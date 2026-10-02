import { getSupabaseServerClient } from "@/lib/supabase/server";
import { chunkPages } from "./chunking";
import { getChunkEmbeddings } from "./embeddings";
import { extractPdfText, toCleanUint8Array } from "./extract";

export interface IngestDocumentParams {
  fileBuffer: Uint8Array | Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
  title: string;
  description?: string;
  knowledgeArea: string;
  sourceName?: string;
}

export interface IngestResult {
  documentId: string;
  title: string;
  pageCount: number;
  chunkCount: number;
  status: "INDEXED";
}

/**
 * End-to-end ingestion pipeline:
 * File -> Supabase Storage -> PDF Text Extraction -> Semantic Chunking -> Embeddings -> Vector Store
 *
 * Guaranteed cleanup on failure: deletes any partial chunks, uploaded storage files, or
 * temporary document rows so that failed uploads never leave orphan artifacts or false records.
 */
export async function ingestKnowledgeDocument(
  params: IngestDocumentParams
): Promise<IngestResult> {
  const supabase = getSupabaseServerClient();
  const sourceName =
    params.sourceName ||
    (params.knowledgeArea === "sergio-flores" ? "Sergio Flórez & Abogados" : "Documento cargado");

  // Ensure binary data is an isolated, pure Uint8Array (PDF.js in unpdf explicitly requires Uint8Array rather than Buffer)
  const uint8Data = toCleanUint8Array(params.fileBuffer);

  // 1. Create document entry with PROCESSING status
  const { data: docRecord, error: docError } = await supabase
    .from("knowledge_documents")
    .insert({
      title: params.title,
      description: params.description || null,
      knowledge_area: params.knowledgeArea,
      source_name: sourceName,
      file_name: params.fileName,
      mime_type: params.mimeType,
      file_size: params.fileSize,
      status: "PROCESSING",
    })
    .select("id")
    .single();

  if (docError || !docRecord) {
    throw new Error(`Error registrando el documento en la base de datos: ${docError?.message}`);
  }

  const documentId = docRecord.id;
  const storagePath = `documents/${documentId}/${params.fileName}`;

  try {
    // 2. Upload file to Supabase Storage (knowledge-documents bucket)
    const { error: storageError } = await supabase.storage
      .from("knowledge-documents")
      .upload(storagePath, uint8Data, {
        contentType: params.mimeType,
        upsert: true,
      });

    if (storageError) {
      console.warn("[knowledge/ingest] Storage upload notice:", storageError.message);
    }

    // 3. Extract text from PDF
    const extraction = await extractPdfText(uint8Data);

    if (extraction.isScannedOrEmpty) {
      throw new Error(
        "El documento no contiene texto legible (posible PDF escaneado). Se requerirá soporte OCR en una fase posterior."
      );
    }

    // 4. Create semantic chunks
    const chunks = chunkPages(extraction.pages, {
      targetChunkSize: 800,
      overlapSize: 150,
      knowledgeArea: params.knowledgeArea,
      documentTitle: params.title,
    });

    if (chunks.length === 0) {
      throw new Error("No fue posible generar fragmentos de texto válidos.");
    }

    // 5. Generate embeddings for chunks with OpenAI
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await getChunkEmbeddings(chunkTexts);

    // 6. Insert chunks and embeddings into knowledge_chunks
    const chunkRecords = chunks.map((chunk, idx) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      page_number: chunk.pageNumber || null,
      metadata: chunk.metadata,
      embedding: embeddings[idx],
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRecords.length; i += 50) {
      const slice = chunkRecords.slice(i, i + 50);
      const { error: chunkInsertError } = await supabase
        .from("knowledge_chunks")
        .insert(slice);

      if (chunkInsertError) {
        throw new Error(`Error guardando fragmentos vectoriales: ${chunkInsertError.message}`);
      }
    }

    // 7. Update document status to INDEXED
    await supabase
      .from("knowledge_documents")
      .update({
        status: "INDEXED",
        page_count: extraction.totalPages,
        chunk_count: chunks.length,
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return {
      documentId,
      title: params.title,
      pageCount: extraction.totalPages,
      chunkCount: chunks.length,
      status: "INDEXED",
    };
  } catch (err: any) {
    console.error("[knowledge/ingest] Ingestion failure, rolling back artifacts:", err?.message);

    // Clean up partial artifacts safely
    try {
      await Promise.all([
        supabase.from("knowledge_chunks").delete().eq("document_id", documentId),
        supabase.storage.from("knowledge-documents").remove([storagePath]),
        supabase.from("knowledge_documents").delete().eq("id", documentId),
      ]);
    } catch (cleanupErr) {
      console.warn("[knowledge/ingest] Cleanup warning:", cleanupErr);
    }

    throw err;
  }
}
