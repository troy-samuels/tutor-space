import { getV3RunSeed, makeRng, pick } from "./shared";

export interface ByteChoiceQuestion {
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  track: "recognition" | "false-friends";
  band: "A1" | "A2" | "B1" | "B2";
}

export interface ByteChoicePuzzle {
  gameSlug: "byte-choice";
  language: string;
  puzzleNumber: number;
  seed: number;
  questions: ByteChoiceQuestion[];
}

interface PoolRow {
  prompt: string;
  correct: string;
  distractors: [string, string];
  band: "A1" | "A2" | "B1" | "B2";
}

// ──────────────────────────────────────────────
// 50 EN→ES pairs across A1–B2 difficulty bands
// ──────────────────────────────────────────────
const EN_POOL: PoolRow[] = [
  // A1 — basic concrete nouns & common verbs
  { prompt: "cat", correct: "gato", distractors: ["gallo", "ganso"], band: "A1" },
  { prompt: "dog", correct: "perro", distractors: ["pera", "pero"], band: "A1" },
  { prompt: "house", correct: "casa", distractors: ["caza", "cama"], band: "A1" },
  { prompt: "water", correct: "agua", distractors: ["aguja", "ayuda"], band: "A1" },
  { prompt: "food", correct: "comida", distractors: ["camino", "cocina"], band: "A1" },
  { prompt: "sun", correct: "sol", distractors: ["sal", "sur"], band: "A1" },
  { prompt: "moon", correct: "luna", distractors: ["lupa", "lucha"], band: "A1" },
  { prompt: "bread", correct: "pan", distractors: ["paz", "par"], band: "A1" },
  { prompt: "milk", correct: "leche", distractors: ["lecho", "lente"], band: "A1" },
  { prompt: "red", correct: "rojo", distractors: ["roto", "roce"], band: "A1" },
  { prompt: "hand", correct: "mano", distractors: ["malo", "mayo"], band: "A1" },
  { prompt: "fish", correct: "pez", distractors: ["pie", "piel"], band: "A1" },

  // A2 — everyday vocabulary
  { prompt: "stair", correct: "escalera", distractors: ["estrella", "espejo"], band: "A2" },
  { prompt: "window", correct: "ventana", distractors: ["vecino", "viento"], band: "A2" },
  { prompt: "quiet", correct: "silencioso", distractors: ["soleado", "sincero"], band: "A2" },
  { prompt: "teacher", correct: "profesor", distractors: ["productor", "protector"], band: "A2" },
  { prompt: "river", correct: "río", distractors: ["ruido", "ritmo"], band: "A2" },
  { prompt: "market", correct: "mercado", distractors: ["marcado", "mensaje"], band: "A2" },
  { prompt: "library", correct: "biblioteca", distractors: ["biología", "bicicleta"], band: "A2" },
  { prompt: "answer", correct: "respuesta", distractors: ["receta", "reserva"], band: "A2" },
  { prompt: "street", correct: "calle", distractors: ["carne", "calvo"], band: "A2" },
  { prompt: "garden", correct: "jardín", distractors: ["jarrón", "jamón"], band: "A2" },
  { prompt: "kitchen", correct: "cocina", distractors: ["colina", "cortina"], band: "A2" },
  { prompt: "bridge", correct: "puente", distractors: ["pueblo", "puerta"], band: "A2" },
  { prompt: "happy", correct: "feliz", distractors: ["feroz", "fácil"], band: "A2" },
  { prompt: "shirt", correct: "camisa", distractors: ["camino", "canción"], band: "A2" },

  // B1 — intermediate / abstract
  { prompt: "dream", correct: "sueño", distractors: ["suelo", "sudor"], band: "B1" },
  { prompt: "freedom", correct: "libertad", distractors: ["libreta", "ligereza"], band: "B1" },
  { prompt: "danger", correct: "peligro", distractors: ["pelícano", "peluquero"], band: "B1" },
  { prompt: "knowledge", correct: "conocimiento", distractors: ["consentimiento", "comportamiento"], band: "B1" },
  { prompt: "strength", correct: "fuerza", distractors: ["fiesta", "frontera"], band: "B1" },
  { prompt: "journey", correct: "viaje", distractors: ["vinagre", "viraje"], band: "B1" },
  { prompt: "mistake", correct: "error", distractors: ["espejo", "esfuerzo"], band: "B1" },
  { prompt: "health", correct: "salud", distractors: ["salida", "salto"], band: "B1" },
  { prompt: "advice", correct: "consejo", distractors: ["conejo", "comercio"], band: "B1" },
  { prompt: "truth", correct: "verdad", distractors: ["ventaja", "velocidad"], band: "B1" },
  { prompt: "noise", correct: "ruido", distractors: ["rumbo", "rubio"], band: "B1" },
  { prompt: "choice", correct: "elección", distractors: ["emoción", "estación"], band: "B1" },
  { prompt: "speed", correct: "velocidad", distractors: ["voluntad", "vecindad"], band: "B1" },

  // B2 — advanced / nuanced
  { prompt: "development", correct: "desarrollo", distractors: ["descanso", "descuento"], band: "B2" },
  { prompt: "environment", correct: "medio ambiente", distractors: ["momento", "movimiento"], band: "B2" },
  { prompt: "achievement", correct: "logro", distractors: ["lujo", "ladrón"], band: "B2" },
  { prompt: "behaviour", correct: "comportamiento", distractors: ["compartimiento", "compromiso"], band: "B2" },
  { prompt: "improvement", correct: "mejora", distractors: ["memoria", "mentira"], band: "B2" },
  { prompt: "threat", correct: "amenaza", distractors: ["alianza", "amargura"], band: "B2" },
  { prompt: "welfare", correct: "bienestar", distractors: ["bienvenida", "bisagra"], band: "B2" },
  { prompt: "shelter", correct: "refugio", distractors: ["reflejo", "registro"], band: "B2" },
  { prompt: "deadline", correct: "plazo", distractors: ["plaza", "plástico"], band: "B2" },
  { prompt: "outcome", correct: "resultado", distractors: ["respaldo", "recuerdo"], band: "B2" },
  { prompt: "overview", correct: "resumen", distractors: ["recurso", "reclamo"], band: "B2" },
  { prompt: "purpose", correct: "propósito", distractors: ["protocolo", "pronóstico"], band: "B2" },
];

// ──────────────────────────────────────────────
// 50 ES→EN pairs (reverse direction)
// ──────────────────────────────────────────────
const ES_POOL: PoolRow[] = [
  // A1
  { prompt: "gato", correct: "cat", distractors: ["cut", "cap"], band: "A1" },
  { prompt: "perro", correct: "dog", distractors: ["dig", "dot"], band: "A1" },
  { prompt: "casa", correct: "house", distractors: ["horse", "hose"], band: "A1" },
  { prompt: "agua", correct: "water", distractors: ["winter", "wafer"], band: "A1" },
  { prompt: "comida", correct: "food", distractors: ["flood", "foot"], band: "A1" },
  { prompt: "sol", correct: "sun", distractors: ["son", "sum"], band: "A1" },
  { prompt: "luna", correct: "moon", distractors: ["mood", "moan"], band: "A1" },
  { prompt: "pan", correct: "bread", distractors: ["break", "brain"], band: "A1" },
  { prompt: "leche", correct: "milk", distractors: ["mint", "mild"], band: "A1" },
  { prompt: "rojo", correct: "red", distractors: ["rod", "rid"], band: "A1" },
  { prompt: "mano", correct: "hand", distractors: ["hard", "hang"], band: "A1" },
  { prompt: "pez", correct: "fish", distractors: ["fist", "fill"], band: "A1" },

  // A2
  { prompt: "escalera", correct: "stair", distractors: ["star", "screen"], band: "A2" },
  { prompt: "ventana", correct: "window", distractors: ["winter", "wisdom"], band: "A2" },
  { prompt: "silencioso", correct: "quiet", distractors: ["quick", "quite"], band: "A2" },
  { prompt: "profesor", correct: "teacher", distractors: ["producer", "protector"], band: "A2" },
  { prompt: "río", correct: "river", distractors: ["rhythm", "rain"], band: "A2" },
  { prompt: "mercado", correct: "market", distractors: ["message", "marker"], band: "A2" },
  { prompt: "biblioteca", correct: "library", distractors: ["bicycle", "biology"], band: "A2" },
  { prompt: "respuesta", correct: "answer", distractors: ["result", "recipe"], band: "A2" },
  { prompt: "calle", correct: "street", distractors: ["stream", "strong"], band: "A2" },
  { prompt: "jardín", correct: "garden", distractors: ["garlic", "gather"], band: "A2" },
  { prompt: "cocina", correct: "kitchen", distractors: ["kitten", "kingdom"], band: "A2" },
  { prompt: "puente", correct: "bridge", distractors: ["branch", "bright"], band: "A2" },
  { prompt: "feliz", correct: "happy", distractors: ["hardly", "hasty"], band: "A2" },
  { prompt: "camisa", correct: "shirt", distractors: ["shift", "shelf"], band: "A2" },

  // B1
  { prompt: "sueño", correct: "dream", distractors: ["drain", "drift"], band: "B1" },
  { prompt: "libertad", correct: "freedom", distractors: ["frequent", "fraction"], band: "B1" },
  { prompt: "peligro", correct: "danger", distractors: ["dancer", "dagger"], band: "B1" },
  { prompt: "conocimiento", correct: "knowledge", distractors: ["kindness", "knighthood"], band: "B1" },
  { prompt: "fuerza", correct: "strength", distractors: ["stretch", "strategy"], band: "B1" },
  { prompt: "viaje", correct: "journey", distractors: ["journal", "junior"], band: "B1" },
  { prompt: "error", correct: "mistake", distractors: ["misplace", "mixture"], band: "B1" },
  { prompt: "salud", correct: "health", distractors: ["wealth", "heaven"], band: "B1" },
  { prompt: "consejo", correct: "advice", distractors: ["advance", "advent"], band: "B1" },
  { prompt: "verdad", correct: "truth", distractors: ["trust", "trace"], band: "B1" },
  { prompt: "ruido", correct: "noise", distractors: ["nerve", "north"], band: "B1" },
  { prompt: "elección", correct: "choice", distractors: ["chance", "change"], band: "B1" },
  { prompt: "velocidad", correct: "speed", distractors: ["speech", "spirit"], band: "B1" },

  // B2
  { prompt: "desarrollo", correct: "development", distractors: ["department", "deployment"], band: "B2" },
  { prompt: "medio ambiente", correct: "environment", distractors: ["equipment", "engagement"], band: "B2" },
  { prompt: "logro", correct: "achievement", distractors: ["attachment", "agreement"], band: "B2" },
  { prompt: "comportamiento", correct: "behaviour", distractors: ["basement", "boundary"], band: "B2" },
  { prompt: "mejora", correct: "improvement", distractors: ["impression", "implement"], band: "B2" },
  { prompt: "amenaza", correct: "threat", distractors: ["thread", "throne"], band: "B2" },
  { prompt: "bienestar", correct: "welfare", distractors: ["warfare", "warehouse"], band: "B2" },
  { prompt: "refugio", correct: "shelter", distractors: ["shatter", "shoulder"], band: "B2" },
  { prompt: "plazo", correct: "deadline", distractors: ["headline", "decline"], band: "B2" },
  { prompt: "resultado", correct: "outcome", distractors: ["outline", "outlook"], band: "B2" },
  { prompt: "resumen", correct: "overview", distractors: ["overlap", "overcome"], band: "B2" },
  { prompt: "propósito", correct: "purpose", distractors: ["pursuit", "premise"], band: "B2" },
];

const QUESTIONS_PER_ROUND = 10;

export function getByteChoicePuzzle(
  language: "en" | "es",
  seedOverride?: number | null,
  cefr?: "A1" | "A2" | "B1" | "B2" | null,
): ByteChoicePuzzle {
  const { seed, puzzleNumber } = getV3RunSeed("byte-choice", language, seedOverride);
  const rng = makeRng(seed);
  const pool = language === "es" ? ES_POOL : EN_POOL;

  // Build a weighted pool if CEFR is specified
  const BANDS: Array<"A1" | "A2" | "B1" | "B2"> = ["A1", "A2", "B1", "B2"];

  function buildWeightedPool(): PoolRow[] {
    if (!cefr) return [...pool];

    const bandIndex = BANDS.indexOf(cefr);
    const byBand: Record<string, PoolRow[]> = { A1: [], A2: [], B1: [], B2: [] };
    for (const row of pool) {
      byBand[row.band].push(row);
    }

    // Determine weights based on position
    let weights: Record<string, number>;
    if (bandIndex === 0) {
      // A1: 75% A1, 25% A2
      weights = { A1: 75, A2: 25, B1: 0, B2: 0 };
    } else if (bandIndex === BANDS.length - 1) {
      // B2: 25% B1, 75% B2
      weights = { A1: 0, A2: 0, B1: 25, B2: 75 };
    } else {
      // Middle bands: 60% target, 25% one below, 15% one above
      weights = { A1: 0, A2: 0, B1: 0, B2: 0 };
      weights[cefr] = 60;
      weights[BANDS[bandIndex - 1]] = 25;
      weights[BANDS[bandIndex + 1]] = 15;
    }

    // Build weighted pool by repeating rows proportionally
    const weighted: PoolRow[] = [];
    for (const band of BANDS) {
      const w = weights[band];
      if (w > 0 && byBand[band].length > 0) {
        // Add each row from this band `w` times for weighting
        for (const row of byBand[band]) {
          for (let j = 0; j < w; j++) {
            weighted.push(row);
          }
        }
      }
    }

    return weighted.length > 0 ? weighted : [...pool];
  }

  const weightedPool = buildWeightedPool();

  // Pick questions
  const usedPrompts = new Set<string>();
  const questions: ByteChoiceQuestion[] = [];

  for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
    let row: PoolRow;
    let attempts = 0;
    do {
      row = pick(weightedPool, rng);
      attempts++;
    } while (usedPrompts.has(row.prompt) && attempts < 60);
    usedPrompts.add(row.prompt);

    const optionBag = [row.correct, ...row.distractors] as const;
    const shuffled = [...optionBag].sort(() => rng() - 0.5) as [string, string, string];
    const correctIndex = shuffled.findIndex((value) => value === row.correct) as 0 | 1 | 2;

    questions.push({
      prompt: row.prompt,
      options: shuffled,
      correctIndex,
      track: row.distractors.some((d) => d.startsWith(row.correct.slice(0, 2)))
        ? "false-friends"
        : "recognition",
      band: row.band,
    });
  }

  return {
    gameSlug: "byte-choice",
    language,
    puzzleNumber,
    seed,
    questions,
  };
}
