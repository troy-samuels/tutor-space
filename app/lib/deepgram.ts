/**
 * Deepgram SDK Client
 *
 * Factory pattern for Deepgram speech-to-text client.
 * Used for transcribing lesson recordings with diarization.
 */

import { createClient } from "@deepgram/sdk";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.warn(
    "[Deepgram] DEEPGRAM_API_KEY is not set. Transcription features will be disabled."
  );
}

/**
 * Get the Deepgram client instance.
 * Throws if API key is not configured.
 */
export function getDeepgramClient() {
  if (!DEEPGRAM_API_KEY) {
    throw new Error(
      "Deepgram is not configured. Set DEEPGRAM_API_KEY in your environment."
    );
  }
  return createClient(DEEPGRAM_API_KEY);
}

/**
 * Check if Deepgram is properly configured
 */
export function isDeepgramConfigured(): boolean {
  return !!DEEPGRAM_API_KEY;
}
