import { NextResponse } from "next/server";
import { getRealIndexedCount, getRealKnowledgeDocuments } from "@/lib/knowledge/db";

export async function GET() {
  try {
    const [documents, realCount] = await Promise.all([
      getRealKnowledgeDocuments(),
      getRealIndexedCount(),
    ]);

    return NextResponse.json({
      documents,
      realCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error al obtener documentos" }, { status: 500 });
  }
}
