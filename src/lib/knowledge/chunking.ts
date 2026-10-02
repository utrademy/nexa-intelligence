import type { ExtractedPage } from "./extract";

export interface TextChunk {
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  metadata: {
    characterCount: number;
    pageNumber?: number;
    knowledgeArea?: string;
    documentTitle?: string;
  };
}

export interface ChunkingOptions {
  targetChunkSize?: number;
  overlapSize?: number;
  knowledgeArea?: string;
  documentTitle?: string;
}

/**
 * Splits extracted pages into semantic chunks of ~800 characters with 150 character overlap,
 * keeping page references accurate.
 */
export function chunkPages(
  pages: ExtractedPage[],
  options: ChunkingOptions = {}
): TextChunk[] {
  const targetSize = options.targetChunkSize || 800;
  const overlap = options.overlapSize || 150;
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    // If page text is within target size, keep it as a clean single chunk
    if (text.length <= targetSize + overlap) {
      chunks.push({
        chunkIndex: chunkIndex++,
        content: text,
        pageNumber: page.pageNumber,
        metadata: {
          characterCount: text.length,
          pageNumber: page.pageNumber,
          knowledgeArea: options.knowledgeArea,
          documentTitle: options.documentTitle,
        },
      });
      continue;
    }

    // Split into paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = "";

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      if ((currentChunk + "\n\n" + cleanPara).length > targetSize && currentChunk.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentChunk.trim(),
          pageNumber: page.pageNumber,
          metadata: {
            characterCount: currentChunk.trim().length,
            pageNumber: page.pageNumber,
            knowledgeArea: options.knowledgeArea,
            documentTitle: options.documentTitle,
          },
        });

        // Retain overlap from end of previous chunk
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.min(words.length, 25)).join(" ");
        currentChunk = overlapWords + "\n\n" + cleanPara;
      } else {
        currentChunk = currentChunk ? currentChunk + "\n\n" + cleanPara : cleanPara;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        content: currentChunk.trim(),
        pageNumber: page.pageNumber,
        metadata: {
          characterCount: currentChunk.trim().length,
          pageNumber: page.pageNumber,
          knowledgeArea: options.knowledgeArea,
          documentTitle: options.documentTitle,
        },
      });
    }
  }

  return chunks;
}
