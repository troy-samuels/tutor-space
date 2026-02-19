import { getV3RunSeed, makeRng, pick } from "./shared";

export interface RelayWave {
  clue: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  track: "speed" | "context";
}

export interface RelaySprintPuzzle {
  gameSlug: "relay-sprint";
  language: string;
  puzzleNumber: number;
  seed: number;
  waves: RelayWave[];
}

// ──────────────────────────────────────────────
// 35 EN→ES rows: [clue, correct, distractor1, distractor2]
// ──────────────────────────────────────────────
const EN_ROWS: [string, string, string, string][] = [
  ["stair", "escalera", "estrella", "espejo"],
  ["window", "ventana", "vecino", "verano"],
  ["river", "río", "ruido", "ritmo"],
  ["market", "mercado", "mensaje", "marcado"],
  ["teacher", "profesor", "productor", "protector"],
  ["quiet", "silencioso", "soleado", "sincero"],
  ["cat", "gato", "gallo", "ganso"],
  ["dog", "perro", "pera", "pero"],
  ["house", "casa", "caza", "cama"],
  ["sun", "sol", "sal", "sur"],
  ["moon", "luna", "lupa", "lucha"],
  ["bread", "pan", "paz", "par"],
  ["milk", "leche", "lecho", "lente"],
  ["hand", "mano", "malo", "mayo"],
  ["fish", "pez", "pie", "piel"],
  ["dream", "sueño", "suelo", "sudor"],
  ["freedom", "libertad", "libreta", "ligereza"],
  ["danger", "peligro", "pelícano", "peluquero"],
  ["strength", "fuerza", "fiesta", "frontera"],
  ["journey", "viaje", "vinagre", "viraje"],
  ["health", "salud", "salida", "salto"],
  ["truth", "verdad", "ventaja", "velocidad"],
  ["noise", "ruido", "rumbo", "rubio"],
  ["speed", "velocidad", "voluntad", "vecindad"],
  ["garden", "jardín", "jarrón", "jamón"],
  ["kitchen", "cocina", "colina", "cortina"],
  ["bridge", "puente", "pueblo", "puerta"],
  ["happy", "feliz", "feroz", "fácil"],
  ["shirt", "camisa", "camino", "canción"],
  ["advice", "consejo", "conejo", "comercio"],
  ["choice", "elección", "emoción", "estación"],
  ["threat", "amenaza", "alianza", "amargura"],
  ["shelter", "refugio", "reflejo", "registro"],
  ["deadline", "plazo", "plaza", "plástico"],
  ["purpose", "propósito", "protocolo", "pronóstico"],
];

// ──────────────────────────────────────────────
// 35 ES→EN rows (reversed)
// ──────────────────────────────────────────────
const ES_ROWS: [string, string, string, string][] = [
  ["escalera", "stair", "star", "screen"],
  ["ventana", "window", "winter", "wisdom"],
  ["río", "river", "rain", "rhythm"],
  ["mercado", "market", "message", "marker"],
  ["profesor", "teacher", "producer", "protector"],
  ["silencioso", "quiet", "quick", "quite"],
  ["gato", "cat", "cut", "cap"],
  ["perro", "dog", "dig", "dot"],
  ["casa", "house", "horse", "hose"],
  ["sol", "sun", "son", "sum"],
  ["luna", "moon", "mood", "moan"],
  ["pan", "bread", "break", "brain"],
  ["leche", "milk", "mint", "mild"],
  ["mano", "hand", "hard", "hang"],
  ["pez", "fish", "fist", "fill"],
  ["sueño", "dream", "drain", "drift"],
  ["libertad", "freedom", "frequent", "fraction"],
  ["peligro", "danger", "dancer", "dagger"],
  ["fuerza", "strength", "stretch", "strategy"],
  ["viaje", "journey", "journal", "junior"],
  ["salud", "health", "wealth", "heaven"],
  ["verdad", "truth", "trust", "trace"],
  ["ruido", "noise", "nerve", "north"],
  ["velocidad", "speed", "speech", "spirit"],
  ["jardín", "garden", "garlic", "gather"],
  ["cocina", "kitchen", "kitten", "kingdom"],
  ["puente", "bridge", "branch", "bright"],
  ["feliz", "happy", "hardly", "hasty"],
  ["camisa", "shirt", "shift", "shelf"],
  ["consejo", "advice", "advance", "advent"],
  ["elección", "choice", "chance", "change"],
  ["amenaza", "threat", "thread", "throne"],
  ["refugio", "shelter", "shatter", "shoulder"],
  ["plazo", "deadline", "headline", "decline"],
  ["propósito", "purpose", "pursuit", "premise"],
];

export function getRelaySprintPuzzle(language: "en" | "es", seedOverride?: number | null): RelaySprintPuzzle {
  const { seed, puzzleNumber } = getV3RunSeed("relay-sprint", language, seedOverride);
  const rng = makeRng(seed);
  const rows = language === "es" ? ES_ROWS : EN_ROWS;

  const usedClues = new Set<string>();
  const waves: RelayWave[] = [];

  for (let i = 0; i < 16; i++) {
    let row: [string, string, string, string];
    let attempts = 0;
    do {
      row = pick(rows, rng);
      attempts++;
    } while (usedClues.has(row[0]) && attempts < 60);
    usedClues.add(row[0]);

    const [clue, correct, d1, d2] = row;
    const options = [correct, d1, d2].sort(() => rng() - 0.5) as [string, string, string];
    const correctIndex = options.findIndex((v) => v === correct) as 0 | 1 | 2;

    waves.push({
      clue,
      options,
      correctIndex,
      track: rng() > 0.5 ? "speed" : "context",
    });
  }

  return {
    gameSlug: "relay-sprint",
    language,
    puzzleNumber,
    seed,
    waves,
  };
}
