import OpenAI from "openai";
import {
  DEMO_ORG_CONTEXT,
  LABOR_AI_DATA_ERROR_MESSAGE,
  LABOR_AI_ERROR_MESSAGE,
  LABOR_AI_INSTRUCTIONS,
  LABOR_AI_LIMITS,
  LABOR_AI_MODEL,
  getModeInstructions,
} from "@/lib/ai/labor-ai";
import {
  formatSnapshotForPrompt,
  getOrganizationIntelligenceSnapshot,
} from "@/lib/data-intelligence/organization-snapshot";
import {
  classifyQuestionContext,
  shouldFetchOrganizationalData,
} from "@/lib/data-intelligence/routing";
import {
  formatChunksAsCitations,
  searchKnowledgeChunks,
  shouldPerformKnowledgeRetrieval,
} from "@/lib/knowledge/retrieval";
import type { LaborAiResponse, LaborAiTurn, SourceCitation } from "@/lib/types";

function fail(status: number, message = LABOR_AI_ERROR_MESSAGE) {
  return Response.json({ error: message } satisfies LaborAiResponse, { status });
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const { question, history, includeOrgContext, knowledgeAreas } = body as Record<string, unknown>;

  if (typeof question !== "string") return null;
  const q = question.trim();
  if (!q || q.length > LABOR_AI_LIMITS.questionChars) return null;

  const turns: LaborAiTurn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) return null;
    for (const t of history.slice(-LABOR_AI_LIMITS.historyTurns)) {
      if (!t || typeof t !== "object") return null;
      const { role, content } = t as Record<string, unknown>;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null;
      turns.push({ role, content: content.slice(0, LABOR_AI_LIMITS.historyChars) });
    }
  }

  const parsedAreas: string[] = [];
  if (Array.isArray(knowledgeAreas)) {
    for (const a of knowledgeAreas) {
      if (typeof a === "string" && a.trim()) {
        parsedAreas.push(a.trim());
      }
    }
  }

  return {
    question: q,
    history: turns,
    includeOrgContext: includeOrgContext !== false,
    knowledgeAreas: parsedAreas,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[labor-ai] OPENAI_API_KEY is not configured");
    return fail(500);
  }

  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return fail(400);

  let instructions = LABOR_AI_INSTRUCTIONS;
  let dataUsed = false;
  let sampleSize: number | undefined;
  let sources: SourceCitation[] | undefined;

  // 1. Determine mode using deterministic classification
  const hasActiveKnowledgeFilters = parsed.knowledgeAreas.length > 0;
  const shouldRetrieveDocs = shouldPerformKnowledgeRetrieval(parsed.question);
  const classification = classifyQuestionContext(parsed.question, {
    includeOrgContext: parsed.includeOrgContext,
    hasActiveKnowledgeFilters,
    shouldRetrieveDocs,
  });

  const mode = classification.mode;
  console.log(
    `[labor-ai] Classified query mode: ${mode} (asksOrg: ${classification.asksOrg}, asksKnowledge: ${classification.asksKnowledge}, canUseOrg: ${classification.canUseOrg}, canUseKnowledge: ${classification.canUseKnowledge})`
  );

  // 2. Fetch organizational snapshot and retrieve RAG chunks in parallel
  console.log(
    `[labor-ai] Executing data fetching in parallel (fetchOrg: ${classification.canUseOrg}, fetchRAG: ${classification.canUseKnowledge})...`
  );
  const [snapshot, retrievedChunks] = await Promise.all([
    classification.canUseOrg ? getOrganizationIntelligenceSnapshot() : Promise.resolve(null),
    classification.canUseKnowledge
      ? searchKnowledgeChunks(parsed.question, {
          matchThreshold: 0.35,
          matchCount: 4,
          filterKnowledgeAreas: parsed.knowledgeAreas,
        })
      : Promise.resolve([]),
  ]);

  if (classification.canUseOrg) {
    if (!snapshot) {
      console.error("[labor-ai] Failed to retrieve organizational snapshot from Supabase");
      return fail(503, LABOR_AI_DATA_ERROR_MESSAGE);
    }
    const dataBlock = formatSnapshotForPrompt(snapshot);
    instructions = `${instructions}\n\n${dataBlock}`;
    dataUsed = true;
    sampleSize = snapshot.dataset.sampleSize;
    console.log(`[labor-ai] Organizational data injected. Real sample size: ${sampleSize}`);
  } else if (parsed.includeOrgContext) {
    instructions = `${instructions}\n\n${DEMO_ORG_CONTEXT}`;
  } else {
    console.log("[labor-ai] Organization context toggle is OFF: omitting all organizational data.");
    instructions = `${instructions}\n\n[AVISO DE CONTEXTO ORGANIZACIONAL: El usuario ha desactivado el acceso a los datos de la organización. NO mencione ni asuma datos internos de Financiera Comultrasan ni métricas demográficas internas en su respuesta. Responda estrictamente desde el marco normativo legal general.]`;
  }

  // 3. Process RAG chunks if retrieved
  if (classification.canUseKnowledge) {
    if (retrievedChunks.length > 0) {
      console.log(`[labor-ai] RAG: Found ${retrievedChunks.length} relevant chunks`);
      const citations = formatChunksAsCitations(retrievedChunks);
      sources = citations;

      const docBlock =
        "DOCUMENT GROUNDING CONTEXT (RAG - FUENTES DOCUMENTALES SELECCIONADAS):\n" +
        retrievedChunks
          .map(
            (c, i) =>
              `[DOCUMENTO ${i + 1}] "${c.documentTitle}" (${c.sourceName || "Documento normativo"}${
                c.pageNumber ? ` · Página ${c.pageNumber}` : ""
              })\n${c.content.length > 2000 ? c.content.slice(0, 2000) + "…" : c.content}`
          )
          .join("\n\n");

      instructions = `${instructions}\n\n${docBlock}`;
    } else {
      console.log("[labor-ai] RAG: No indexed chunks matched the threshold in selected areas");
    }
  } else {
    if (!hasActiveKnowledgeFilters) {
      console.log("[labor-ai] RAG skipped: No knowledge source filters selected by user.");
    }
  }

  // 4. Inject mode-specific instructions
  instructions = `${instructions}\n\n${getModeInstructions(mode, sampleSize)}`;

  try {
    const client = new OpenAI({ apiKey, timeout: LABOR_AI_LIMITS.timeoutMs, maxRetries: 1 });
    const response = await client.responses.create({
      model: LABOR_AI_MODEL,
      instructions,
      input: [...parsed.history, { role: "user", content: parsed.question }],
      max_output_tokens: LABOR_AI_LIMITS.maxOutputTokens,
      reasoning: { effort: "low" },
      store: false,
    });

    const answer = response.output_text?.trim();
    if (!answer) {
      console.error("[labor-ai] Empty response from model", { status: response.status });
      return fail(502);
    }

    const knowledgeUsed = Boolean(sources && sources.length > 0);
    const retrievedChunkCount = sources ? sources.length : 0;

    return Response.json({
      answer,
      dataUsed,
      sampleSize,
      sources,
      mode,
      knowledgeUsed,
      retrievedChunkCount,
    } satisfies LaborAiResponse);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("[labor-ai] OpenAI request failed", { status: error.status, type: error.type, code: error.code });
    } else {
      console.error("[labor-ai] Unexpected error", error instanceof Error ? error.name : "unknown");
    }
    return fail(502);
  }
}
