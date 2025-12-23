/**
 * Activity Suggester
 *
 * Uses AI to generate suggested lesson activities based on:
 * - Student's error patterns from recent lessons
 * - Focus areas (grammar, vocabulary, pronunciation)
 * - Proficiency level
 * - L1 interference patterns
 * - Lesson duration
 */

import OpenAI from "openai";
import type { SuggestedActivity, FocusArea, ErrorPattern } from "./briefing-generator";

// =============================================================================
// TYPES
// =============================================================================

export interface ActivitySuggestionInput {
  proficiencyLevel: string;
  errorPatterns: ErrorPattern[];
  focusAreas: FocusArea[];
  nativeLanguage: string | null;
  targetLanguage: string;
  lessonDuration: number;
}

// =============================================================================
// ACTIVITY TEMPLATES (Fallback when AI unavailable)
// =============================================================================

const ACTIVITY_TEMPLATES: Record<string, SuggestedActivity[]> = {
  grammar: [
    {
      title: "Grammar Gap-Fill Exercise",
      description: "Practice target structure with context-based gap-fill sentences",
      durationMin: 10,
      category: "practice",
    },
    {
      title: "Error Correction Game",
      description: "Identify and correct errors in sample sentences",
      durationMin: 8,
      category: "game",
    },
    {
      title: "Sentence Transformation",
      description: "Transform sentences using the target grammar pattern",
      durationMin: 10,
      category: "practice",
    },
  ],
  vocabulary: [
    {
      title: "Vocabulary Review Flashcards",
      description: "Quick review of vocabulary items due for spaced repetition",
      durationMin: 5,
      category: "review",
    },
    {
      title: "Context Guessing Game",
      description: "Guess vocabulary meaning from context sentences",
      durationMin: 8,
      category: "game",
    },
    {
      title: "Word Association Web",
      description: "Build vocabulary connections through association chains",
      durationMin: 10,
      category: "practice",
    },
  ],
  pronunciation: [
    {
      title: "Minimal Pairs Drill",
      description: "Practice distinguishing similar sounds",
      durationMin: 8,
      category: "practice",
    },
    {
      title: "Shadowing Exercise",
      description: "Listen and repeat with focus on intonation and rhythm",
      durationMin: 10,
      category: "practice",
    },
    {
      title: "Tongue Twister Challenge",
      description: "Fun pronunciation practice with tongue twisters",
      durationMin: 5,
      category: "warmup",
    },
  ],
  conversation: [
    {
      title: "Role-Play Scenario",
      description: "Practice target language in a realistic context",
      durationMin: 15,
      category: "conversation",
    },
    {
      title: "Picture Description",
      description: "Describe images using target vocabulary and structures",
      durationMin: 10,
      category: "conversation",
    },
    {
      title: "Opinion Exchange",
      description: "Discuss a topic using taught structures",
      durationMin: 12,
      category: "conversation",
    },
  ],
  warmup: [
    {
      title: "Weekend Recap",
      description: "Warm up with casual conversation about recent activities",
      durationMin: 5,
      category: "warmup",
    },
    {
      title: "Vocabulary Quick-Fire",
      description: "Fast-paced vocabulary review game",
      durationMin: 5,
      category: "warmup",
    },
  ],
};

// =============================================================================
// AI-POWERED SUGGESTER
// =============================================================================

/**
 * Generate activity suggestions using AI
 */
export async function suggestActivities(
  input: ActivitySuggestionInput
): Promise<SuggestedActivity[]> {
  // Try AI-powered suggestions first
  const aiSuggestions = await generateAISuggestions(input);
  if (aiSuggestions && aiSuggestions.length >= 2) {
    return aiSuggestions;
  }

  // Fallback to template-based suggestions
  return generateTemplateSuggestions(input);
}

/**
 * Generate suggestions using OpenAI
 */
async function generateAISuggestions(
  input: ActivitySuggestionInput
): Promise<SuggestedActivity[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[ActivitySuggester] No OpenAI API key, using templates");
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = buildPrompt(input);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert language teaching consultant. Generate 2-3 specific, actionable lesson activities based on the student's needs. Each activity should:
- Target specific errors or focus areas mentioned
- Be appropriate for the proficiency level
- Fit within the time allocation
- Be engaging and practical

Respond with a JSON array of activities. Each activity must have:
- title: Short, descriptive name (5-8 words max)
- description: One sentence explaining the activity and how it addresses the student's needs
- durationMin: Estimated duration in minutes (5-15)
- category: One of "warmup", "practice", "conversation", "review", "game"
- targetArea: What specific skill/error this addresses

Example response:
[
  {
    "title": "Past Tense Story Chain",
    "description": "Build a collaborative story using past tense verbs to address recurring tense errors",
    "durationMin": 12,
    "category": "conversation",
    "targetArea": "past_tense"
  }
]`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const activities = parsed.activities || parsed;

    if (!Array.isArray(activities)) return null;

    return activities.map((a: Record<string, unknown>) => ({
      title: String(a.title || "Activity"),
      description: String(a.description || ""),
      durationMin: Number(a.durationMin) || 10,
      category: validateCategory(a.category),
      targetArea: String(a.targetArea || ""),
    }));
  } catch (error) {
    console.error("[ActivitySuggester] AI generation failed:", error);
    return null;
  }
}

function buildPrompt(input: ActivitySuggestionInput): string {
  const parts: string[] = [];

  parts.push(`Student Profile:`);
  parts.push(`- Proficiency Level: ${input.proficiencyLevel}`);
  parts.push(`- Target Language: ${input.targetLanguage}`);
  if (input.nativeLanguage) {
    parts.push(`- Native Language: ${input.nativeLanguage}`);
  }
  parts.push(`- Lesson Duration: ${input.lessonDuration} minutes`);

  if (input.errorPatterns.length > 0) {
    parts.push(`\nRecent Error Patterns (ranked by frequency):`);
    for (const pattern of input.errorPatterns.slice(0, 5)) {
      const l1Note = pattern.isL1Interference ? " [L1 interference]" : "";
      parts.push(`- ${pattern.type}: ${pattern.count} occurrences${l1Note}`);
      if (pattern.examples.length > 0) {
        parts.push(`  Example: ${pattern.examples[0]}`);
      }
    }
  }

  if (input.focusAreas.length > 0) {
    parts.push(`\nRecommended Focus Areas:`);
    for (const area of input.focusAreas.slice(0, 3)) {
      parts.push(`- ${area.topic} (${area.type}): ${area.reason}`);
    }
  }

  parts.push(`\nGenerate 2-3 specific activities that:`);
  parts.push(`1. Address the most frequent error patterns`);
  parts.push(`2. Are appropriate for ${input.proficiencyLevel} level`);
  parts.push(`3. Can fit within ${input.lessonDuration} minutes total`);
  if (input.nativeLanguage) {
    parts.push(`4. Consider L1 interference from ${input.nativeLanguage}`);
  }

  return parts.join("\n");
}

function validateCategory(category: unknown): SuggestedActivity["category"] {
  const valid = ["warmup", "practice", "conversation", "review", "game"];
  const cat = String(category).toLowerCase();
  return valid.includes(cat) ? (cat as SuggestedActivity["category"]) : "practice";
}

// =============================================================================
// TEMPLATE-BASED FALLBACK
// =============================================================================

/**
 * Generate suggestions from templates when AI is unavailable
 */
function generateTemplateSuggestions(input: ActivitySuggestionInput): SuggestedActivity[] {
  const suggestions: SuggestedActivity[] = [];
  const targetDuration = input.lessonDuration;
  let currentDuration = 0;

  // Always start with a warmup
  const warmup = ACTIVITY_TEMPLATES.warmup[0];
  suggestions.push({ ...warmup });
  currentDuration += warmup.durationMin;

  // Add activities based on focus areas
  const focusTypes = new Set(input.focusAreas.map((f) => f.type));

  for (const type of focusTypes) {
    const templates = ACTIVITY_TEMPLATES[type] || ACTIVITY_TEMPLATES.grammar;
    for (const template of templates) {
      if (currentDuration + template.durationMin <= targetDuration * 0.8) {
        suggestions.push({
          ...template,
          targetArea: input.focusAreas.find((f) => f.type === type)?.topic || type,
        });
        currentDuration += template.durationMin;
        if (suggestions.length >= 4) break;
      }
    }
    if (suggestions.length >= 4) break;
  }

  // Add a conversation activity if there's time
  if (currentDuration + 15 <= targetDuration && suggestions.length < 4) {
    suggestions.push({
      ...ACTIVITY_TEMPLATES.conversation[0],
      description: `Practice using today's focus areas in free conversation`,
    });
  }

  return suggestions.slice(0, 4);
}
