// Mock data for TutorLingua Practice flow — Gamified Version

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** True for Chinese, Japanese, Korean — affects tile sizing and game mechanics */
  isCJK?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", isCJK: true },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🌐", isCJK: true },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", isCJK: true },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🌐" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🌐" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
];

// ─── Assessment: Mixed exercise types ────────────────────────────

export type ExerciseType =
  | "multiple-choice"
  | "fill-blank"
  | "word-order"
  | "translate"
  | "listening";

export interface AssessmentExercise {
  type: ExerciseType;
  prompt: string;
  /** For multiple-choice */
  options?: string[];
  correctIndex?: number;
  /** For fill-blank: sentence with ___ placeholder */
  sentence?: string;
  correctAnswer?: string;
  /** For word-order: shuffled words + correct order */
  words?: string[];
  correctOrder?: string[];
  /** For translate */
  sourceText?: string;
  acceptedAnswers?: string[];
  /** XP reward */
  xp: number;
  /** Difficulty label */
  difficulty: "easy" | "medium" | "hard" | "expert" | "master";
}

export const ASSESSMENT_EXERCISES: Record<string, AssessmentExercise[]> = {
  es: [
    {
      type: "multiple-choice",
      prompt: 'How do you say "Good morning" in Spanish?',
      options: ["Buenas noches", "Buenos días", "Buenas tardes", "Adiós"],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete the sentence with the correct verb form.",
      sentence: "Ayer yo ___ al mercado.",
      correctAnswer: "fui",
      options: ["soy", "fui", "voy", "ido"],
      correctIndex: 1,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["gusta", "me", "mucho", "la", "paella"],
      correctOrder: ["me", "gusta", "mucho", "la", "paella"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: '"Ella está cansada" — what tense is this?',
      options: [
        "Past tense",
        "Present (temporary state)",
        "Future tense",
        "Subjunctive",
      ],
      correctIndex: 1,
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "fill-blank",
      prompt: "Use the subjunctive mood.",
      sentence: "Espero que ___ un buen día.",
      correctAnswer: "tengas",
      options: ["tienes", "tengas", "tener", "tendrás"],
      correctIndex: 1,
      xp: 30,
      difficulty: "hard",
    },
  ],
  fr: [
    {
      type: "multiple-choice",
      prompt: 'How do you say "Thank you" in French?',
      options: ["Bonjour", "Merci", "S'il vous plaît", "Au revoir"],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct article.",
      sentence: "J'ai mangé ___ croissants ce matin.",
      correctAnswer: "des",
      options: ["les", "des", "un", "la"],
      correctIndex: 1,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["suis", "je", "Paris", "allé", "à"],
      correctOrder: ["je", "suis", "allé", "à", "Paris"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: 'Which verb uses "être" in passé composé?',
      options: ["manger", "dormir", "aller", "boire"],
      correctIndex: 2,
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "fill-blank",
      prompt: "Complete the conditional sentence.",
      sentence: "Si j'étais riche, je ___ autour du monde.",
      correctAnswer: "voyagerais",
      options: ["voyage", "voyagerais", "voyagerai", "voyagé"],
      correctIndex: 1,
      xp: 30,
      difficulty: "hard",
    },
  ],
  de: [
    {
      type: "multiple-choice",
      prompt: 'How do you say "Good day" in German?',
      options: ["Gute Nacht", "Guten Tag", "Tschüss", "Danke"],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct article.",
      sentence: "___ Buch ist interessant.",
      correctAnswer: "Das",
      options: ["Der", "Die", "Das", "Ein"],
      correctIndex: 2,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["ins", "ich", "Kino", "gehe", "gern"],
      correctOrder: ["ich", "gehe", "gern", "ins", "Kino"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: 'Which auxiliary verb does "gehen" use in perfect tense?',
      options: ["haben", "sein", "werden", "machen"],
      correctIndex: 1,
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct adjective ending.",
      sentence: "Er ist ein ___ Schauspieler.",
      correctAnswer: "großartiger",
      options: ["großartig", "großartiger", "großartige", "großartiges"],
      correctIndex: 1,
      xp: 30,
      difficulty: "hard",
    },
  ],
  pt: [
    {
      type: "multiple-choice",
      prompt: 'How do you say "Please" in Portuguese?',
      options: ["Obrigado", "Por favor", "Desculpe", "Tchau"],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct preposition.",
      sentence: "Eu moro no Brasil ___ cinco anos.",
      correctAnswer: "há",
      options: ["por", "há", "desde", "para"],
      correctIndex: 1,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["gosto", "eu", "música", "de", "brasileira"],
      correctOrder: ["eu", "gosto", "de", "música", "brasileira"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: "Which is the correct future subjunctive?",
      options: ["Quando eu ir", "Quando eu for", "Quando eu fui", "Quando eu vá"],
      correctIndex: 1,
      xp: 25,
      difficulty: "hard",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct gender agreement.",
      sentence: "As músicas são muito ___.",
      correctAnswer: "lindas",
      options: ["lindo", "linda", "lindas", "lindos"],
      correctIndex: 2,
      xp: 20,
      difficulty: "medium",
    },
  ],
  ja: [
    {
      type: "multiple-choice",
      prompt: 'How do you say "Hello" in Japanese?',
      options: ["さようなら", "こんにちは", "ありがとう", "すみません"],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct particle.",
      sentence: "公園___ 散歩しました。",
      correctAnswer: "で",
      options: ["に", "で", "を", "は"],
      correctIndex: 1,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["を", "日本語", "勉強", "しています", "私は"],
      correctOrder: ["私は", "日本語", "を", "勉強", "しています"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: "What is the difference between は and が?",
      options: [
        "は = object, が = subject",
        "は = topic marker, が = subject marker",
        "They are interchangeable",
        "は = past, が = present",
      ],
      correctIndex: 1,
      xp: 25,
      difficulty: "hard",
    },
    {
      type: "fill-blank",
      prompt: "Complete the causative-passive form.",
      sentence: "先生に宿題を___。",
      correctAnswer: "させられました",
      options: ["しました", "させました", "させられました", "されました"],
      correctIndex: 2,
      xp: 30,
      difficulty: "master",
    },
  ],
  en: [
    {
      type: "multiple-choice",
      prompt: "Which sentence is grammatically correct?",
      options: [
        "I goed to the store",
        "I went to the store",
        "I gone to the store",
        "I go to the store yesterday",
      ],
      correctIndex: 1,
      xp: 10,
      difficulty: "easy",
    },
    {
      type: "fill-blank",
      prompt: "Complete with the correct tense.",
      sentence: "I ___ teaching for five years.",
      correctAnswer: "have been",
      options: ["am", "have been", "was", "had"],
      correctIndex: 1,
      xp: 15,
      difficulty: "easy",
    },
    {
      type: "word-order",
      prompt: "Put these words in the correct order.",
      words: ["never", "I", "sushi", "have", "tried"],
      correctOrder: ["I", "have", "never", "tried", "sushi"],
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "multiple-choice",
      prompt: "What is the correct word: affect or effect?",
      options: [
        "The medicine had no affect",
        "The medicine had no effect",
        "The medicine affected no effect",
        "The medicine effected no affect",
      ],
      correctIndex: 1,
      xp: 20,
      difficulty: "medium",
    },
    {
      type: "fill-blank",
      prompt: "Complete the mixed conditional.",
      sentence: "If I ___ harder, I would be more confident now.",
      correctAnswer: "had studied",
      options: ["studied", "had studied", "have studied", "would study"],
      correctIndex: 1,
      xp: 30,
      difficulty: "hard",
    },
  ],
};

// ─── Practice: Mixed interactive exercises ───────────────────────

export type PracticeExerciseType =
  | "conversation"
  | "word-bank"
  | "multiple-choice"
  | "fill-blank"
  | "word-order"
  | "listening-comprehension";

export interface PracticeExercise {
  type: PracticeExerciseType;
  /** Context / instruction for the exercise */
  prompt: string;
  /** For conversation type */
  aiMessage?: string;
  suggestedResponse?: string;
  /** For word-bank: target sentence + available words (includes distractors) */
  targetSentence?: string;
  wordBank?: string[];
  /** For multiple-choice */
  options?: string[];
  correctIndex?: number;
  /** For fill-blank */
  sentence?: string;
  correctAnswer?: string;
  blankOptions?: string[];
  blankCorrectIndex?: number;
  /** For word-order */
  words?: string[];
  correctOrder?: string[];
  /** Error correction (shown after answering) */
  correction?: {
    wrong: string;
    correct: string;
    explanation: string;
  };
  /** XP reward */
  xp: number;
}

export type PracticeDifficultyBand = "easy" | "medium" | "hard";

export interface PracticeQuestionPools {
  easy: PracticeExercise[];
  medium: PracticeExercise[];
  hard: PracticeExercise[];
}

export interface PracticeSession {
  exercises: PracticeExercise[];
  questionPools: PracticeQuestionPools;
  topic: string;
  level: string;
}

interface PracticeSessionSeed {
  exercises: PracticeExercise[];
  topic: string;
  level: string;
}

const PRACTICE_SESSION_SEEDS: Record<string, PracticeSessionSeed> = {
  es: {
    topic: "Weekend Plans",
    level: "B1",
    exercises: [
      {
        type: "word-bank",
        prompt: "Build this sentence: \"I went to the market yesterday.\"",
        targetSentence: "Ayer fui al mercado",
        wordBank: ["Ayer", "fui", "al", "mercado", "soy", "en", "la", "tienda"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "Your friend says: \"¿Qué hiciste ayer?\" — What are they asking?",
        options: [
          "What will you do tomorrow?",
          "What did you do yesterday?",
          "Where are you going?",
          "How are you feeling?",
        ],
        correctIndex: 1,
        xp: 10,
      },
      {
        type: "fill-blank",
        prompt: "Complete: She cooks very ___",
        sentence: "Ella cocina muy ___.",
        correctAnswer: "bien",
        blankOptions: ["bueno", "bien", "buena", "mejor"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "bueno",
          correct: "bien",
          explanation: "'Bien' is an adverb (how she cooks), 'bueno' is an adjective",
        },
        xp: 15,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "¿Qué te gusta hacer los fines de semana?",
        suggestedResponse: "Me gusta salir con mis amigos y ir al cine.",
        xp: 20,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"The food is very delicious\"",
        words: ["es", "comida", "muy", "la", "deliciosa"],
        correctOrder: ["la", "comida", "es", "muy", "deliciosa"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "\"Las tapas son muy ___\" — which is correct?",
        options: ["rico", "ricos", "rica", "ricas"],
        correctIndex: 3,
        correction: {
          wrong: "ricos",
          correct: "ricas",
          explanation: "Gender agreement: 'las tapas' is feminine plural → ricas",
        },
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I hope you have a good day\"",
        targetSentence: "Espero que tengas un buen día",
        wordBank: ["Espero", "que", "tengas", "un", "buen", "día", "tienes", "bueno", "el"],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Subjunctive: I doubt it will rain tomorrow",
        sentence: "Dudo que ___ mañana.",
        correctAnswer: "llueva",
        blankOptions: ["llueve", "llueva", "lloverá", "llovió"],
        blankCorrectIndex: 1,
        xp: 25,
      },
      {
        type: "multiple-choice",
        prompt: "\"Nosotros ___ a la playa ayer\" — what tense?",
        options: ["vamos", "fuimos", "iremos", "íbamos"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"My brother is taller than me\"",
        words: ["hermano", "más", "mi", "que", "es", "alto", "yo"],
        correctOrder: ["mi", "hermano", "es", "más", "alto", "que", "yo"],
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete: We need to leave early",
        sentence: "Necesitamos ___ temprano.",
        correctAnswer: "salir",
        blankOptions: ["salir", "salimos", "sale", "saliendo"],
        blankCorrectIndex: 0,
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "Which word means \"always\"?",
        options: ["nunca", "siempre", "a veces", "casi"],
        correctIndex: 1,
        xp: 10,
      },
      {
        type: "word-bank",
        prompt: "Build: \"Can you help me, please?\"",
        targetSentence: "¿Puedes ayudarme por favor?",
        wordBank: ["¿Puedes", "ayudarme", "por", "favor?", "quieres", "dame", "hoy"],
        xp: 15,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "¿Cuál es tu comida favorita y por qué?",
        suggestedResponse: "Mi comida favorita es la paella porque me encanta el arroz con mariscos.",
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete: If I had money, I would travel",
        sentence: "Si ___ dinero, viajaría.",
        correctAnswer: "tuviera",
        blankOptions: ["tengo", "tuviera", "tendré", "tenía"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "tengo",
          correct: "tuviera",
          explanation: "Conditional sentences use the subjunctive imperfect after 'si'",
        },
        xp: 25,
      },
    ],
  },
  fr: {
    topic: "Daily Routine",
    level: "B1",
    exercises: [
      {
        type: "word-bank",
        prompt: "Build: \"I ate croissants this morning\"",
        targetSentence: "J'ai mangé des croissants ce matin",
        wordBank: ["J'ai", "mangé", "des", "croissants", "ce", "matin", "les", "soir", "bu"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "Which verb uses 'être' in passé composé?",
        options: ["manger", "dormir", "aller", "boire"],
        correctIndex: 2,
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I went to the park",
        sentence: "Je ___ allé au parc.",
        correctAnswer: "suis",
        blankOptions: ["ai", "suis", "étais", "avais"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "ai",
          correct: "suis",
          explanation: "Movement verbs (aller, venir, partir…) use 'être' not 'avoir'",
        },
        xp: 15,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "Qu'est-ce que tu fais le weekend?",
        suggestedResponse: "Le weekend, je fais du sport et je vois mes amis.",
        xp: 20,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"If I were rich, I would travel\"",
        words: ["riche", "je", "j'étais", "voyagerais", "si"],
        correctOrder: ["si", "j'étais", "riche", "je", "voyagerais"],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: Next year (feminine noun!)",
        sentence: "___ prochaine, je vais en France.",
        correctAnswer: "L'année",
        blankOptions: ["Le prochain année", "L'année", "La an", "Le année"],
        blankCorrectIndex: 1,
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "\"Elle est allée\" — why 'allée' with an extra 'e'?",
        options: [
          "It's always spelled that way",
          "Agreement with feminine subject using être",
          "It's in the imperfect tense",
          "It's a reflexive verb",
        ],
        correctIndex: 1,
        xp: 20,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I would like a coffee please\"",
        targetSentence: "Je voudrais un café s'il vous plaît",
        wordBank: ["Je", "voudrais", "un", "café", "s'il", "vous", "plaît", "veux", "le", "bonjour"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "What does \"pourtant\" mean?",
        options: ["therefore", "however", "because", "finally"],
        correctIndex: 1,
        xp: 10,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"She always arrives on time\"",
        words: ["arrive", "elle", "toujours", "à", "l'heure"],
        correctOrder: ["elle", "arrive", "toujours", "à", "l'heure"],
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I have been living here for 3 years",
        sentence: "J' ___ ici depuis trois ans.",
        correctAnswer: "habite",
        blankOptions: ["habite", "ai habité", "habitais", "habiterai"],
        blankCorrectIndex: 0,
        correction: {
          wrong: "ai habité",
          correct: "habite",
          explanation: "French uses present tense with 'depuis' for ongoing actions",
        },
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "Quel est ton film préféré et pourquoi?",
        suggestedResponse: "Mon film préféré est Amélie parce que c'est une belle histoire.",
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "\"Je me suis levé\" — what type of verb is \"se lever\"?",
        options: ["Regular -er verb", "Reflexive verb", "Irregular verb", "Passive voice"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"It is necessary that you come tomorrow\"",
        targetSentence: "Il faut que tu viennes demain",
        wordBank: ["Il", "faut", "que", "tu", "viennes", "demain", "viens", "dois", "aller"],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: If I could, I would go to Paris",
        sentence: "Si je ___, j'irais à Paris.",
        correctAnswer: "pouvais",
        blankOptions: ["peux", "pouvais", "pourrai", "pourrais"],
        blankCorrectIndex: 1,
        xp: 25,
      },
    ],
  },
  de: {
    topic: "Hobbies & Free Time",
    level: "A2",
    exercises: [
      {
        type: "multiple-choice",
        prompt: "\"Das Buch\" — what gender is 'Buch'?",
        options: ["Masculine (der)", "Feminine (die)", "Neuter (das)", "Plural (die)"],
        correctIndex: 2,
        xp: 10,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I like going to the cinema\"",
        targetSentence: "Ich gehe gern ins Kino",
        wordBank: ["Ich", "gehe", "gern", "ins", "Kino", "bin", "im", "Theater"],
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete with the correct adjective ending",
        sentence: "Er ist ein ___ Schauspieler.",
        correctAnswer: "großartiger",
        blankOptions: ["großartig", "großartiger", "großartige", "großartiges"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "großartig",
          correct: "großartiger",
          explanation: "Masculine nominative with 'ein' needs -er ending",
        },
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "Was machst du gern in deiner Freizeit?",
        suggestedResponse: "In meiner Freizeit lese ich gern Bücher und spiele Gitarre.",
        xp: 20,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"I went to the cinema yesterday\"",
        words: ["bin", "ins", "Kino", "gestern", "gegangen", "ich"],
        correctOrder: ["gestern", "bin", "ich", "ins", "Kino", "gegangen"],
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "\"Ich bin ins Kino gegangen\" — why 'bin' not 'habe'?",
        options: [
          "Gehen is a reflexive verb",
          "Gehen indicates movement, uses sein",
          "It's in the future tense",
          "Both are acceptable",
        ],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I have been learning German for 2 years",
        sentence: "Ich lerne ___ zwei Jahren Deutsch.",
        correctAnswer: "seit",
        blankOptions: ["für", "seit", "vor", "nach"],
        blankCorrectIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I would like a beer please\"",
        targetSentence: "Ich hätte gern ein Bier bitte",
        wordBank: ["Ich", "hätte", "gern", "ein", "Bier", "bitte", "habe", "das", "Wein"],
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I must go home now",
        sentence: "Ich ___ jetzt nach Hause gehen.",
        correctAnswer: "muss",
        blankOptions: ["muss", "kann", "will", "darf"],
        blankCorrectIndex: 0,
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "What case follows the preposition \"mit\"?",
        options: ["Nominative", "Accusative", "Dative", "Genitive"],
        correctIndex: 2,
        xp: 15,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"Yesterday I went to the cinema\"",
        words: ["ins", "bin", "gestern", "ich", "Kino", "gegangen"],
        correctOrder: ["gestern", "bin", "ich", "ins", "Kino", "gegangen"],
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "Was machst du normalerweise am Wochenende?",
        suggestedResponse: "Am Wochenende gehe ich gern spazieren und treffe mich mit Freunden.",
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete: The book that I read was good",
        sentence: "Das Buch, ___ ich gelesen habe, war gut.",
        correctAnswer: "das",
        blankOptions: ["der", "die", "das", "den"],
        blankCorrectIndex: 2,
        correction: {
          wrong: "die",
          correct: "das",
          explanation: "Relative pronoun matches the gender of 'Buch' (neuter → das)",
        },
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "\"Ich würde gern reisen\" — what mood is this?",
        options: ["Indicative", "Imperative", "Subjunctive (Konjunktiv II)", "Passive"],
        correctIndex: 2,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"Could you please help me?\"",
        targetSentence: "Könnten Sie mir bitte helfen?",
        wordBank: ["Könnten", "Sie", "mir", "bitte", "helfen?", "du", "mich", "kann"],
        xp: 25,
      },
    ],
  },
  pt: {
    topic: "Music & Culture",
    level: "B1",
    exercises: [
      {
        type: "multiple-choice",
        prompt: "\"Eu moro no Brasil há cinco anos\" — what does 'há' mean here?",
        options: ["There is", "For (duration)", "Since", "Ago"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I like Brazilian music\"",
        targetSentence: "Eu gosto de música brasileira",
        wordBank: ["Eu", "gosto", "de", "música", "brasileira", "gostar", "o", "brasileiro"],
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete with correct gender agreement",
        sentence: "As músicas são muito ___.",
        correctAnswer: "lindas",
        blankOptions: ["lindo", "linda", "lindas", "lindos"],
        blankCorrectIndex: 2,
        correction: {
          wrong: "lindo",
          correct: "lindas",
          explanation: "'Músicas' is feminine plural → lindas",
        },
        xp: 15,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "Que tipo de música você gosta?",
        suggestedResponse: "Eu gosto de bossa nova e samba. São estilos muito bonitos.",
        xp: 20,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"When I go to Brazil, I will visit Rio\"",
        words: ["for", "eu", "quando", "ao", "Brasil", "vou", "visitar", "o", "Rio"],
        correctOrder: ["quando", "eu", "for", "ao", "Brasil", "vou", "visitar", "o", "Rio"],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I have been playing guitar for 5 years",
        sentence: "Eu toco violão ___ cinco anos.",
        correctAnswer: "há",
        blankOptions: ["por", "há", "desde", "para"],
        blankCorrectIndex: 1,
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "\"Quando eu for\" — what tense is this?",
        options: ["Present", "Past", "Future subjunctive", "Conditional"],
        correctIndex: 2,
        xp: 20,
      },
      {
        type: "word-bank",
        prompt: "Build: \"I want to form a band in the future\"",
        targetSentence: "Eu quero formar uma banda no futuro",
        wordBank: ["Eu", "quero", "formar", "uma", "banda", "no", "futuro", "um", "grupo", "queria"],
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I have been studying Portuguese for 2 years",
        sentence: "Eu ___ português há dois anos.",
        correctAnswer: "estudo",
        blankOptions: ["estudo", "estudei", "estudava", "estudarei"],
        blankCorrectIndex: 0,
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "What does \"saudade\" roughly mean?",
        options: ["happiness", "a longing or nostalgia", "anger", "surprise"],
        correctIndex: 1,
        xp: 10,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"She told me that she would come\"",
        words: ["que", "ela", "disse", "viria", "me"],
        correctOrder: ["ela", "me", "disse", "que", "viria"],
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "O que você gosta de fazer nas férias?",
        suggestedResponse: "Nas férias eu gosto de ir à praia e viajar para novos lugares.",
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete: If I were you, I would accept",
        sentence: "Se eu ___ você, eu aceitaria.",
        correctAnswer: "fosse",
        blankOptions: ["sou", "fosse", "seria", "era"],
        blankCorrectIndex: 1,
        xp: 25,
      },
      {
        type: "multiple-choice",
        prompt: "\"Ele está cozinhando\" — what tense is this?",
        options: ["Simple present", "Present continuous", "Past perfect", "Future"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"Could you tell me where the station is?\"",
        targetSentence: "Você poderia me dizer onde fica a estação?",
        wordBank: ["Você", "poderia", "me", "dizer", "onde", "fica", "a", "estação?", "é", "tem"],
        xp: 25,
      },
    ],
  },
  ja: {
    topic: "Daily Life",
    level: "A2",
    exercises: [
      {
        type: "multiple-choice",
        prompt: "Which particle marks the location of an action?",
        options: ["に", "で", "を", "は"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"I am studying Japanese\"",
        words: ["を", "日本語", "勉強", "しています", "私は"],
        correctOrder: ["私は", "日本語", "を", "勉強", "しています"],
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete with the correct particle",
        sentence: "公園___ 散歩しました。",
        correctAnswer: "で",
        blankOptions: ["に", "で", "を", "は"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "に",
          correct: "で",
          explanation: "で marks the location WHERE an action happens",
        },
        xp: 15,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "今日は何をしましたか？",
        suggestedResponse: "今日は公園で散歩しました。天気がよかったです。",
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "は vs が — which is the TOPIC marker?",
        options: ["が", "は", "Both", "Neither"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete the ongoing action",
        sentence: "毎日 勉強___。",
        correctAnswer: "しています",
        blankOptions: ["します", "しています", "するしています", "した"],
        blankCorrectIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"The cherry blossoms were beautiful\"",
        targetSentence: "桜がきれいでした",
        wordBank: ["桜", "が", "きれい", "でした", "は", "です", "の"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "What is the causative-passive of する?",
        options: ["される", "させる", "させられる", "している"],
        correctIndex: 2,
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I am going to the station",
        sentence: "えきに ___。",
        correctAnswer: "いきます",
        blankOptions: ["いきます", "きます", "かえります", "あります"],
        blankCorrectIndex: 0,
        xp: 10,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"I eat sushi at the restaurant\"",
        words: ["すしを", "で", "レストラン", "たべます"],
        correctOrder: ["レストラン", "で", "すしを", "たべます"],
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "Which particle marks the destination?",
        options: ["は (wa)", "を (wo)", "に (ni)", "で (de)"],
        correctIndex: 2,
        xp: 10,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "しゅみは なんですか？ (What are your hobbies?)",
        suggestedResponse: "わたしの しゅみは どくしょと さんぽです。",
        xp: 20,
      },
      {
        type: "fill-blank",
        prompt: "Complete: This is my friend's book",
        sentence: "これは ともだち___ ほんです。",
        correctAnswer: "の",
        blankOptions: ["の", "は", "が", "を"],
        blankCorrectIndex: 0,
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "What does ～てください mean?",
        options: ["Please don't...", "Please do...", "I want to...", "I did..."],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-bank",
        prompt: "Build: \"Yesterday was very fun\"",
        targetSentence: "きのうは とても たのしかったです",
        wordBank: ["きのうは", "とても", "たのしかったです", "たのしいです", "きょうは", "すこし"],
        xp: 20,
      },
    ],
  },
  en: {
    topic: "Work & Career",
    level: "B2",
    exercises: [
      {
        type: "fill-blank",
        prompt: "Complete: Duration with present perfect continuous",
        sentence: "I ___ teaching for five years.",
        correctAnswer: "have been",
        blankOptions: ["am", "have been", "was", "had"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "am teaching since",
          correct: "have been teaching for",
          explanation: "Duration uses present perfect continuous + 'for'",
        },
        xp: 15,
      },
      {
        type: "multiple-choice",
        prompt: "Which is correct?",
        options: [
          "The medicine had no affect",
          "The medicine had no effect",
          "The medicine effected nothing",
          "The medicine was affective",
        ],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"I have never tried sushi\"",
        words: ["never", "I", "sushi", "have", "tried"],
        correctOrder: ["I", "have", "never", "tried", "sushi"],
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "What do you enjoy most about your work?",
        suggestedResponse:
          "I enjoy the creative challenges and working with talented people.",
        xp: 20,
      },
      {
        type: "word-bank",
        prompt: "Build: \"If I had studied harder, I would be confident now\"",
        targetSentence: "If I had studied harder I would be confident now",
        wordBank: [
          "If", "I", "had", "studied", "harder", "would", "be", "confident", "now",
          "have", "will", "am",
        ],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: Past tense narrative",
        sentence: "Last year, one of my students ___ a competition.",
        correctAnswer: "won",
        blankOptions: ["win", "won", "wins", "winning"],
        blankCorrectIndex: 1,
        xp: 10,
      },
      {
        type: "multiple-choice",
        prompt: "\"Despite being tired, she finished the report.\" What does 'despite' express?",
        options: ["Cause", "Contrast/concession", "Time", "Condition"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete the third conditional",
        sentence: "If she ___ the email, she would have replied.",
        correctAnswer: "had seen",
        blankOptions: ["saw", "had seen", "has seen", "would see"],
        blankCorrectIndex: 1,
        xp: 25,
      },
      {
        type: "multiple-choice",
        prompt: "\"She's been working here since 2020\" — what tense?",
        options: ["Present simple", "Present perfect continuous", "Past continuous", "Future perfect"],
        correctIndex: 1,
        xp: 15,
      },
      {
        type: "word-order",
        prompt: "Arrange: \"Not only did he pass, but he also got the highest score\"",
        words: ["he", "not only", "but", "pass,", "did", "the highest score", "he also got"],
        correctOrder: ["not only", "did", "he", "pass,", "but", "he also got", "the highest score"],
        xp: 25,
      },
      {
        type: "fill-blank",
        prompt: "Complete: I wish I ___ more time",
        sentence: "I wish I ___ more time.",
        correctAnswer: "had",
        blankOptions: ["have", "had", "would have", "having"],
        blankCorrectIndex: 1,
        correction: {
          wrong: "have",
          correct: "had",
          explanation: "'Wish' for present situations uses past simple (subjunctive mood)",
        },
        xp: 20,
      },
      {
        type: "conversation",
        prompt: "Respond to the AI naturally",
        aiMessage: "What would you do if you won the lottery?",
        suggestedResponse: "If I won the lottery, I would travel the world and invest in education.",
        xp: 20,
      },
      {
        type: "multiple-choice",
        prompt: "Which is correct? \"The team ___ working hard.\"",
        options: ["is", "are", "both can be correct", "were"],
        correctIndex: 2,
        xp: 15,
      },
      {
        type: "fill-blank",
        prompt: "Complete: By next year, I ___ graduated",
        sentence: "By next year, I ___ graduated.",
        correctAnswer: "will have",
        blankOptions: ["will", "will have", "have", "would have"],
        blankCorrectIndex: 1,
        xp: 25,
      },
      {
        type: "word-bank",
        prompt: "Build: \"Despite the rain, we enjoyed ourselves\"",
        targetSentence: "Despite the rain, we enjoyed ourselves",
        wordBank: ["Despite", "the", "rain,", "we", "enjoyed", "ourselves", "Although", "them", "had"],
        xp: 20,
      },
    ],
  },
};

function buildQuestionPools(exercises: PracticeExercise[]): PracticeQuestionPools {
  const easy = exercises.filter((exercise) => exercise.xp <= 15);
  const medium = exercises.filter(
    (exercise) => exercise.xp > 15 && exercise.xp <= 20
  );
  const hard = exercises.filter((exercise) => exercise.xp > 20);

  return {
    easy: easy.length > 0 ? easy : exercises.slice(0, Math.max(1, Math.floor(exercises.length / 3))),
    medium:
      medium.length > 0
        ? medium
        : exercises.slice(
            Math.max(1, Math.floor(exercises.length / 3)),
            Math.max(2, Math.floor((exercises.length * 2) / 3))
          ),
    hard: hard.length > 0 ? hard : exercises.slice(Math.max(2, Math.floor((exercises.length * 2) / 3))),
  };
}

export function getPracticeDifficultyBand(
  difficultyMultiplier: number
): PracticeDifficultyBand {
  if (difficultyMultiplier >= 2) return "hard";
  if (difficultyMultiplier >= 1.5) return "medium";
  return "easy";
}

export function getPracticeExercisesForDifficulty(
  session: PracticeSession,
  difficultyMultiplier: number
): PracticeExercise[] {
  const band = getPracticeDifficultyBand(difficultyMultiplier);
  const selectedPool = session.questionPools[band];
  if (selectedPool.length > 0) return selectedPool;

  if (band === "hard" && session.questionPools.medium.length > 0) {
    return session.questionPools.medium;
  }
  if (session.questionPools.easy.length > 0) {
    return session.questionPools.easy;
  }
  return session.exercises;
}

export const PRACTICE_SESSIONS: Record<string, PracticeSession> = Object.fromEntries(
  Object.entries(PRACTICE_SESSION_SEEDS).map(([languageCode, session]) => [
    languageCode,
    {
      ...session,
      questionPools: buildQuestionPools(session.exercises),
    },
  ])
) as Record<string, PracticeSession>;

// ─── Error corrections (reused by CorrectionChip) ───────────────

export interface ErrorCorrection {
  wrong: string;
  correct: string;
  explanation: string;
}

// ─── Score / Results data ────────────────────────────────────────

export interface Achievement {
  icon: string;
  label: string;
  description: string;
}

export interface ScoreResult {
  overallScore: number;
  level: string;
  levelLabel: string;
  xpEarned: number;
  streak: number;
  percentile: number;
  metrics: {
    label: string;
    score: number;
  }[];
  topErrors: ErrorCorrection[];
  achievements: Achievement[];
}

export const SCORE_RESULTS: Record<string, ScoreResult> = {
  es: {
    overallScore: 76,
    level: "B1",
    levelLabel: "B1 · Intermediate",
    xpEarned: 145,
    streak: 1,
    percentile: 73,
    metrics: [
      { label: "Grammar", score: 7 },
      { label: "Vocabulary", score: 8 },
      { label: "Fluency", score: 8 },
    ],
    topErrors: [
      { wrong: "soy", correct: "fui", explanation: "Past tense of 'ir' (to go)" },
      { wrong: "bueno", correct: "bien", explanation: "Adverb vs adjective" },
      { wrong: "ricos", correct: "ricas", explanation: "Feminine plural agreement" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "🔥", label: "Quick Learner", description: "Got 3 correct in a row" },
      { icon: "📝", label: "Grammar Guru", description: "Scored 7+ on grammar" },
    ],
  },
  fr: {
    overallScore: 72,
    level: "B1",
    levelLabel: "B1 · Intermédiaire",
    xpEarned: 130,
    streak: 1,
    percentile: 68,
    metrics: [
      { label: "Grammaire", score: 7 },
      { label: "Vocabulaire", score: 7 },
      { label: "Fluidité", score: 8 },
    ],
    topErrors: [
      { wrong: "j'ai allé", correct: "je suis allé(e)", explanation: "Movement verbs use 'être'" },
      { wrong: "le prochain année", correct: "l'année prochaine", explanation: "Feminine noun + placement" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "🇫🇷", label: "Francophone", description: "Completed a French session" },
    ],
  },
  de: {
    overallScore: 70,
    level: "A2",
    levelLabel: "A2 · Grundstufe",
    xpEarned: 115,
    streak: 1,
    percentile: 62,
    metrics: [
      { label: "Grammatik", score: 6 },
      { label: "Wortschatz", score: 7 },
      { label: "Flüssigkeit", score: 8 },
    ],
    topErrors: [
      { wrong: "großartig", correct: "großartiger", explanation: "Adjective ending: masculine nominative" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "🇩🇪", label: "Auf Deutsch!", description: "Completed a German session" },
    ],
  },
  pt: {
    overallScore: 74,
    level: "B1",
    levelLabel: "B1 · Intermediário",
    xpEarned: 125,
    streak: 1,
    percentile: 70,
    metrics: [
      { label: "Gramática", score: 7 },
      { label: "Vocabulário", score: 8 },
      { label: "Fluência", score: 7 },
    ],
    topErrors: [
      { wrong: "por cinco anos", correct: "há cinco anos", explanation: "Duration uses 'há'" },
      { wrong: "lindo", correct: "lindas", explanation: "Feminine plural agreement" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "🇧🇷", label: "Brasileiro", description: "Completed a Portuguese session" },
    ],
  },
  ja: {
    overallScore: 68,
    level: "A2",
    levelLabel: "A2 · 初級",
    xpEarned: 110,
    streak: 1,
    percentile: 58,
    metrics: [
      { label: "文法", score: 6 },
      { label: "語彙", score: 7 },
      { label: "流暢さ", score: 7 },
    ],
    topErrors: [
      { wrong: "公園に散歩", correct: "公園で散歩", explanation: "Action location uses で" },
      { wrong: "勉強するしています", correct: "勉強しています", explanation: "Don't double する" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "🇯🇵", label: "日本語!", description: "Completed a Japanese session" },
    ],
  },
  en: {
    overallScore: 78,
    level: "B2",
    levelLabel: "B2 · Upper Intermediate",
    xpEarned: 140,
    streak: 1,
    percentile: 76,
    metrics: [
      { label: "Grammar", score: 7 },
      { label: "Vocabulary", score: 8 },
      { label: "Fluency", score: 9 },
    ],
    topErrors: [
      { wrong: "I am teaching since", correct: "I have been teaching for", explanation: "Present perfect continuous for duration" },
      { wrong: "win", correct: "won", explanation: "Past tense for completed action" },
    ],
    achievements: [
      { icon: "🎯", label: "First Session", description: "Completed your first practice" },
      { icon: "⚡", label: "Speed Demon", description: "Answered 5 questions in under 30 seconds" },
    ],
  },
};
