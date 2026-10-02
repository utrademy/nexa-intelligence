import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { KnowledgeAreaId, SourceCitation } from "@/lib/types";
import { getQueryEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  knowledgeArea: string;
  sourceName: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  similarity: number;
}

function mapKnowledgeAreaToUi(area: string): KnowledgeAreaId {
  const norm = area.toLowerCase().trim();
  if (norm.includes("labor") || norm === "labor_law") return "labor-law";
  if (norm.includes("social") || norm === "social_security") return "social-security";
  if (norm.includes("osh") || norm.includes("sst")) return "osh";
  if (norm.includes("sergio") || norm.includes("flores") || norm.includes("flórez")) return "sergio-flores";
  return "other";
}

export function normalizeKnowledgeArea(area: string): string {
  const norm = area.toLowerCase().trim().replace(/_/g, "-");
  if (norm.includes("labor") || norm === "labor-law") return "labor-law";
  if (norm.includes("social") || norm === "social-security") return "social-security";
  if (norm.includes("osh") || norm.includes("sst")) return "osh";
  if (norm.includes("sergio") || norm.includes("flores") || norm.includes("flórez")) return "sergio-flores";
  return norm;
}

/**
 * Searches indexed knowledge chunks using vector cosine similarity.
 * Returns empty array if no matches found or if database vector tables are not yet initialized.
 */
export async function searchKnowledgeChunks(
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    filterKnowledgeArea?: string;
    filterKnowledgeAreas?: string[];
  } = {}
): Promise<RetrievedChunk[]> {
  const threshold = options.matchThreshold ?? 0.35;
  const count = options.matchCount ?? 4;

  // Determine target areas
  let targetAreas: string[] | null = null;
  if (options.filterKnowledgeAreas) {
    targetAreas = Array.from(
      new Set(options.filterKnowledgeAreas.map(normalizeKnowledgeArea).filter(Boolean))
    );
    if (targetAreas.length === 0) {
      // User explicitly filtered to empty set of areas -> return empty
      return [];
    }
  } else if (options.filterKnowledgeArea) {
    targetAreas = [normalizeKnowledgeArea(options.filterKnowledgeArea)];
  }

  try {
    const embedding = await getQueryEmbedding(query);
    const supabase = getSupabaseServerClient();

    let rows: any[] = [];

    if (!targetAreas || targetAreas.length === 0) {
      // No area filter applied
      const { data, error } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: count,
        filter_knowledge_area: null,
      });
      if (error) {
        console.warn("[knowledge/retrieval] RPC match_knowledge_chunks error:", error.message);
        return [];
      }
      rows = Array.isArray(data) ? data : [];
    } else if (targetAreas.length === 1) {
      // Exactly 1 area
      const { data, error } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: count,
        filter_knowledge_area: targetAreas[0],
      });
      if (error) {
        console.warn("[knowledge/retrieval] RPC match_knowledge_chunks error:", error.message);
        return [];
      }
      rows = Array.isArray(data) ? data : [];
    } else {
      // Multiple areas selected (e.g. LABOR_LAW and SERGIO_FLORES)
      const areaQueries = await Promise.all(
        targetAreas.map((area) =>
          supabase.rpc("match_knowledge_chunks", {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: count,
            filter_knowledge_area: area,
          })
        )
      );

      const combined: any[] = [];
      const seenIds = new Set<string>();

      for (const res of areaQueries) {
        if (res.data && Array.isArray(res.data)) {
          for (const row of res.data) {
            if (!seenIds.has(row.id)) {
              seenIds.add(row.id);
              combined.push(row);
            }
          }
        }
      }

      // Sort by similarity descending and pick top `count`
      combined.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
      rows = combined.slice(0, count);
    }

    return rows.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      documentTitle: row.document_title || "Documento sin título",
      knowledgeArea: row.knowledge_area || "labor-law",
      sourceName: row.source_name || "Documento normativo",
      content: row.content,
      pageNumber: row.page_number ?? null,
      chunkIndex: row.chunk_index ?? 0,
      similarity: typeof row.similarity === "number" ? row.similarity : 0,
    }));
  } catch (err) {
    console.warn("[knowledge/retrieval] Retrieval failed gracefully:", err);
    return [];
  }
}

/**
 * Maps retrieved chunks to structured SourceCitation objects for the UI.
 */
export function formatChunksAsCitations(chunks: RetrievedChunk[]): SourceCitation[] {
  return chunks.map((chunk, index) => {
    const pageRef = chunk.pageNumber ? `Página ${chunk.pageNumber}` : "Documento normativo";
    const sourceRef = chunk.sourceName ? `${chunk.sourceName} · ${pageRef}` : pageRef;
    const relevancePct = Math.min(99, Math.max(50, Math.round(chunk.similarity * 100)));

    return {
      id: chunk.id || `chunk-${index}`,
      title: chunk.documentTitle,
      area: mapKnowledgeAreaToUi(chunk.knowledgeArea),
      excerpt: chunk.content.slice(0, 280) + (chunk.content.length > 280 ? "…" : ""),
      reference: sourceRef,
      relevance: relevancePct,
      page: chunk.pageNumber ?? undefined,
      documentId: chunk.documentId,
    };
  });
}

/**
 * Determines whether a user question should trigger RAG vector retrieval.
 * Returns true if the query asks about policies, regulations, procedures, doctrine,
 * internal documents, legal standards, Sergio Flórez knowledge, or general legal queries.
 */
export function shouldPerformKnowledgeRetrieval(question: string): boolean {
  const q = question.toLowerCase();

  // Explicit keywords asking about documentation or procedures
  const docKeywords = [
    "según",
    "documento",
    "documentos",
    "norma",
    "normativa",
    "ley",
    "decreto",
    "resolución",
    "código",
    "política",
    "procedimiento",
    "guía",
    "metodología",
    "sergio",
    "flórez",
    "flores",
    "jurisprudencia",
    "corte",
    "estabilidad laboral",
    "ajustes razonables",
    "inclusión laboral",
    "sst",
    "seguridad y salud",
    "pila",
    "reforma laboral",
    "contrato",
    "despido",
    "indemnización",
    "discapacidad",
    "reubicación",
    "fuero",
  ];

  return docKeywords.some((kw) => q.includes(kw));
}
