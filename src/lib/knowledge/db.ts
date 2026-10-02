import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentAiStatus, KnowledgeAreaId, KnowledgeDocument } from "@/lib/types";

export interface DbKnowledgeDocument {
  id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  knowledge_area: string;
  source_name: string;
  file_name: string;
  storage_path: string | null;
  mime_type: string;
  file_size: number;
  status: string;
  page_count: number;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbStatusToUi(status: string): DocumentAiStatus {
  switch (status) {
    case "INDEXED":
      return "Indexado";
    case "PROCESSING":
      return "Procesando";
    case "FAILED":
      return "Error";
    default:
      return "Requiere revisión";
  }
}

function mapDbAreaToId(area: string): KnowledgeAreaId {
  const norm = area.toLowerCase().trim();
  if (norm.includes("labor") || norm === "labor_law") return "labor-law";
  if (norm.includes("social") || norm === "social_security") return "social-security";
  if (norm.includes("osh") || norm.includes("sst")) return "osh";
  if (norm.includes("sergio") || norm.includes("flores") || norm.includes("flórez")) return "sergio-flores";
  return "other";
}

/**
 * Fetches real indexed documents from Supabase knowledge_documents table.
 * Gracefully returns empty list if table does not yet exist.
 */
export async function getRealKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Table doesn't exist yet or permission error
      console.warn("[knowledge/db] Could not fetch real knowledge documents:", error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: DbKnowledgeDocument) => ({
      id: row.id,
      title: row.title,
      area: mapDbAreaToId(row.knowledge_area),
      source: row.source_name || "Sergio Flórez & Abogados",
      format: (row.file_name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF") as "PDF" | "DOCX",
      pages: row.page_count || 1,
      lastUpdated: row.updated_at ? row.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: mapDbStatusToUi(row.status),
      description: row.description || undefined,
      chunkCount: row.chunk_count || 0,
      fileSize: row.file_size || 0,
      isReal: true,
    }));
  } catch (err) {
    console.warn("[knowledge/db] Error querying knowledge documents:", err);
    return [];
  }
}

/**
 * Returns count of real indexed documents in Supabase.
 */
export async function getRealIndexedCount(): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("knowledge_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "INDEXED");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
