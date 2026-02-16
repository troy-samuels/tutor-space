/**
 * False Friends / Deceptive Cognates database.
 * Words that look like English words but mean something different.
 * This is the signature mechanic for Lingua Connections.
 */

export interface FalseFriend {
  word: string;
  language: string;
  looksLike: string; // What English speakers think it means
  actualMeaning: string; // What it actually means
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  example?: string;
}

export const FALSE_FRIENDS: FalseFriend[] = [
  // === SPANISH ===
  { word: "actual", language: "es", looksLike: "actual", actualMeaning: "current, present", cefrLevel: "B1" },
  { word: "sensible", language: "es", looksLike: "sensible", actualMeaning: "sensitive", cefrLevel: "B1" },
  { word: "real", language: "es", looksLike: "real", actualMeaning: "royal", cefrLevel: "A2" },
  { word: "embarazada", language: "es", looksLike: "embarrassed", actualMeaning: "pregnant", cefrLevel: "B1" },
  { word: "éxito", language: "es", looksLike: "exit", actualMeaning: "success", cefrLevel: "A2" },
  { word: "librería", language: "es", looksLike: "library", actualMeaning: "bookshop", cefrLevel: "A2" },
  { word: "carpeta", language: "es", looksLike: "carpet", actualMeaning: "folder", cefrLevel: "B1" },
  { word: "constipado", language: "es", looksLike: "constipated", actualMeaning: "having a cold", cefrLevel: "B1" },
  { word: "bizarro", language: "es", looksLike: "bizarre", actualMeaning: "brave, gallant", cefrLevel: "C1" },
  { word: "largo", language: "es", looksLike: "large", actualMeaning: "long", cefrLevel: "A2" },
  { word: "asistir", language: "es", looksLike: "assist", actualMeaning: "to attend", cefrLevel: "B1" },
  { word: "recordar", language: "es", looksLike: "record", actualMeaning: "to remember", cefrLevel: "A2" },
  { word: "sopa", language: "es", looksLike: "soap", actualMeaning: "soup", cefrLevel: "A1" },
  { word: "ropa", language: "es", looksLike: "rope", actualMeaning: "clothes", cefrLevel: "A1" },
  { word: "realizar", language: "es", looksLike: "realise", actualMeaning: "to carry out, accomplish", cefrLevel: "B2" },
  { word: "pretender", language: "es", looksLike: "pretend", actualMeaning: "to try, to aim for", cefrLevel: "B2" },
  { word: "contestar", language: "es", looksLike: "contest", actualMeaning: "to answer", cefrLevel: "A2" },
  { word: "molestar", language: "es", looksLike: "molest", actualMeaning: "to bother, annoy", cefrLevel: "B1" },
  { word: "introducir", language: "es", looksLike: "introduce", actualMeaning: "to insert", cefrLevel: "B2" },
  { word: "fábrica", language: "es", looksLike: "fabric", actualMeaning: "factory", cefrLevel: "B1" },

  // === FRENCH ===
  { word: "actuellement", language: "fr", looksLike: "actually", actualMeaning: "currently", cefrLevel: "B1" },
  { word: "blessé", language: "fr", looksLike: "blessed", actualMeaning: "injured", cefrLevel: "B1" },
  { word: "attendre", language: "fr", looksLike: "attend", actualMeaning: "to wait", cefrLevel: "A2" },
  { word: "librairie", language: "fr", looksLike: "library", actualMeaning: "bookshop", cefrLevel: "A2" },
  { word: "monnaie", language: "fr", looksLike: "money", actualMeaning: "change (coins)", cefrLevel: "A2" },
  { word: "coin", language: "fr", looksLike: "coin", actualMeaning: "corner", cefrLevel: "A2" },
  { word: "figure", language: "fr", looksLike: "figure", actualMeaning: "face", cefrLevel: "B1" },
  { word: "journée", language: "fr", looksLike: "journey", actualMeaning: "day", cefrLevel: "A1" },
  { word: "raisin", language: "fr", looksLike: "raisin", actualMeaning: "grape", cefrLevel: "A2" },
  { word: "assister", language: "fr", looksLike: "assist", actualMeaning: "to attend, witness", cefrLevel: "B1" },
  { word: "entrée", language: "fr", looksLike: "entrée (main course)", actualMeaning: "starter, appetiser", cefrLevel: "A2" },
  { word: "préservatif", language: "fr", looksLike: "preservative", actualMeaning: "condom", cefrLevel: "B2" },
  { word: "regarder", language: "fr", looksLike: "regard", actualMeaning: "to watch, look at", cefrLevel: "A1" },
  { word: "bras", language: "fr", looksLike: "bra", actualMeaning: "arm", cefrLevel: "A1" },
  { word: "sale", language: "fr", looksLike: "sale", actualMeaning: "dirty", cefrLevel: "A2" },
  { word: "formidable", language: "fr", looksLike: "formidable", actualMeaning: "wonderful, great", cefrLevel: "B1" },
  { word: "chair", language: "fr", looksLike: "chair", actualMeaning: "flesh", cefrLevel: "B1" },
  { word: "prune", language: "fr", looksLike: "prune", actualMeaning: "plum", cefrLevel: "A2" },
  { word: "location", language: "fr", looksLike: "location", actualMeaning: "rental", cefrLevel: "B1" },
  { word: "résumer", language: "fr", looksLike: "resume", actualMeaning: "to summarise", cefrLevel: "B2" },

  // === GERMAN ===
  { word: "aktuell", language: "de", looksLike: "actual", actualMeaning: "current, up-to-date", cefrLevel: "B1" },
  { word: "bekommen", language: "de", looksLike: "become", actualMeaning: "to get, receive", cefrLevel: "A2" },
  { word: "Gift", language: "de", looksLike: "gift", actualMeaning: "poison", cefrLevel: "A2" },
  { word: "sensibel", language: "de", looksLike: "sensible", actualMeaning: "sensitive", cefrLevel: "B1" },
  { word: "Handy", language: "de", looksLike: "handy", actualMeaning: "mobile phone", cefrLevel: "A1" },
  { word: "Rock", language: "de", looksLike: "rock", actualMeaning: "skirt", cefrLevel: "A2" },
  { word: "Rat", language: "de", looksLike: "rat", actualMeaning: "advice, council", cefrLevel: "B1" },
  { word: "bald", language: "de", looksLike: "bald", actualMeaning: "soon", cefrLevel: "A1" },
  { word: "Gymnasium", language: "de", looksLike: "gymnasium", actualMeaning: "secondary school", cefrLevel: "A2" },
  { word: "Chef", language: "de", looksLike: "chef", actualMeaning: "boss", cefrLevel: "A2" },
  { word: "fast", language: "de", looksLike: "fast", actualMeaning: "almost", cefrLevel: "A2" },
  { word: "See", language: "de", looksLike: "see", actualMeaning: "lake (der) / sea (die)", cefrLevel: "A2" },
  { word: "Taste", language: "de", looksLike: "taste", actualMeaning: "key, button", cefrLevel: "B1" },
  { word: "Mist", language: "de", looksLike: "mist", actualMeaning: "manure, rubbish", cefrLevel: "B1" },
  { word: "Oldtimer", language: "de", looksLike: "old timer", actualMeaning: "vintage car", cefrLevel: "B2" },
  { word: "Smoking", language: "de", looksLike: "smoking", actualMeaning: "tuxedo", cefrLevel: "B2" },
  { word: "Brief", language: "de", looksLike: "brief", actualMeaning: "letter", cefrLevel: "A1" },
  { word: "Wand", language: "de", looksLike: "wand", actualMeaning: "wall", cefrLevel: "A1" },
  { word: "Kind", language: "de", looksLike: "kind", actualMeaning: "child", cefrLevel: "A1" },
  { word: "Fabrik", language: "de", looksLike: "fabric", actualMeaning: "factory", cefrLevel: "B1" },
];

/**
 * Get false friends for a specific language.
 */
export function getFalseFriends(language: string): FalseFriend[] {
  return FALSE_FRIENDS.filter((ff) => ff.language === language);
}

/**
 * Get false friends suitable for a given CEFR level and below.
 */
export function getFalseFriendsForLevel(
  language: string,
  maxLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
): FalseFriend[] {
  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const maxIdx = levelOrder.indexOf(maxLevel);
  return FALSE_FRIENDS.filter(
    (ff) => ff.language === language && levelOrder.indexOf(ff.cefrLevel) <= maxIdx
  );
}
