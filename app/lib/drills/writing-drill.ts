/**
 * Writing Drill Generator
 *
 * Generates contextual writing exercises based on lesson objectives,
 * vocabulary focus, and grammar targets. Includes rubrics for evaluation.
 */

import type { TutorAnalysis, InferredObjective } from "@/lib/analysis/tutor-speech-analyzer";
import type { StudentAnalysis } from "@/lib/analysis/student-speech-analyzer";
import type { L1InterferenceResult } from "@/lib/analysis/l1-interference";

// =============================================================================
// TYPES
// =============================================================================

export interface WritingDrill {
  type: "contextual_writing";
  id: string;
  title: string;
  description: string;
  prompt: string;
  promptType: WritingPromptType;
  context: string;
  instructions: string[];
  requiredVocabulary: string[];
  grammarFocus: string[];
  minWords: number;
  maxWords: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  estimatedDurationMinutes: number;
  rubric: WritingRubric;
  exampleResponse?: string;
  scaffoldingHints: string[];
  commonMistakesToAvoid: string[];
  bonusChallenges?: string[];
}

export type WritingPromptType =
  | "email"
  | "message"
  | "description"
  | "narrative"
  | "opinion"
  | "comparison"
  | "instructions"
  | "summary"
  | "letter"
  | "review"
  | "diary"
  | "essay";

export interface WritingRubric {
  vocabularyUsage: RubricCategory;
  grammarAccuracy: RubricCategory;
  coherence: RubricCategory;
  taskCompletion: RubricCategory;
  creativity?: RubricCategory;
}

export interface RubricCategory {
  weight: number;
  criteria: string[];
  exemplary: string;
  proficient: string;
  developing: string;
  beginning: string;
}

export interface WritingDrillInput {
  lessonObjectives: InferredObjective[];
  tutorAnalysis?: TutorAnalysis;
  studentAnalysis?: StudentAnalysis;
  l1Interference?: L1InterferenceResult[];
  targetLanguage: string;
  proficiencyLevel: string;
  studentName?: string;
}

// =============================================================================
// PROMPT TEMPLATES BY TYPE AND TOPIC
// =============================================================================

interface PromptTemplate {
  type: WritingPromptType;
  title: string;
  prompt: string;
  context: string;
  instructions: string[];
  minWords: number;
  maxWords: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const PROMPT_TEMPLATES: Record<string, PromptTemplate[]> = {
  travel: [
    {
      type: "email",
      title: "Hotel Reservation Inquiry",
      prompt: "Write an email to a hotel asking about room availability and amenities for your upcoming trip.",
      context: "You are planning a vacation and need to contact a hotel.",
      instructions: [
        "Include the dates you want to stay",
        "Ask about room types and prices",
        "Inquire about specific amenities",
        "Request a response",
      ],
      minWords: 50,
      maxWords: 150,
      difficulty: "beginner",
    },
    {
      type: "narrative",
      title: "My Best Trip",
      prompt: "Write about a memorable trip you took. Describe where you went, what you did, and why it was special.",
      context: "Share a travel experience with a friend.",
      instructions: [
        "Describe the destination",
        "Tell what activities you did",
        "Explain what made it memorable",
        "Use past tense verbs",
      ],
      minWords: 100,
      maxWords: 250,
      difficulty: "intermediate",
    },
    {
      type: "review",
      title: "Destination Review",
      prompt: "Write a review of a place you visited, rating different aspects like accommodations, food, attractions, and value for money.",
      context: "Help other travelers by sharing your experience.",
      instructions: [
        "Give an overall rating",
        "Discuss pros and cons",
        "Make a recommendation",
        "Include specific examples",
      ],
      minWords: 150,
      maxWords: 300,
      difficulty: "advanced",
    },
  ],
  food: [
    {
      type: "description",
      title: "My Favorite Dish",
      prompt: "Describe your favorite food or dish. What is it? What does it taste like? Why do you like it?",
      context: "Tell someone about food you enjoy.",
      instructions: [
        "Name the dish",
        "Describe how it looks and tastes",
        "Explain why you like it",
        "Use descriptive adjectives",
      ],
      minWords: 50,
      maxWords: 120,
      difficulty: "beginner",
    },
    {
      type: "instructions",
      title: "Recipe Writing",
      prompt: "Write instructions for preparing a simple dish or recipe you know how to make.",
      context: "Share a recipe with a friend who wants to learn.",
      instructions: [
        "List the ingredients needed",
        "Write step-by-step instructions",
        "Use command/imperative forms",
        "Include cooking times",
      ],
      minWords: 80,
      maxWords: 200,
      difficulty: "intermediate",
    },
    {
      type: "review",
      title: "Restaurant Review",
      prompt: "Write a review of a restaurant you've visited. Rate the food, service, ambiance, and overall experience.",
      context: "Review for a restaurant guide website.",
      instructions: [
        "Mention what you ordered",
        "Describe the quality",
        "Comment on service and atmosphere",
        "Give a recommendation",
      ],
      minWords: 120,
      maxWords: 250,
      difficulty: "intermediate",
    },
  ],
  work: [
    {
      type: "email",
      title: "Absence Notification",
      prompt: "Write a professional email to your supervisor explaining that you will be absent from work.",
      context: "You need to take a day off for a personal matter.",
      instructions: [
        "State the reason for your absence",
        "Mention the date(s)",
        "Offer to handle urgent matters",
        "Use formal language",
      ],
      minWords: 50,
      maxWords: 120,
      difficulty: "beginner",
    },
    {
      type: "email",
      title: "Meeting Request",
      prompt: "Write an email requesting a meeting with a colleague to discuss a project.",
      context: "You need to coordinate on a work project.",
      instructions: [
        "State the purpose of the meeting",
        "Propose some available times",
        "Explain what you'd like to discuss",
        "Be professional and polite",
      ],
      minWords: 70,
      maxWords: 150,
      difficulty: "intermediate",
    },
    {
      type: "opinion",
      title: "Workplace Improvement",
      prompt: "Write a proposal suggesting an improvement to your workplace. Explain the problem and your solution.",
      context: "Submit ideas for making the office better.",
      instructions: [
        "Identify a current issue",
        "Propose a solution",
        "Explain the benefits",
        "Address potential concerns",
      ],
      minWords: 150,
      maxWords: 300,
      difficulty: "advanced",
    },
  ],
  daily_life: [
    {
      type: "diary",
      title: "My Day",
      prompt: "Write about what you did today (or a typical day in your life).",
      context: "Daily journal entry.",
      instructions: [
        "Describe your morning routine",
        "Mention main activities",
        "Tell how you felt",
        "Use past tense",
      ],
      minWords: 50,
      maxWords: 150,
      difficulty: "beginner",
    },
    {
      type: "message",
      title: "Making Plans",
      prompt: "Write a text message to a friend suggesting plans for the weekend.",
      context: "Casual conversation with a friend.",
      instructions: [
        "Suggest an activity",
        "Propose a time",
        "Keep it casual and friendly",
        "Ask for their response",
      ],
      minWords: 30,
      maxWords: 80,
      difficulty: "beginner",
    },
    {
      type: "description",
      title: "My Living Space",
      prompt: "Describe where you live. What does your home look like? What are your favorite and least favorite things about it?",
      context: "Tell a new friend about your home.",
      instructions: [
        "Describe the type of home",
        "Mention the rooms and features",
        "Share what you like about it",
        "Use location prepositions",
      ],
      minWords: 80,
      maxWords: 180,
      difficulty: "intermediate",
    },
  ],
  opinions: [
    {
      type: "opinion",
      title: "Opinion on Social Media",
      prompt: "Write your opinion about social media. Is it mostly positive or negative for society? Explain your view.",
      context: "Contribute to a class discussion.",
      instructions: [
        "State your opinion clearly",
        "Give at least two reasons",
        "Use examples to support your view",
        "Consider the opposite view briefly",
      ],
      minWords: 100,
      maxWords: 220,
      difficulty: "intermediate",
    },
    {
      type: "comparison",
      title: "City vs. Country Living",
      prompt: "Compare living in a city versus living in the countryside. Which do you prefer and why?",
      context: "Personal reflection essay.",
      instructions: [
        "Compare at least 3 aspects",
        "State your preference",
        "Use comparison structures",
        "Give specific reasons",
      ],
      minWords: 120,
      maxWords: 250,
      difficulty: "intermediate",
    },
    {
      type: "essay",
      title: "Technology's Impact",
      prompt: "Write an essay about how technology has changed our lives in the past 20 years.",
      context: "Academic essay assignment.",
      instructions: [
        "Write an introduction with thesis",
        "Discuss multiple impacts",
        "Include examples",
        "Write a conclusion",
      ],
      minWords: 200,
      maxWords: 400,
      difficulty: "advanced",
    },
  ],
  introduction: [
    {
      type: "description",
      title: "Introduce Yourself",
      prompt: "Write a paragraph introducing yourself. Include your name, where you're from, what you do, and your hobbies.",
      context: "First day in a new class or group.",
      instructions: [
        "Share basic information",
        "Mention your interests",
        "Say something about your goals",
        "Keep it friendly",
      ],
      minWords: 50,
      maxWords: 120,
      difficulty: "beginner",
    },
    {
      type: "description",
      title: "Family Description",
      prompt: "Write about your family. Who are the members? What do they do? What do you like doing together?",
      context: "Share with a new friend or pen pal.",
      instructions: [
        "Mention family members",
        "Describe each person briefly",
        "Share activities you do together",
        "Use possessive forms",
      ],
      minWords: 60,
      maxWords: 150,
      difficulty: "beginner",
    },
  ],
  grammar_practice: [
    {
      type: "narrative",
      title: "What Happened Yesterday",
      prompt: "Write about what you did yesterday from morning to night.",
      context: "Practice using past tense.",
      instructions: [
        "Write in chronological order",
        "Use past tense verbs",
        "Include time expressions",
        "Connect ideas smoothly",
      ],
      minWords: 60,
      maxWords: 150,
      difficulty: "beginner",
    },
    {
      type: "narrative",
      title: "My Plans for the Future",
      prompt: "Write about your plans and goals for the next year or five years.",
      context: "Practice using future tense.",
      instructions: [
        "Discuss different life areas",
        "Use future tense forms",
        "Express hopes and intentions",
        "Be specific with goals",
      ],
      minWords: 80,
      maxWords: 180,
      difficulty: "intermediate",
    },
    {
      type: "narrative",
      title: "If I Could...",
      prompt: "Write about what you would do if you won a million dollars (or: if you could travel anywhere, if you could have any job, etc.)",
      context: "Practice using conditional forms.",
      instructions: [
        "Use conditional structures",
        "Be creative and detailed",
        "Explain your reasons",
        "Consider multiple scenarios",
      ],
      minWords: 100,
      maxWords: 220,
      difficulty: "intermediate",
    },
  ],
};

// =============================================================================
// RUBRIC TEMPLATES
// =============================================================================

function createRubric(
  difficulty: "beginner" | "intermediate" | "advanced",
  vocabularyFocus: string[],
  grammarFocus: string[]
): WritingRubric {
  return {
    vocabularyUsage: {
      weight: 25,
      criteria: vocabularyFocus.length > 0
        ? [`Uses target vocabulary: ${vocabularyFocus.slice(0, 5).join(", ")}`]
        : ["Uses appropriate vocabulary for the topic"],
      exemplary: "Uses all target vocabulary correctly and naturally",
      proficient: "Uses most target vocabulary correctly",
      developing: "Uses some target vocabulary but with errors",
      beginning: "Limited vocabulary use, frequent errors",
    },
    grammarAccuracy: {
      weight: 30,
      criteria: grammarFocus.length > 0
        ? grammarFocus.slice(0, 3).map((g) => `Correctly uses ${g}`)
        : ["Uses grammar appropriate for level"],
      exemplary: "Grammar is accurate throughout with varied structures",
      proficient: "Grammar is mostly accurate with minor errors",
      developing: "Several grammar errors but meaning is clear",
      beginning: "Frequent grammar errors that affect meaning",
    },
    coherence: {
      weight: 25,
      criteria: [
        "Ideas flow logically",
        "Uses appropriate connectors",
        "Clear organization",
      ],
      exemplary: "Writing is well-organized with smooth transitions",
      proficient: "Writing is organized with some transitions",
      developing: "Some organization but transitions are weak",
      beginning: "Disorganized, hard to follow",
    },
    taskCompletion: {
      weight: 20,
      criteria: [
        "Addresses all parts of the prompt",
        "Meets word count requirements",
        "Follows instructions",
      ],
      exemplary: "Fully addresses task with thoughtful detail",
      proficient: "Addresses task with adequate detail",
      developing: "Partially addresses task or lacks detail",
      beginning: "Does not address the task adequately",
    },
  };
}

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

/**
 * Generate writing drills based on lesson analysis
 */
export async function generateWritingDrills(
  input: WritingDrillInput
): Promise<WritingDrill[]> {
  const {
    lessonObjectives,
    tutorAnalysis,
    l1Interference,
    targetLanguage,
    proficiencyLevel,
  } = input;

  const drills: WritingDrill[] = [];

  // 1. Generate drill based on lesson topic
  if (lessonObjectives.length > 0) {
    const topicDrill = generateTopicBasedWritingDrill(
      lessonObjectives,
      tutorAnalysis,
      targetLanguage,
      proficiencyLevel
    );
    if (topicDrill) {
      drills.push(topicDrill);
    }
  }

  // 2. Generate vocabulary-focused drill
  if (tutorAnalysis && tutorAnalysis.focusVocabulary.length > 0) {
    const vocabDrill = generateVocabularyWritingDrill(
      tutorAnalysis.focusVocabulary,
      tutorAnalysis.focusGrammar,
      targetLanguage,
      proficiencyLevel
    );
    if (vocabDrill) {
      drills.push(vocabDrill);
    }
  }

  // 3. Generate grammar practice drill
  if (tutorAnalysis && tutorAnalysis.focusGrammar.length > 0) {
    const grammarDrill = generateGrammarWritingDrill(
      tutorAnalysis.focusGrammar,
      tutorAnalysis.focusVocabulary,
      targetLanguage,
      proficiencyLevel
    );
    if (grammarDrill) {
      drills.push(grammarDrill);
    }
  }

  // 4. Generate L1 awareness drill
  if (l1Interference && l1Interference.length > 0) {
    const l1Drill = generateL1AwarenessWritingDrill(
      l1Interference,
      targetLanguage,
      proficiencyLevel
    );
    if (l1Drill) {
      drills.push(l1Drill);
    }
  }

  return drills;
}

// =============================================================================
// SPECIFIC DRILL GENERATORS
// =============================================================================

/**
 * Generate drill based on lesson topic
 */
function generateTopicBasedWritingDrill(
  objectives: InferredObjective[],
  tutorAnalysis: TutorAnalysis | undefined,
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill | null {
  const mainObjective = objectives[0];
  if (!mainObjective) return null;

  // Map topic to template category
  const category = mapTopicToCategory(mainObjective.topic);
  const templates = PROMPT_TEMPLATES[category];

  if (!templates || templates.length === 0) {
    return generateGenericWritingDrill(
      mainObjective.topic,
      tutorAnalysis,
      targetLanguage,
      proficiencyLevel
    );
  }

  // Select template by difficulty
  const template = selectTemplateByLevel(templates, proficiencyLevel);
  const vocabulary = tutorAnalysis?.focusVocabulary || [];
  const grammar = tutorAnalysis?.focusGrammar || [];

  return buildWritingDrill(
    template,
    vocabulary,
    grammar,
    targetLanguage,
    proficiencyLevel
  );
}

/**
 * Generate vocabulary-focused writing drill
 */
function generateVocabularyWritingDrill(
  vocabulary: string[],
  grammar: string[],
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill | null {
  if (vocabulary.length < 3) return null;

  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);
  const wordCount = difficulty === "beginner" ? 60 : difficulty === "intermediate" ? 120 : 200;

  const prompt = `Write a short text using as many of these words as possible: ${vocabulary.slice(0, 8).join(", ")}. The topic is free - you can write about anything as long as you include the vocabulary naturally.`;

  return {
    type: "contextual_writing",
    id: `write-vocab-${Date.now()}`,
    title: "Vocabulary Practice Writing",
    description: "Practice using new vocabulary in context.",
    prompt,
    promptType: "description",
    context: "Free writing with vocabulary focus",
    instructions: [
      `Include at least ${Math.min(5, vocabulary.length)} of the target words`,
      "Use each word correctly in context",
      "Write complete sentences",
      "Make sure the text makes sense",
    ],
    requiredVocabulary: vocabulary.slice(0, 8),
    grammarFocus: grammar.slice(0, 3),
    minWords: wordCount - 20,
    maxWords: wordCount + 30,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: difficulty === "beginner" ? 10 : 15,
    rubric: createRubric(difficulty, vocabulary, grammar),
    scaffoldingHints: [
      "Start by brainstorming how to connect the words",
      "Think of a situation where these words would naturally appear",
      "You can write about a real or imaginary experience",
    ],
    commonMistakesToAvoid: [
      "Don't just list the words in one sentence",
      "Make sure each word fits naturally in context",
      "Check that you're using the correct form of each word",
    ],
  };
}

/**
 * Generate grammar practice writing drill
 */
function generateGrammarWritingDrill(
  grammar: string[],
  vocabulary: string[],
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill | null {
  if (grammar.length === 0) return null;

  const mainGrammar = grammar[0].toLowerCase();

  // Find appropriate template for this grammar
  const templates = PROMPT_TEMPLATES.grammar_practice;
  let template: PromptTemplate | null = null;

  if (mainGrammar.includes("past") || mainGrammar.includes("preterite")) {
    template = templates.find((t) => t.title.includes("Yesterday")) ?? null;
  } else if (mainGrammar.includes("future") || mainGrammar.includes("will") || mainGrammar.includes("going")) {
    template = templates.find((t) => t.title.includes("Future")) ?? null;
  } else if (mainGrammar.includes("conditional") || mainGrammar.includes("would")) {
    template = templates.find((t) => t.title.includes("If")) ?? null;
  }

  if (!template) {
    // Create generic grammar drill
    return generateGenericGrammarDrill(grammar, vocabulary, targetLanguage, proficiencyLevel);
  }

  return buildWritingDrill(template, vocabulary, grammar, targetLanguage, proficiencyLevel);
}

/**
 * Generate drill to practice avoiding L1 interference
 */
function generateL1AwarenessWritingDrill(
  l1Interference: L1InterferenceResult[],
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill | null {
  if (l1Interference.length === 0) return null;

  const topPattern = l1Interference[0];
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);
  const wordCount = difficulty === "beginner" ? 50 : difficulty === "intermediate" ? 100 : 150;

  let prompt = "";
  let promptType: WritingPromptType = "description";
  const focusStructures: string[] = [];

  // Customize based on interference pattern
  switch (topPattern.patternType) {
    case "article_omission":
      prompt = "Describe your ideal home. Include specific items in each room (a bed, the kitchen, some chairs, etc.). Pay special attention to using articles (a/an/the) correctly.";
      focusStructures.push("articles (a, an, the)");
      break;
    case "plural_marking":
      prompt = "Write about things you own or want to buy. Mention quantities (two books, many pens, some phones). Focus on correct plural forms.";
      focusStructures.push("plural forms (-s, -es)");
      break;
    case "tense_marking":
      prompt = "Write about what you did last weekend and what you will do next weekend. Use correct past and future verb forms.";
      focusStructures.push("past tense", "future tense");
      break;
    case "word_order":
      prompt = "Write sentences about your family members, describing what they look like and what they are like. Pay attention to word order in your sentences.";
      focusStructures.push("subject-verb-object order", "adjective position");
      break;
    case "adjective_order":
      prompt = "Describe objects using multiple adjectives (a beautiful old wooden table, a small red car). Focus on putting adjectives in the correct order.";
      promptType = "description";
      focusStructures.push("adjective order");
      break;
    default:
      prompt = `Write about your daily routine. Pay special attention to ${topPattern.patternName}.`;
      focusStructures.push(topPattern.patternName);
  }

  return {
    type: "contextual_writing",
    id: `write-l1-${Date.now()}`,
    title: `Writing Practice: ${topPattern.patternName}`,
    description: topPattern.explanation || `Practice avoiding common ${topPattern.patternType} errors.`,
    prompt,
    promptType,
    context: "Targeted grammar practice",
    instructions: [
      `Focus on: ${focusStructures.join(", ")}`,
      "Proofread carefully for this specific pattern",
      "Use the examples from your lesson as reference",
      "Write naturally - don't force unnatural sentences",
    ],
    requiredVocabulary: [],
    grammarFocus: focusStructures,
    minWords: wordCount - 10,
    maxWords: wordCount + 30,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: 10,
    rubric: createRubric(difficulty, [], focusStructures),
    scaffoldingHints: [
      `Remember: ${topPattern.explanation}`,
      "Read your sentences aloud to check if they sound natural",
      `Examples: ${topPattern.examples.slice(0, 2).map((e) => `"${e.wrong}" → "${e.correct}"`).join("; ")}`,
    ],
    commonMistakesToAvoid: topPattern.examples.slice(0, 3).map((e) => `Don't write "${e.wrong}" → write "${e.correct}"`),
    bonusChallenges: [
      "Write one complex sentence with multiple clauses",
      "Use at least one connector (however, therefore, because, etc.)",
    ],
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapTopicToCategory(topic: string): string {
  const topicLower = topic.toLowerCase();

  const mappings: Array<{ keywords: string[]; category: string }> = [
    { keywords: ["travel", "trip", "vacation", "hotel", "airport", "flight"], category: "travel" },
    { keywords: ["food", "restaurant", "cook", "recipe", "eat", "meal"], category: "food" },
    { keywords: ["work", "job", "office", "meeting", "business", "career"], category: "work" },
    { keywords: ["daily", "routine", "home", "life", "weekend", "schedule"], category: "daily_life" },
    { keywords: ["opinion", "think", "believe", "argue", "compare"], category: "opinions" },
    { keywords: ["introduce", "myself", "family", "friend", "hobby"], category: "introduction" },
    { keywords: ["past", "future", "conditional", "tense", "verb"], category: "grammar_practice" },
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => topicLower.includes(kw))) {
      return mapping.category;
    }
  }

  return "daily_life"; // Default
}

function selectTemplateByLevel(
  templates: PromptTemplate[],
  proficiencyLevel: string
): PromptTemplate {
  const targetDifficulty = mapProficiencyToDifficulty(proficiencyLevel);

  const matching = templates.find((t) => t.difficulty === targetDifficulty);
  if (matching) return matching;

  // Fall back to closest difficulty
  if (targetDifficulty === "beginner") {
    return templates.find((t) => t.difficulty === "intermediate") || templates[0];
  }
  if (targetDifficulty === "advanced") {
    return templates.find((t) => t.difficulty === "intermediate") || templates[templates.length - 1];
  }

  return templates[0];
}

function buildWritingDrill(
  template: PromptTemplate,
  vocabulary: string[],
  grammar: string[],
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill {
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);

  // Adjust word counts based on actual proficiency
  let minWords = template.minWords;
  let maxWords = template.maxWords;

  if (difficulty !== template.difficulty) {
    const multiplier =
      difficulty === "beginner" ? 0.7 :
        difficulty === "advanced" ? 1.4 : 1;
    minWords = Math.round(template.minWords * multiplier);
    maxWords = Math.round(template.maxWords * multiplier);
  }

  return {
    type: "contextual_writing",
    id: `write-${Date.now()}`,
    title: template.title,
    description: template.context,
    prompt: template.prompt,
    promptType: template.type,
    context: template.context,
    instructions: [
      ...template.instructions,
      ...(vocabulary.length > 0 ? [`Try to use some of these words: ${vocabulary.slice(0, 5).join(", ")}`] : []),
    ],
    requiredVocabulary: vocabulary.slice(0, 8),
    grammarFocus: grammar.slice(0, 3),
    minWords,
    maxWords,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: Math.max(10, Math.round(maxWords / 15)),
    rubric: createRubric(difficulty, vocabulary, grammar),
    scaffoldingHints: [
      "Plan your writing before you start",
      "Use the instructions as a checklist",
      "Proofread when finished",
    ],
    commonMistakesToAvoid: [
      "Don't forget to address all parts of the prompt",
      "Check your spelling and punctuation",
      "Make sure your ideas connect logically",
    ],
  };
}

function generateGenericWritingDrill(
  topic: string,
  tutorAnalysis: TutorAnalysis | undefined,
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill {
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);
  const wordCount = difficulty === "beginner" ? 60 : difficulty === "intermediate" ? 120 : 200;
  const vocabulary = tutorAnalysis?.focusVocabulary || [];
  const grammar = tutorAnalysis?.focusGrammar || [];

  return {
    type: "contextual_writing",
    id: `write-generic-${Date.now()}`,
    title: `Writing Practice: ${topic}`,
    description: `Practice writing about ${topic} using vocabulary and structures from your lesson.`,
    prompt: `Write a short text about "${topic}". Share your thoughts, experiences, or opinions on this subject.`,
    promptType: "description",
    context: "Free writing on lesson topic",
    instructions: [
      "Write about the topic in your own words",
      "Include your own experiences or opinions",
      "Use vocabulary from your lesson",
      "Write complete, connected sentences",
    ],
    requiredVocabulary: vocabulary.slice(0, 8),
    grammarFocus: grammar.slice(0, 3),
    minWords: wordCount - 10,
    maxWords: wordCount + 40,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: 15,
    rubric: createRubric(difficulty, vocabulary, grammar),
    scaffoldingHints: [
      "Think about what aspects of this topic interest you most",
      "Use examples to support your points",
      "Connect your ideas with words like 'and', 'but', 'because', 'so'",
    ],
    commonMistakesToAvoid: [
      "Don't write just one or two sentences",
      "Don't forget to check your grammar",
      "Make sure your text has a clear beginning and end",
    ],
  };
}

function generateGenericGrammarDrill(
  grammar: string[],
  vocabulary: string[],
  targetLanguage: string,
  proficiencyLevel: string
): WritingDrill {
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);
  const wordCount = difficulty === "beginner" ? 50 : difficulty === "intermediate" ? 100 : 150;

  return {
    type: "contextual_writing",
    id: `write-grammar-${Date.now()}`,
    title: `Grammar Practice: ${grammar[0]}`,
    description: `Practice using ${grammar[0]} correctly in context.`,
    prompt: `Write a short text demonstrating your understanding of ${grammar[0]}. Choose any topic you like.`,
    promptType: "description",
    context: "Targeted grammar practice",
    instructions: [
      `Use ${grammar[0]} correctly in multiple sentences`,
      "Show variety in your sentence structures",
      "Make sure the grammar is used naturally",
    ],
    requiredVocabulary: vocabulary.slice(0, 5),
    grammarFocus: grammar,
    minWords: wordCount - 10,
    maxWords: wordCount + 30,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: 10,
    rubric: createRubric(difficulty, vocabulary, grammar),
    scaffoldingHints: [
      `Think about situations where you would naturally use ${grammar[0]}`,
      "Look at your lesson notes for examples",
    ],
    commonMistakesToAvoid: [
      `Don't force the grammar - use it where it fits naturally`,
      "Check your work against the examples from class",
    ],
  };
}

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

// =============================================================================
// EXPORTS
// =============================================================================

export { PROMPT_TEMPLATES };
