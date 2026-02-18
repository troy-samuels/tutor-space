/**
 * Shared types for TutorLingua learner tools.
 * Supports EN, ES, FR, DE at launch — extensible to any language in LANGUAGE_CONFIGS.
 */

export type ToolLang = "en" | "es" | "fr" | "de";

export interface ToolLanguageConfig {
  code: ToolLang;
  name: string;
  nativeName: string;
  flag: string;
  /** What learners are doing when they use this language */
  learnerLabel: string;
  /** Challenge variant for the Daily Challenge tool */
  challengeType: "phrasal-verbs" | "false-friends";
  challengeLabel: string;
  challengeDescription: string;
}

export const TOOL_LANGUAGES: ToolLanguageConfig[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    learnerLabel: "Learning English",
    challengeType: "phrasal-verbs",
    challengeLabel: "Phrasal Verb Challenge",
    challengeDescription: "The #1 pain point for every English learner",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    learnerLabel: "Learning Spanish",
    challengeType: "false-friends",
    challengeLabel: "False Friends Challenge",
    challengeDescription: "Tricky words that fool English speakers every time",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    learnerLabel: "Learning French",
    challengeType: "false-friends",
    challengeLabel: "Faux Amis Challenge",
    challengeDescription: "French words that look like English — but aren't",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    learnerLabel: "Learning German",
    challengeType: "false-friends",
    challengeLabel: "False Friends Challenge",
    challengeDescription: "German words that will trip up any English speaker",
  },
];

export function getToolLanguage(code: string): ToolLanguageConfig {
  return TOOL_LANGUAGES.find((l) => l.code === code) ?? TOOL_LANGUAGES[0];
}

export function isValidToolLang(code: string): code is ToolLang {
  return TOOL_LANGUAGES.some((l) => l.code === code);
}

export const DEFAULT_LANG: ToolLang = "en";
