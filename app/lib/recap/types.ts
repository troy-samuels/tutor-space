export interface RecapVocabWord {
  word: string;
  translation: string;
  example: string;
  phonetic: string;
  /** Part of speech: noun, verb, adjective, adverb, etc. */
  partOfSpeech?: string;
  /** Common word pairings / collocations */
  collocations?: string[];
}

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface BaseExercise {
  question: string;
  explanation: string;
  targetVocab?: string;
  difficulty?: ExerciseDifficulty;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: "multipleChoice";
  options: string[];
  correct: number;
}

export interface FillBlankExercise extends BaseExercise {
  type: "fillBlank";
  answer: string;
  hint?: string;
}

export interface WordOrderExercise extends BaseExercise {
  type: "wordOrder";
  words: string[];
  correctOrder: number[];
  correctSentence: string;
}

export interface ListeningExercise extends BaseExercise {
  type: "listening";
  /** The text to be spoken via Web Speech API */
  spokenText: string;
  /** BCP-47 language code for TTS voice selection */
  speechLang: string;
  /** The correct transcription the student must type */
  answer: string;
  /** Optional hint shown after a failed attempt */
  hint?: string;
}

export interface MatchingExercise extends BaseExercise {
  type: "matching";
  /** Left column items */
  leftItems: string[];
  /** Right column items (same length, index-aligned = correct pair) */
  rightItems: string[];
}

export interface TranslationExercise extends BaseExercise {
  type: "translation";
  /** The sentence to translate */
  sourceText: string;
  /** Source language label (e.g. "English") */
  sourceLanguage: string;
  /** Target language label (e.g. "Spanish") */
  targetLanguage: string;
  /** The correct (or ideal) translation */
  answer: string;
  /** Acceptable alternative translations for fuzzy matching */
  acceptableAnswers?: string[];
}

export interface ContextClozeExercise extends BaseExercise {
  type: "contextCloze";
  /** Paragraph text with numbered blanks: {1}, {2}, {3}, etc. */
  passage: string;
  /** Answers keyed by blank number */
  answers: Record<string, string>;
  /** Optional hints keyed by blank number */
  hints?: Record<string, string>;
}

export type RecapExercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | WordOrderExercise
  | ListeningExercise
  | MatchingExercise
  | TranslationExercise
  | ContextClozeExercise;

/** Localised UI strings for the student recap experience */
export interface RecapUIStrings {
  yourLessonRecap: string;
  whatWeCovered: string;
  keyVocabulary: string;
  yourMission: string;
  tapToReveal: string;
  iKnowThese: string;
  continue: string;
  check: string;
  correct: string;
  notQuite: string;
  correctAnswerIs: string;
  correctSentenceLabel: string;
  questionOf: string;
  arrangeWords: string;
  tapWordsHere: string;
  typeYourAnswer: string;
  showHint: string;
  amazingWork: string;
  greatEffort: string;
  keepGoing: string;
  bonusWord: string;
  prev: string;
  next: string;
  listen: string;
  startPractice: string;
  saveProgress: string;
  maybeLater: string;
  poweredBy: string;
  /* New UI strings for new exercise types */
  listenAndType: string;
  matchThePairs: string;
  translateThisSentence: string;
  fillInTheBlanks: string;
  playAgain: string;
  partOfSpeech: string;
  collocations: string;
  difficulty: string;
  funFact: string;
  streak: string;
  shareYourScore: string;
  practiceAgainTomorrow: string;
}

/** English fallback UI strings for backward compatibility */
export const DEFAULT_UI_STRINGS: RecapUIStrings = {
  yourLessonRecap: "Your Lesson Recap",
  whatWeCovered: "What we covered:",
  keyVocabulary: "🔤 Key Vocabulary",
  yourMission: "Your mission",
  tapToReveal: "Tap to reveal",
  iKnowThese: "I know these →",
  continue: "Continue →",
  check: "Check →",
  correct: "✨ Correct!",
  notQuite: "Not quite!",
  correctAnswerIs: "The correct answer is:",
  correctSentenceLabel: "Correct sentence:",
  questionOf: "Question {n} of {total}",
  arrangeWords: "Arrange the words to form a correct sentence:",
  tapWordsHere: "Tap words below to place them here...",
  typeYourAnswer: "Type your answer...",
  showHint: "💡 Show hint",
  amazingWork: "Amazing work",
  greatEffort: "Great effort",
  keepGoing: "Keep going",
  bonusWord: "🎁 Bonus word:",
  prev: "← Prev",
  next: "Next →",
  listen: "🔊 Listen",
  startPractice: "Start Practice",
  saveProgress: "Want to track your progress over time? Sign in to save your learning journey.",
  maybeLater: "Maybe later",
  poweredBy: "⚡ Powered by",
  listenAndType: "🔊 Listen and type what you hear",
  matchThePairs: "🔗 Match the pairs",
  translateThisSentence: "🌍 Translate this sentence",
  fillInTheBlanks: "📝 Fill in all the blanks",
  playAgain: "🔊 Play again",
  partOfSpeech: "Part of speech",
  collocations: "Common pairings",
  difficulty: "Difficulty",
  funFact: "💡 Fun fact",
  streak: "🔥 Streak",
  shareYourScore: "📤 Share your score",
  practiceAgainTomorrow: "📅 Practice again tomorrow",
};

export interface RecapSummary {
  studentName: string | null;
  tutorName: string | null;
  language: string;
  level: string | null;
  /** BCP-47 code of the language the tutor writes in (e.g. "en", "ja", "pt") */
  tutorLanguage?: string;
  encouragement: string;
  covered: string[];
  vocabulary: RecapVocabWord[];
  weakSpots: string[];
  homework: string;
  bonusWord: { word: string; translation: string };
  /** Cultural or linguistic fun fact related to the lesson */
  funFact?: string;
  /** Analysis of specific student mistakes mentioned by the tutor */
  mistakeAnalysis?: string[];
  /** Localised UI labels — absent on legacy recaps, English fallback used */
  uiStrings?: RecapUIStrings;
}

export interface RecapData {
  id: string;
  shortId: string;
  summary: RecapSummary;
  exercises: RecapExercise[];
  createdAt: string;
}

export interface AttemptAnswer {
  exerciseIndex: number;
  answer: string | number | Record<string, string>;
  correct: boolean;
  timeMs: number;
}
