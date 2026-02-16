import type { WordLadderPuzzle } from "./types";

/**
 * German Word Ladder puzzles.
 * All words are 4 letters, common German vocabulary.
 */
export const PUZZLES_DE: WordLadderPuzzle[] = [
  {
    number: 1,
    language: "de",
    date: "2026-02-17",
    startWord: "HAUS",
    targetWord: "MAUS",
    par: 2,
    optimalPath: ["HAUS", "MAUS"],
    validWords: new Set([
      "HAUS", "MAUS", "RAUS", "LAUS", "HAUT", "HAUL", "HAUS", "MAUT",
      "MAUL", "HAUE", "HASE",
    ]),
    hint: "A house becomes a mouse with one change...",
  },
  {
    number: 2,
    language: "de",
    date: "2026-02-18",
    startWord: "BROT",
    targetWord: "BOOT",
    par: 2,
    optimalPath: ["BROT", "BROT", "BOOT"],
    validWords: new Set([
      "BROT", "BOOT", "BROT", "BLOT", "BOLT", "BOOM", "BOND", "BORD",
      "BORN", "BOSS", "BOCK", "BOHR", "BOHM",
    ]),
    hint: "Bread floats away on a boat...",
  },
  {
    number: 3,
    language: "de",
    date: "2026-02-19",
    startWord: "HAND",
    targetWord: "HUND",
    par: 2,
    optimalPath: ["HAND", "HUND"],
    validWords: new Set([
      "HAND", "HUND", "HANG", "HART", "HAST", "HALT", "HALB", "HALS",
      "HUND", "HUPE", "HURE", "HAUT",
    ]),
    hint: "A hand becomes a dog...",
  },
  {
    number: 4,
    language: "de",
    date: "2026-02-20",
    startWord: "WORT",
    targetWord: "WERT",
    par: 2,
    optimalPath: ["WORT", "WERT"],
    validWords: new Set([
      "WORT", "WERT", "WORT", "WART", "WARM", "WARN", "WALD", "WAHL",
      "WAND", "WEIT", "WERK", "WELT",
    ]),
    hint: "A word becomes a value...",
  },
  {
    number: 5,
    language: "de",
    date: "2026-02-21",
    startWord: "NACHT",
    targetWord: "MACHT",
    par: 2,
    optimalPath: ["NACHT", "MACHT"],
    validWords: new Set([
      "NACHT", "MACHT", "WACHT", "FACHT", "PACHT", "DACHT", "SACHT",
    ]),
    hint: "Night becomes power...",
  },
  {
    number: 6,
    language: "de",
    date: "2026-02-22",
    startWord: "KALT",
    targetWord: "HALT",
    par: 2,
    optimalPath: ["KALT", "HALT"],
    validWords: new Set([
      "KALT", "HALT", "KALT", "KAHL", "KALB", "KALK", "KAMM", "BALL",
      "FALL", "HALL", "WALL", "MALZ", "SALZ", "WALT",
    ]),
    hint: "Cold becomes stop...",
  },
  {
    number: 7,
    language: "de",
    date: "2026-02-23",
    startWord: "GELD",
    targetWord: "HELD",
    par: 2,
    optimalPath: ["GELD", "HELD"],
    validWords: new Set([
      "GELD", "HELD", "FELD", "GELT", "GELB", "GELS", "HELM", "HEIL",
      "HERD", "HERR", "BELD", "MELD",
    ]),
    hint: "Money becomes a hero...",
  },
  {
    number: 8,
    language: "de",
    date: "2026-02-24",
    startWord: "LIEB",
    targetWord: "LIED",
    par: 2,
    optimalPath: ["LIEB", "LIED"],
    validWords: new Set([
      "LIEB", "LIED", "LIEF", "LIES", "LIEG", "LIFT", "LILA", "LIME",
      "LIND", "LINK", "LIST",
    ]),
    hint: "Love becomes a song...",
  },
];
