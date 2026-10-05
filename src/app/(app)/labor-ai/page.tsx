import type { Metadata } from "next";
import { LaborChat } from "@/components/labor-ai/LaborChat";
import { getKnowledgeData, getLaborContextStats } from "@/lib/data";

export const metadata: Metadata = { title: "NEXA Laboral AI" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LaborAiPage() {
  const [{ areas }, orgContext] = await Promise.all([
    getKnowledgeData(),
    getLaborContextStats(),
  ]);
  return <LaborChat areas={areas} orgContext={orgContext} />;
}
