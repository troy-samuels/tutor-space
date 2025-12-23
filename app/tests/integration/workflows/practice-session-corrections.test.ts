/**
 * AI Practice Session Integration Tests
 *
 * Tests the AI Practice workflow including:
 * - Session creation and configuration
 * - Message exchange with grammar corrections
 * - Phonetic error detection
 * - Usage tracking (text turns, audio seconds)
 * - Session feedback generation
 *
 * @module tests/integration/workflows/practice-session-corrections
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// =============================================================================
// TYPES (mirroring production)
// =============================================================================

type GrammarCategorySlug =
  | "verb_tense"
  | "subject_verb_agreement"
  | "preposition"
  | "article"
  | "word_order"
  | "gender_agreement"
  | "conjugation"
  | "pronoun"
  | "plural_singular"
  | "spelling"
  | "vocabulary";

interface StructuredCorrection {
  original: string;
  corrected: string;
  category: GrammarCategorySlug;
  explanation: string;
}

interface PhoneticError {
  misspelled: string;
  intended: string;
  pattern?: string;
}

interface PracticeMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  corrections: StructuredCorrection[] | null;
  phonetic_errors: PhoneticError[] | null;
  vocabulary_used: string[] | null;
  tokens_used: number;
  created_at: string;
}

interface PracticeSession {
  id: string;
  student_id: string;
  tutor_id: string;
  scenario_id: string | null;
  language: string;
  level: string | null;
  topic: string | null;
  message_count: number;
  tokens_used: number;
  grammar_errors_count: number;
  phonetic_errors_count: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  ai_feedback: SessionFeedback | null;
}

interface SessionFeedback {
  overall_rating: number;
  suggestions: string[];
  grammar_issues: string[];
  vocabulary_used?: string[];
  grammar_breakdown?: Record<string, number>;
  duration_seconds?: number;
  message_count?: number;
}

interface UsagePeriod {
  id: string;
  student_id: string;
  text_turns_used: number;
  audio_seconds_used: number;
  blocks_consumed: number;
  period_start: string;
  period_end: string;
}

interface PracticeScenario {
  id: string;
  tutor_id: string;
  title: string;
  language: string;
  level: string | null;
  topic: string | null;
  system_prompt: string | null;
  vocabulary_focus: string[] | null;
  grammar_focus: string[] | null;
  max_messages: number;
  is_active: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GRAMMAR_CATEGORY_SLUGS: GrammarCategorySlug[] = [
  "verb_tense",
  "subject_verb_agreement",
  "preposition",
  "article",
  "word_order",
  "gender_agreement",
  "conjugation",
  "pronoun",
  "plural_singular",
  "spelling",
  "vocabulary",
];

const FREE_TEXT_TURNS = 600;
const FREE_AUDIO_SECONDS = 2700; // 45 minutes
const BLOCK_TEXT_TURNS = 300;
const BLOCK_AUDIO_SECONDS = 2700;

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

let idCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

function createMockStudent(tutorId: string) {
  return {
    id: generateId("student"),
    tutor_id: tutorId,
    user_id: generateId("user"),
    ai_practice_enabled: true,
    ai_practice_free_tier_enabled: true,
    ai_practice_subscription_id: null,
    ai_practice_block_subscription_item_id: null,
  };
}

function createMockTutor() {
  return {
    id: generateId("tutor"),
    tier: "studio" as const,
  };
}

function createMockScenario(tutorId: string, overrides: Partial<PracticeScenario> = {}): PracticeScenario {
  return {
    id: generateId("scenario"),
    tutor_id: tutorId,
    title: "Restaurant Ordering Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "ordering food at a restaurant",
    system_prompt: null,
    vocabulary_focus: ["menu", "camarero", "cuenta", "propina"],
    grammar_focus: ["conditional tense", "polite requests"],
    max_messages: 20,
    is_active: true,
    ...overrides,
  };
}

// =============================================================================
// PURE FUNCTIONS FOR TESTING (mirroring production logic)
// =============================================================================

function normalizeGrammarCategorySlug(input: string | undefined | null): GrammarCategorySlug {
  if (!input) return "vocabulary";
  const normalized = String(input).toLowerCase().trim().replace(/\s+/g, "_");
  if (GRAMMAR_CATEGORY_SLUGS.includes(normalized as GrammarCategorySlug)) {
    return normalized as GrammarCategorySlug;
  }
  return "vocabulary";
}

function parseStructuredResponse(content: string): {
  cleanContent: string;
  corrections: StructuredCorrection[];
  phoneticErrors: PhoneticError[];
} {
  const corrections: StructuredCorrection[] = [];
  const phoneticErrors: PhoneticError[] = [];

  // Parse structured corrections
  const correctionsMatch = content.match(/<corrections>([\s\S]*?)<\/corrections>/i);
  if (correctionsMatch) {
    try {
      const parsed = JSON.parse(correctionsMatch[1].trim());
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          corrections.push({
            original: String(c.original || "").trim(),
            corrected: String(c.corrected || "").trim(),
            category: normalizeGrammarCategorySlug(c.category),
            explanation: String(c.explanation || "").trim(),
          });
        }
      }
    } catch {
      // JSON parsing failed, try fallback
      const fallback = parseFallbackCorrections(content);
      corrections.push(...fallback);
    }
  } else {
    // Try legacy format
    const fallback = parseFallbackCorrections(content);
    corrections.push(...fallback);
  }

  // Parse phonetic errors
  const phoneticMatch = content.match(/<phonetic_errors>([\s\S]*?)<\/phonetic_errors>/i);
  if (phoneticMatch) {
    try {
      const parsed = JSON.parse(phoneticMatch[1].trim());
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          phoneticErrors.push({
            misspelled: String(p.misspelled || "").trim(),
            intended: String(p.intended || "").trim(),
            pattern: p.pattern ? String(p.pattern).trim() : undefined,
          });
        }
      }
    } catch {
      // Ignore phonetic parsing errors
    }
  }

  // Clean content
  const cleanContent = content
    .replace(/<corrections>[\s\S]*?<\/corrections>/gi, "")
    .replace(/<phonetic_errors>[\s\S]*?<\/phonetic_errors>/gi, "")
    .replace(/\[Correction:[^\]]+\]/gi, "")
    .trim();

  return { cleanContent, corrections, phoneticErrors };
}

function parseFallbackCorrections(content: string): StructuredCorrection[] {
  const corrections: StructuredCorrection[] = [];
  const regex = /\[Correction:\s*['"]?([^'"]+)['"]?\s*should be\s*['"]?([^'"]+)['"]?\s*-?\s*([^\]]*)\]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    corrections.push({
      original: match[1].trim(),
      corrected: match[2].trim(),
      category: "vocabulary",
      explanation: match[3].trim() || "Grammar correction",
    });
  }

  return corrections;
}

function parseVocabulary(content: string, focusWords: string[]): string[] {
  if (!focusWords || focusWords.length === 0) return [];
  const contentLower = content.toLowerCase();
  return focusWords.filter((word) => contentLower.includes(word.toLowerCase()));
}

function canSendMessage(session: PracticeSession, maxMessages: number): {
  allowed: boolean;
  error?: string;
} {
  if (session.ended_at) {
    return { allowed: false, error: "Session has ended" };
  }

  // +2 for user message and assistant response
  if ((session.message_count || 0) + 2 > maxMessages) {
    return { allowed: false, error: "Message limit reached for this practice session" };
  }

  return { allowed: true };
}

function calculateUsageAllowance(usagePeriod: UsagePeriod): {
  textAllowance: number;
  audioAllowance: number;
  textRemaining: number;
  audioRemaining: number;
} {
  const textAllowance = FREE_TEXT_TURNS + usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS;
  const audioAllowance = FREE_AUDIO_SECONDS + usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS;

  return {
    textAllowance,
    audioAllowance,
    textRemaining: Math.max(0, textAllowance - usagePeriod.text_turns_used),
    audioRemaining: Math.max(0, audioAllowance - usagePeriod.audio_seconds_used),
  };
}

function isUsageExhausted(usagePeriod: UsagePeriod): boolean {
  const { textRemaining, audioRemaining } = calculateUsageAllowance(usagePeriod);
  return textRemaining <= 0 && audioRemaining <= 0;
}

function generateSessionFeedback(
  messages: Array<{ role: string; content: string }>,
  grammarErrors: Array<{ category_slug: string }>
): SessionFeedback {
  // Simplified mock feedback generation
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  // Calculate rating based on grammar error ratio
  const errorRatio = userMessages.length > 0 ? grammarErrors.length / userMessages.length : 0;
  let rating: number;
  if (errorRatio < 0.2) rating = 5;
  else if (errorRatio < 0.4) rating = 4;
  else if (errorRatio < 0.6) rating = 3;
  else if (errorRatio < 0.8) rating = 2;
  else rating = 1;

  // Count grammar issues by category
  const grammarBreakdown: Record<string, number> = {};
  for (const error of grammarErrors) {
    grammarBreakdown[error.category_slug] = (grammarBreakdown[error.category_slug] || 0) + 1;
  }

  // Generate suggestions based on errors
  const suggestions: string[] = [];
  const topCategories = Object.entries(grammarBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (const [category] of topCategories) {
    suggestions.push(`Focus on practicing ${category.replace(/_/g, " ")}`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Keep up the great work!");
  }

  const grammarIssues = topCategories.map(([category, count]) =>
    `${category.replace(/_/g, " ")}: ${count} occurrence(s)`
  );

  return {
    overall_rating: rating,
    suggestions,
    grammar_issues: grammarIssues,
    grammar_breakdown: grammarBreakdown,
    message_count: userMessages.length + assistantMessages.length,
  };
}

// =============================================================================
// MOCK IN-MEMORY DATABASE
// =============================================================================

class MockPracticeDatabase {
  private sessions: Map<string, PracticeSession> = new Map();
  private messages: Map<string, PracticeMessage[]> = new Map();
  private grammarErrors: Map<string, Array<{ category_slug: string; session_id: string }>> = new Map();
  private usagePeriods: Map<string, UsagePeriod> = new Map();

  reset(): void {
    this.sessions.clear();
    this.messages.clear();
    this.grammarErrors.clear();
    this.usagePeriods.clear();
  }

  // Session operations
  createSession(params: {
    studentId: string;
    tutorId: string;
    scenarioId?: string;
    language: string;
    level?: string;
    topic?: string;
  }): PracticeSession {
    const id = generateId("session");
    const session: PracticeSession = {
      id,
      student_id: params.studentId,
      tutor_id: params.tutorId,
      scenario_id: params.scenarioId || null,
      language: params.language,
      level: params.level || null,
      topic: params.topic || null,
      message_count: 0,
      tokens_used: 0,
      grammar_errors_count: 0,
      phonetic_errors_count: 0,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: null,
      ai_feedback: null,
    };

    this.sessions.set(id, session);
    this.messages.set(id, []);
    this.grammarErrors.set(id, []);

    return session;
  }

  getSession(id: string): PracticeSession | null {
    return this.sessions.get(id) || null;
  }

  // Message operations
  addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    corrections?: StructuredCorrection[],
    phoneticErrors?: PhoneticError[],
    vocabularyUsed?: string[],
    tokensUsed: number = 0
  ): { message: PracticeMessage | null; error: string | null } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { message: null, error: "Session not found" };
    }

    if (session.ended_at) {
      return { message: null, error: "Session has ended" };
    }

    const message: PracticeMessage = {
      id: generateId("message"),
      session_id: sessionId,
      role,
      content,
      corrections: corrections || null,
      phonetic_errors: phoneticErrors || null,
      vocabulary_used: vocabularyUsed || null,
      tokens_used: tokensUsed,
      created_at: new Date().toISOString(),
    };

    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    // Update session stats
    session.message_count += 1;
    session.tokens_used += tokensUsed;

    if (corrections && corrections.length > 0) {
      session.grammar_errors_count += corrections.length;

      // Track grammar errors
      const errors = this.grammarErrors.get(sessionId) || [];
      for (const c of corrections) {
        errors.push({ category_slug: c.category, session_id: sessionId });
      }
      this.grammarErrors.set(sessionId, errors);
    }

    if (phoneticErrors && phoneticErrors.length > 0) {
      session.phonetic_errors_count += phoneticErrors.length;
    }

    this.sessions.set(sessionId, session);

    return { message, error: null };
  }

  getMessages(sessionId: string): PracticeMessage[] {
    return this.messages.get(sessionId) || [];
  }

  getGrammarErrors(sessionId: string): Array<{ category_slug: string; session_id: string }> {
    return this.grammarErrors.get(sessionId) || [];
  }

  // Session completion
  endSession(sessionId: string): {
    session: PracticeSession | null;
    feedback: SessionFeedback | null;
    error: string | null;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { session: null, feedback: null, error: "Session not found" };
    }

    if (session.ended_at) {
      return { session, feedback: session.ai_feedback, error: null };
    }

    const messages = this.getMessages(sessionId);
    const grammarErrors = this.getGrammarErrors(sessionId);

    const endedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const feedback = generateSessionFeedback(
      messages.map((m) => ({ role: m.role, content: m.content })),
      grammarErrors
    );
    feedback.duration_seconds = durationSeconds;

    session.ended_at = endedAt.toISOString();
    session.duration_seconds = durationSeconds;
    session.ai_feedback = feedback;

    this.sessions.set(sessionId, session);

    return { session, feedback, error: null };
  }

  // Usage tracking
  getOrCreateUsagePeriod(studentId: string): UsagePeriod {
    const existing = Array.from(this.usagePeriods.values()).find(
      (p) => p.student_id === studentId
    );

    if (existing) return existing;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const period: UsagePeriod = {
      id: generateId("usage"),
      student_id: studentId,
      text_turns_used: 0,
      audio_seconds_used: 0,
      blocks_consumed: 0,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    };

    this.usagePeriods.set(period.id, period);
    return period;
  }

  incrementTextTurn(usagePeriodId: string): UsagePeriod | null {
    const period = this.usagePeriods.get(usagePeriodId);
    if (!period) return null;

    period.text_turns_used += 1;
    this.usagePeriods.set(usagePeriodId, period);

    return period;
  }

  incrementAudioSeconds(usagePeriodId: string, seconds: number): UsagePeriod | null {
    const period = this.usagePeriods.get(usagePeriodId);
    if (!period) return null;

    period.audio_seconds_used += seconds;
    this.usagePeriods.set(usagePeriodId, period);

    return period;
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe("AI Practice Session Workflow", () => {
  let db: MockPracticeDatabase;
  let tutor: ReturnType<typeof createMockTutor>;
  let student: ReturnType<typeof createMockStudent>;

  beforeEach(() => {
    db = new MockPracticeDatabase();
    tutor = createMockTutor();
    student = createMockStudent(tutor.id);
  });

  describe("Session Creation", () => {
    it("creates a basic practice session", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      assert.ok(session.id);
      assert.equal(session.student_id, student.id);
      assert.equal(session.tutor_id, tutor.id);
      assert.equal(session.language, "Spanish");
      assert.equal(session.message_count, 0);
      assert.equal(session.ended_at, null);
    });

    it("creates session with scenario configuration", () => {
      const scenario = createMockScenario(tutor.id);

      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        scenarioId: scenario.id,
        language: scenario.language,
        level: scenario.level ?? undefined,
        topic: scenario.topic ?? undefined,
      });

      assert.equal(session.scenario_id, scenario.id);
      assert.equal(session.language, "Spanish");
      assert.equal(session.level, "intermediate");
      assert.equal(session.topic, "ordering food at a restaurant");
    });

    it("creates session with level and topic", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "French",
        level: "beginner",
        topic: "greetings and introductions",
      });

      assert.equal(session.level, "beginner");
      assert.equal(session.topic, "greetings and introductions");
    });
  });

  describe("Message Exchange", () => {
    it("adds user message to session", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      const result = db.addMessage(
        session.id,
        "user",
        "Hola, me gustaría un café por favor"
      );

      assert.equal(result.error, null);
      assert.ok(result.message);
      assert.equal(result.message.role, "user");
      assert.equal(result.message.content, "Hola, me gustaría un café por favor");

      const updatedSession = db.getSession(session.id);
      assert.equal(updatedSession!.message_count, 1);
    });

    it("adds assistant message with corrections", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      const corrections: StructuredCorrection[] = [
        {
          original: "Yo soy tiene",
          corrected: "Yo tengo",
          category: "conjugation",
          explanation: "Use 'tengo' (first person) instead of 'tiene' (third person)",
        },
      ];

      const result = db.addMessage(
        session.id,
        "assistant",
        "Great! Let me help you with that.",
        corrections,
        undefined,
        undefined,
        150
      );

      assert.equal(result.error, null);
      assert.ok(result.message);
      assert.equal(result.message.corrections!.length, 1);
      assert.equal(result.message.corrections![0].category, "conjugation");

      const updatedSession = db.getSession(session.id);
      assert.equal(updatedSession!.grammar_errors_count, 1);
      assert.equal(updatedSession!.tokens_used, 150);
    });

    it("tracks phonetic errors separately", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      const phoneticErrors: PhoneticError[] = [
        {
          misspelled: "becouse",
          intended: "because",
          pattern: "au->o confusion",
        },
      ];

      const result = db.addMessage(
        session.id,
        "assistant",
        "Good effort!",
        undefined,
        phoneticErrors
      );

      assert.ok(result.message);
      assert.equal(result.message.phonetic_errors!.length, 1);

      const updatedSession = db.getSession(session.id);
      assert.equal(updatedSession!.phonetic_errors_count, 1);
    });

    it("tracks vocabulary usage", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      const result = db.addMessage(
        session.id,
        "assistant",
        "You used 'camarero' correctly!",
        undefined,
        undefined,
        ["camarero", "cuenta"]
      );

      assert.ok(result.message);
      assert.deepEqual(result.message.vocabulary_used, ["camarero", "cuenta"]);
    });

    it("rejects message to ended session", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      db.endSession(session.id);

      const result = db.addMessage(session.id, "user", "One more message");

      assert.ok(result.error);
      assert.equal(result.error, "Session has ended");
    });

    it("rejects message to non-existent session", () => {
      const result = db.addMessage("nonexistent", "user", "Hello");

      assert.ok(result.error);
      assert.equal(result.error, "Session not found");
    });
  });

  describe("Grammar Correction Parsing", () => {
    it("parses structured corrections from AI response", () => {
      const aiResponse = `Great practice! Your sentence was almost perfect.

<corrections>
[{"original": "Yo querer", "corrected": "Yo quiero", "category": "conjugation", "explanation": "First person present tense requires 'quiero'"}]
</corrections>`;

      const { cleanContent, corrections, phoneticErrors } = parseStructuredResponse(aiResponse);

      assert.ok(!cleanContent.includes("<corrections>"));
      assert.equal(corrections.length, 1);
      assert.equal(corrections[0].original, "Yo querer");
      assert.equal(corrections[0].corrected, "Yo quiero");
      assert.equal(corrections[0].category, "conjugation");
    });

    it("parses multiple corrections", () => {
      const aiResponse = `Let me help with a few things.

<corrections>
[
  {"original": "el problema", "corrected": "la problema", "category": "gender_agreement", "explanation": "Problema is feminine"},
  {"original": "vamos a el parque", "corrected": "vamos al parque", "category": "preposition", "explanation": "Use contraction 'al'"}
]
</corrections>`;

      const { corrections } = parseStructuredResponse(aiResponse);

      assert.equal(corrections.length, 2);
      assert.equal(corrections[0].category, "gender_agreement");
      assert.equal(corrections[1].category, "preposition");
    });

    it("parses phonetic errors", () => {
      const aiResponse = `Good try!

<phonetic_errors>
[{"misspelled": "kwando", "intended": "cuando", "pattern": "c->k substitution"}]
</phonetic_errors>`;

      const { phoneticErrors } = parseStructuredResponse(aiResponse);

      assert.equal(phoneticErrors.length, 1);
      assert.equal(phoneticErrors[0].misspelled, "kwando");
      assert.equal(phoneticErrors[0].intended, "cuando");
    });

    it("parses both corrections and phonetic errors", () => {
      const aiResponse = `Nice work!

<corrections>
[{"original": "Yo esta", "corrected": "Yo estoy", "category": "conjugation", "explanation": "Use first person"}]
</corrections>

<phonetic_errors>
[{"misspelled": "hize", "intended": "hice", "pattern": "z->c confusion"}]
</phonetic_errors>`;

      const { corrections, phoneticErrors } = parseStructuredResponse(aiResponse);

      assert.equal(corrections.length, 1);
      assert.equal(phoneticErrors.length, 1);
    });

    it("handles legacy correction format", () => {
      const aiResponse = `Good! [Correction: 'tener' should be 'tengo' - conjugation error]`;

      const { corrections } = parseStructuredResponse(aiResponse);

      assert.equal(corrections.length, 1);
      assert.equal(corrections[0].original, "tener");
      assert.equal(corrections[0].corrected, "tengo");
    });

    it("cleans content by removing correction tags", () => {
      const aiResponse = `This is the clean response.

<corrections>
[{"original": "error", "corrected": "correct", "category": "spelling", "explanation": "typo"}]
</corrections>

Extra text after.`;

      const { cleanContent } = parseStructuredResponse(aiResponse);

      assert.ok(!cleanContent.includes("<corrections>"));
      assert.ok(!cleanContent.includes("</corrections>"));
      assert.ok(cleanContent.includes("This is the clean response"));
      assert.ok(cleanContent.includes("Extra text after"));
    });

    it("normalizes unknown category to vocabulary", () => {
      const aiResponse = `<corrections>
[{"original": "test", "corrected": "tests", "category": "unknown_category", "explanation": "fix"}]
</corrections>`;

      const { corrections } = parseStructuredResponse(aiResponse);

      assert.equal(corrections[0].category, "vocabulary");
    });
  });

  describe("Vocabulary Parsing", () => {
    it("extracts focus vocabulary from response", () => {
      const content = "You used the word camarero correctly when ordering!";
      const focusWords = ["camarero", "cuenta", "propina", "menu"];

      const used = parseVocabulary(content, focusWords);

      assert.deepEqual(used, ["camarero"]);
    });

    it("extracts multiple vocabulary words", () => {
      const content = "Great use of 'camarero' and 'cuenta' in your sentence!";
      const focusWords = ["camarero", "cuenta", "propina"];

      const used = parseVocabulary(content, focusWords);

      assert.deepEqual(used, ["camarero", "cuenta"]);
    });

    it("handles case insensitivity", () => {
      const content = "You said CAMARERO correctly";
      const focusWords = ["camarero"];

      const used = parseVocabulary(content, focusWords);

      assert.deepEqual(used, ["camarero"]);
    });

    it("returns empty for no focus words", () => {
      const content = "Good work!";

      const used = parseVocabulary(content, []);

      assert.deepEqual(used, []);
    });
  });

  describe("Session Completion", () => {
    it("generates feedback when ending session", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      // Add some messages
      db.addMessage(session.id, "user", "Hola, como estas?");
      db.addMessage(session.id, "assistant", "Muy bien, gracias!");
      db.addMessage(session.id, "user", "Yo querer un cafe");
      db.addMessage(
        session.id,
        "assistant",
        "Good try!",
        [{ original: "querer", corrected: "quiero", category: "conjugation", explanation: "Use first person" }]
      );

      const { session: endedSession, feedback } = db.endSession(session.id);

      assert.ok(endedSession!.ended_at);
      assert.ok(endedSession!.duration_seconds !== null);
      assert.ok(feedback);
      assert.ok(feedback.overall_rating >= 1 && feedback.overall_rating <= 5);
      assert.ok(Array.isArray(feedback.suggestions));
      assert.ok(feedback.grammar_breakdown);
    });

    it("returns existing feedback for already ended session", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      db.addMessage(session.id, "user", "Test message");

      const { feedback: firstFeedback } = db.endSession(session.id);
      const { feedback: secondFeedback } = db.endSession(session.id);

      assert.deepEqual(firstFeedback, secondFeedback);
    });

    it("calculates grammar breakdown correctly", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      // Add messages with various error types
      db.addMessage(session.id, "user", "message 1");
      db.addMessage(session.id, "assistant", "response", [
        { original: "a", corrected: "b", category: "conjugation", explanation: "" },
      ]);
      db.addMessage(session.id, "user", "message 2");
      db.addMessage(session.id, "assistant", "response", [
        { original: "c", corrected: "d", category: "conjugation", explanation: "" },
        { original: "e", corrected: "f", category: "article", explanation: "" },
      ]);

      const { feedback } = db.endSession(session.id);

      assert.ok(feedback!.grammar_breakdown);
      assert.equal(feedback!.grammar_breakdown!["conjugation"], 2);
      assert.equal(feedback!.grammar_breakdown!["article"], 1);
    });

    it("generates suggestions based on error categories", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      // Add multiple verb tense errors
      for (let i = 0; i < 3; i++) {
        db.addMessage(session.id, "user", `message ${i}`);
        db.addMessage(session.id, "assistant", "response", [
          { original: "x", corrected: "y", category: "verb_tense", explanation: "" },
        ]);
      }

      const { feedback } = db.endSession(session.id);

      assert.ok(feedback!.suggestions.some((s) => s.toLowerCase().includes("verb tense")));
    });
  });

  describe("Usage Tracking", () => {
    it("creates usage period for new student", () => {
      const period = db.getOrCreateUsagePeriod(student.id);

      assert.ok(period.id);
      assert.equal(period.student_id, student.id);
      assert.equal(period.text_turns_used, 0);
      assert.equal(period.audio_seconds_used, 0);
      assert.equal(period.blocks_consumed, 0);
    });

    it("returns existing usage period", () => {
      const period1 = db.getOrCreateUsagePeriod(student.id);
      const period2 = db.getOrCreateUsagePeriod(student.id);

      assert.equal(period1.id, period2.id);
    });

    it("increments text turns", () => {
      const period = db.getOrCreateUsagePeriod(student.id);

      db.incrementTextTurn(period.id);
      db.incrementTextTurn(period.id);

      const updated = db.getOrCreateUsagePeriod(student.id);
      assert.equal(updated.text_turns_used, 2);
    });

    it("increments audio seconds", () => {
      const period = db.getOrCreateUsagePeriod(student.id);

      db.incrementAudioSeconds(period.id, 30);
      db.incrementAudioSeconds(period.id, 45);

      const updated = db.getOrCreateUsagePeriod(student.id);
      assert.equal(updated.audio_seconds_used, 75);
    });

    it("calculates usage allowance correctly", () => {
      const period: UsagePeriod = {
        id: "test",
        student_id: student.id,
        text_turns_used: 100,
        audio_seconds_used: 500,
        blocks_consumed: 2,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      };

      const allowance = calculateUsageAllowance(period);

      assert.equal(allowance.textAllowance, FREE_TEXT_TURNS + 2 * BLOCK_TEXT_TURNS);
      assert.equal(allowance.audioAllowance, FREE_AUDIO_SECONDS + 2 * BLOCK_AUDIO_SECONDS);
      assert.equal(allowance.textRemaining, allowance.textAllowance - 100);
      assert.equal(allowance.audioRemaining, allowance.audioAllowance - 500);
    });

    it("detects exhausted usage", () => {
      const exhaustedPeriod: UsagePeriod = {
        id: "test",
        student_id: student.id,
        text_turns_used: FREE_TEXT_TURNS,
        audio_seconds_used: FREE_AUDIO_SECONDS,
        blocks_consumed: 0,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      };

      assert.equal(isUsageExhausted(exhaustedPeriod), true);
    });

    it("non-exhausted with available text turns", () => {
      const period: UsagePeriod = {
        id: "test",
        student_id: student.id,
        text_turns_used: 100,
        audio_seconds_used: FREE_AUDIO_SECONDS,
        blocks_consumed: 0,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      };

      assert.equal(isUsageExhausted(period), false);
    });
  });

  describe("Message Limit Enforcement", () => {
    it("allows messages within limit", () => {
      const session: PracticeSession = {
        id: "test",
        student_id: student.id,
        tutor_id: tutor.id,
        scenario_id: null,
        language: "Spanish",
        level: null,
        topic: null,
        message_count: 10,
        tokens_used: 0,
        grammar_errors_count: 0,
        phonetic_errors_count: 0,
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_seconds: null,
        ai_feedback: null,
      };

      const result = canSendMessage(session, 20);
      assert.equal(result.allowed, true);
    });

    it("blocks messages at limit", () => {
      const session: PracticeSession = {
        id: "test",
        student_id: student.id,
        tutor_id: tutor.id,
        scenario_id: null,
        language: "Spanish",
        level: null,
        topic: null,
        message_count: 19,
        tokens_used: 0,
        grammar_errors_count: 0,
        phonetic_errors_count: 0,
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_seconds: null,
        ai_feedback: null,
      };

      const result = canSendMessage(session, 20);
      assert.equal(result.allowed, false);
      assert.ok(result.error!.includes("Message limit"));
    });

    it("blocks messages for ended session", () => {
      const session: PracticeSession = {
        id: "test",
        student_id: student.id,
        tutor_id: tutor.id,
        scenario_id: null,
        language: "Spanish",
        level: null,
        topic: null,
        message_count: 5,
        tokens_used: 0,
        grammar_errors_count: 0,
        phonetic_errors_count: 0,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 300,
        ai_feedback: null,
      };

      const result = canSendMessage(session, 20);
      assert.equal(result.allowed, false);
      assert.equal(result.error, "Session has ended");
    });
  });

  describe("Grammar Category Normalization", () => {
    it("normalizes valid categories", () => {
      assert.equal(normalizeGrammarCategorySlug("verb_tense"), "verb_tense");
      assert.equal(normalizeGrammarCategorySlug("VERB_TENSE"), "verb_tense");
      assert.equal(normalizeGrammarCategorySlug("Verb Tense"), "verb_tense");
    });

    it("defaults unknown categories to vocabulary", () => {
      assert.equal(normalizeGrammarCategorySlug("unknown"), "vocabulary");
      assert.equal(normalizeGrammarCategorySlug("random_category"), "vocabulary");
    });

    it("handles null and undefined", () => {
      assert.equal(normalizeGrammarCategorySlug(null), "vocabulary");
      assert.equal(normalizeGrammarCategorySlug(undefined), "vocabulary");
    });
  });

  describe("Full Workflow Integration", () => {
    it("complete practice session flow", () => {
      // Step 1: Create session
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
        level: "intermediate",
        topic: "restaurant ordering",
      });

      // Initialize usage tracking
      const usagePeriod = db.getOrCreateUsagePeriod(student.id);

      // Step 2: Exchange messages
      db.addMessage(session.id, "user", "Hola, me gustaría una mesa para dos personas");
      db.incrementTextTurn(usagePeriod.id);

      db.addMessage(
        session.id,
        "assistant",
        "Buenas tardes! Por supuesto, tenemos una mesa disponible.",
        undefined,
        undefined,
        ["mesa"],
        80
      );

      db.addMessage(session.id, "user", "Yo querer ver el menu, por favor");
      db.incrementTextTurn(usagePeriod.id);

      db.addMessage(
        session.id,
        "assistant",
        "Aqui tiene el menu.",
        [{ original: "querer", corrected: "quisiera", category: "verb_tense", explanation: "Use conditional for polite requests" }],
        undefined,
        ["menu"],
        100
      );

      db.addMessage(session.id, "user", "Me gustaria el pollo con arroz");
      db.incrementTextTurn(usagePeriod.id);

      db.addMessage(
        session.id,
        "assistant",
        "Excelente eleccion!",
        undefined,
        undefined,
        undefined,
        60
      );

      // Verify session state
      const currentSession = db.getSession(session.id);
      assert.equal(currentSession!.message_count, 6);
      assert.equal(currentSession!.grammar_errors_count, 1);
      assert.equal(currentSession!.tokens_used, 240);

      // Verify usage
      const currentUsage = db.getOrCreateUsagePeriod(student.id);
      assert.equal(currentUsage.text_turns_used, 3);

      // Step 3: End session
      const { session: endedSession, feedback } = db.endSession(session.id);

      assert.ok(endedSession!.ended_at);
      assert.ok(feedback);
      assert.equal(feedback.message_count, 6);
      assert.ok(feedback.grammar_breakdown!["verb_tense"]);
      assert.ok(feedback.suggestions.length > 0);
    });

    it("handles session with many errors correctly", () => {
      const session = db.createSession({
        studentId: student.id,
        tutorId: tutor.id,
        language: "Spanish",
      });

      // Simulate many errors
      for (let i = 0; i < 5; i++) {
        db.addMessage(session.id, "user", `Message ${i}`);
        db.addMessage(
          session.id,
          "assistant",
          `Response ${i}`,
          [
            { original: `error${i}a`, corrected: `correct${i}a`, category: "verb_tense", explanation: "" },
            { original: `error${i}b`, corrected: `correct${i}b`, category: "article", explanation: "" },
          ]
        );
      }

      const { feedback } = db.endSession(session.id);

      // With 2 errors per exchange and 5 exchanges = 10 errors / 5 user messages = 2.0 ratio
      // This should result in a lower rating
      assert.ok(feedback!.overall_rating <= 3);
      assert.equal(feedback!.grammar_breakdown!["verb_tense"], 5);
      assert.equal(feedback!.grammar_breakdown!["article"], 5);
    });
  });
});
