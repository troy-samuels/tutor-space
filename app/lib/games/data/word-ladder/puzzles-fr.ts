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
      "MODE", "MOIS", "MOIT", "MOUS", "MOBS",
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
      "PEUR", "POUR", "LEUR", "FOUR", "JOUR", "TOUR", "COUR",
      "DOUR", "PAIR", "NEUR",
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
      "VEUF",
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
      "CHAT", "CHAR", "CHAI", "CHAP", "CHER", "CHEF", "CHOC",
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
    par: 3,
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
  // ---- Puzzles 9–30 (added content) ----
  {
    number: 9,
    language: "fr",
    date: "2026-02-25",
    startWord: "GARE",
    targetWord: "RARE",
    par: 2,
    // GARE→RARE: G→R (pos 0)
    optimalPath: ["GARE", "RARE"],
    validWords: new Set([
      "GARE", "RARE", "GALE", "GAGE", "GAZE", "GAME", "GATE", "GAVE",
      "CARE", "DARE", "FARE", "MARE", "PARE", "TARE", "RACE",
    ]),
    hint: "The station becomes scarce...",
  },
  {
    number: 10,
    language: "fr",
    date: "2026-02-26",
    startWord: "LOUP",
    targetWord: "ROUE",
    par: 3,
    // LOUP→LOUE: P→E (pos 3). LOUE→ROUE: L→R (pos 0)
    optimalPath: ["LOUP", "LOUE", "ROUE"],
    validWords: new Set([
      "LOUP", "LOUE", "ROUE", "LOUD", "LOUR", "LOUT", "JOUE", "MOUE",
      "NOUE", "SOUE", "TOUE", "VOUE", "RODE", "ROBE", "ROSE",
    ]),
    hint: "A wolf rents a wheel...",
  },
  {
    number: 11,
    language: "fr",
    date: "2026-02-27",
    startWord: "FEUX",
    targetWord: "JEUX",
    par: 2,
    // FEUX→JEUX: F→J (pos 0)
    optimalPath: ["FEUX", "JEUX"],
    validWords: new Set([
      "FEUX", "JEUX", "DEUX", "VEUX", "PEUX", "YEUX", "FAUX", "FOUS",
      "FEUS", "CEUX", "DEUX", "LEUX", "MEUX",
    ]),
    hint: "Fires become games...",
  },
  {
    number: 12,
    language: "fr",
    date: "2026-02-28",
    startWord: "NUIT",
    targetWord: "HUIT",
    par: 2,
    // NUIT→HUIT: N→H (pos 0)
    optimalPath: ["NUIT", "HUIT"],
    validWords: new Set([
      "NUIT", "HUIT", "SUIT", "FUIT", "BUIT", "NUIS", "NOIR", "NOIX",
      "HUIS", "NUES", "SUIS", "DUIT", "LUIT",
    ]),
    hint: "Night becomes eight...",
  },
  {
    number: 13,
    language: "fr",
    date: "2026-03-01",
    startWord: "DOUX",
    targetWord: "JOUR",
    par: 4,
    // DOUX→DOUE: X→E (pos 3). DOUE→JOUE: D→J (pos 0). JOUE→JOUR: E→R (pos 3)
    optimalPath: ["DOUX", "DOUE", "JOUE", "JOUR"],
    validWords: new Set([
      "DOUX", "DOUE", "JOUE", "JOUR", "DORE", "DOSE", "DOME", "DONE",
      "DOTE", "MOUE", "NOUE", "ROUE", "SOUE", "VOUE", "JOUI", "JOUS",
      "JOLI", "FOUR", "POUR", "TOUR", "COUR",
    ]),
    hint: "Softness plays on cheeks until day breaks...",
  },
  {
    number: 14,
    language: "fr",
    date: "2026-03-02",
    startWord: "ROBE",
    targetWord: "RODE",
    par: 2,
    // ROBE→RODE: B→D (pos 2)
    optimalPath: ["ROBE", "RODE"],
    validWords: new Set([
      "ROBE", "RODE", "ROLE", "ROME", "ROSE", "ROTE", "ROUE", "ROPE",
      "RIME", "CODE", "MODE", "NODE", "RUDE", "RAGE", "RARE",
    ]),
    hint: "A dress prowls the streets...",
  },
  {
    number: 15,
    language: "fr",
    date: "2026-03-03",
    startWord: "SOIR",
    targetWord: "VOIX",
    par: 4,
    // SOIR→SOIE: R→E (pos 3). SOIE→VOIE: S→V (pos 0). VOIE→VOIX: E→X (pos 3)
    optimalPath: ["SOIR", "SOIE", "VOIE", "VOIX"],
    validWords: new Set([
      "SOIR", "SOIE", "VOIE", "VOIX", "SOIN", "SOIF", "SOIT", "SOIS",
      "SOLE", "SOME", "FOIE", "JOIE", "NOIE", "VOIR", "VOIS", "BOIS",
      "FOIS", "LOIS", "MOIS", "TOIT",
    ]),
    hint: "Evening silk shows the way to speak up...",
  },
  {
    number: 16,
    language: "fr",
    date: "2026-03-04",
    startWord: "BRAS",
    targetWord: "GRIS",
    par: 3,
    // BRAS→BRIS: A→I (pos 2). BRIS→GRIS: B→G (pos 0)
    optimalPath: ["BRAS", "BRIS", "GRIS"],
    validWords: new Set([
      "BRAS", "BRIS", "GRIS", "BRAI", "BRAN", "CRIS", "PRIS", "TRIS",
      "GRAS", "GROS", "BRUS", "GRAS",
    ]),
    hint: "Arms break into grey...",
  },
  {
    number: 17,
    language: "fr",
    date: "2026-03-05",
    startWord: "LAIT",
    targetWord: "LAID",
    par: 2,
    // LAIT→LAID: T→D (pos 3)
    optimalPath: ["LAIT", "LAID"],
    validWords: new Set([
      "LAIT", "LAID", "LAIE", "LAIS", "LAIC", "FAIT", "MAIT",
      "LARD", "LAIR", "BAIE", "HAIE", "MAIS", "BAIN", "GAIN",
    ]),
    hint: "Milk turns ugly...",
  },
  {
    number: 18,
    language: "fr",
    date: "2026-03-06",
    startWord: "BEAU",
    targetWord: "PEAU",
    par: 2,
    // BEAU→PEAU: B→P (pos 0)
    optimalPath: ["BEAU", "PEAU"],
    validWords: new Set([
      "BEAU", "PEAU", "VEAU", "SEAU", "HAUT", "BEUR",
      "PEUT", "PEUR", "PEUX", "BOIS",
    ]),
    hint: "Beauty is only skin deep...",
  },
  {
    number: 19,
    language: "fr",
    date: "2026-03-07",
    startWord: "MAIN",
    targetWord: "MAIS",
    par: 2,
    // MAIN→MAIS: N→S (pos 3)
    optimalPath: ["MAIN", "MAIS"],
    validWords: new Set([
      "MAIN", "MAIS", "MAIL", "MAIE", "MAIR", "BAIN", "GAIN", "PAIN",
      "SAIN", "VAIN", "NAIN", "RAIN", "FAIT", "MAXI",
    ]),
    hint: "A hand becomes a 'but'...",
  },
  {
    number: 20,
    language: "fr",
    date: "2026-03-08",
    startWord: "CHER",
    targetWord: "CHEF",
    par: 2,
    // CHER→CHEF: R→F (pos 3)
    optimalPath: ["CHER", "CHEF"],
    validWords: new Set([
      "CHER", "CHEF", "CHEZ", "CHEN", "CHEM", "CHAR", "CHAT", "CHOC",
      "CHOU", "CHAS", "AMER", "FIER", "HIER", "LIER", "TIER",
    ]),
    hint: "Expensive becomes the boss of the kitchen...",
  },
  {
    number: 21,
    language: "fr",
    date: "2026-03-09",
    startWord: "PONT",
    targetWord: "PORT",
    par: 2,
    // PONT→PORT: N→R (pos 2)
    optimalPath: ["PONT", "PORT"],
    validWords: new Set([
      "PONT", "PORT", "POLI", "POSE", "PORE", "POIS", "PORC", "POUR",
      "POLY", "FOND", "FONT", "DONT", "MONT", "MORT", "FORT", "SORT",
    ]),
    hint: "A bridge leads to a harbor...",
  },
  {
    number: 22,
    language: "fr",
    date: "2026-03-10",
    startWord: "DENT",
    targetWord: "VENT",
    par: 2,
    // DENT→VENT: D→V (pos 0)
    optimalPath: ["DENT", "VENT"],
    validWords: new Set([
      "DENT", "VENT", "CENT", "LENT", "MENT", "RENT", "SENT", "TENT",
      "DANS", "DONT", "VEND", "VERS", "VERT", "VENU",
    ]),
    hint: "A tooth becomes the wind...",
  },
  {
    number: 23,
    language: "fr",
    date: "2026-03-11",
    startWord: "GRAS",
    targetWord: "GRIS",
    par: 2,
    // GRAS→GRIS: A→I (pos 2)
    optimalPath: ["GRAS", "GRIS"],
    validWords: new Set([
      "GRAS", "GRIS", "GROS", "BRAS", "CRIS", "PRIS", "TRIS",
      "BRIS", "GRAD", "GRIS", "GRAS",
    ]),
    hint: "Fat becomes grey...",
  },
  {
    number: 24,
    language: "fr",
    date: "2026-03-12",
    startWord: "MIEL",
    targetWord: "CIEL",
    par: 2,
    // MIEL→CIEL: M→C (pos 0)
    optimalPath: ["MIEL", "CIEL"],
    validWords: new Set([
      "MIEL", "CIEL", "FIEL", "MIEN", "MISE", "MINE", "MILE",
      "MIDI", "CITE", "CIRE", "CIME", "PIEL", "BIEL", "RIEL",
    ]),
    hint: "Honey becomes the sky...",
  },
  {
    number: 25,
    language: "fr",
    date: "2026-03-13",
    startWord: "FOND",
    targetWord: "FONT",
    par: 2,
    // FOND→FONT: D→T (pos 3)
    optimalPath: ["FOND", "FONT"],
    validWords: new Set([
      "FOND", "FONT", "FOIN", "FOIE", "FOIS", "FOLS", "BOND",
      "DONT", "ROND", "MONT", "PONT", "FONS",
    ]),
    hint: "The bottom becomes a spring...",
  },
  {
    number: 26,
    language: "fr",
    date: "2026-03-14",
    startWord: "NOIR",
    targetWord: "NOIX",
    par: 2,
    // NOIR→NOIX: R→X (pos 3)
    optimalPath: ["NOIR", "NOIX"],
    validWords: new Set([
      "NOIR", "NOIX", "NOIE", "NOIS", "VOIR", "SOIR",
      "MOIS", "BOIS", "FOIS", "LOIS", "DOIS", "VOIX", "FOIE",
    ]),
    hint: "Black cracks open a nut...",
  },
  {
    number: 27,
    language: "fr",
    date: "2026-03-15",
    startWord: "FAIM",
    targetWord: "PAIR",
    par: 3,
    // FAIM→FAIR: M→R (pos 3). FAIR→PAIR: F→P (pos 0)
    optimalPath: ["FAIM", "FAIR", "PAIR"],
    validWords: new Set([
      "FAIM", "FAIR", "PAIR", "FAIT", "FAIS", "FAIL", "FAIN", "PAIS",
      "PAIX", "PAIN", "LAIR", "HAIR", "VOIR", "SOIR", "BAIN", "GAIN",
    ]),
    hint: "Hunger plays fair, then comes in pairs...",
  },
  {
    number: 28,
    language: "fr",
    date: "2026-03-16",
    startWord: "FILS",
    targetWord: "FOUS",
    par: 3,
    // FILS→FOLS: I→O (pos 1). FOLS→FOUS: L→U (pos 2)
    optimalPath: ["FILS", "FOLS", "FOUS"],
    validWords: new Set([
      "FILS", "FOLS", "FOUS", "FINS", "FITS", "FIGS", "FOIS",
      "FOUR", "FOUL", "BOLS", "COLS", "MOLS",
    ]),
    hint: "Sons go crazy through folly...",
  },
  {
    number: 29,
    language: "fr",
    date: "2026-03-17",
    startWord: "DIRE",
    targetWord: "DORE",
    par: 2,
    // DIRE→DORE: I→O (pos 1)
    optimalPath: ["DIRE", "DORE"],
    validWords: new Set([
      "DIRE", "DORE", "DURE", "DAME", "DARE", "DOME", "DOSE", "DOTE",
      "DONE", "DINE", "DIVE", "LIRE", "RIRE", "TIRE",
    ]),
    hint: "To say becomes golden...",
  },
  {
    number: 30,
    language: "fr",
    date: "2026-03-18",
    startWord: "CAGE",
    targetWord: "CAVE",
    par: 2,
    // CAGE→CAVE: G→V (pos 2)
    optimalPath: ["CAGE", "CAVE"],
    validWords: new Set([
      "CAGE", "CAVE", "CAFE", "CAME", "CANE", "CAPE", "CARE", "CASE",
      "CALE", "CAKE", "CADE", "GAVE", "RAVE", "NAVE", "PAVE", "SAVE",
    ]),
    hint: "A cage opens into a cellar...",
  },
];
