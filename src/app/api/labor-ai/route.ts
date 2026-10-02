import OpenAI from "openai";
import {
  DEMO_ORG_CONTEXT,
  LABOR_AI_DATA_ERROR_MESSAGE,
  LABOR_AI_ERROR_MESSAGE,
  LABOR_AI_INSTRUCTIONS,
  LABOR_AI_LIMITS,
  LABOR_AI_MODEL,
} from "@/lib/ai/labor-ai";
import {
  formatSnapshotForPrompt,
  getOrganizationIntelligenceSnapshot,
} from "@/lib/data-intelligence/organization-snapshot";
import { shouldFetchOrganizationalData } from "@/lib/data-intelligence/routing";
import {
  formatChunksAsCitations,
  searchKnowledgeChunks,
  shouldPerformKnowledgeRetrieval,
} from "@/lib/knowledge/retrieval";
import type { LaborAiResponse, LaborAiTurn, SourceCitation } from "@/lib/types";

function fail(status: number, message = LABOR_AI_ERROR_MESSAGE) {
  return Response.json({ error: message } satisfies LaborAiResponse, { status });
}

function parseBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const { question, history, includeOrgContext } = body as Record<string, unknown>;

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

  return { question: q, history: turns, includeOrgContext: includeOrgContext !== false };
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

  // 1. Determine if question requires real database intelligence
  const requiresOrgData = parsed.includeOrgContext && shouldFetchOrganizationalData(parsed.question);

  if (requiresOrgData) {
    console.log("[labor-ai] Routing query to Supabase Organizational Data Intelligence Layer...");
    const snapshot = await getOrganizationIntelligenceSnapshot();
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
  }

  // 2. Determine if question requires or benefits from specialized document knowledge (RAG)
  const shouldRetrieveDocs = shouldPerformKnowledgeRetrieval(parsed.question);

  if (shouldRetrieveDocs) {
    console.log("[labor-ai] Checking Knowledge Center for semantically relevant chunks...");
    const retrievedChunks = await searchKnowledgeChunks(parsed.question, {
      matchThreshold: 0.35,
      matchCount: 4,
    });

    if (retrievedChunks.length > 0) {
      console.log(`[labor-ai] RAG: Found ${retrievedChunks.length} relevant chunks`);
      const citations = formatChunksAsCitations(retrievedChunks);
      sources = citations;

      const docBlock =
        "DOCUMENT GROUNDING CONTEXT (RAG - SERGIO FLÓREZ & ABOGADOS):\n" +
        retrievedChunks
          .map(
            (c, i) =>
              `[DOCUMENTO ${i + 1}] "${c.documentTitle}" (${c.sourceName || "Sergio Flórez & Abogados"}${
                c.pageNumber ? ` · Página ${c.pageNumber}` : ""
              })\n${c.content}`
          )
          .join("\n\n");

      instructions = `${instructions}\n\n${docBlock}`;
    } else {
      console.log("[labor-ai] RAG: No indexed chunks matched the threshold");
    }
  }

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

    return Response.json({
      answer,
      dataUsed,
      sampleSize,
      sources,
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
