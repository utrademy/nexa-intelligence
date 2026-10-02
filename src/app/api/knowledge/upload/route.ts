import { NextResponse } from "next/server";
import { ingestKnowledgeDocument } from "@/lib/knowledge/ingest";

export const maxDuration = 60; // Allow sufficient time for embedding and PDF extraction

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title =
      (formData.get("title") as string)?.trim() ||
      file?.name.replace(/\.[^/.]+$/, "") ||
      "Documento";
    const description = (formData.get("description") as string)?.trim() || undefined;
    const area = (formData.get("area") as string)?.trim() || "labor-law";
    const sourceName =
      (formData.get("sourceName") as string)?.trim() ||
      (area === "sergio-flores" ? "Sergio Flórez & Abogados" : "Documento cargado");

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Formato no compatible en esta fase. Por favor cargue un archivo PDF." },
        { status: 400 }
      );
    }

    // Convert file to pure Uint8Array (PDF.js in unpdf explicitly requires Uint8Array rather than Buffer)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const result = await ingestKnowledgeDocument({
      fileBuffer: uint8Array,
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
    console.error("[api/knowledge/upload] Server technical error:", err);

    const rawMessage = (err?.message || "").toLowerCase();
    let userFacingMessage =
      "No fue posible procesar el PDF. Verifique que el archivo contenga texto seleccionable e inténtelo nuevamente.";

    if (rawMessage.includes("escaneado") || rawMessage.includes("ocr") || rawMessage.includes("no contiene texto")) {
      userFacingMessage =
        "El documento no contiene texto legible (posible PDF escaneado). Se requerirá soporte OCR en una fase posterior.";
    } else if (rawMessage.includes("contraseña") || rawMessage.includes("password")) {
      userFacingMessage =
        "El archivo PDF está protegido con contraseña. Por favor cargue un documento desprotegido.";
    }

    return NextResponse.json(
      {
        error: userFacingMessage,
      },
      { status: 400 }
    );
  }
}
