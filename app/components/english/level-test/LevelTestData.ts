// English Level Test — A1–C2 Placement Questions
// Questions are tagged by CEFR level and skill area

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelQuestion {
  id: number;
  level: CEFRLevel;
  skill: "grammar" | "vocabulary" | "usage";
  prompt: string;
  options: string[];
  correct: number; // index into options
  explanation: string;
}

export const LEVEL_QUESTIONS: LevelQuestion[] = [
  // A1
  {
    id: 1,
    level: "A1",
    skill: "grammar",
    prompt: "She ___ a teacher.",
    options: ["am", "is", "are", "be"],
    correct: 1,
    explanation: "'She' takes 'is' — the third person singular of 'to be'.",
  },
  {
    id: 2,
    level: "A1",
    skill: "vocabulary",
    prompt: "What do you use to tell the time?",
    options: ["a book", "a clock", "a pen", "a chair"],
    correct: 1,
    explanation: "A clock is used to tell the time.",
  },
  {
    id: 3,
    level: "A1",
    skill: "grammar",
    prompt: "I ___ coffee every morning.",
    options: ["drink", "drinks", "drinking", "drank"],
    correct: 0,
    explanation: "First person singular (I) uses the base form 'drink' in the present simple.",
  },
  // A2
  {
    id: 4,
    level: "A2",
    skill: "grammar",
    prompt: "They ___ TV when the phone rang.",
    options: ["watched", "were watching", "watch", "are watching"],
    correct: 1,
    explanation: "Past continuous 'were watching' describes an action in progress when another (rang) interrupted it.",
  },
  {
    id: 5,
    level: "A2",
    skill: "vocabulary",
    prompt: "Which word means the opposite of 'cheap'?",
    options: ["small", "expensive", "near", "easy"],
    correct: 1,
    explanation: "'Expensive' is the antonym of 'cheap'.",
  },
  {
    id: 6,
    level: "A2",
    skill: "usage",
    prompt: "Choose the correct sentence:",
    options: [
      "She suggested to go to the cinema.",
      "She suggested going to the cinema.",
      "She suggested go to the cinema.",
      "She suggested we going to the cinema.",
    ],
    correct: 1,
    explanation: "'Suggest' is followed by a gerund (verb + -ing) or a that-clause.",
  },
  // B1
  {
    id: 7,
    level: "B1",
    skill: "grammar",
    prompt: "By the time she arrived, we ___ for two hours.",
    options: ["waited", "have waited", "had been waiting", "were waiting"],
    correct: 2,
    explanation: "Past perfect continuous ('had been waiting') shows duration of an action before another past event.",
  },
  {
    id: 8,
    level: "B1",
    skill: "vocabulary",
    prompt: "The word 'reluctant' is closest in meaning to:",
    options: ["eager", "unwilling", "happy", "quick"],
    correct: 1,
    explanation: "'Reluctant' means unwilling or hesitant to do something.",
  },
  {
    id: 9,
    level: "B1",
    skill: "usage",
    prompt: "If I ___ you, I would apologise immediately.",
    options: ["am", "was", "were", "had been"],
    correct: 2,
    explanation: "In second conditional, we use 'were' for all subjects (formal: 'If I were you...').",
  },
  {
    id: 10,
    level: "B1",
    skill: "grammar",
    prompt: "He asked me where ___ from.",
    options: ["am I", "I am", "was I", "I was"],
    correct: 3,
    explanation: "In reported speech, past tense is used and the word order is inverted (subject before verb): 'I was'.",
  },
  // B2
  {
    id: 11,
    level: "B2",
    skill: "grammar",
    prompt: "The report ___ by the committee before the deadline.",
    options: [
      "has been submitted",
      "had been submitted",
      "was submitted",
      "submitted",
    ],
    correct: 1,
    explanation: "Past perfect passive ('had been submitted') is needed to show the action was complete before the deadline (another past reference point).",
  },
  {
    id: 12,
    level: "B2",
    skill: "vocabulary",
    prompt: "Choose the best word: 'The politician's speech was ___; it convinced almost no one.'",
    options: ["persuasive", "compelling", "eloquent", "unconvincing"],
    correct: 3,
    explanation: "'Unconvincing' fits: the speech failed to convince, which is confirmed by 'convinced almost no one'.",
  },
  {
    id: 13,
    level: "B2",
    skill: "usage",
    prompt: "Which is the most natural way to express a strong recommendation?",
    options: [
      "You should possibly consider reading this.",
      "You really ought to read this — it's excellent.",
      "Reading this could be a potential option.",
      "It might be worth thinking about reading this.",
    ],
    correct: 1,
    explanation: "'Really ought to' gives a strong, natural recommendation. The others are hedged or awkward.",
  },
  {
    id: 14,
    level: "B2",
    skill: "grammar",
    prompt: "Not only ___ the exam, she also received a scholarship.",
    options: [
      "she passed",
      "did she pass",
      "she did pass",
      "passed she",
    ],
    correct: 1,
    explanation: "After 'not only' at the start of a sentence, inversion is required: 'did she pass'.",
  },
  // C1
  {
    id: 15,
    level: "C1",
    skill: "vocabulary",
    prompt: "The word 'sanguine' means:",
    options: ["angry and aggressive", "optimistic about the future", "deeply saddened", "completely exhausted"],
    correct: 1,
    explanation: "'Sanguine' (from Latin 'sanguis', blood) means optimistic, especially in difficult situations.",
  },
  {
    id: 16,
    level: "C1",
    skill: "grammar",
    prompt: "Had they known about the risks, they ___ the project.",
    options: [
      "would not have started",
      "would not start",
      "did not start",
      "had not started",
    ],
    correct: 0,
    explanation: "This is a third conditional (inverted): 'Had they known' = 'If they had known'. The result needs 'would have + past participle'.",
  },
  {
    id: 17,
    level: "C1",
    skill: "usage",
    prompt: "Which sentence uses 'despite' correctly?",
    options: [
      "Despite of the rain, the match continued.",
      "Despite the rain, the match continued.",
      "Despite that it rained, the match continued.",
      "Despite it rained, the match continued.",
    ],
    correct: 1,
    explanation: "'Despite' is followed directly by a noun/noun phrase, never 'of' or a clause.",
  },
  // C2
  {
    id: 18,
    level: "C2",
    skill: "vocabulary",
    prompt: "A 'pyrrhic victory' is one that:",
    options: [
      "is achieved without any losses",
      "costs so much that it is barely worth winning",
      "is won unexpectedly at the last moment",
      "results in a lasting peace agreement",
    ],
    correct: 1,
    explanation: "A pyrrhic victory comes at such great cost to the victor that it is equivalent to defeat.",
  },
  {
    id: 19,
    level: "C2",
    skill: "grammar",
    prompt: "The results, ___ further analysis is required, are nonetheless promising.",
    options: [
      "pending on whether",
      "for which",
      "notwithstanding that",
      "from which",
    ],
    correct: 1,
    explanation: "'for which' creates a relative clause qualifying 'results': 'the results, for which further analysis is required...'",
  },
  {
    id: 20,
    level: "C2",
    skill: "usage",
    prompt: "Choose the most precise and natural sentence:",
    options: [
      "The situation deteriorated to such an extent that intervention became an inevitable necessity.",
      "The situation so deteriorated that intervention became inevitable.",
      "The situation had deteriorated very much and so intervention was made necessary.",
      "Due to the situation's deterioration, there was a necessity for inevitable intervention.",
    ],
    correct: 1,
    explanation: "Option B is precise, concise, and avoids redundancy ('inevitable necessity' is a tautology). 'So deteriorated' is a clean inversion.",
  },
];

export function scoreToLevel(correct: number, total: number): CEFRLevel {
  const pct = (correct / total) * 100;
  if (pct >= 90) return "C2";
  if (pct >= 78) return "C1";
  if (pct >= 63) return "B2";
  if (pct >= 47) return "B1";
  if (pct >= 30) return "A2";
  return "A1";
}

export const LEVEL_META: Record<
  CEFRLevel,
  { label: string; colour: string; bg: string; description: string; next: string }
> = {
  A1: {
    label: "A1 – Beginner",
    colour: "#6B7280",
    bg: "#F3F4F6",
    description: "You're just starting out. You can understand and use basic phrases.",
    next: "Focus on everyday vocabulary and simple present tense.",
  },
  A2: {
    label: "A2 – Elementary",
    colour: "#0D9668",
    bg: "#ECFDF5",
    description: "You can handle simple, routine exchanges and familiar topics.",
    next: "Practice past tenses and expand your core vocabulary.",
  },
  B1: {
    label: "B1 – Intermediate",
    colour: "#4A7EC5",
    bg: "#EFF6FF",
    description: "You can deal with most everyday situations when travelling in English.",
    next: "Work on conditionals, reported speech, and phrasal verbs.",
  },
  B2: {
    label: "B2 – Upper Intermediate",
    colour: "#7C4FD0",
    bg: "#F5F3FF",
    description: "You can interact with native speakers with a degree of fluency.",
    next: "Polish advanced grammar, idiomatic expressions, and register.",
  },
  C1: {
    label: "C1 – Advanced",
    colour: "#D48C09",
    bg: "#FFFBEB",
    description: "You can express yourself fluently and spontaneously without much searching.",
    next: "Sharpen collocations, nuanced vocabulary, and academic writing.",
  },
  C2: {
    label: "C2 – Mastery",
    colour: "#D36135",
    bg: "#FFF7ED",
    description: "You can understand virtually everything heard or read with ease.",
    next: "You're at near-native level. Keep reading widely and challenging yourself!",
  },
};
