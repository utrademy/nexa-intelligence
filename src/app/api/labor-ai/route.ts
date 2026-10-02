import OpenAI from "openai";
import {
  DEMO_ORG_CONTEXT,
  LABOR_AI_ERROR_MESSAGE,
  LABOR_AI_INSTRUCTIONS,
  LABOR_AI_LIMITS,
  LABOR_AI_MODEL,
} from "@/lib/ai/labor-ai";
import type { LaborAiResponse, LaborAiTurn } from "@/lib/types";

function fail(status: number) {
  return Response.json({ error: LABOR_AI_ERROR_MESSAGE } satisfies LaborAiResponse, { status });
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

  const instructions = parsed.includeOrgContext ? `${LABOR_AI_INSTRUCTIONS}\n\n${DEMO_ORG_CONTEXT}` : LABOR_AI_INSTRUCTIONS;

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
    return Response.json({ answer } satisfies LaborAiResponse);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("[labor-ai] OpenAI request failed", { status: error.status, type: error.type, code: error.code });
    } else {
      console.error("[labor-ai] Unexpected error", error instanceof Error ? error.name : "unknown");
    }
    return fail(502);
  }
}
