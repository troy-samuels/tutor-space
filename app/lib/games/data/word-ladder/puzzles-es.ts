import type { WordLadderPuzzle } from "./types";

/**
 * Spanish Word Ladder puzzles.
 * All words are 4 letters, common Spanish vocabulary.
 */
export const PUZZLES_ES: WordLadderPuzzle[] = [
  {
    number: 1,
    language: "es",
    date: "2026-02-17",
    startWord: "CASA",
    targetWord: "CAPA",
    par: 3,
    optimalPath: ["CASA", "COSA", "COPA", "CAPA"],
    validWords: new Set([
      "CASA", "COSA", "COPA", "CAPA", "CASO", "COSO", "CANA", "CARA",
      "CAMA", "CALA", "CADA", "CAZA", "CAVA", "CATA", "COFA", "COLA",
      "CODA", "COMA", "COTA", "CORA", "COMO", "CODO", "CONO", "COJO",
    ]),
    hint: "Think about containers and coverings...",
  },
  {
    number: 2,
    language: "es",
    date: "2026-02-18",
    startWord: "PATO",
    targetWord: "PALA",
    par: 3,
    optimalPath: ["PATO", "PALO", "PALA"],
    validWords: new Set([
      "PATO", "PALO", "PALA", "PACO", "PAGO", "PAVO", "PASO", "PATA",
      "PANA", "PAPA", "PARA", "PASA", "PARO", "PARO", "PARO",
    ]),
    hint: "A duck starts you off, a shovel finishes...",
  },
  {
    number: 3,
    language: "es",
    date: "2026-02-19",
    startWord: "MESA",
    targetWord: "MURO",
    par: 4,
    optimalPath: ["MESA", "MUSA", "MURO"],
    validWords: new Set([
      "MESA", "MUSA", "MURO", "MISA", "MASA", "MASO", "MANO", "MALO",
      "MAPA", "MARA", "MARCA", "MUDO", "MUGO", "MULO", "MULA", "META",
      "MORA", "MODA", "MOTA", "MOZA", "MOFA",
    ]),
    hint: "Inspiration is the bridge between furniture and walls...",
  },
  {
    number: 4,
    language: "es",
    date: "2026-02-20",
    startWord: "LUNA",
    targetWord: "LOCA",
    par: 3,
    optimalPath: ["LUNA", "LONA", "LOCA"],
    validWords: new Set([
      "LUNA", "LONA", "LOCA", "LUPA", "LURA", "LUGA", "LUCA", "LUDA",
      "LIGA", "LIRA", "LIMA", "LILA", "LOMA", "LOBA", "LOTA", "LOZA",
      "LOSA", "LOMA",
    ]),
    hint: "From the moon to madness in just a few steps...",
  },
  {
    number: 5,
    language: "es",
    date: "2026-02-21",
    startWord: "ROPA",
    targetWord: "ROSA",
    par: 2,
    optimalPath: ["ROPA", "ROSA"],
    validWords: new Set([
      "ROPA", "ROSA", "ROCA", "ROTA", "ROMA", "RODA", "ROJA", "ROÑA",
      "ROZA", "RISA", "RICA", "RINA",
    ]),
    hint: "Clothes become a flower with one simple change...",
  },
  {
    number: 6,
    language: "es",
    date: "2026-02-22",
    startWord: "GATO",
    targetWord: "GANA",
    par: 3,
    optimalPath: ["GATO", "GATA", "GANA"],
    validWords: new Set([
      "GATO", "GATA", "GANA", "GAMA", "GASA", "GALA", "GAFA", "GAGO",
      "GAJO", "GALO", "GAMO", "GAPO",
    ]),
    hint: "From a cat to winning, with a feminine twist...",
  },
  {
    number: 7,
    language: "es",
    date: "2026-02-23",
    startWord: "PELO",
    targetWord: "PESO",
    par: 2,
    optimalPath: ["PELO", "PESO"],
    validWords: new Set([
      "PELO", "PESO", "PECO", "PEGO", "PEDO", "PERO", "PENO", "PETO",
      "PEÓN", "PENA", "PERA", "PESA", "PEGA",
    ]),
    hint: "Hair and weight differ by just one letter...",
  },
  {
    number: 8,
    language: "es",
    date: "2026-02-24",
    startWord: "VIDA",
    targetWord: "VINO",
    par: 3,
    optimalPath: ["VIDA", "VINA", "VINO"],
    validWords: new Set([
      "VIDA", "VINA", "VINO", "VIGA", "VISA", "VIVA", "VIÑA", "VIRA",
      "VILO", "VISO",
    ]),
    hint: "Life leads to wine through a vineyard...",
  },
];
