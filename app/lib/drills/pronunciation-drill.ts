/**
 * Pronunciation Drill Generator
 *
 * Generates pronunciation drills based on student errors, lesson content,
 * and language-specific phoneme targets. Integrates with Azure Speech Services
 * for pronunciation assessment.
 */

import type { StudentAnalysis } from "@/lib/analysis/student-speech-analyzer";
import type { TutorAnalysis } from "@/lib/analysis/tutor-speech-analyzer";
import type { L1InterferenceResult } from "@/lib/analysis/l1-interference";

// =============================================================================
// TYPES
// =============================================================================

export interface PronunciationDrill {
  type: "pronunciation";
  id: string;
  title: string;
  description: string;
  targetPhonemes: string[];
  targetWords: string[];
  targetPhrases: string[];
  referenceText: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  sourceTimestamp?: number;
  estimatedDurationMinutes: number;
  azureSpeechConfig: {
    language: string;
    referenceText: string;
    gradingSystem: "HundredMark" | "FivePoint";
    granularity: "Phoneme" | "Word" | "FullText";
    dimension: "Comprehensive";
    enableMiscue: boolean;
  };
  focusAreas: PronunciationFocusArea[];
  practiceSteps: PronunciationStep[];
  tips: string[];
}

export interface PronunciationFocusArea {
  type: "phoneme" | "word" | "phrase" | "intonation" | "stress";
  target: string;
  description: string;
  commonMistake?: string;
  l1Related: boolean;
}

export interface PronunciationStep {
  order: number;
  instruction: string;
  targetText: string;
  isOptional: boolean;
  focusPhonemes?: string[];
}

export interface PronunciationDrillInput {
  studentAnalysis: StudentAnalysis;
  tutorAnalysis?: TutorAnalysis;
  l1Interference?: L1InterferenceResult[];
  targetLanguage: string;
  nativeLanguage?: string;
  proficiencyLevel?: string;
}

// =============================================================================
// PHONEME DATABASES
// =============================================================================

/**
 * Common difficult phonemes by L1→L2 pair
 */
const DIFFICULT_PHONEMES: Record<string, Record<string, string[]>> = {
  ja: {
    en: ["/r/", "/l/", "/θ/", "/ð/", "/v/", "/f/", "/æ/", "/ʌ/"],
  },
  zh: {
    en: ["/r/", "/θ/", "/ð/", "/v/", "/æ/", "/ɪ/", "/ʊ/"],
  },
  es: {
    en: ["/v/", "/b/", "/ʃ/", "/ʒ/", "/z/", "/æ/", "/ɪ/"],
  },
  ko: {
    en: ["/r/", "/l/", "/f/", "/v/", "/θ/", "/ð/", "/z/"],
  },
  de: {
    en: ["/w/", "/v/", "/θ/", "/ð/", "/æ/"],
  },
  fr: {
    en: ["/θ/", "/ð/", "/h/", "/r/", "/ŋ/"],
  },
  pt: {
    en: ["/θ/", "/ð/", "/h/", "/æ/", "/ɪ/"],
  },
  ar: {
    en: ["/p/", "/v/", "/ʒ/", "/ŋ/", "/eɪ/", "/oʊ/"],
  },
  ru: {
    en: ["/θ/", "/ð/", "/w/", "/æ/", "/ŋ/"],
  },
  it: {
    en: ["/θ/", "/ð/", "/h/", "/æ/", "/ʌ/"],
  },
};

/**
 * Word lists by phoneme for practice
 */
const PHONEME_WORD_LISTS: Record<string, string[]> = {
  "/r/": ["red", "run", "river", "right", "rock", "road", "rain", "room"],
  "/l/": ["light", "love", "leave", "listen", "look", "learn", "life", "long"],
  "/θ/": ["think", "three", "through", "thought", "thing", "thank", "thick", "throw"],
  "/ð/": ["this", "that", "there", "them", "then", "these", "those", "the"],
  "/v/": ["very", "voice", "view", "value", "visit", "video", "village", "vote"],
  "/w/": ["water", "want", "work", "world", "week", "way", "word", "wait"],
  "/h/": ["house", "help", "have", "home", "hope", "happy", "hard", "here"],
  "/æ/": ["cat", "hat", "apple", "happy", "family", "man", "back", "hand"],
  "/ʌ/": ["cup", "love", "money", "come", "some", "done", "mother", "run"],
  "/ɪ/": ["bit", "sit", "ship", "fish", "with", "this", "big", "give"],
  "/ʊ/": ["book", "look", "good", "foot", "put", "push", "cook", "would"],
  "/ŋ/": ["sing", "thing", "ring", "bring", "king", "long", "wrong", "young"],
  "/ʃ/": ["she", "ship", "shoe", "shop", "fish", "wash", "push", "wish"],
  "/ʒ/": ["vision", "measure", "pleasure", "leisure", "treasure", "usual"],
  "/z/": ["zoo", "zero", "zone", "zoom", "zip", "buzz", "fizz", "jazz"],
};

/**
 * Minimal pairs for contrast practice
 */
const MINIMAL_PAIRS: Record<string, string[][]> = {
  "r-l": [
    ["right", "light"],
    ["red", "led"],
    ["road", "load"],
    ["rain", "lane"],
    ["rock", "lock"],
  ],
  "v-b": [
    ["very", "berry"],
    ["vest", "best"],
    ["vote", "boat"],
    ["vase", "base"],
  ],
  "θ-s": [
    ["think", "sink"],
    ["thick", "sick"],
    ["three", "see"],
    ["thank", "sank"],
  ],
  "ð-z": [
    ["then", "zen"],
    ["those", "doze"],
  ],
  "w-v": [
    ["wine", "vine"],
    ["west", "vest"],
    ["wet", "vet"],
    ["wail", "veil"],
  ],
  "æ-e": [
    ["bat", "bet"],
    ["pan", "pen"],
    ["man", "men"],
    ["bad", "bed"],
  ],
  "ɪ-i": [
    ["ship", "sheep"],
    ["sit", "seat"],
    ["bit", "beat"],
    ["slip", "sleep"],
  ],
};

// =============================================================================
// AZURE SPEECH LANGUAGE CODES
// =============================================================================

const AZURE_LANGUAGE_CODES: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-BR",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-SA",
  ru: "ru-RU",
  hi: "hi-IN",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
};

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

/**
 * Generate pronunciation drills based on lesson analysis
 */
export async function generatePronunciationDrills(
  input: PronunciationDrillInput
): Promise<PronunciationDrill[]> {
  const {
    studentAnalysis,
    tutorAnalysis,
    l1Interference,
    targetLanguage,
    nativeLanguage,
    proficiencyLevel = "intermediate",
  } = input;

  const drills: PronunciationDrill[] = [];

  // 1. Generate drills for pronunciation errors from lesson
  const errorBasedDrill = generateErrorBasedDrill(
    studentAnalysis,
    targetLanguage,
    proficiencyLevel
  );
  if (errorBasedDrill) {
    drills.push(errorBasedDrill);
  }

  // 2. Generate L1-targeted phoneme drill
  if (nativeLanguage && l1Interference && l1Interference.length > 0) {
    const l1Drill = generateL1PhonemeDrill(
      nativeLanguage,
      targetLanguage,
      l1Interference,
      proficiencyLevel
    );
    if (l1Drill) {
      drills.push(l1Drill);
    }
  }

  // 3. Generate vocabulary pronunciation drill from tutor focus
  if (tutorAnalysis && tutorAnalysis.focusVocabulary.length > 0) {
    const vocabDrill = generateVocabularyPronunciationDrill(
      tutorAnalysis.focusVocabulary,
      targetLanguage,
      proficiencyLevel
    );
    if (vocabDrill) {
      drills.push(vocabDrill);
    }
  }

  // 4. Generate minimal pairs drill if L1 suggests contrast issues
  if (nativeLanguage) {
    const minimalPairsDrill = generateMinimalPairsDrill(
      nativeLanguage,
      targetLanguage,
      proficiencyLevel
    );
    if (minimalPairsDrill) {
      drills.push(minimalPairsDrill);
    }
  }

  return drills;
}

// =============================================================================
// SPECIFIC DRILL GENERATORS
// =============================================================================

/**
 * Generate drill based on specific pronunciation errors from lesson
 */
function generateErrorBasedDrill(
  studentAnalysis: StudentAnalysis,
  targetLanguage: string,
  proficiencyLevel: string
): PronunciationDrill | null {
  // Find pronunciation-related errors
  const pronunciationErrors = studentAnalysis.errors.filter(
    (e) => e.category === "pronunciation" || e.type === "pronunciation"
  );

  if (pronunciationErrors.length === 0) {
    return null;
  }

  // Extract words that had pronunciation issues
  const targetWords = pronunciationErrors
    .map((e) => e.original)
    .filter((w) => w && w.length > 0)
    .slice(0, 10);

  if (targetWords.length === 0) {
    return null;
  }

  const referenceText = targetWords.join(". ");

  return {
    type: "pronunciation",
    id: `pron-error-${Date.now()}`,
    title: "Pronunciation Practice: Lesson Corrections",
    description: "Practice the words from your lesson that need pronunciation improvement.",
    targetPhonemes: [],
    targetWords,
    targetPhrases: [],
    referenceText,
    difficulty: mapProficiencyToDifficulty(proficiencyLevel),
    language: targetLanguage,
    estimatedDurationMinutes: Math.max(5, targetWords.length),
    azureSpeechConfig: {
      language: AZURE_LANGUAGE_CODES[targetLanguage] || "en-US",
      referenceText,
      gradingSystem: "HundredMark",
      granularity: "Word",
      dimension: "Comprehensive",
      enableMiscue: true,
    },
    focusAreas: targetWords.map((word) => ({
      type: "word" as const,
      target: word,
      description: `Practice correct pronunciation of "${word}"`,
      l1Related: false,
    })),
    practiceSteps: targetWords.map((word, index) => ({
      order: index + 1,
      instruction: `Say "${word}" clearly`,
      targetText: word,
      isOptional: false,
    })),
    tips: [
      "Listen to the reference audio before speaking",
      "Focus on the sounds you found difficult in the lesson",
      "Slow down if needed - accuracy is more important than speed",
    ],
  };
}

/**
 * Generate drill targeting L1 interference phonemes
 */
function generateL1PhonemeDrill(
  nativeLanguage: string,
  targetLanguage: string,
  l1Interference: L1InterferenceResult[],
  proficiencyLevel: string
): PronunciationDrill | null {
  // Get difficult phonemes for this L1→L2 pair
  const difficultPhonemes = DIFFICULT_PHONEMES[nativeLanguage]?.[targetLanguage];

  if (!difficultPhonemes || difficultPhonemes.length === 0) {
    return null;
  }

  // Select top 3 phonemes to focus on
  const targetPhonemes = difficultPhonemes.slice(0, 3);

  // Get practice words for each phoneme
  const targetWords: string[] = [];
  for (const phoneme of targetPhonemes) {
    const words = PHONEME_WORD_LISTS[phoneme];
    if (words) {
      targetWords.push(...words.slice(0, 3));
    }
  }

  if (targetWords.length === 0) {
    return null;
  }

  const referenceText = targetWords.join(". ");

  return {
    type: "pronunciation",
    id: `pron-l1-${Date.now()}`,
    title: `Phoneme Practice: Common ${getLanguageName(nativeLanguage)} Speaker Challenges`,
    description: `These sounds are often challenging for ${getLanguageName(nativeLanguage)} speakers learning ${getLanguageName(targetLanguage)}. Regular practice will help!`,
    targetPhonemes,
    targetWords,
    targetPhrases: [],
    referenceText,
    difficulty: mapProficiencyToDifficulty(proficiencyLevel),
    language: targetLanguage,
    estimatedDurationMinutes: 10,
    azureSpeechConfig: {
      language: AZURE_LANGUAGE_CODES[targetLanguage] || "en-US",
      referenceText,
      gradingSystem: "HundredMark",
      granularity: "Phoneme",
      dimension: "Comprehensive",
      enableMiscue: true,
    },
    focusAreas: targetPhonemes.map((phoneme) => ({
      type: "phoneme" as const,
      target: phoneme,
      description: `The ${phoneme} sound`,
      commonMistake: getCommonMistake(phoneme, nativeLanguage),
      l1Related: true,
    })),
    practiceSteps: targetWords.map((word, index) => ({
      order: index + 1,
      instruction: `Practice: ${word}`,
      targetText: word,
      isOptional: false,
      focusPhonemes: targetPhonemes.filter((p) => {
        const words = PHONEME_WORD_LISTS[p];
        return words?.includes(word);
      }),
    })),
    tips: [
      `${getLanguageName(nativeLanguage)} doesn't have some of these sounds - focus on mouth position`,
      "Watch videos of native speakers to see how they form these sounds",
      "Practice in front of a mirror to check your mouth shape",
    ],
  };
}

/**
 * Generate vocabulary pronunciation drill
 */
function generateVocabularyPronunciationDrill(
  vocabulary: string[],
  targetLanguage: string,
  proficiencyLevel: string
): PronunciationDrill | null {
  if (vocabulary.length === 0) {
    return null;
  }

  const targetWords = vocabulary.slice(0, 12);
  const referenceText = targetWords.join(". ");

  return {
    type: "pronunciation",
    id: `pron-vocab-${Date.now()}`,
    title: "Vocabulary Pronunciation Practice",
    description: "Practice pronouncing the key vocabulary from your lesson.",
    targetPhonemes: [],
    targetWords,
    targetPhrases: [],
    referenceText,
    difficulty: mapProficiencyToDifficulty(proficiencyLevel),
    language: targetLanguage,
    estimatedDurationMinutes: Math.max(5, targetWords.length),
    azureSpeechConfig: {
      language: AZURE_LANGUAGE_CODES[targetLanguage] || "en-US",
      referenceText,
      gradingSystem: "HundredMark",
      granularity: "Word",
      dimension: "Comprehensive",
      enableMiscue: true,
    },
    focusAreas: targetWords.map((word) => ({
      type: "word" as const,
      target: word,
      description: `Vocabulary word: ${word}`,
      l1Related: false,
    })),
    practiceSteps: targetWords.map((word, index) => ({
      order: index + 1,
      instruction: `Say "${word}"`,
      targetText: word,
      isOptional: false,
    })),
    tips: [
      "Focus on stress patterns for multi-syllable words",
      "Link words together naturally when practicing phrases",
      "Record yourself and compare to native pronunciation",
    ],
  };
}

/**
 * Generate minimal pairs drill for contrast practice
 */
function generateMinimalPairsDrill(
  nativeLanguage: string,
  targetLanguage: string,
  proficiencyLevel: string
): PronunciationDrill | null {
  // Get difficult phonemes for this pair
  const difficultPhonemes = DIFFICULT_PHONEMES[nativeLanguage]?.[targetLanguage];

  if (!difficultPhonemes || difficultPhonemes.length < 2) {
    return null;
  }

  // Find relevant minimal pairs
  const relevantPairs: string[][] = [];
  const pairKeys = Object.keys(MINIMAL_PAIRS);

  for (const key of pairKeys) {
    const [p1, p2] = key.split("-");
    const fullP1 = `/${p1}/`;
    const fullP2 = `/${p2}/`;

    if (difficultPhonemes.includes(fullP1) || difficultPhonemes.includes(fullP2)) {
      relevantPairs.push(...(MINIMAL_PAIRS[key] || []));
    }
  }

  if (relevantPairs.length === 0) {
    return null;
  }

  // Select up to 5 pairs
  const selectedPairs = relevantPairs.slice(0, 5);
  const targetWords = selectedPairs.flat();
  const referenceText = selectedPairs.map((pair) => `${pair[0]}, ${pair[1]}`).join(". ");

  return {
    type: "pronunciation",
    id: `pron-minimal-${Date.now()}`,
    title: "Minimal Pairs Contrast Practice",
    description: "Practice distinguishing between similar sounds with minimal pairs.",
    targetPhonemes: difficultPhonemes.slice(0, 4),
    targetWords,
    targetPhrases: [],
    referenceText,
    difficulty: mapProficiencyToDifficulty(proficiencyLevel),
    language: targetLanguage,
    estimatedDurationMinutes: 8,
    azureSpeechConfig: {
      language: AZURE_LANGUAGE_CODES[targetLanguage] || "en-US",
      referenceText,
      gradingSystem: "HundredMark",
      granularity: "Phoneme",
      dimension: "Comprehensive",
      enableMiscue: true,
    },
    focusAreas: selectedPairs.map((pair) => ({
      type: "word" as const,
      target: `${pair[0]} vs ${pair[1]}`,
      description: "Minimal pair contrast",
      l1Related: true,
    })),
    practiceSteps: selectedPairs.flatMap((pair, index) => [
      {
        order: index * 2 + 1,
        instruction: `Say "${pair[0]}"`,
        targetText: pair[0],
        isOptional: false,
      },
      {
        order: index * 2 + 2,
        instruction: `Now say "${pair[1]}" - notice the difference`,
        targetText: pair[1],
        isOptional: false,
      },
    ]),
    tips: [
      "Focus on the single sound that differs between the words",
      "Exaggerate the difference at first, then make it more natural",
      "Say both words back-to-back to feel the contrast",
    ],
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapProficiencyToDifficulty(
  proficiency: string
): "beginner" | "intermediate" | "advanced" {
  const lower = proficiency.toLowerCase();
  if (lower.includes("beginner") || lower.includes("elementary")) {
    return "beginner";
  }
  if (lower.includes("advanced") || lower.includes("proficient")) {
    return "advanced";
  }
  return "intermediate";
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    ru: "Russian",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
  };
  return names[code] || code.toUpperCase();
}

function getCommonMistake(phoneme: string, nativeLanguage: string): string {
  const mistakes: Record<string, Record<string, string>> = {
    "/r/": {
      ja: "Often pronounced as /l/ or Japanese 'r'",
      zh: "May sound like /l/ or retroflex approximant",
      ko: "Often confused with /l/",
    },
    "/l/": {
      ja: "Often pronounced as /r/ or Japanese 'r'",
      zh: "May be unclear at word endings",
    },
    "/θ/": {
      ja: "Often pronounced as /s/",
      zh: "Often pronounced as /s/",
      es: "Often pronounced as /t/ or /s/",
      de: "Often pronounced as /s/",
      fr: "Often pronounced as /s/ or /z/",
    },
    "/ð/": {
      ja: "Often pronounced as /z/",
      zh: "Often pronounced as /z/ or /d/",
      es: "Often pronounced as /d/",
    },
    "/v/": {
      es: "Often confused with /b/",
      de: "Often pronounced as /f/",
      ja: "Often pronounced as /b/",
    },
    "/æ/": {
      ja: "Often pronounced as /a/ or /e/",
      zh: "Often pronounced as /e/ or /ɛ/",
      es: "Often pronounced as /a/",
    },
  };

  return mistakes[phoneme]?.[nativeLanguage] || "May be unfamiliar - listen carefully";
}

// =============================================================================
// EXPORT ADDITIONAL UTILITIES
// =============================================================================

export {
  DIFFICULT_PHONEMES,
  PHONEME_WORD_LISTS,
  MINIMAL_PAIRS,
  AZURE_LANGUAGE_CODES,
};
