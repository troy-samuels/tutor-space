import { getV3RunSeed, makeRng } from "./shared";

export interface PixelPairTile {
  id: string;
  value: string;
  pairId: string;
  kind: "left" | "right";
}

export interface PixelPairsPuzzle {
  gameSlug: "pixel-pairs";
  language: string;
  puzzleNumber: number;
  seed: number;
  pairCount: number;
  tiles: PixelPairTile[];
}

// ──────────────────────────────────────────────
// 30 EN→ES pairs for memory matching
// ──────────────────────────────────────────────
const EN_PAIRS: [string, string][] = [
  ["water", "agua"],
  ["window", "ventana"],
  ["book", "libro"],
  ["garden", "jardín"],
  ["answer", "respuesta"],
  ["street", "calle"],
  ["cat", "gato"],
  ["dog", "perro"],
  ["house", "casa"],
  ["sun", "sol"],
  ["moon", "luna"],
  ["bread", "pan"],
  ["milk", "leche"],
  ["fish", "pez"],
  ["hand", "mano"],
  ["tree", "árbol"],
  ["chair", "silla"],
  ["door", "puerta"],
  ["cloud", "nube"],
  ["fire", "fuego"],
  ["star", "estrella"],
  ["flower", "flor"],
  ["bird", "pájaro"],
  ["river", "río"],
  ["bridge", "puente"],
  ["dream", "sueño"],
  ["heart", "corazón"],
  ["king", "rey"],
  ["night", "noche"],
  ["rain", "lluvia"],
];

// ──────────────────────────────────────────────
// 30 ES→EN pairs (reversed)
// ──────────────────────────────────────────────
const ES_PAIRS: [string, string][] = [
  ["agua", "water"],
  ["ventana", "window"],
  ["libro", "book"],
  ["jardín", "garden"],
  ["respuesta", "answer"],
  ["calle", "street"],
  ["gato", "cat"],
  ["perro", "dog"],
  ["casa", "house"],
  ["sol", "sun"],
  ["luna", "moon"],
  ["pan", "bread"],
  ["leche", "milk"],
  ["pez", "fish"],
  ["mano", "hand"],
  ["árbol", "tree"],
  ["silla", "chair"],
  ["puerta", "door"],
  ["nube", "cloud"],
  ["fuego", "fire"],
  ["estrella", "star"],
  ["flor", "flower"],
  ["pájaro", "bird"],
  ["río", "river"],
  ["puente", "bridge"],
  ["sueño", "dream"],
  ["corazón", "heart"],
  ["rey", "king"],
  ["noche", "night"],
  ["lluvia", "rain"],
];

/**
 * Grid sizes by difficulty:
 *  - 6 pairs → 3×4 grid (beginner)
 *  - 8 pairs → 4×4 grid (standard)
 *  - 10 pairs → 4×5 grid (advanced)
 */
export type GridSize = 6 | 8 | 10;

export function getPixelPairsPuzzle(
  language: "en" | "es",
  seedOverride?: number | null,
  pairCount: GridSize = 8,
): PixelPairsPuzzle {
  const { seed, puzzleNumber } = getV3RunSeed("pixel-pairs", language, seedOverride);
  const rng = makeRng(seed);
  const source = language === "es" ? ES_PAIRS : EN_PAIRS;

  const chosen = [...source].sort(() => rng() - 0.5).slice(0, pairCount);
  const tiles: PixelPairTile[] = [];

  for (const [left, right] of chosen) {
    const pairId = `${left}-${right}`;
    tiles.push({ id: `${pairId}-l`, value: left, pairId, kind: "left" });
    tiles.push({ id: `${pairId}-r`, value: right, pairId, kind: "right" });
  }

  const shuffled = tiles.sort(() => rng() - 0.5);

  return {
    gameSlug: "pixel-pairs",
    language,
    puzzleNumber,
    seed,
    pairCount,
    tiles: shuffled,
  };
}
