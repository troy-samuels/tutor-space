import type { ConnectionsPuzzle } from "./types";

/**
 * Spanish Lingua Connections puzzles.
 * Each puzzle has 4 categories of 4 words with lateral/deceptive groupings.
 */
export const PUZZLES_ES: ConnectionsPuzzle[] = [
  {
    number: 1,
    language: "es",
    date: "2026-02-17",
    categories: [
      {
        name: "Partes del cuerpo (Body parts)",
        words: ["brazo", "pierna", "cabeza", "mano"],
        difficulty: "yellow",
        explanation: "Basic body parts — brazo (arm), pierna (leg), cabeza (head), mano (hand).",
      },
      {
        name: "Falsos amigos — no significan lo que parecen (False friends)",
        words: ["éxito", "carpeta", "largo", "sopa"],
        difficulty: "green",
        explanation:
          "These look like English words but mean something different: éxito (success, not exit), carpeta (folder, not carpet), largo (long, not large), sopa (soup, not soap).",
        isFalseFriends: true,
      },
      {
        name: "En la cocina (In the kitchen)",
        words: ["cuchillo", "sartén", "horno", "nevera"],
        difficulty: "blue",
        explanation: "Kitchen items — cuchillo (knife), sartén (frying pan), horno (oven), nevera (fridge).",
      },
      {
        name: "Verbos que cambian de significado con 'se' (Verbs that change meaning with 'se')",
        words: ["acordar", "parecer", "quedar", "poner"],
        difficulty: "purple",
        explanation:
          "These verbs completely change meaning when made reflexive: acordar (to agree) vs acordarse (to remember), parecer (to seem) vs parecerse (to look like), quedar (to remain) vs quedarse (to stay), poner (to put) vs ponerse (to become/start).",
      },
    ],
    vibeClues: [
      "One group is full of impostors pretending to be English words...",
      "Two groups involve things you'd find below your neck and inside your house — but don't mix them up",
      "The hardest group? They're shapeshifters. Add two letters and they become different verbs entirely.",
    ],
  },
  {
    number: 2,
    language: "es",
    date: "2026-02-18",
    categories: [
      {
        name: "Colores (Colours)",
        words: ["rojo", "azul", "verde", "negro"],
        difficulty: "yellow",
        explanation: "Basic colours — rojo (red), azul (blue), verde (green), negro (black).",
      },
      {
        name: "Palabras que también son nombres propios (Words that are also names)",
        words: ["rosa", "blanca", "esperanza", "dolores"],
        difficulty: "green",
        explanation:
          "These are common nouns AND Spanish names: rosa (rose/pink), blanca (white), esperanza (hope), dolores (pains). The trap: rosa and blanca look like colours!",
      },
      {
        name: "En el aeropuerto (At the airport)",
        words: ["vuelo", "maleta", "pasaporte", "embarque"],
        difficulty: "blue",
        explanation: "Airport vocabulary — vuelo (flight), maleta (suitcase), pasaporte (passport), embarque (boarding).",
      },
      {
        name: "Expresiones con 'dar' (Expressions with 'dar')",
        words: ["ganas", "cuenta", "igual", "miedo"],
        difficulty: "purple",
        explanation:
          "These words form common expressions with 'dar': dar ganas (to feel like), darse cuenta (to realise), dar igual (to not matter), dar miedo (to scare). They seem random until you see the connecting verb.",
      },
    ],
    vibeClues: [
      "Careful — two of the 'colours' are actually hiding in another group entirely",
      "One group only makes sense when you add a missing verb. It's a very giving verb.",
      "If you were rushing to catch a plane, you'd need everything in one group",
    ],
  },
  {
    number: 3,
    language: "es",
    date: "2026-02-19",
    categories: [
      {
        name: "Animales domésticos (Pets)",
        words: ["gato", "perro", "conejo", "tortuga"],
        difficulty: "yellow",
        explanation: "Common pets — gato (cat), perro (dog), conejo (rabbit), tortuga (turtle).",
      },
      {
        name: "Falsos amigos (False friends)",
        words: ["embarazada", "constipado", "sensible", "actual"],
        difficulty: "green",
        explanation:
          "Deceptive cognates: embarazada (pregnant, not embarrassed), constipado (having a cold, not constipated), sensible (sensitive, not sensible), actual (current, not actual).",
        isFalseFriends: true,
      },
      {
        name: "Profesiones terminadas en -ero/-era (Jobs ending in -ero/-era)",
        words: ["bombero", "enfermero", "cocinero", "peluquero"],
        difficulty: "blue",
        explanation: "Jobs with -ero suffix — bombero (firefighter), enfermero (nurse), cocinero (cook), peluquero (hairdresser).",
      },
      {
        name: "Palabras con doble sentido (Words with double meanings)",
        words: ["banco", "copa", "muñeca", "planta"],
        difficulty: "purple",
        explanation:
          "Each word has two completely different meanings: banco (bank/bench), copa (cup/tree crown), muñeca (doll/wrist), planta (plant/floor of building).",
      },
    ],
    vibeClues: [
      "One group will make you blush if you use them wrong in conversation...",
      "These four all moonlight — they have secret second jobs as completely different words",
      "One group shares a grammatical DNA: they're all built the same way",
    ],
  },
  {
    number: 4,
    language: "es",
    date: "2026-02-20",
    categories: [
      {
        name: "Frutas (Fruits)",
        words: ["manzana", "naranja", "fresa", "uva"],
        difficulty: "yellow",
        explanation: "Fruits — manzana (apple), naranja (orange), fresa (strawberry), uva (grape).",
      },
      {
        name: "Tiempo atmosférico (Weather)",
        words: ["lluvia", "nieve", "tormenta", "niebla"],
        difficulty: "green",
        explanation: "Weather words — lluvia (rain), nieve (snow), tormenta (storm), niebla (fog).",
      },
      {
        name: "Falsos amigos (False friends)",
        words: ["asistir", "recordar", "pretender", "realizar"],
        difficulty: "blue",
        explanation:
          "Verb false friends: asistir (to attend, not assist), recordar (to remember, not record), pretender (to try/aim, not pretend), realizar (to carry out, not realise).",
        isFalseFriends: true,
      },
      {
        name: "Palabras que riman con comida (Words that rhyme with food items)",
        words: ["puerta", "cama", "mesa", "silla"],
        difficulty: "purple",
        explanation:
          "Furniture/household items — puerta (door), cama (bed), mesa (table), silla (chair). The trick: they seem random, but they're all things you'd find when describing a room. The rhyme clue is a misdirection!",
      },
    ],
    vibeClues: [
      "These verbs will get you in trouble at a Spanish office if you use the English meaning",
      "One group is what you'd describe if asked '¿Cómo está el tiempo?'",
      "Four of these words are secretly the same category as what surrounds you right now",
    ],
  },
  {
    number: 5,
    language: "es",
    date: "2026-02-21",
    categories: [
      {
        name: "Días de la semana (Days of the week... but tricky)",
        words: ["lunes", "martes", "viernes", "domingo"],
        difficulty: "yellow",
        explanation: "Days of the week — lunes (Monday), martes (Tuesday), viernes (Friday), domingo (Sunday). Note: only 4 of 7!",
      },
      {
        name: "Modismos con comida (Food idioms)",
        words: ["pan", "tomate", "pera", "leche"],
        difficulty: "green",
        explanation:
          "These words are in common idioms: 'ser pan comido' (to be easy), 'ponerse como un tomate' (to go red), 'pedir peras al olmo' (to ask the impossible), 'estar de mala leche' (to be in a bad mood).",
      },
      {
        name: "Verbos irregulares en pretérito (Irregular preterite verbs)",
        words: ["tuve", "puse", "dije", "hice"],
        difficulty: "blue",
        explanation:
          "Irregular preterite forms: tuve (I had, from tener), puse (I put, from poner), dije (I said, from decir), hice (I did, from hacer).",
      },
      {
        name: "También son planetas (Also planet names)",
        words: ["mercurio", "venus", "marte", "plutón"],
        difficulty: "purple",
        explanation:
          "These are planets in Spanish. The trap: 'marte' looks like 'martes' (Tuesday), and 'mercurio' is also the element mercury. Multiple overlaps designed to confuse.",
      },
    ],
    vibeClues: [
      "Two groups share a suspicious resemblance. One is about your calendar, the other is about the sky. Don't mix them up.",
      "One group sounds delicious but is actually about emotions and impossibility",
      "If your Spanish teacher asked you to conjugate, you'd need to know these four rebels",
    ],
  },
  {
    number: 6,
    language: "es",
    date: "2026-02-22",
    categories: [
      {
        name: "Ropa (Clothing)",
        words: ["camisa", "zapatos", "bufanda", "falda"],
        difficulty: "yellow",
        explanation: "Clothing items — camisa (shirt), zapatos (shoes), bufanda (scarf), falda (skirt).",
      },
      {
        name: "Onomatopeyas en español (Spanish onomatopoeia)",
        words: ["miau", "guau", "tic-tac", "pum"],
        difficulty: "green",
        explanation:
          "Spanish sound words: miau (meow), guau (woof — not 'wow'!), tic-tac (tick-tock), pum (bang). 'Guau' is the trap — English speakers hear 'wow'.",
      },
      {
        name: "Falsos amigos (False friends)",
        words: ["ropa", "contestar", "fábrica", "molestar"],
        difficulty: "blue",
        explanation:
          "False friends: ropa (clothes, not rope), contestar (to answer, not contest), fábrica (factory, not fabric), molestar (to bother, not molest). Ropa could trick you into the clothing group!",
        isFalseFriends: true,
      },
      {
        name: "Expresiones con 'tener' (Expressions with 'tener')",
        words: ["hambre", "sueño", "razón", "prisa"],
        difficulty: "purple",
        explanation:
          "These form expressions with 'tener' where English uses 'to be': tener hambre (to be hungry), tener sueño (to be sleepy), tener razón (to be right), tener prisa (to be in a hurry).",
      },
    ],
    vibeClues: [
      "One word is a double agent — it could belong to the clothing group OR the impostor group. Choose wisely.",
      "These four only make sense when you add a verb that means 'to have' but doesn't mean possession here",
      "One group is loud but means nothing. Literally.",
    ],
  },
  {
    number: 7,
    language: "es",
    date: "2026-02-23",
    categories: [
      {
        name: "Medios de transporte (Transport)",
        words: ["tren", "avión", "barco", "bicicleta"],
        difficulty: "yellow",
        explanation: "Transport — tren (train), avión (plane), barco (boat), bicicleta (bicycle).",
      },
      {
        name: "Palabras que son verbos Y sustantivos (Words that are both verbs and nouns)",
        words: ["sobre", "corte", "llama", "cura"],
        difficulty: "green",
        explanation:
          "Each has dual identity: sobre (on/envelope), corte (cut/court), llama (flame/llama/calls), cura (cure/priest). The overlap makes categorisation tricky.",
      },
      {
        name: "Conectores formales (Formal connectors)",
        words: ["además", "sin embargo", "no obstante", "asimismo"],
        difficulty: "blue",
        explanation:
          "Formal writing connectors — además (furthermore), sin embargo (however), no obstante (nevertheless), asimismo (likewise). These look random but all serve the same function.",
      },
      {
        name: "Palabras árabes en español (Arabic-origin words)",
        words: ["almohada", "alfombra", "azúcar", "alcalde"],
        difficulty: "purple",
        explanation:
          "Words with Arabic origins (all start with 'al-'): almohada (pillow), alfombra (carpet), azúcar (sugar), alcalde (mayor). Spanish has ~4,000 Arabic-origin words from 800 years of Moorish rule.",
      },
    ],
    vibeClues: [
      "One group left a linguistic footprint from 800 years of history. Look at how they start.",
      "Four shapeshifters that change part of speech depending on context",
      "If you were writing an academic essay, you'd need all four of one group",
    ],
  },
];
