import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSION = 1536;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("[embeddings] OPENAI_API_KEY no está configurada en el servidor.");
  }
  return new OpenAI({ apiKey });
}

/**
 * Generates an embedding for a single text query using text-embedding-3-small.
 */
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const clean = query.replace(/\n+/g, " ").trim();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: clean,
  });

  return response.data[0].embedding;
}

/**
 * Generates embeddings for an array of text chunks in batches.
 */
export async function getChunkEmbeddings(
  chunks: string[],
  batchSize = 25
): Promise<number[][]> {
  const openai = getOpenAIClient();
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize).map((c) => c.replace(/\n+/g, " ").trim());
    if (batch.length === 0) continue;

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    for (const item of response.data) {
      embeddings.push(item.embedding);
    }
  }

  return embeddings;
}
