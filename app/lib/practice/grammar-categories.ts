export const GRAMMAR_CATEGORY_SLUGS = [
  "verb-tense",
  "subject-verb-agreement",
  "preposition",
  "article",
  "word-order",
  "gender-agreement",
  "conjugation",
  "pronoun",
  "plural-singular",
  "spelling",
  "vocabulary",
] as const;

export type GrammarCategorySlug = (typeof GRAMMAR_CATEGORY_SLUGS)[number];

export const GRAMMAR_CATEGORY_LABELS: Record<GrammarCategorySlug, string> = {
  "verb-tense": "Verb Tense",
  "subject-verb-agreement": "Subject-Verb Agreement",
  preposition: "Prepositions",
  article: "Articles",
  "word-order": "Word Order",
  "gender-agreement": "Gender Agreement",
  conjugation: "Conjugation",
  pronoun: "Pronouns",
  "plural-singular": "Plural/Singular",
  spelling: "Spelling",
  vocabulary: "Vocabulary",
};

export function normalizeGrammarCategorySlug(input: unknown): GrammarCategorySlug {
  const raw = String(input ?? "").trim().toLowerCase();
  const normalized = raw.replace(/_/g, "-");
  if (GRAMMAR_CATEGORY_SLUGS.includes(normalized as GrammarCategorySlug)) {
    return normalized as GrammarCategorySlug;
  }
  return "vocabulary";
}

