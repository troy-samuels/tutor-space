/**
 * SpeechUtil — Premium wrapper around Web Speech API
 *
 * Handles browser inconsistencies, voice priority selection,
 * and provides Promise-based interfaces for TTS and STT.
 */

/** Check if speech synthesis is available */
export function isAudioSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Check if speech recognition is available */
export function isMicSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
  );
}

/**
 * Voice priority chain: Google > Microsoft > Samantha > any matching lang.
 * Chrome loads voices async, so we wait for them.
 */
export async function getPreferredVoice(
  lang: string
): Promise<SpeechSynthesisVoice | null> {
  if (!isAudioSupported()) return null;

  const voices = await getVoices();
  const langPrefix = lang.split("-")[0].toLowerCase();

  // Priority order for selecting the best voice
  const priorities = [
    (v: SpeechSynthesisVoice) =>
      v.lang.toLowerCase().startsWith(langPrefix) &&
      v.name.toLowerCase().includes("google"),
    (v: SpeechSynthesisVoice) =>
      v.lang.toLowerCase().startsWith(langPrefix) &&
      v.name.toLowerCase().includes("microsoft") &&
      v.name.toLowerCase().includes("online"),
    (v: SpeechSynthesisVoice) =>
      v.lang.toLowerCase().startsWith(langPrefix) &&
      v.name.toLowerCase().includes("samantha"),
    (v: SpeechSynthesisVoice) =>
      v.lang.toLowerCase().startsWith(langPrefix),
  ];

  for (const matcher of priorities) {
    const match = voices.find(matcher);
    if (match) return match;
  }

  return null;
}

/** Promise-based voice list (handles Chrome's async loading) */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome loads voices asynchronously
    let fallbackTimer: ReturnType<typeof setTimeout>;
    const onVoicesChanged = () => {
      clearTimeout(fallbackTimer);
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", onVoicesChanged);

    // Fallback timeout — don't hang forever
    fallbackTimer = setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    }, 2000);
  });
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

/**
 * Promise-based speech synthesis.
 * Resolves when utterance finishes, rejects on error.
 */
export function speak(
  text: string,
  lang: string,
  options: SpeakOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isAudioSupported()) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    if (options.voice) {
      utterance.voice = options.voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      // "interrupted" and "canceled" aren't real errors
      if (event.error === "interrupted" || event.error === "canceled") {
        resolve();
      } else {
        reject(new Error(`Speech error: ${event.error}`));
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export interface ListenResult {
  transcript: string;
  confidence: number;
}

/**
 * Promise-based speech recognition.
 * Resolves with the final transcript, rejects on error.
 */
export function startListening(
  lang: string,
  options: { timeout?: number } = {}
): Promise<ListenResult> {
  return new Promise((resolve, reject) => {
    if (!isMicSupported()) {
      reject(new Error("Speech recognition not supported"));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let resolved = false;
    const timeoutMs = options.timeout ?? 8000;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        recognition.stop();
        resolve({ transcript: "", confidence: 0 });
      }
    }, timeoutMs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      const result = event.results[0][0];
      resolve({
        transcript: result.transcript,
        confidence: result.confidence,
      });
    };

    recognition.onerror = (event: { error: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      // "no-speech" and "aborted" are not fatal
      if (event.error === "no-speech" || event.error === "aborted") {
        resolve({ transcript: "", confidence: 0 });
      } else {
        reject(new Error(`Recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ transcript: "", confidence: 0 });
      }
    };

    try {
      recognition.start();
    } catch (err) {
      resolved = true;
      clearTimeout(timer);
      reject(
        err instanceof Error
          ? err
          : new Error("Failed to start speech recognition")
      );
    }
  });
}

/** Stop any ongoing speech synthesis */
export function stopSpeaking(): void {
  if (isAudioSupported()) {
    window.speechSynthesis.cancel();
  }
}
