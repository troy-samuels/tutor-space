import { getV3RunSeed, makeRng } from "./shared";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CefrTier = "A1" | "A2" | "B1" | "B2";

export interface WordEntry {
  /** The target-language word (lowercase, with accents) */
  word: string;
  /** English meaning shown as the clue */
  clue: string;
  /** CEFR difficulty tier */
  cefr: CefrTier;
  /** Semantic category for progressive hints */
  category: string;
  /** Example sentence with the word replaced by ___ */
  example: string;
  /** Related words for the post-solve learning moment */
  related: string[];
}

export interface LinguaWordlePuzzle {
  gameSlug: "lingua-wordle";
  language: string;
  puzzleNumber: number;
  seed: number;
  entry: WordEntry;
}

// ─────────────────────────────────────────────
// Spanish word bank — curated for learning value
//
// Design principles:
// 1. Every word teaches something useful
// 2. Distractors within each length bracket exist
//    (multiple 5-letter words, multiple 6-letter, etc.)
// 3. Categories spread across daily life
// 4. Examples show natural usage, not textbook sentences
// 5. Related words build vocabulary clusters
// ─────────────────────────────────────────────

const ES_WORDS: WordEntry[] = [
  // ── A1: Common, short, concrete ──
  { word: "gato", clue: "cat", cefr: "A1", category: "animals", example: "El ___ duerme en el sofá", related: ["gata", "gatito", "maullar"] },
  { word: "perro", clue: "dog", cefr: "A1", category: "animals", example: "Mi ___ juega en el parque", related: ["perra", "perrito", "ladrar"] },
  { word: "casa", clue: "house", cefr: "A1", category: "home", example: "Vivo en una ___ grande", related: ["casita", "hogar", "vivir"] },
  { word: "agua", clue: "water", cefr: "A1", category: "food & drink", example: "Quiero un vaso de ___", related: ["sed", "beber", "río"] },
  { word: "mesa", clue: "table", cefr: "A1", category: "furniture", example: "Pon el plato en la ___", related: ["silla", "mueble", "comer"] },
  { word: "libro", clue: "book", cefr: "A1", category: "objects", example: "Estoy leyendo un ___ muy bueno", related: ["leer", "página", "librería"] },
  { word: "verde", clue: "green", cefr: "A1", category: "colours", example: "Me gusta el color ___", related: ["rojo", "azul", "color"] },
  { word: "playa", clue: "beach", cefr: "A1", category: "places", example: "Vamos a la ___ este verano", related: ["arena", "mar", "sol"] },
  { word: "leche", clue: "milk", cefr: "A1", category: "food & drink", example: "Tomo café con ___", related: ["vaca", "queso", "yogur"] },
  { word: "noche", clue: "night", cefr: "A1", category: "time", example: "Buenas ___, hasta mañana", related: ["día", "dormir", "luna"] },
  { word: "padre", clue: "father", cefr: "A1", category: "family", example: "Mi ___ trabaja en Madrid", related: ["madre", "hijo", "familia"] },
  { word: "amigo", clue: "friend", cefr: "A1", category: "people", example: "Él es mi mejor ___", related: ["amiga", "amistad", "conocer"] },
  { word: "tienda", clue: "shop", cefr: "A1", category: "places", example: "Compré esto en la ___", related: ["comprar", "vender", "precio"] },
  { word: "calle", clue: "street", cefr: "A1", category: "places", example: "Vivo en esta ___", related: ["avenida", "camino", "ciudad"] },
  { word: "mundo", clue: "world", cefr: "A1", category: "general", example: "Es el mejor café del ___", related: ["tierra", "país", "global"] },

  // ── A2: Slightly harder, still concrete ──
  { word: "cocina", clue: "kitchen", cefr: "A2", category: "rooms", example: "Estoy preparando la cena en la ___", related: ["cocinar", "cocinero", "receta"] },
  { word: "ventana", clue: "window", cefr: "A2", category: "home", example: "Abre la ___, hace calor", related: ["puerta", "abrir", "luz"] },
  { word: "trabajo", clue: "work / job", cefr: "A2", category: "work", example: "Tengo mucho ___ esta semana", related: ["trabajar", "oficina", "jefe"] },
  { word: "camino", clue: "path / way", cefr: "A2", category: "places", example: "Este ___ lleva al pueblo", related: ["andar", "ruta", "paseo"] },
  { word: "pueblo", clue: "village / town", cefr: "A2", category: "places", example: "Mi ___ es muy pequeño", related: ["ciudad", "aldea", "vecino"] },
  { word: "comida", clue: "food / meal", cefr: "A2", category: "food & drink", example: "La ___ española es deliciosa", related: ["comer", "cena", "plato"] },
  { word: "puerta", clue: "door", cefr: "A2", category: "home", example: "Alguien llama a la ___", related: ["abrir", "cerrar", "llave"] },
  { word: "lluvia", clue: "rain", cefr: "A2", category: "weather", example: "Hoy hay mucha ___", related: ["llover", "paraguas", "nube"] },
  { word: "piedra", clue: "stone / rock", cefr: "A2", category: "nature", example: "Se sentó sobre una ___", related: ["roca", "tierra", "duro"] },
  { word: "cuerpo", clue: "body", cefr: "A2", category: "body", example: "El ___ humano es increíble", related: ["cabeza", "mano", "salud"] },
  { word: "dinero", clue: "money", cefr: "A2", category: "finance", example: "No tengo ___ suficiente", related: ["pagar", "banco", "precio"] },
  { word: "guerra", clue: "war", cefr: "A2", category: "general", example: "La ___ terminó hace años", related: ["paz", "soldado", "batalla"] },
  { word: "fuerza", clue: "strength / force", cefr: "A2", category: "body", example: "Necesitas ___ para esto", related: ["fuerte", "poder", "débil"] },
  { word: "lengua", clue: "tongue / language", cefr: "A2", category: "body", example: "El español es una ___ hermosa", related: ["idioma", "hablar", "palabra"] },
  { word: "helado", clue: "ice cream", cefr: "A2", category: "food & drink", example: "Quiero un ___ de chocolate", related: ["frío", "sabor", "dulce"] },

  // ── B1: Abstract, longer, more nuanced ──
  { word: "libertad", clue: "freedom", cefr: "B1", category: "abstract", example: "La ___ es un derecho fundamental", related: ["libre", "liberar", "derecho"] },
  { word: "consejo", clue: "advice", cefr: "B1", category: "communication", example: "Te voy a dar un buen ___", related: ["aconsejar", "recomendar", "sugerencia"] },
  { word: "recuerdo", clue: "memory / souvenir", cefr: "B1", category: "abstract", example: "Tengo un buen ___ de ese viaje", related: ["recordar", "olvidar", "memoria"] },
  { word: "sombrero", clue: "hat", cefr: "B1", category: "clothing", example: "Usa un ___ para el sol", related: ["gorro", "sombra", "cabeza"] },
  { word: "problema", clue: "problem", cefr: "B1", category: "general", example: "Hay un ___ con el sistema", related: ["solución", "resolver", "dificultad"] },
  { word: "pregunta", clue: "question", cefr: "B1", category: "communication", example: "Tengo una ___ importante", related: ["preguntar", "respuesta", "duda"] },
  { word: "cantidad", clue: "quantity / amount", cefr: "B1", category: "general", example: "Necesitamos una gran ___", related: ["mucho", "número", "total"] },
  { word: "gobierno", clue: "government", cefr: "B1", category: "politics", example: "El ___ aprobó la nueva ley", related: ["gobernar", "presidente", "política"] },
  { word: "silencio", clue: "silence", cefr: "B1", category: "abstract", example: "El ___ en la sala era total", related: ["silencioso", "callado", "ruido"] },
  { word: "equipaje", clue: "luggage", cefr: "B1", category: "travel", example: "No olvides tu ___", related: ["maleta", "viajar", "avión"] },
  { word: "sencillo", clue: "simple / easy", cefr: "B1", category: "general", example: "La solución es muy ___", related: ["fácil", "complejo", "básico"] },
  { word: "tormenta", clue: "storm", cefr: "B1", category: "weather", example: "Viene una ___ esta noche", related: ["trueno", "rayo", "lluvia"] },
  { word: "pescado", clue: "fish (food)", cefr: "B1", category: "food & drink", example: "El ___ fresco es delicioso", related: ["pescar", "mar", "comer"] },
  { word: "escalera", clue: "stairs / ladder", cefr: "B1", category: "home", example: "Sube por la ___", related: ["subir", "bajar", "piso"] },
  { word: "caballo", clue: "horse", cefr: "B1", category: "animals", example: "Montó a ___ por el campo", related: ["yegua", "montar", "jinete"] },

  // ── B2: Nuanced, abstract, longer ──
  { word: "esperanza", clue: "hope", cefr: "B2", category: "abstract", example: "Nunca pierdas la ___", related: ["esperar", "deseo", "optimismo"] },
  { word: "confianza", clue: "trust / confidence", cefr: "B2", category: "abstract", example: "La ___ se gana con el tiempo", related: ["confiar", "seguridad", "fe"] },
  { word: "desarrollo", clue: "development", cefr: "B2", category: "general", example: "El ___ del proyecto va bien", related: ["desarrollar", "crecer", "progreso"] },
  { word: "resultado", clue: "result / outcome", cefr: "B2", category: "general", example: "El ___ del examen fue bueno", related: ["resultar", "final", "efecto"] },
  { word: "costumbre", clue: "custom / habit", cefr: "B2", category: "culture", example: "Es una ___ de mi país", related: ["tradición", "hábito", "cultura"] },
  { word: "naturaleza", clue: "nature", cefr: "B2", category: "nature", example: "Me encanta estar en la ___", related: ["natural", "bosque", "animal"] },
  { word: "sufrimiento", clue: "suffering", cefr: "B2", category: "abstract", example: "Hay mucho ___ en el mundo", related: ["sufrir", "dolor", "pena"] },
  { word: "advertencia", clue: "warning", cefr: "B2", category: "communication", example: "Ignóró la ___ del médico", related: ["advertir", "peligro", "aviso"] },
  { word: "conocimiento", clue: "knowledge", cefr: "B2", category: "abstract", example: "El ___ es poder", related: ["conocer", "saber", "aprender"] },
  { word: "descubrimiento", clue: "discovery", cefr: "B2", category: "general", example: "Fue un ___ importante", related: ["descubrir", "explorar", "encontrar"] },
];

// ─────────────────────────────────────────────
// Puzzle generation
// ─────────────────────────────────────────────

const WORDS_BY_LANG: Record<string, WordEntry[]> = {
  es: ES_WORDS,
};

export function getLinguaWordlePuzzle(
  language: string,
  cefr: CefrTier | null,
  seedOverride?: number | null,
): LinguaWordlePuzzle {
  const { seed, puzzleNumber } = getV3RunSeed("lingua-wordle", language, seedOverride);
  const rng = makeRng(seed);
  const allWords = WORDS_BY_LANG[language] ?? WORDS_BY_LANG.es!;

  // Filter by CEFR if specified, otherwise pick from full pool
  const pool = cefr
    ? allWords.filter((w) => w.cefr === cefr)
    : allWords;

  // Deterministic selection based on seed
  const idx = Math.floor(rng() * pool.length);
  const entry = pool[idx]!;

  return {
    gameSlug: "lingua-wordle",
    language,
    puzzleNumber,
    seed,
    entry,
  };
}

/** Get the target language's special characters for the keyboard */
export function getSpecialKeys(language: string): string[] {
  switch (language) {
    case "es": return ["ñ", "á", "é", "í", "ó", "ú"];
    case "fr": return ["é", "è", "ê", "ë", "à", "â", "ç", "ù", "û", "ô", "î", "ï"];
    case "de": return ["ä", "ö", "ü", "ß"];
    case "it": return ["à", "è", "é", "ì", "ò", "ù"];
    case "pt": return ["ã", "õ", "á", "é", "í", "ó", "ú", "â", "ê", "ô", "ç"];
    default: return [];
  }
}

/**
 * Normalise a letter by stripping accents.
 * Used in lenient mode: "é" → "e", "ñ" → "n"
 */
export function normaliseLetter(letter: string): string {
  return letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Evaluate a guess against the answer.
 * Returns an array of 'correct' | 'present' | 'absent' for each letter.
 *
 * Uses the standard Wordle algorithm:
 * 1. First pass: mark exact matches (green)
 * 2. Second pass: mark present-but-wrong-position (yellow), respecting letter frequency
 *
 * Accent handling:
 * - Lenient mode (default): strip accents before comparing
 * - Strict mode: accents must match exactly
 */
export type TileState = "correct" | "present" | "absent";

export function evaluateGuess(
  guess: string,
  answer: string,
  strict = false,
): TileState[] {
  const g = [...guess.toLowerCase()];
  const a = [...answer.toLowerCase()];
  const result: TileState[] = new Array(g.length).fill("absent");

  // Normalise for comparison if lenient
  const gComp = strict ? g : g.map(normaliseLetter);
  const aComp = strict ? a : a.map(normaliseLetter);

  // Track which answer letters have been "used"
  const used = new Array(a.length).fill(false);

  // Pass 1: exact matches (green)
  for (let i = 0; i < g.length; i++) {
    if (gComp[i] === aComp[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Pass 2: present but wrong position (yellow)
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < a.length; j++) {
      if (!used[j] && gComp[i] === aComp[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}
