/**
 * Stream parser for AI Practice chat responses.
 * Parses corrections and phonetic errors from XML tags as they stream in.
 */

export interface StreamCorrection {
  original: string;
  corrected: string;
  category: string;
  explanation: string;
}

export interface StreamPhoneticError {
  misspelled: string;
  intended: string;
  pattern?: string;
}

export interface ParsedStreamData {
  content: string;
  corrections: StreamCorrection[];
  phoneticErrors: StreamPhoneticError[];
  isComplete: boolean;
}

/**
 * Creates a stateful parser that accumulates streamed chunks and extracts
 * structured data (corrections, phonetic errors) as they become available.
 */
export function createStreamParser() {
  let buffer = "";
  let corrections: StreamCorrection[] = [];
  let phoneticErrors: StreamPhoneticError[] = [];
  let correctionsExtracted = false;
  let phoneticExtracted = false;

  return {
    /**
     * Process a new chunk of streamed content
     */
    addChunk(chunk: string): ParsedStreamData {
      buffer += chunk;

      // Try to extract corrections if we see the closing tag
      if (!correctionsExtracted && buffer.includes("</corrections>")) {
        const match = buffer.match(/<corrections>([\s\S]*?)<\/corrections>/i);
        if (match) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) {
              corrections = parsed.map((c) => ({
                original: String(c.original || "").trim(),
                corrected: String(c.corrected || "").trim(),
                category: String(c.category || "vocabulary").trim(),
                explanation: String(c.explanation || "").trim(),
              }));
            }
          } catch {
            // JSON parse failed, will try fallback later
          }
          correctionsExtracted = true;
        }
      }

      // Try to extract phonetic errors if we see the closing tag
      if (!phoneticExtracted && buffer.includes("</phonetic_errors>")) {
        const match = buffer.match(/<phonetic_errors>([\s\S]*?)<\/phonetic_errors>/i);
        if (match) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) {
              phoneticErrors = parsed.map((p) => ({
                misspelled: String(p.misspelled || "").trim(),
                intended: String(p.intended || "").trim(),
                pattern: p.pattern ? String(p.pattern).trim() : undefined,
              }));
            }
          } catch {
            // JSON parse failed
          }
          phoneticExtracted = true;
        }
      }

      // Get clean content (without XML tags)
      const cleanContent = this.getCleanContent();

      return {
        content: cleanContent,
        corrections,
        phoneticErrors,
        isComplete: false,
      };
    },

    /**
     * Get the content without XML tags for display
     */
    getCleanContent(): string {
      return buffer
        .replace(/<corrections>[\s\S]*?<\/corrections>/gi, "")
        .replace(/<phonetic_errors>[\s\S]*?<\/phonetic_errors>/gi, "")
        .replace(/<corrections>[\s\S]*$/gi, "") // Partial opening tag
        .replace(/<phonetic_errors>[\s\S]*$/gi, "") // Partial opening tag
        .replace(/\[Correction:[^\]]+\]/gi, "") // Legacy format
        .trim();
    },

    /**
     * Finalize parsing and return complete data
     */
    finalize(): ParsedStreamData {
      // Final attempt to extract if not already done
      if (!correctionsExtracted) {
        const match = buffer.match(/<corrections>([\s\S]*?)<\/corrections>/i);
        if (match) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) {
              corrections = parsed.map((c) => ({
                original: String(c.original || "").trim(),
                corrected: String(c.corrected || "").trim(),
                category: String(c.category || "vocabulary").trim(),
                explanation: String(c.explanation || "").trim(),
              }));
            }
          } catch {
            // Use fallback parsing
            corrections = this.parseFallbackCorrections();
          }
        } else {
          corrections = this.parseFallbackCorrections();
        }
      }

      if (!phoneticExtracted) {
        const match = buffer.match(/<phonetic_errors>([\s\S]*?)<\/phonetic_errors>/i);
        if (match) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) {
              phoneticErrors = parsed.map((p) => ({
                misspelled: String(p.misspelled || "").trim(),
                intended: String(p.intended || "").trim(),
                pattern: p.pattern ? String(p.pattern).trim() : undefined,
              }));
            }
          } catch {
            // Ignore phonetic parse errors
          }
        }
      }

      return {
        content: this.getCleanContent(),
        corrections,
        phoneticErrors,
        isComplete: true,
      };
    },

    /**
     * Fallback parser for legacy correction format
     */
    parseFallbackCorrections(): StreamCorrection[] {
      const result: StreamCorrection[] = [];
      const regex = /\[Correction:\s*['"]?([^'"]+)['"]?\s*should be\s*['"]?([^'"]+)['"]?\s*-?\s*([^\]]*)\]/gi;
      let match;

      while ((match = regex.exec(buffer)) !== null) {
        result.push({
          original: match[1].trim(),
          corrected: match[2].trim(),
          category: "vocabulary",
          explanation: match[3].trim() || "Grammar correction",
        });
      }

      return result;
    },

    /**
     * Get the raw buffer (for debugging)
     */
    getRawBuffer(): string {
      return buffer;
    },

    /**
     * Reset the parser state
     */
    reset() {
      buffer = "";
      corrections = [];
      phoneticErrors = [];
      correctionsExtracted = false;
      phoneticExtracted = false;
    },
  };
}

/**
 * Server-Sent Events encoder for streaming responses
 */
export function encodeSSEMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Creates an SSE stream from an OpenAI stream
 */
export function createSSEEncoder() {
  const encoder = new TextEncoder();

  return {
    encode(data: object): Uint8Array {
      return encoder.encode(encodeSSEMessage(data));
    },
    encodeDone(): Uint8Array {
      return encoder.encode("data: [DONE]\n\n");
    },
  };
}
