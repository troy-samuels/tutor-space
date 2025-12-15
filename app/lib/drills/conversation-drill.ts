/**
 * Conversation Simulation Drill Generator
 *
 * Generates AI-powered conversation practice scenarios based on
 * lesson objectives, student level, and learning goals.
 */

import type { TutorAnalysis, InferredObjective } from "@/lib/analysis/tutor-speech-analyzer";
import type { StudentAnalysis } from "@/lib/analysis/student-speech-analyzer";
import type { L1InterferenceResult } from "@/lib/analysis/l1-interference";

// =============================================================================
// TYPES
// =============================================================================

export interface ConversationDrill {
  type: "conversation_simulation";
  id: string;
  title: string;
  description: string;
  scenario: ConversationScenario;
  objectives: string[];
  targetVocabulary: string[];
  targetGrammar: string[];
  maxTurns: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  estimatedDurationMinutes: number;
  systemPrompt: string;
  openingMessage: string;
  evaluationCriteria: EvaluationCriteria;
  hints: ConversationHint[];
  followUpQuestions: string[];
}

export interface ConversationScenario {
  setup: string;
  context: string;
  aiRole: string;
  aiRoleDescription: string;
  studentRole: string;
  studentRoleDescription: string;
  setting: string;
  tone: "formal" | "neutral" | "informal";
  culturalNotes?: string[];
}

export interface EvaluationCriteria {
  vocabularyUsage: {
    weight: number;
    targetWords: string[];
  };
  grammarAccuracy: {
    weight: number;
    focusStructures: string[];
  };
  fluency: {
    weight: number;
    minWordsPerTurn: number;
  };
  taskCompletion: {
    weight: number;
    objectives: string[];
  };
}

export interface ConversationHint {
  trigger: string;
  hint: string;
  vocabulary?: string[];
}

export interface ConversationDrillInput {
  lessonObjectives: InferredObjective[];
  tutorAnalysis?: TutorAnalysis;
  studentAnalysis?: StudentAnalysis;
  l1Interference?: L1InterferenceResult[];
  targetLanguage: string;
  nativeLanguage?: string;
  proficiencyLevel: string;
  studentName?: string;
}

// =============================================================================
// SCENARIO TEMPLATES BY TOPIC
// =============================================================================

const SCENARIO_TEMPLATES: Record<string, ConversationScenario[]> = {
  restaurant: [
    {
      setup: "You are at a restaurant and need to order food and drinks.",
      context: "casual dining restaurant",
      aiRole: "waiter",
      aiRoleDescription: "You are a friendly waiter at a restaurant. Help the customer order and answer questions about the menu.",
      studentRole: "customer",
      studentRoleDescription: "You are a customer ordering a meal. Ask about the menu, order food and drinks, and ask for the check.",
      setting: "Restaurant",
      tone: "neutral",
    },
    {
      setup: "You have a reservation at an upscale restaurant for a special occasion.",
      context: "fine dining restaurant, birthday dinner",
      aiRole: "sommelier",
      aiRoleDescription: "You are a sommelier at an upscale restaurant. Help the guest select wine and explain the menu options.",
      studentRole: "guest",
      studentRoleDescription: "You are celebrating a birthday. Ask for recommendations and make selections based on preferences.",
      setting: "Fine Dining Restaurant",
      tone: "formal",
      culturalNotes: ["In fine dining, there's typically a dress code", "Wine is often selected to pair with the meal"],
    },
  ],
  travel: [
    {
      setup: "You are at an airport trying to check in for your flight.",
      context: "airport check-in counter",
      aiRole: "airline agent",
      aiRoleDescription: "You are an airline check-in agent. Help passengers check in, handle baggage, and answer questions about their flight.",
      studentRole: "traveler",
      studentRoleDescription: "You need to check in for your flight, possibly check baggage, and get boarding pass information.",
      setting: "Airport",
      tone: "neutral",
    },
    {
      setup: "You are checking into a hotel after a long journey.",
      context: "hotel front desk",
      aiRole: "hotel receptionist",
      aiRoleDescription: "You are a hotel front desk receptionist. Check guests in, explain amenities, and handle requests.",
      studentRole: "guest",
      studentRoleDescription: "You are checking into your hotel. Confirm your reservation, ask about amenities, and request any needed services.",
      setting: "Hotel",
      tone: "neutral",
    },
  ],
  shopping: [
    {
      setup: "You are at a clothing store looking for a specific item.",
      context: "retail clothing store",
      aiRole: "sales associate",
      aiRoleDescription: "You are a helpful sales associate. Help customers find items, suggest alternatives, and assist with sizes and fitting rooms.",
      studentRole: "shopper",
      studentRoleDescription: "You are looking for specific clothing items. Ask about availability, sizes, and prices.",
      setting: "Clothing Store",
      tone: "neutral",
    },
    {
      setup: "You are at a local market negotiating prices with a vendor.",
      context: "outdoor market or bazaar",
      aiRole: "market vendor",
      aiRoleDescription: "You are a market vendor selling goods. Engage in friendly negotiation and describe your products.",
      studentRole: "buyer",
      studentRoleDescription: "You are browsing and want to buy something but need to negotiate a good price.",
      setting: "Local Market",
      tone: "informal",
      culturalNotes: ["Haggling is expected and part of the experience", "Start with a lower offer than you expect to pay"],
    },
  ],
  work: [
    {
      setup: "You are in a job interview for a position you're interested in.",
      context: "office interview room",
      aiRole: "interviewer",
      aiRoleDescription: "You are conducting a job interview. Ask about experience, skills, and situational questions.",
      studentRole: "candidate",
      studentRoleDescription: "You are interviewing for a job. Present your qualifications and answer questions professionally.",
      setting: "Office",
      tone: "formal",
    },
    {
      setup: "You need to explain a project update to your manager.",
      context: "workplace meeting",
      aiRole: "manager",
      aiRoleDescription: "You are a manager receiving a project update. Ask clarifying questions and provide feedback.",
      studentRole: "employee",
      studentRoleDescription: "You are updating your manager on a project. Explain progress, challenges, and next steps.",
      setting: "Office",
      tone: "formal",
    },
  ],
  healthcare: [
    {
      setup: "You are at a doctor's office describing your symptoms.",
      context: "medical clinic",
      aiRole: "doctor",
      aiRoleDescription: "You are a doctor conducting a routine checkup. Ask about symptoms, medical history, and provide advice.",
      studentRole: "patient",
      studentRoleDescription: "You are visiting the doctor with some symptoms. Describe how you feel and answer medical questions.",
      setting: "Medical Clinic",
      tone: "formal",
    },
    {
      setup: "You are at a pharmacy picking up a prescription.",
      context: "pharmacy counter",
      aiRole: "pharmacist",
      aiRoleDescription: "You are a pharmacist. Help customers with prescriptions and answer questions about medications.",
      studentRole: "customer",
      studentRoleDescription: "You need to pick up a prescription and have questions about how to take it.",
      setting: "Pharmacy",
      tone: "neutral",
    },
  ],
  social: [
    {
      setup: "You meet someone at a party and strike up a conversation.",
      context: "house party or social gathering",
      aiRole: "new acquaintance",
      aiRoleDescription: "You are someone at a party looking to make new friends. Be friendly and share about yourself.",
      studentRole: "party guest",
      studentRoleDescription: "You are at a party and want to make conversation with someone new.",
      setting: "Social Gathering",
      tone: "informal",
    },
    {
      setup: "You are calling to make plans with a friend.",
      context: "phone call with friend",
      aiRole: "friend",
      aiRoleDescription: "You are a friend receiving a call. Discuss plans and suggest activities.",
      studentRole: "caller",
      studentRoleDescription: "You want to make plans with your friend for the weekend.",
      setting: "Phone Call",
      tone: "informal",
    },
  ],
  education: [
    {
      setup: "You are asking a professor about an assignment.",
      context: "university office hours",
      aiRole: "professor",
      aiRoleDescription: "You are a professor during office hours. Help students understand assignments and course material.",
      studentRole: "student",
      studentRoleDescription: "You have questions about an assignment and need clarification.",
      setting: "University",
      tone: "formal",
    },
    {
      setup: "You are registering for classes at a school.",
      context: "school registration office",
      aiRole: "registrar",
      aiRoleDescription: "You work in registration. Help students sign up for classes and explain requirements.",
      studentRole: "student",
      studentRoleDescription: "You need to register for classes and have questions about requirements.",
      setting: "School Office",
      tone: "neutral",
    },
  ],
  housing: [
    {
      setup: "You are viewing an apartment you might want to rent.",
      context: "apartment showing",
      aiRole: "landlord",
      aiRoleDescription: "You are showing an apartment. Answer questions about the unit, building, and lease terms.",
      studentRole: "prospective tenant",
      studentRoleDescription: "You are interested in renting the apartment. Ask questions and negotiate if needed.",
      setting: "Apartment",
      tone: "neutral",
    },
    {
      setup: "You need to report a problem in your apartment to maintenance.",
      context: "phone call to building management",
      aiRole: "maintenance coordinator",
      aiRoleDescription: "You coordinate maintenance requests. Get details about problems and schedule repairs.",
      studentRole: "tenant",
      studentRoleDescription: "You have an issue in your apartment that needs to be fixed.",
      setting: "Phone Call",
      tone: "neutral",
    },
  ],
};

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

/**
 * Generate conversation simulation drills based on lesson analysis
 */
export async function generateConversationDrills(
  input: ConversationDrillInput
): Promise<ConversationDrill[]> {
  const {
    lessonObjectives,
    tutorAnalysis,
    studentAnalysis,
    l1Interference,
    targetLanguage,
    proficiencyLevel,
    studentName,
  } = input;

  const drills: ConversationDrill[] = [];

  // 1. Generate drill based on lesson topic if identified
  if (lessonObjectives.length > 0) {
    const topicDrill = generateTopicBasedDrill(
      lessonObjectives,
      tutorAnalysis,
      targetLanguage,
      proficiencyLevel,
      studentName
    );
    if (topicDrill) {
      drills.push(topicDrill);
    }
  }

  // 2. Generate drill targeting grammar structures
  if (tutorAnalysis && tutorAnalysis.focusGrammar.length > 0) {
    const grammarDrill = generateGrammarFocusDrill(
      tutorAnalysis.focusGrammar,
      tutorAnalysis.focusVocabulary,
      targetLanguage,
      proficiencyLevel,
      studentName
    );
    if (grammarDrill) {
      drills.push(grammarDrill);
    }
  }

  // 3. Generate drill for L1 interference practice
  if (l1Interference && l1Interference.length > 0) {
    const l1Drill = generateL1PracticeDrill(
      l1Interference,
      targetLanguage,
      proficiencyLevel,
      studentName
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
function generateTopicBasedDrill(
  objectives: InferredObjective[],
  tutorAnalysis: TutorAnalysis | undefined,
  targetLanguage: string,
  proficiencyLevel: string,
  studentName?: string
): ConversationDrill | null {
  // Find the main topic from objectives
  const mainObjective = objectives[0];
  if (!mainObjective) return null;

  // Map objective topic to scenario category
  const scenarioCategory = mapTopicToScenario(mainObjective.topic);
  const scenarios = SCENARIO_TEMPLATES[scenarioCategory];

  if (!scenarios || scenarios.length === 0) {
    // Create a generic scenario based on the topic
    return generateGenericScenario(
      mainObjective,
      tutorAnalysis,
      targetLanguage,
      proficiencyLevel,
      studentName
    );
  }

  // Select appropriate scenario based on difficulty
  const scenario = selectScenarioByLevel(scenarios, proficiencyLevel);

  // Extract vocabulary and grammar from tutor analysis
  const targetVocabulary = tutorAnalysis?.focusVocabulary || [];
  const targetGrammar = tutorAnalysis?.focusGrammar || [];

  return buildConversationDrill(
    scenario,
    objectives.map((o) => o.topic),
    targetVocabulary,
    targetGrammar,
    targetLanguage,
    proficiencyLevel,
    studentName
  );
}

/**
 * Generate drill focused on specific grammar structures
 */
function generateGrammarFocusDrill(
  grammarFocus: string[],
  vocabulary: string[],
  targetLanguage: string,
  proficiencyLevel: string,
  studentName?: string
): ConversationDrill | null {
  if (grammarFocus.length === 0) return null;

  // Select scenario that naturally uses these grammar structures
  const scenario = selectScenarioForGrammar(grammarFocus, proficiencyLevel);

  return buildConversationDrill(
    scenario,
    grammarFocus,
    vocabulary,
    grammarFocus,
    targetLanguage,
    proficiencyLevel,
    studentName,
    `Focus on using: ${grammarFocus.slice(0, 3).join(", ")}`
  );
}

/**
 * Generate drill to practice avoiding L1 interference
 */
function generateL1PracticeDrill(
  l1Interference: L1InterferenceResult[],
  targetLanguage: string,
  proficiencyLevel: string,
  studentName?: string
): ConversationDrill | null {
  if (l1Interference.length === 0) return null;

  // Get the most problematic patterns
  const topPatterns = l1Interference.slice(0, 2);

  // Select a scenario that will naturally require these structures
  const patternTypes = topPatterns.map((p) => p.patternType);
  const scenario = selectScenarioForPatterns(patternTypes, proficiencyLevel);

  const objectives = topPatterns.map(
    (p) => `Practice: ${p.patternName} (avoid ${p.pattern})`
  );

  return buildConversationDrill(
    scenario,
    objectives,
    [],
    patternTypes,
    targetLanguage,
    proficiencyLevel,
    studentName,
    `Pay special attention to: ${topPatterns.map((p) => p.patternName).join(", ")}`
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapTopicToScenario(topic: string): string {
  const topicLower = topic.toLowerCase();

  const mappings: Array<{ keywords: string[]; category: string }> = [
    { keywords: ["restaurant", "food", "order", "menu", "eat", "dining"], category: "restaurant" },
    { keywords: ["travel", "airport", "hotel", "flight", "vacation", "trip"], category: "travel" },
    { keywords: ["shop", "buy", "store", "market", "purchase", "price"], category: "shopping" },
    { keywords: ["work", "job", "interview", "office", "meeting", "business"], category: "work" },
    { keywords: ["doctor", "health", "medical", "pharmacy", "sick", "appointment"], category: "healthcare" },
    { keywords: ["friend", "party", "social", "meet", "introduce", "conversation"], category: "social" },
    { keywords: ["school", "class", "study", "university", "teacher", "student"], category: "education" },
    { keywords: ["apartment", "rent", "house", "home", "move", "landlord"], category: "housing" },
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => topicLower.includes(kw))) {
      return mapping.category;
    }
  }

  return "social"; // Default fallback
}

function selectScenarioByLevel(
  scenarios: ConversationScenario[],
  proficiencyLevel: string
): ConversationScenario {
  const level = proficiencyLevel.toLowerCase();

  // For beginners, prefer simpler/informal scenarios
  if (level.includes("beginner") || level.includes("elementary")) {
    const informal = scenarios.find((s) => s.tone === "informal");
    return informal || scenarios[0];
  }

  // For advanced, prefer formal/complex scenarios
  if (level.includes("advanced") || level.includes("proficient")) {
    const formal = scenarios.find((s) => s.tone === "formal");
    return formal || scenarios[scenarios.length - 1];
  }

  // Default to first scenario
  return scenarios[0];
}

function selectScenarioForGrammar(
  grammarFocus: string[],
  proficiencyLevel: string
): ConversationScenario {
  const grammarLower = grammarFocus.map((g) => g.toLowerCase()).join(" ");

  // Past tense → travel or social stories
  if (grammarLower.includes("past") || grammarLower.includes("preterite")) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.travel || SCENARIO_TEMPLATES.social, proficiencyLevel);
  }

  // Future → planning scenarios
  if (grammarLower.includes("future") || grammarLower.includes("will") || grammarLower.includes("going to")) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.social || SCENARIO_TEMPLATES.travel, proficiencyLevel);
  }

  // Conditionals → work scenarios
  if (grammarLower.includes("conditional") || grammarLower.includes("would")) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.work, proficiencyLevel);
  }

  // Questions → healthcare or shopping
  if (grammarLower.includes("question") || grammarLower.includes("interrogative")) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.healthcare || SCENARIO_TEMPLATES.shopping, proficiencyLevel);
  }

  // Default
  return selectScenarioByLevel(SCENARIO_TEMPLATES.social, proficiencyLevel);
}

function selectScenarioForPatterns(
  patternTypes: string[],
  proficiencyLevel: string
): ConversationScenario {
  // Article issues → shopping (lots of noun phrases)
  if (patternTypes.some((p) => p.includes("article"))) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.shopping, proficiencyLevel);
  }

  // Word order → work (structured sentences)
  if (patternTypes.some((p) => p.includes("word_order"))) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.work, proficiencyLevel);
  }

  // Tense issues → travel (past/future events)
  if (patternTypes.some((p) => p.includes("tense"))) {
    return selectScenarioByLevel(SCENARIO_TEMPLATES.travel, proficiencyLevel);
  }

  // Default to social
  return selectScenarioByLevel(SCENARIO_TEMPLATES.social, proficiencyLevel);
}

function generateGenericScenario(
  objective: InferredObjective,
  tutorAnalysis: TutorAnalysis | undefined,
  targetLanguage: string,
  proficiencyLevel: string,
  studentName?: string
): ConversationDrill {
  const scenario: ConversationScenario = {
    setup: `Practice conversation about "${objective.topic}"`,
    context: objective.topic,
    aiRole: "conversation partner",
    aiRoleDescription: `You are a helpful conversation partner. Have a natural discussion about ${objective.topic}. Ask follow-up questions and encourage the student to speak more.`,
    studentRole: "learner",
    studentRoleDescription: `You want to practice talking about ${objective.topic}. Share your thoughts and respond to questions.`,
    setting: "Casual Conversation",
    tone: "neutral",
  };

  return buildConversationDrill(
    scenario,
    [objective.topic],
    tutorAnalysis?.focusVocabulary || [],
    tutorAnalysis?.focusGrammar || [],
    targetLanguage,
    proficiencyLevel,
    studentName
  );
}

function buildConversationDrill(
  scenario: ConversationScenario,
  objectives: string[],
  targetVocabulary: string[],
  targetGrammar: string[],
  targetLanguage: string,
  proficiencyLevel: string,
  studentName?: string,
  additionalNote?: string
): ConversationDrill {
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);
  const maxTurns = difficulty === "beginner" ? 6 : difficulty === "intermediate" ? 10 : 15;

  const systemPrompt = buildSystemPrompt(
    scenario,
    targetLanguage,
    difficulty,
    targetVocabulary,
    targetGrammar,
    studentName
  );

  const openingMessage = buildOpeningMessage(scenario, difficulty);

  return {
    type: "conversation_simulation",
    id: `conv-${Date.now()}`,
    title: `${scenario.setting} Conversation Practice`,
    description: scenario.setup,
    scenario,
    objectives,
    targetVocabulary: targetVocabulary.slice(0, 10),
    targetGrammar: targetGrammar.slice(0, 5),
    maxTurns,
    difficulty,
    language: targetLanguage,
    estimatedDurationMinutes: maxTurns + 5,
    systemPrompt,
    openingMessage,
    evaluationCriteria: {
      vocabularyUsage: {
        weight: 25,
        targetWords: targetVocabulary.slice(0, 10),
      },
      grammarAccuracy: {
        weight: 30,
        focusStructures: targetGrammar.slice(0, 5),
      },
      fluency: {
        weight: 20,
        minWordsPerTurn: difficulty === "beginner" ? 5 : difficulty === "intermediate" ? 10 : 15,
      },
      taskCompletion: {
        weight: 25,
        objectives,
      },
    },
    hints: generateHints(scenario, targetVocabulary),
    followUpQuestions: generateFollowUpQuestions(scenario),
  };
}

function buildSystemPrompt(
  scenario: ConversationScenario,
  targetLanguage: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  vocabulary: string[],
  grammar: string[],
  studentName?: string
): string {
  const languageName = getLanguageName(targetLanguage);
  const nameRef = studentName ? ` (the student's name is ${studentName})` : "";

  const adjustments =
    difficulty === "beginner"
      ? "Use simple sentences and speak slowly. Repeat or rephrase if the student seems confused. Be very encouraging."
      : difficulty === "intermediate"
        ? "Use natural conversational speed. Challenge the student occasionally but support them when struggling."
        : "Use complex sentences and idiomatic expressions. Push the student to elaborate and use advanced structures.";

  const vocabNote =
    vocabulary.length > 0
      ? `\n\nTry to use or elicit these vocabulary words naturally: ${vocabulary.slice(0, 5).join(", ")}`
      : "";

  const grammarNote =
    grammar.length > 0
      ? `\n\nWatch for opportunities where the student should use these structures: ${grammar.slice(0, 3).join(", ")}`
      : "";

  return `You are a ${languageName} conversation practice partner.${nameRef}

ROLE: ${scenario.aiRoleDescription}

SETTING: ${scenario.setting}
CONTEXT: ${scenario.context}
TONE: ${scenario.tone}

DIFFICULTY LEVEL: ${difficulty}
${adjustments}

IMPORTANT GUIDELINES:
- Respond ONLY in ${languageName}
- Keep responses conversational and natural
- Ask follow-up questions to keep the conversation going
- Gently correct major errors by modeling correct usage
- Be patient and supportive
- Stay in character as ${scenario.aiRole}
${vocabNote}${grammarNote}

${scenario.culturalNotes ? `\nCULTURAL NOTES:\n${scenario.culturalNotes.map((n) => `- ${n}`).join("\n")}` : ""}`;
}

function buildOpeningMessage(
  scenario: ConversationScenario,
  difficulty: "beginner" | "intermediate" | "advanced"
): string {
  // This would ideally be in the target language
  // For now, we provide English placeholders that the AI will translate
  const openers: Record<string, string> = {
    waiter: "Hello! Welcome. Table for how many?",
    "airline agent": "Good morning. May I see your passport and booking confirmation?",
    "hotel receptionist": "Hello, welcome to our hotel. Do you have a reservation?",
    "sales associate": "Hi there! Can I help you find something today?",
    "market vendor": "Hello! Take a look - best quality, best prices!",
    interviewer: "Thank you for coming in. Please, have a seat. Tell me about yourself.",
    manager: "Thanks for scheduling this. So, how's the project going?",
    doctor: "Hello. What brings you in today?",
    pharmacist: "Hi, how can I help you?",
    "new acquaintance": "Hi! I don't think we've met. I'm here with my friend.",
    friend: "Hey! What's up? Great to hear from you!",
    professor: "Come in. What can I help you with?",
    registrar: "Hello, are you here to register for classes?",
    landlord: "Thanks for coming to see the place. Let me show you around.",
    "maintenance coordinator": "Maintenance, how can I help?",
    "conversation partner": "Hi! Great to chat with you. What would you like to talk about?",
  };

  const opener = openers[scenario.aiRole] || "Hello! How can I help you today?";

  // Simpler openers for beginners
  if (difficulty === "beginner") {
    const simpleOpeners: Record<string, string> = {
      waiter: "Hello! How are you?",
      "sales associate": "Hello! Can I help?",
      friend: "Hi! How are you?",
    };
    return simpleOpeners[scenario.aiRole] || opener;
  }

  return opener;
}

function generateHints(
  scenario: ConversationScenario,
  vocabulary: string[]
): ConversationHint[] {
  const hints: ConversationHint[] = [
    {
      trigger: "stuck",
      hint: `Remember, you're the ${scenario.studentRole} in this scenario.`,
      vocabulary: vocabulary.slice(0, 3),
    },
    {
      trigger: "vocabulary",
      hint: "Try using some of these words in your response.",
      vocabulary: vocabulary.slice(0, 5),
    },
    {
      trigger: "elaborate",
      hint: "Try to give longer answers. Add details and ask questions back.",
    },
  ];

  // Add scenario-specific hints
  if (scenario.setting === "Restaurant") {
    hints.push({
      trigger: "order",
      hint: "You can say: 'I would like...' or 'Could I have...'",
    });
  }

  if (scenario.setting === "Airport") {
    hints.push({
      trigger: "luggage",
      hint: "Mention if you have bags to check or just carry-on.",
    });
  }

  return hints;
}

function generateFollowUpQuestions(scenario: ConversationScenario): string[] {
  const questions: Record<string, string[]> = {
    Restaurant: [
      "How did the ordering go?",
      "Were there any words you didn't know?",
      "What would you order at a real restaurant?",
    ],
    Airport: [
      "Did you understand the agent's questions?",
      "What was the most challenging part?",
      "Have you traveled by plane before?",
    ],
    Hotel: [
      "What amenities did you ask about?",
      "Were you able to get what you needed?",
      "What would you ask about at a real hotel?",
    ],
    Office: [
      "How did you feel during the conversation?",
      "What was the hardest question to answer?",
      "How would you prepare for a real interview?",
    ],
    default: [
      "How did that conversation feel?",
      "What parts were most challenging?",
      "What would you like to practice more?",
    ],
  };

  return questions[scenario.setting] || questions.default;
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
  };
  return names[code] || code.toUpperCase();
}

// =============================================================================
// EXPORTS
// =============================================================================

export { SCENARIO_TEMPLATES };
