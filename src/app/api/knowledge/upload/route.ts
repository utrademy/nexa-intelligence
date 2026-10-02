import { NextResponse } from "next/server";
import { ingestKnowledgeDocument } from "@/lib/knowledge/ingest";

export const maxDuration = 60; // Allow sufficient time for embedding and PDF extraction

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim() || file?.name.replace(/\.[^/.]+$/, "") || "Documento";
    const description = (formData.get("description") as string)?.trim() || undefined;
    const area = (formData.get("area") as string)?.trim() || "labor-law";
    const sourceName = (formData.get("sourceName") as string)?.trim() || "Sergio Flórez & Abogados";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Formato no compatible en esta fase. Por favor cargue un archivo PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await ingestKnowledgeDocument({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      fileSize: file.size,
      title,
      description,
      knowledgeArea: area,
      sourceName,
    });

    return NextResponse.json({
      success: true,
      document: {
        id: result.documentId,
        title: result.title,
        area,
        source: sourceName,
        format: "PDF" as const,
        pages: result.pageCount,
        lastUpdated: new Date().toISOString().slice(0, 10),
        status: result.status === "INDEXED" ? "Indexado" : "Error",
        chunkCount: result.chunkCount,
        isReal: true,
      },
    });
  } catch (err: any) {
    console.error("[api/knowledge/upload] Upload error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Ocurrió un error al procesar e indexar el documento en la base de conocimiento.",
      },
      { status: 500 }
    );
  }
}
