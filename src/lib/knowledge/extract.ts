import { extractText } from "unpdf";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  totalPages: number;
  pages: ExtractedPage[];
  totalCharacters: number;
  isScannedOrEmpty: boolean;
}

/**
 * Converts any binary input (Buffer, ArrayBuffer, TypedArray view) into an isolated,
 * pure Uint8Array with its own dedicated memory buffer.
 *
 * This completely satisfies Mozilla PDF.js's strict requirement:
 * "Please provide binary data as `Uint8Array`, rather than `Buffer`."
 * while avoiding transferable ArrayBuffer clone errors in Node runtimes.
 */
export function toCleanUint8Array(input: Uint8Array | ArrayBuffer | Buffer): Uint8Array {
  if (Buffer.isBuffer(input)) {
    const copy = new Uint8Array(input.length);
    copy.set(input);
    return copy;
  }
  if (input instanceof ArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy;
  }
  if (ArrayBuffer.isView(input)) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
    return copy;
  }
  return new Uint8Array(input);
}

/**
 * Extracts page-by-page text from a PDF Uint8Array, ArrayBuffer, or Buffer.
 * If the PDF has no readable text (e.g. scanned image), marks isScannedOrEmpty = true
 * without hallucinating any content.
 */
export async function extractPdfText(
  buffer: Uint8Array | ArrayBuffer | Buffer
): Promise<ExtractionResult> {
  try {
    const uint8 = toCleanUint8Array(buffer);
    const { text, totalPages } = await extractText(uint8);

    const pages: ExtractedPage[] = [];
    let totalCharacters = 0;

    // text is an array of strings, one per page
    const pageArray = Array.isArray(text) ? text : [text];

    pageArray.forEach((pageContent, idx) => {
      const cleaned = (pageContent || "")
        .replace(/\r\n/g, "\n")
        .replace(/\u0000/g, "")
        .trim();

      if (cleaned.length > 0) {
        pages.push({
          pageNumber: idx + 1,
          text: cleaned,
        });
        totalCharacters += cleaned.length;
      }
    });

    const isScannedOrEmpty = totalCharacters < 50;

    return {
      totalPages: totalPages || pageArray.length || 1,
      pages,
      totalCharacters,
      isScannedOrEmpty,
    };
  } catch (error) {
    console.error("[knowledge/extract] Error extracting text from PDF:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.toLowerCase().includes("password")) {
      throw new Error("El archivo PDF está protegido con contraseña.");
    }
    throw new Error(
      error instanceof Error ? error.message : "Error al procesar el archivo PDF"
    );
  }
}
