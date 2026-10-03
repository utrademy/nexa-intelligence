import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    process.env[k] = v;
  }
}

import { getOrganizationIntelligenceSnapshot, formatSnapshotForPrompt } from "../src/lib/data-intelligence/organization-snapshot";
import { searchKnowledgeChunks } from "../src/lib/knowledge/retrieval";
import { LABOR_AI_INSTRUCTIONS, getModeInstructions } from "../src/lib/ai/labor-ai";
import OpenAI from "openai";

async function diagnoseOptimized() {
  const q = "Analiza nuestra población e identifica las principales brechas de información laboral. ¿Qué deberíamos revisar según nuestra documentación?";
  
  const [snapshot, chunks] = await Promise.all([
    getOrganizationIntelligenceSnapshot(),
    searchKnowledgeChunks(q, { filterKnowledgeAreas: ["labor-law"] }),
  ]);

  let instructions = LABOR_AI_INSTRUCTIONS;
  if (snapshot) {
    instructions += "\n\n" + formatSnapshotForPrompt(snapshot);
  }
  if (chunks.length > 0) {
    instructions +=
      "\n\nDOCUMENT GROUNDING CONTEXT (RAG):\n" +
      chunks
        .map(
          (c, i) =>
            `[DOCUMENTO ${i + 1}] "${c.documentTitle}" (${c.sourceName || "Documento normativo"}${
              c.pageNumber ? ` · Página ${c.pageNumber}` : ""
            })\n${c.content.length > 1800 ? c.content.slice(0, 1800) + "…" : c.content}`
        )
        .join("\n\n");
  }
  instructions += "\n\n" + getModeInstructions("COMBINED", snapshot?.dataset.sampleSize);

  console.log("Trimmed instructions length (chars):", instructions.length);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const t0 = Date.now();
  console.log("Calling OpenAI Responses API...");
  try {
    const res = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions,
      input: [{ role: "user", content: q }],
      max_output_tokens: 2500,
      reasoning: { effort: "low" },
    });
    console.log(`OpenAI completed in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
    console.log("Output text snippet:\n", res.output_text?.slice(0, 500));
  } catch (err: any) {
    console.error("OpenAI failed with error:", err);
  }
}

diagnoseOptimized();
