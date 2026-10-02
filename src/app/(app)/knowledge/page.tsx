import type { Metadata } from "next";
import { KnowledgeCenter } from "@/components/knowledge/KnowledgeCenter";
import { getKnowledgeData } from "@/lib/data";

export const metadata: Metadata = { title: "Centro de Conocimiento" };

export default async function KnowledgePage() {
  const { areas, documents, realIndexedCount } = await getKnowledgeData();
  return <KnowledgeCenter areas={areas} documents={documents} realIndexedCount={realIndexedCount} />;
}
