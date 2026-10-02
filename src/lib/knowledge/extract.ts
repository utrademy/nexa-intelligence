import { extractText, getMeta } from "unpdf";

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
 * Extracts page-by-page text from a PDF Buffer or Uint8Array.
 * If the PDF has no readable text (e.g. scanned image), marks isScannedOrEmpty = true
 * without hallucinating any content.
 */
export async function extractPdfText(buffer: Uint8Array | ArrayBuffer): Promise<ExtractionResult> {
  try {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
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
    throw new Error(
      error instanceof Error ? error.message : "Error al procesar el archivo PDF"
    );
  }
}
