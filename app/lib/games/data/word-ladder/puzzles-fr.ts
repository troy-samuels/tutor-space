import type { WordLadderPuzzle } from "./types";

/**
 * French Word Ladder puzzles.
 * All words are 4 letters, common French vocabulary.
 */
export const PUZZLES_FR: WordLadderPuzzle[] = [
  {
    number: 1,
    language: "fr",
    date: "2026-02-17",
    startWord: "MORT",
    targetWord: "MOTS",
    par: 2,
    optimalPath: ["MORT", "MORS", "MOTS"],
    validWords: new Set([
      "MORT", "MORS", "MOTS", "MORD", "MORE", "MONT", "MOUE", "MOLE",
      "MODE", "MOIS", "MOIT", "MORS", "MOUS", "MOBS",
    ]),
    hint: "Death becomes words with a small detour...",
  },
  {
    number: 2,
    language: "fr",
    date: "2026-02-18",
    startWord: "PEUR",
    targetWord: "POUR",
    par: 2,
    optimalPath: ["PEUR", "POUR"],
    validWords: new Set([
      "PEUR", "POUR", "PEUR", "NEUR", "LEUR", "PÈRE", "PAIR", "PAUR",
      "FOUR", "JOUR", "TOUR", "COUR", "DOUR",
    ]),
    hint: "Fear transforms into purpose...",
  },
  {
    number: 3,
    language: "fr",
    date: "2026-02-19",
    startWord: "LUNE",
    targetWord: "LUXE",
    par: 2,
    optimalPath: ["LUNE", "LUXE"],
    validWords: new Set([
      "LUNE", "LUXE", "LURE", "LUGE", "LUCE", "LUTE", "LIME", "LIRE",
      "LISE", "LICE", "LINE", "LIVE", "LAME", "LAPE", "LASE",
    ]),
    hint: "The moon leads to luxury...",
  },
  {
    number: 4,
    language: "fr",
    date: "2026-02-20",
    startWord: "VENT",
    targetWord: "VEAU",
    par: 3,
    optimalPath: ["VENT", "VENU", "VEAU"],
    validWords: new Set([
      "VENT", "VENU", "VEAU", "VEND", "VERS", "VERT", "VEUX", "VETO",
      "VENU", "VEUF", "VEAU", "VEAU",
    ]),
    hint: "The wind blows towards a young calf...",
  },
  {
    number: 5,
    language: "fr",
    date: "2026-02-21",
    startWord: "CHAT",
    targetWord: "CHAR",
    par: 2,
    optimalPath: ["CHAT", "CHAR"],
    validWords: new Set([
      "CHAT", "CHAR", "CHAN", "CHAI", "CHAP", "CHER", "CHEF", "CHOC",
      "CHOU", "CHAS",
    ]),
    hint: "A cat becomes a tank...",
  },
  {
    number: 6,
    language: "fr",
    date: "2026-02-22",
    startWord: "PAIN",
    targetWord: "PAIX",
    par: 2,
    optimalPath: ["PAIN", "PAIX"],
    validWords: new Set([
      "PAIN", "PAIX", "PAIR", "PAIS", "PALE", "PANE", "PARE", "PAYS",
      "PARC", "PART",
    ]),
    hint: "Bread becomes peace...",
  },
  {
    number: 7,
    language: "fr",
    date: "2026-02-23",
    startWord: "TOUR",
    targetWord: "TOUX",
    par: 2,
    optimalPath: ["TOUR", "TOUS", "TOUX"],
    validWords: new Set([
      "TOUR", "TOUS", "TOUX", "TOUT", "TORD", "TOUE", "TORE", "TORT",
      "TONS", "TOPS", "TOCS",
    ]),
    hint: "A tower leads to a cough through everyone...",
  },
  {
    number: 8,
    language: "fr",
    date: "2026-02-24",
    startWord: "RIRE",
    targetWord: "RIME",
    par: 2,
    optimalPath: ["RIRE", "RIME"],
    validWords: new Set([
      "RIRE", "RIME", "RIDE", "RITE", "RISE", "RICE", "RIPE", "ROBE",
      "RIVE", "RIEN",
    ]),
    hint: "Laughter becomes rhyme...",
  },
];
