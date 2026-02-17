import type { WordLadderPuzzle } from "./types";

/**
 * German Word Ladder puzzles.
 * Words are 4-5 letters, common German vocabulary.
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
      "HAUS", "MAUS", "RAUS", "LAUS", "HAUT", "MAUT",
      "MAUL", "HAUE", "HASE", "BAUS", "DAUS",
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
    optimalPath: ["BROT", "BOOT"],
    validWords: new Set([
      "BROT", "BOOT", "BLOT", "BOLT", "BOOM", "BOND", "BORD",
      "BORN", "BOSS", "BOCK", "BOHR",
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
      "HUPE", "HURE", "HAUT", "BAND", "LAND", "SAND", "WAND",
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
      "WORT", "WERT", "WART", "WARM", "WARN", "WALD", "WAHL",
      "WAND", "WEIT", "WERK", "WELT", "WIRT", "SORT", "TORT", "PORT",
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
      "NACHT", "MACHT", "WACHT", "PACHT", "SACHT", "DACHT", "FACHT",
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
      "KALT", "HALT", "KAHL", "KALB", "KALK", "KAMM", "BALL",
      "FALL", "HALL", "WALL", "MALZ", "SALZ", "WALT", "BALT",
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
      "HERD", "HERR", "MELD",
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
      "LIEB", "LIED", "LIEF", "LIES", "LIEG", "LIFT", "LILA",
      "LIND", "LINK", "LIST", "DIEB", "HIEB", "SIEB",
    ]),
    hint: "Love becomes a song...",
  },
  // ---- Puzzles 9–30 (added content) ----
  {
    number: 9,
    language: "de",
    date: "2026-02-25",
    startWord: "HUND",
    targetWord: "BUND",
    par: 2,
    // HUND→BUND: H→B (pos 0)
    optimalPath: ["HUND", "BUND"],
    validWords: new Set([
      "HUND", "BUND", "FUND", "MUND", "RUND", "WUND", "HUNG",
      "BUNT", "BURG", "BUCH", "BAND", "RUND", "HUNT",
    ]),
    hint: "A dog joins the alliance...",
  },
  {
    number: 10,
    language: "de",
    date: "2026-02-26",
    startWord: "WALD",
    targetWord: "WILD",
    par: 2,
    // WALD→WILD: A→I (pos 1)
    optimalPath: ["WALD", "WILD"],
    validWords: new Set([
      "WALD", "WILD", "WAND", "WELT", "WORT", "WERT", "WIND",
      "WINK", "WIRT", "BILD", "MILD", "WAID", "WOLD",
    ]),
    hint: "The forest becomes wild...",
  },
  {
    number: 11,
    language: "de",
    date: "2026-02-27",
    startWord: "LUST",
    targetWord: "LAST",
    par: 2,
    // LUST→LAST: U→A (pos 1)
    optimalPath: ["LUST", "LAST"],
    validWords: new Set([
      "LUST", "LAST", "LIST", "LOST", "JUST", "MUST", "RUST", "DUST",
      "FAST", "MAST", "RAST", "HAST", "LASS", "LAND", "LAUT",
    ]),
    hint: "Pleasure becomes a burden...",
  },
  {
    number: 12,
    language: "de",
    date: "2026-02-28",
    startWord: "KERN",
    targetWord: "FERN",
    par: 2,
    // KERN→FERN: K→F (pos 0)
    optimalPath: ["KERN", "FERN"],
    validWords: new Set([
      "KERN", "FERN", "BERN", "GERN", "HERN", "TERN", "KERL",
      "FEST", "FELD", "FEIN", "FELL", "FELS", "FETT", "BERG",
    ]),
    hint: "The core becomes distant...",
  },
  {
    number: 13,
    language: "de",
    date: "2026-03-01",
    startWord: "TIER",
    targetWord: "TIEF",
    par: 2,
    // TIER→TIEF: R→F (pos 3)
    optimalPath: ["TIER", "TIEF"],
    validWords: new Set([
      "TIER", "TIEF", "BIER", "GIER", "HIER", "VIER", "ZIER",
      "FIEL", "VIEL", "ZIEL", "TIED", "TIES",
    ]),
    hint: "An animal dives deep...",
  },
  {
    number: 14,
    language: "de",
    date: "2026-03-02",
    startWord: "LICHT",
    targetWord: "NICHT",
    par: 2,
    // LICHT→NICHT: L→N (pos 0)
    optimalPath: ["LICHT", "NICHT"],
    validWords: new Set([
      "LICHT", "NICHT", "DICHT", "WICHT", "SICHT",
      "LINDE", "LINKS", "NACHT", "RICHT",
    ]),
    hint: "Light becomes 'not'...",
  },
  {
    number: 15,
    language: "de",
    date: "2026-03-03",
    startWord: "REGEN",
    targetWord: "WEGEN",
    par: 2,
    // REGEN→WEGEN: R→W (pos 0)
    optimalPath: ["REGEN", "WEGEN"],
    validWords: new Set([
      "REGEN", "WEGEN", "GEGEN", "LEGEN", "DEGEN", "SEGEN", "FEGEN",
      "REGAL", "REGEL",
    ]),
    hint: "Rain becomes because of...",
  },
  {
    number: 16,
    language: "de",
    date: "2026-03-04",
    startWord: "STERN",
    targetWord: "STIRN",
    par: 2,
    // STERN→STIRN: E→I (pos 2)
    optimalPath: ["STERN", "STIRN"],
    validWords: new Set([
      "STERN", "STIRN", "STEIL", "STEIN", "STEIF", "STIER",
      "STILL", "STIFT", "STARK", "START",
    ]),
    hint: "A star becomes a forehead...",
  },
  {
    number: 17,
    language: "de",
    date: "2026-03-05",
    startWord: "FEST",
    targetWord: "FETT",
    par: 2,
    // FEST→FETT: S→T (pos 2)
    optimalPath: ["FEST", "FETT"],
    validWords: new Set([
      "FEST", "FETT", "FELT", "FELD", "FEIN", "FELL", "FELS",
      "FERN", "BEST", "REST", "NEST", "TEST", "WETT", "BETT",
    ]),
    hint: "A party gets fat...",
  },
  {
    number: 18,
    language: "de",
    date: "2026-03-06",
    startWord: "GEHEN",
    targetWord: "SEHEN",
    par: 2,
    // GEHEN→SEHEN: G→S (pos 0)
    optimalPath: ["GEHEN", "SEHEN"],
    validWords: new Set([
      "GEHEN", "SEHEN", "LEHEN", "REHEN", "WEHEN",
      "GEBEN", "GEGEN", "GEBER", "SEGEL", "SEGEN",
    ]),
    hint: "Going becomes seeing...",
  },
  {
    number: 19,
    language: "de",
    date: "2026-03-07",
    startWord: "TAUB",
    targetWord: "RAUB",
    par: 2,
    // TAUB→RAUB: T→R (pos 0)
    optimalPath: ["TAUB", "RAUB"],
    validWords: new Set([
      "TAUB", "RAUB", "LAUB", "HAUB", "SAUB", "TAUF",
      "TAUS", "TAUG", "RAUM", "RAUS", "RAUE", "ZAUB",
    ]),
    hint: "Deaf becomes robbery...",
  },
  {
    number: 20,
    language: "de",
    date: "2026-03-08",
    startWord: "BAUM",
    targetWord: "RAUM",
    par: 2,
    // BAUM→RAUM: B→R (pos 0)
    optimalPath: ["BAUM", "RAUM"],
    validWords: new Set([
      "BAUM", "RAUM", "DAUM", "KAUM", "ZAUM", "SAUM",
      "BAUS", "RAUB", "RAUS", "HAUS", "MAUS", "LAUS",
    ]),
    hint: "A tree becomes a room...",
  },
  {
    number: 21,
    language: "de",
    date: "2026-03-09",
    startWord: "LAND",
    targetWord: "SAND",
    par: 2,
    // LAND→SAND: L→S (pos 0)
    optimalPath: ["LAND", "SAND"],
    validWords: new Set([
      "LAND", "SAND", "BAND", "HAND", "RAND", "WAND",
      "LANG", "LAUT", "LAUF", "SANG", "SANK", "SAFT", "SAMT",
    ]),
    hint: "Land becomes sand...",
  },
  {
    number: 22,
    language: "de",
    date: "2026-03-10",
    startWord: "REIS",
    targetWord: "REIN",
    par: 2,
    // REIS→REIN: S→N (pos 3)
    optimalPath: ["REIS", "REIN"],
    validWords: new Set([
      "REIS", "REIN", "REIF", "REIH", "REIM", "REIT",
      "LEIS", "WEIS", "BEIN", "FEIN", "HEIN", "KEIN", "MEIN", "SEIN",
    ]),
    hint: "Rice becomes pure...",
  },
  {
    number: 23,
    language: "de",
    date: "2026-03-11",
    startWord: "WEIN",
    targetWord: "BEIN",
    par: 2,
    // WEIN→BEIN: W→B (pos 0)
    optimalPath: ["WEIN", "BEIN"],
    validWords: new Set([
      "WEIN", "BEIN", "DEIN", "FEIN", "HEIN", "KEIN", "LEIN",
      "MEIN", "REIN", "SEIN", "WEIT", "WEIL", "WEIB", "HEIM",
    ]),
    hint: "Wine goes straight to the leg...",
  },
  {
    number: 24,
    language: "de",
    date: "2026-03-12",
    startWord: "HASE",
    targetWord: "NASE",
    par: 2,
    // HASE→NASE: H→N (pos 0)
    optimalPath: ["HASE", "NASE"],
    validWords: new Set([
      "HASE", "NASE", "BASE", "CASE", "FASE", "GASE", "RASE", "VASE",
      "HAST", "HASS", "HAUT", "NAME", "NAHE", "NASS",
    ]),
    hint: "A hare follows its nose...",
  },
  {
    number: 25,
    language: "de",
    date: "2026-03-13",
    startWord: "FALL",
    targetWord: "FELD",
    par: 3,
    // FALL→FELL: A→E (pos 1). FELL→FELD: L→D (pos 3)
    optimalPath: ["FALL", "FELL", "FELD"],
    validWords: new Set([
      "FALL", "FELL", "FELD", "BALL", "HALL", "WALL", "TALL", "BELL",
      "GELL", "HELL", "TELL", "WELL", "HELD", "GELD", "MELD",
    ]),
    hint: "A fall through fur into a field...",
  },
  {
    number: 26,
    language: "de",
    date: "2026-03-14",
    startWord: "TANZ",
    targetWord: "GANZ",
    par: 2,
    // TANZ→GANZ: T→G (pos 0)
    optimalPath: ["TANZ", "GANZ"],
    validWords: new Set([
      "TANZ", "GANZ", "HANZ", "RANZ", "WANZ", "TANG",
      "TANK", "TAUT", "GANG", "GARN", "GAST", "GABE", "LANZ",
    ]),
    hint: "A dance becomes complete...",
  },
  {
    number: 27,
    language: "de",
    date: "2026-03-15",
    startWord: "BETT",
    targetWord: "WETT",
    par: 2,
    // BETT→WETT: B→W (pos 0)
    optimalPath: ["BETT", "WETT"],
    validWords: new Set([
      "BETT", "WETT", "FETT", "NETT", "SETT", "BEIL", "BERG",
      "BEST", "BEIN", "WERT", "WEIL", "WEIT", "KETT", "RETT",
    ]),
    hint: "A bed becomes a bet...",
  },
  {
    number: 28,
    language: "de",
    date: "2026-03-16",
    startWord: "HEIL",
    targetWord: "TEIL",
    par: 2,
    // HEIL→TEIL: H→T (pos 0)
    optimalPath: ["HEIL", "TEIL"],
    validWords: new Set([
      "HEIL", "TEIL", "BEIL", "FEIL", "GEIL", "KEIL", "SEIL", "WEIL",
      "HEIM", "HEIN", "TEIG", "TEER",
    ]),
    hint: "Salvation becomes a part...",
  },
  {
    number: 29,
    language: "de",
    date: "2026-03-17",
    startWord: "SATZ",
    targetWord: "SALZ",
    par: 2,
    // SATZ→SALZ: T→L (pos 2)
    optimalPath: ["SATZ", "SALZ"],
    validWords: new Set([
      "SATZ", "SALZ", "SACK", "SAFT", "SAGE", "SAND", "SANG", "SANK",
      "MALZ", "WALZ", "HALS", "HALT", "BATZ", "KATZ", "MATZ",
    ]),
    hint: "A sentence becomes salty...",
  },
  {
    number: 30,
    language: "de",
    date: "2026-03-18",
    startWord: "SONNE",
    targetWord: "WONNE",
    par: 2,
    // SONNE→WONNE: S→W (pos 0)
    optimalPath: ["SONNE", "WONNE"],
    validWords: new Set([
      "SONNE", "WONNE", "BONNE", "TONNE", "KONNE", "DONNE", "SONDE",
      "SORGE", "SOGAR", "SOLLE", "WOLLE", "WOLKE", "WOCHE",
    ]),
    hint: "Sun becomes bliss...",
  },
];
