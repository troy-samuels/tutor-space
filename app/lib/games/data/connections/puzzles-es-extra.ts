import type { ConnectionsPuzzle } from "./types";

/**
 * Extended Spanish Connections puzzles (8-30).
 * Each puzzle has 4 categories of 4 words with lateral/deceptive groupings.
 */
export const PUZZLES_ES_EXTRA: ConnectionsPuzzle[] = [
  {
    number: 8,
    language: "es",
    date: "2026-02-24",
    categories: [
      {
        name: "Instrumentos musicales (Musical instruments)",
        words: ["guitarra", "piano", "flauta", "tambor"],
        difficulty: "yellow",
        explanation: "Musical instruments — guitarra (guitar), piano (piano), flauta (flute), tambor (drum).",
      },
      {
        name: "Partes de un libro (Parts of a book)",
        words: ["portada", "índice", "capítulo", "prólogo"],
        difficulty: "green",
        explanation: "Book parts — portada (cover), índice (index), capítulo (chapter), prólogo (prologue).",
      },
      {
        name: "Palabras con género sorprendente (Surprising gender)",
        words: ["mano", "día", "mapa", "foto"],
        difficulty: "blue",
        explanation: "Unexpected grammatical gender: la mano (feminine despite -o), el día (masculine despite -a), el mapa (masculine despite -a), la foto (feminine, short for fotografía).",
      },
      {
        name: "Verbos que rigen subjuntivo (Verbs triggering subjunctive)",
        words: ["querer", "esperar", "dudar", "temer"],
        difficulty: "purple",
        explanation: "These verbs require subjunctive in subordinate clauses: querer (to want), esperar (to hope), dudar (to doubt), temer (to fear).",
      },
    ],
    vibeClues: [
      "One group defies the rules you learned about -o and -a endings",
      "Four verbs that share a grammatical superpower — they change the mood of whatever follows",
      "You'd find one group on your bookshelf, another in an orchestra pit",
    ],
  },
  {
    number: 9,
    language: "es",
    date: "2026-02-25",
    categories: [
      {
        name: "Estaciones del año (Seasons)",
        words: ["primavera", "verano", "otoño", "invierno"],
        difficulty: "yellow",
        explanation: "The four seasons — primavera (spring), verano (summer), otoño (autumn), invierno (winter).",
      },
      {
        name: "Materiales (Materials)",
        words: ["madera", "hierro", "cristal", "piedra"],
        difficulty: "green",
        explanation: "Materials — madera (wood), hierro (iron), cristal (glass), piedra (stone).",
      },
      {
        name: "Expresiones con 'echar' (Expressions with 'echar')",
        words: ["vistazo", "mano", "cuenta", "raíces"],
        difficulty: "blue",
        explanation: "Form expressions with echar: echar un vistazo (to take a look), echar una mano (to lend a hand), echar de menos → echar en cuenta (to take into account), echar raíces (to put down roots).",
      },
      {
        name: "Participios irregulares (Irregular past participles)",
        words: ["escrito", "abierto", "muerto", "vuelto"],
        difficulty: "purple",
        explanation: "Irregular participles: escrito (written, from escribir), abierto (opened, from abrir), muerto (died, from morir), vuelto (returned, from volver).",
      },
    ],
    vibeClues: [
      "One group only makes sense when you throw something",
      "Grammar rebels — these past tenses don't follow the -ado/-ido pattern",
      "Two groups could be in a Nature documentary, but one is about what things are made of",
    ],
  },
  {
    number: 10,
    language: "es",
    date: "2026-02-26",
    categories: [
      {
        name: "Deportes (Sports)",
        words: ["fútbol", "baloncesto", "tenis", "natación"],
        difficulty: "yellow",
        explanation: "Sports — fútbol (football), baloncesto (basketball), tenis (tennis), natación (swimming).",
      },
      {
        name: "Partes de la casa (Parts of the house)",
        words: ["tejado", "escalera", "sótano", "balcón"],
        difficulty: "green",
        explanation: "House parts — tejado (roof), escalera (stairs), sótano (basement), balcón (balcony).",
      },
      {
        name: "Falsos amigos verbales (Verb false friends)",
        words: ["soportar", "suceder", "introducir", "atender"],
        difficulty: "blue",
        explanation: "Verb false friends: soportar (to bear/tolerate ≠ support), suceder (to happen ≠ succeed), introducir (to insert ≠ introduce a person), atender (to attend to ≠ attend an event).",
        isFalseFriends: true,
      },
      {
        name: "Sufijos despectivos (Pejorative suffixes)",
        words: ["casucha", "gentuza", "pueblucho", "libraco"],
        difficulty: "purple",
        explanation: "Words with pejorative suffixes: casucha (crappy house, -ucha), gentuza (riffraff, -uza), pueblucho (lousy town, -ucho), libraco (terrible book, -aco). These suffixes add negative connotation.",
      },
    ],
    vibeClues: [
      "One group hides behind English-looking masks — none of them mean what you think",
      "Four words that Spanish uses to insult things. Look at their tails.",
      "You'd watch one group on TV, and live inside the other",
    ],
  },
  {
    number: 11,
    language: "es",
    date: "2026-02-27",
    categories: [
      {
        name: "Emociones (Emotions)",
        words: ["alegría", "tristeza", "miedo", "sorpresa"],
        difficulty: "yellow",
        explanation: "Basic emotions — alegría (joy), tristeza (sadness), miedo (fear), sorpresa (surprise).",
      },
      {
        name: "Gentilicios (Demonyms)",
        words: ["madrileño", "andaluz", "catalán", "gallego"],
        difficulty: "green",
        explanation: "Spanish regional demonyms — madrileño (from Madrid), andaluz (from Andalusia), catalán (from Catalonia), gallego (from Galicia).",
      },
      {
        name: "Verbos pronominales con cambio de significado",
        words: ["ir", "llevar", "dormir", "volver"],
        difficulty: "blue",
        explanation: "Verbs that change meaning with reflexive: ir (to go) → irse (to leave), llevar (to carry) → llevarse (to take away/get along), dormir (to sleep) → dormirse (to fall asleep), volver (to return) → volverse (to become).",
      },
      {
        name: "Palabras con 'ñ' exclusivas del español",
        words: ["niño", "España", "señor", "cariño"],
        difficulty: "purple",
        explanation: "Words featuring ñ, a letter unique to Spanish: niño (child), España (Spain), señor (sir/mr), cariño (affection/darling).",
      },
    ],
    vibeClues: [
      "One group shares a letter that no other language in the world uses the same way",
      "These four verbs are Dr. Jekyll and Mr. Hyde — add 'se' and they transform",
      "One group tells you where people come from within one country",
    ],
  },
  {
    number: 12,
    language: "es",
    date: "2026-02-28",
    categories: [
      {
        name: "Herramientas (Tools)",
        words: ["martillo", "destornillador", "sierra", "llave"],
        difficulty: "yellow",
        explanation: "Tools — martillo (hammer), destornillador (screwdriver), sierra (saw), llave (wrench/key).",
      },
      {
        name: "Verbos de movimiento (Verbs of motion)",
        words: ["correr", "saltar", "nadar", "trepar"],
        difficulty: "green",
        explanation: "Motion verbs — correr (to run), saltar (to jump), nadar (to swim), trepar (to climb).",
      },
      {
        name: "Conectores causales (Causal connectors)",
        words: ["porque", "ya que", "puesto que", "dado que"],
        difficulty: "blue",
        explanation: "All mean 'because/since' with varying formality: porque (because), ya que (since), puesto que (given that), dado que (given that).",
      },
      {
        name: "Palabras homófonas (Homophones)",
        words: ["hola", "ola", "bello", "vello"],
        difficulty: "purple",
        explanation: "Spanish homophones: hola/ola (hello/wave), bello/vello (beautiful/body hair). They sound identical but are spelled differently and have different meanings.",
      },
    ],
    vibeClues: [
      "One group sounds exactly the same when spoken aloud — but look at the spelling",
      "Four ways to say the same thing, from casual to courtroom-formal",
      "One group gets your body moving, another gets things built",
    ],
  },
  {
    number: 13,
    language: "es",
    date: "2026-03-01",
    categories: [
      {
        name: "Verduras (Vegetables)",
        words: ["tomate", "cebolla", "lechuga", "pimiento"],
        difficulty: "yellow",
        explanation: "Vegetables — tomate (tomato), cebolla (onion), lechuga (lettuce), pimiento (pepper).",
      },
      {
        name: "Tiendas (Shops)",
        words: ["panadería", "carnicería", "pescadería", "farmacia"],
        difficulty: "green",
        explanation: "Shops — panadería (bakery), carnicería (butcher), pescadería (fishmonger), farmacia (pharmacy). Three follow the -ería pattern.",
      },
      {
        name: "Expresiones con 'hacer' (Expressions with 'hacer')",
        words: ["cola", "caso", "falta", "daño"],
        difficulty: "blue",
        explanation: "Form expressions with hacer: hacer cola (to queue), hacer caso (to pay attention), hacer falta (to be needed), hacer daño (to hurt).",
      },
      {
        name: "Pretéritos fuertes irregulares (Strong irregular preterites)",
        words: ["quiso", "supo", "vino", "trajo"],
        difficulty: "purple",
        explanation: "Strong irregular preterite forms: quiso (wanted, querer), supo (knew, saber), vino (came, venir), trajo (brought, traer). These are notoriously difficult.",
      },
    ],
    vibeClues: [
      "One group only works if you 'do' something with them — but the verb isn't in the grid",
      "Three shops share DNA in their names. One broke the pattern.",
      "Four verbs walked into the past tense and came out unrecognisable",
    ],
  },
  {
    number: 14,
    language: "es",
    date: "2026-03-02",
    categories: [
      {
        name: "Muebles (Furniture)",
        words: ["sofá", "estantería", "cómoda", "armario"],
        difficulty: "yellow",
        explanation: "Furniture — sofá (sofa), estantería (bookshelf), cómoda (chest of drawers), armario (wardrobe/cupboard).",
      },
      {
        name: "Fenómenos naturales (Natural phenomena)",
        words: ["terremoto", "inundación", "sequía", "erupción"],
        difficulty: "green",
        explanation: "Natural phenomena — terremoto (earthquake), inundación (flood), sequía (drought), erupción (eruption).",
      },
      {
        name: "Marcadores del discurso (Discourse markers)",
        words: ["bueno", "pues", "vale", "venga"],
        difficulty: "blue",
        explanation: "Spoken discourse markers — bueno (well), pues (so/well), vale (OK), venga (come on/OK). These are filler words in conversation, not their dictionary meanings.",
      },
      {
        name: "Verbos con preposición fija (Verbs with fixed prepositions)",
        words: ["soñar", "depender", "consistir", "fijarse"],
        difficulty: "purple",
        explanation: "Verbs requiring specific prepositions: soñar CON (to dream of), depender DE (to depend on), consistir EN (to consist of), fijarse EN (to notice). Missing the preposition is a common error.",
      },
    ],
    vibeClues: [
      "Four words you hear constantly in Spanish conversation — but they don't mean what the dictionary says",
      "These four verbs are clingy — they can't go anywhere without their preposition partner",
      "One group could destroy a city; the other furnishes a room",
    ],
  },
  {
    number: 15,
    language: "es",
    date: "2026-03-03",
    categories: [
      {
        name: "Bebidas (Drinks)",
        words: ["cerveza", "vino", "café", "zumo"],
        difficulty: "yellow",
        explanation: "Drinks — cerveza (beer), vino (wine), café (coffee), zumo (juice).",
      },
      {
        name: "Saludos y despedidas (Greetings and farewells)",
        words: ["adiós", "hasta luego", "buenas noches", "nos vemos"],
        difficulty: "green",
        explanation: "Ways to say goodbye — adiós (goodbye), hasta luego (see you later), buenas noches (good night), nos vemos (see you).",
      },
      {
        name: "Diminutivos (Diminutives)",
        words: ["casita", "perrito", "momentito", "cerquita"],
        difficulty: "blue",
        explanation: "Diminutive forms: casita (little house), perrito (little dog), momentito (just a moment), cerquita (nice and close). Diminutives add warmth, not just smallness.",
      },
      {
        name: "Palabras de origen quechua (Quechua-origin words)",
        words: ["cóndor", "llama", "papa", "coca"],
        difficulty: "purple",
        explanation: "Words from Quechua (Inca language): cóndor (condor), llama (llama), papa (potato — Latin American Spanish), coca (coca plant). Trap: 'papa' also means Pope or dad!",
      },
    ],
    vibeClues: [
      "One group crossed an ocean and a language barrier centuries ago — from the Andes",
      "These four are the cute versions. Spanish shrunk them with love.",
      "One group ends a conversation; another starts a round at the bar",
    ],
  },
  {
    number: 16,
    language: "es",
    date: "2026-03-04",
    categories: [
      {
        name: "Asignaturas escolares (School subjects)",
        words: ["matemáticas", "historia", "ciencias", "inglés"],
        difficulty: "yellow",
        explanation: "School subjects — matemáticas (maths), historia (history), ciencias (science), inglés (English).",
      },
      {
        name: "Materias primas (Raw materials)",
        words: ["algodón", "lana", "seda", "cuero"],
        difficulty: "green",
        explanation: "Raw materials for clothing — algodón (cotton), lana (wool), seda (silk), cuero (leather).",
      },
      {
        name: "Expresiones con 'quedar' (Expressions with 'quedar')",
        words: ["bien", "mal", "claro", "embarazada"],
        difficulty: "blue",
        explanation: "Form expressions with quedar: quedar bien (to come across well), quedar mal (to make a bad impression), quedar claro (to be clear), quedarse embarazada (to get pregnant). Trap: 'embarazada' might look like it belongs elsewhere!",
      },
      {
        name: "Gentilicios irregulares (Irregular demonyms)",
        words: ["estadounidense", "costarricense", "nicaragüense", "canadiense"],
        difficulty: "purple",
        explanation: "Country demonyms with -ense/-ense suffix: estadounidense (American), costarricense (Costa Rican), nicaragüense (Nicaraguan), canadiense (Canadian). Contrast with the regular -eño/-ano patterns.",
      },
    ],
    vibeClues: [
      "One group dresses you, the other teaches you",
      "Four long words that tell you where someone's passport is from",
      "'Quedar' is the Swiss army knife of Spanish verbs. Four of these are its blades.",
    ],
  },
  {
    number: 17,
    language: "es",
    date: "2026-03-05",
    categories: [
      {
        name: "Insectos (Insects)",
        words: ["abeja", "mariposa", "hormiga", "mosca"],
        difficulty: "yellow",
        explanation: "Insects — abeja (bee), mariposa (butterfly), hormiga (ant), mosca (fly).",
      },
      {
        name: "Partes del coche (Car parts)",
        words: ["volante", "parabrisas", "maletero", "espejo"],
        difficulty: "green",
        explanation: "Car parts — volante (steering wheel), parabrisas (windscreen), maletero (boot/trunk), espejo (mirror).",
      },
      {
        name: "Verbos copulativos y semicopulativos",
        words: ["ser", "estar", "parecer", "resultar"],
        difficulty: "blue",
        explanation: "Copulative/semi-copulative verbs: ser (to be — essential), estar (to be — state), parecer (to seem), resultar (to turn out). They link subject to attribute.",
      },
      {
        name: "Aumentativos (Augmentatives)",
        words: ["perrazo", "cochazo", "golazo", "fiestón"],
        difficulty: "purple",
        explanation: "Augmentative forms: perrazo (huge/great dog), cochazo (amazing car), golazo (amazing goal), fiestón (massive party). -azo and -ón intensify meaning, often positively.",
      },
    ],
    vibeClues: [
      "One group went to the gym and got BIGGER. Spanish pumped them up.",
      "You can drive one group but you'd scream if the other group landed on your arm",
      "Four verbs that never describe an action — they just connect things together",
    ],
  },
  {
    number: 18,
    language: "es",
    date: "2026-03-06",
    categories: [
      {
        name: "Flores (Flowers)",
        words: ["rosa", "girasol", "tulipán", "margarita"],
        difficulty: "yellow",
        explanation: "Flowers — rosa (rose), girasol (sunflower), tulipán (tulip), margarita (daisy). Trap: rosa and margarita are also names!",
      },
      {
        name: "Tipos de texto (Text types)",
        words: ["ensayo", "novela", "artículo", "informe"],
        difficulty: "green",
        explanation: "Text types — ensayo (essay), novela (novel), artículo (article), informe (report).",
      },
      {
        name: "Falsos amigos sustantivos (Noun false friends)",
        words: ["lectura", "noticia", "argumento", "decepción"],
        difficulty: "blue",
        explanation: "Noun false friends: lectura (reading ≠ lecture), noticia (news ≠ notice), argumento (plot ≠ argument), decepción (disappointment ≠ deception).",
        isFalseFriends: true,
      },
      {
        name: "Expresiones con 'ponerse' (Expressions with 'ponerse')",
        words: ["nervioso", "rojo", "enfermo", "contento"],
        difficulty: "purple",
        explanation: "Adjectives used with ponerse (to become): ponerse nervioso (to get nervous), ponerse rojo (to go red), ponerse enfermo (to get sick), ponerse contento (to become happy). Ponerse = involuntary change of state.",
      },
    ],
    vibeClues: [
      "Two of the 'flowers' are also women's names. Don't let that trick you.",
      "These four words will betray you if you translate them literally from English",
      "Four things you can 'become' without choosing to — add the right verb",
    ],
  },
  {
    number: 19,
    language: "es",
    date: "2026-03-07",
    categories: [
      {
        name: "Países hispanohablantes (Spanish-speaking countries)",
        words: ["Colombia", "Argentina", "Perú", "Ecuador"],
        difficulty: "yellow",
        explanation: "South American Spanish-speaking countries — Colombia, Argentina, Perú (Peru), Ecuador.",
      },
      {
        name: "Especias y condimentos (Spices and seasonings)",
        words: ["canela", "pimienta", "comino", "orégano"],
        difficulty: "green",
        explanation: "Spices — canela (cinnamon), pimienta (pepper), comino (cumin), orégano (oregano).",
      },
      {
        name: "Verbos de cambio (Verbs of change/becoming)",
        words: ["hacerse", "volverse", "convertirse", "llegar a ser"],
        difficulty: "blue",
        explanation: "All mean 'to become' with nuances: hacerse (through effort), volverse (sudden/involuntary), convertirse en (transformation), llegar a ser (gradual achievement).",
      },
      {
        name: "Prefijos negativos (Negative prefixes)",
        words: ["deshacer", "imposible", "incómodo", "antinatural"],
        difficulty: "purple",
        explanation: "Words with different negative prefixes: des- (deshacer = undo), im- (imposible = impossible), in- (incómodo = uncomfortable), anti- (antinatural = unnatural).",
      },
    ],
    vibeClues: [
      "Four ways to say the same thing — but the flavour is different each time",
      "One group negates things, each with a different prefix strategy",
      "You'd find one group on a map, the other in a kitchen drawer",
    ],
  },
  {
    number: 20,
    language: "es",
    date: "2026-03-08",
    categories: [
      {
        name: "Órganos del cuerpo (Body organs)",
        words: ["corazón", "pulmón", "hígado", "riñón"],
        difficulty: "yellow",
        explanation: "Internal organs — corazón (heart), pulmón (lung), hígado (liver), riñón (kidney).",
      },
      {
        name: "Figuras retóricas (Figures of speech)",
        words: ["metáfora", "hipérbole", "ironía", "sinécdoque"],
        difficulty: "green",
        explanation: "Rhetorical figures — metáfora (metaphor), hipérbole (hyperbole), ironía (irony), sinécdoque (synecdoche).",
      },
      {
        name: "Expresiones con 'caer' (Expressions with 'caer')",
        words: ["bien", "gordo", "rendido", "enfermo"],
        difficulty: "blue",
        explanation: "Expressions with caer: caer bien (to like someone), caer gordo (to dislike someone), caer rendido (to collapse exhausted), caer enfermo (to fall ill).",
      },
      {
        name: "Palabras compuestas (Compound words)",
        words: ["paraguas", "sacacorchos", "rompecabezas", "limpiaparabrisas"],
        difficulty: "purple",
        explanation: "Compound words: paraguas (umbrella = para + aguas), sacacorchos (corkscrew = saca + corchos), rompecabezas (puzzle = rompe + cabezas), limpiaparabrisas (windscreen wiper = limpia + parabrisas).",
      },
    ],
    vibeClues: [
      "Four long words that are secretly two words pretending to be one",
      "One group would make you 'fall' — but not physically",
      "One group is inside you right now; the other is inside a literature textbook",
    ],
  },
  {
    number: 21,
    language: "es",
    date: "2026-03-09",
    categories: [
      {
        name: "Árboles (Trees)",
        words: ["roble", "pino", "olivo", "cerezo"],
        difficulty: "yellow",
        explanation: "Trees — roble (oak), pino (pine), olivo (olive tree), cerezo (cherry tree).",
      },
      {
        name: "Registros formales (Formal register words)",
        words: ["solicitar", "requerir", "estipular", "dictaminar"],
        difficulty: "green",
        explanation: "Formal/legal register verbs — solicitar (to request), requerir (to require), estipular (to stipulate), dictaminar (to rule/determine).",
      },
      {
        name: "Modismos con animales (Animal idioms)",
        words: ["gato", "mosca", "burro", "pez"],
        difficulty: "blue",
        explanation: "Words in animal idioms: dar gato por liebre (to cheat), estar mosca (to be suspicious), caer como un burro (to be stubborn), sentirse como pez en el agua (to feel at home).",
      },
      {
        name: "Gerundios irregulares (Irregular gerunds)",
        words: ["diciendo", "pidiendo", "durmiendo", "leyendo"],
        difficulty: "purple",
        explanation: "Irregular gerund forms: diciendo (saying, decir), pidiendo (asking, pedir), durmiendo (sleeping, dormir), leyendo (reading, leer). These don't follow standard -ando/-iendo.",
      },
    ],
    vibeClues: [
      "Four animals that have nothing to do with the zoo — they're trapped in expressions",
      "One group would impress a judge; the other would impress a gardener",
      "Four -iendo words that broke the rules of conjugation",
    ],
  },
  {
    number: 22,
    language: "es",
    date: "2026-03-10",
    categories: [
      {
        name: "Joyas y accesorios (Jewellery and accessories)",
        words: ["anillo", "collar", "pulsera", "pendientes"],
        difficulty: "yellow",
        explanation: "Jewellery — anillo (ring), collar (necklace), pulsera (bracelet), pendientes (earrings).",
      },
      {
        name: "Onomatopeyas de acciones humanas",
        words: ["achís", "muá", "shhh", "uf"],
        difficulty: "green",
        explanation: "Human sound effects: achís (achoo/sneeze), muá (mwah/kiss), shhh (shh/quiet), uf (phew/relief or disgust).",
      },
      {
        name: "Verbos que cambian de raíz e→i (Stem-changing e→i)",
        words: ["pedir", "seguir", "vestir", "repetir"],
        difficulty: "blue",
        explanation: "E→I stem-changing verbs: pedir (to ask for), seguir (to follow), vestir (to dress), repetir (to repeat). All change e→i in present tense yo forms.",
      },
      {
        name: "Palabras esdrújulas comunes (Common proparoxytone words)",
        words: ["sábado", "teléfono", "número", "brújula"],
        difficulty: "purple",
        explanation: "Esdrújulas — words stressed on the antepenultimate syllable: sábado, teléfono, número, brújula. They always carry a written accent in Spanish.",
      },
    ],
    vibeClues: [
      "One group always has an accent mark — it's a grammatical rule, not a coincidence",
      "Four verbs that rebel at the stem when you conjugate them",
      "One group sparkles; the other makes noises you wouldn't write in an essay",
    ],
  },
  {
    number: 23,
    language: "es",
    date: "2026-03-11",
    categories: [
      {
        name: "Paisajes (Landscapes)",
        words: ["montaña", "desierto", "selva", "playa"],
        difficulty: "yellow",
        explanation: "Landscapes — montaña (mountain), desierto (desert), selva (jungle), playa (beach).",
      },
      {
        name: "Elementos de la oración (Parts of a sentence)",
        words: ["sujeto", "verbo", "complemento", "predicado"],
        difficulty: "green",
        explanation: "Grammatical sentence parts — sujeto (subject), verbo (verb), complemento (complement/object), predicado (predicate).",
      },
      {
        name: "Expresiones con 'llevar' (Expressions with 'llevar')",
        words: ["razón", "puesto", "encima", "adelante"],
        difficulty: "blue",
        explanation: "Expressions with llevar: llevar razón (to be right), llevar puesto (to be wearing), llevar encima (to have on you), llevar adelante (to carry forward).",
      },
      {
        name: "Americanismos vs. peninsular (Latin Am. vs. Spain Spanish)",
        words: ["computadora", "carro", "plata", "celular"],
        difficulty: "purple",
        explanation: "Latin American Spanish variants: computadora (computer, Spain: ordenador), carro (car, Spain: coche), plata (money, Spain: dinero), celular (mobile phone, Spain: móvil).",
      },
    ],
    vibeClues: [
      "One group crosses the Atlantic — they speak differently on each side",
      "Four words that only make sense when you 'carry' them",
      "One group is what you see outside; the other is what your teacher writes on the board",
    ],
  },
  {
    number: 24,
    language: "es",
    date: "2026-03-12",
    categories: [
      {
        name: "Metales (Metals)",
        words: ["oro", "plata", "cobre", "bronce"],
        difficulty: "yellow",
        explanation: "Metals — oro (gold), plata (silver), cobre (copper), bronce (bronze).",
      },
      {
        name: "Tipos de vivienda (Types of housing)",
        words: ["piso", "chalet", "ático", "estudio"],
        difficulty: "green",
        explanation: "Housing types — piso (flat), chalet (detached house), ático (penthouse), estudio (studio apartment).",
      },
      {
        name: "Locuciones prepositivas (Prepositional phrases)",
        words: ["a causa de", "en vez de", "a pesar de", "en torno a"],
        difficulty: "blue",
        explanation: "Complex prepositions: a causa de (because of), en vez de (instead of), a pesar de (despite), en torno a (around/regarding).",
      },
      {
        name: "Verbos con doble participio (Verbs with two participles)",
        words: ["freír", "imprimir", "proveer", "elegir"],
        difficulty: "purple",
        explanation: "Verbs with both regular and irregular participles: freír (freído/frito), imprimir (imprimido/impreso), proveer (proveído/provisto), elegir (elegido → but electo as adjective).",
      },
    ],
    vibeClues: [
      "One group has split personalities — two past tenses each, and both are correct",
      "Four multi-word prepositions hiding as word groups",
      "One group medals; the other is where you sleep",
    ],
  },
  {
    number: 25,
    language: "es",
    date: "2026-03-13",
    categories: [
      {
        name: "Juegos de mesa (Board games)",
        words: ["ajedrez", "dominó", "damas", "parchís"],
        difficulty: "yellow",
        explanation: "Board games — ajedrez (chess), dominó (dominoes), damas (draughts/checkers), parchís (Ludo/Parcheesi).",
      },
      {
        name: "Conceptos musicales (Musical concepts)",
        words: ["melodía", "ritmo", "armonía", "compás"],
        difficulty: "green",
        explanation: "Music concepts — melodía (melody), ritmo (rhythm), armonía (harmony), compás (bar/measure/beat).",
      },
      {
        name: "Verbos de percepción sensorial (Sensory perception verbs)",
        words: ["ver", "oír", "oler", "saborear"],
        difficulty: "blue",
        explanation: "Sensory verbs — ver (to see), oír (to hear), oler (to smell), saborear (to taste/savour). Covers 4 of the 5 senses.",
      },
      {
        name: "Refranes incompletos — primera palabra",
        words: ["quien", "más", "no", "dime"],
        difficulty: "purple",
        explanation: "First words of common proverbs: 'Quien' mucho abarca... (He who grasps much...), 'Más' vale tarde que nunca (Better late than never), 'No' hay mal que por bien no venga, 'Dime' con quién andas (Tell me who you walk with).",
      },
    ],
    vibeClues: [
      "One group starts famous sayings — but you only get the first word",
      "One group lets you feel the world; another lets you play at a table",
      "If you can hum it, strum it, or tap it — it's in one group",
    ],
  },
  {
    number: 26,
    language: "es",
    date: "2026-03-14",
    categories: [
      {
        name: "Tejidos del cuerpo (Body tissues)",
        words: ["piel", "hueso", "músculo", "sangre"],
        difficulty: "yellow",
        explanation: "Body tissue/components — piel (skin), hueso (bone), músculo (muscle), sangre (blood).",
      },
      {
        name: "Monedas y dinero (Money terms)",
        words: ["billete", "moneda", "efectivo", "tarjeta"],
        difficulty: "green",
        explanation: "Money terms — billete (banknote), moneda (coin), efectivo (cash), tarjeta (card).",
      },
      {
        name: "Perífrasis verbales (Verbal periphrases)",
        words: ["ir a", "volver a", "dejar de", "acabar de"],
        difficulty: "blue",
        explanation: "Verbal periphrases: ir a (going to), volver a (to do again), dejar de (to stop doing), acabar de (to have just done). These construct aspect/tense analytically.",
      },
      {
        name: "Palabras con x pronunciadas como j",
        words: ["México", "Oaxaca", "Texas", "Ximena"],
        difficulty: "purple",
        explanation: "Words where x is pronounced like j (Spanish 'jota'): México, Oaxaca, Texas, Ximena. This reflects old Castilian orthography preserved in proper nouns.",
      },
    ],
    vibeClues: [
      "One group has a letter that lies about its sound — an ancient spelling rebellion",
      "Four grammatical constructions that hack tense without conjugating the main verb",
      "One group is under your skin; the other is in your wallet",
    ],
  },
  {
    number: 27,
    language: "es",
    date: "2026-03-15",
    categories: [
      {
        name: "Tipos de queso (Types of cheese)",
        words: ["manchego", "cabrales", "idiazábal", "mahón"],
        difficulty: "yellow",
        explanation: "Spanish cheeses — manchego (La Mancha), cabrales (Asturias), idiazábal (Basque Country), mahón (Menorca). All named after their region.",
      },
      {
        name: "Clases de palabras (Word classes)",
        words: ["sustantivo", "adjetivo", "adverbio", "pronombre"],
        difficulty: "green",
        explanation: "Parts of speech — sustantivo (noun), adjetivo (adjective), adverbio (adverb), pronombre (pronoun).",
      },
      {
        name: "Expresiones con 'meter' (Expressions with 'meter')",
        words: ["prisa", "miedo", "ruido", "pata"],
        difficulty: "blue",
        explanation: "Expressions with meter: meter prisa (to rush someone), meter miedo (to scare), meter ruido (to make noise), meter la pata (to put your foot in it).",
      },
      {
        name: "Leísmo/laísmo/loísmo (Pronoun controversies)",
        words: ["le", "la", "lo", "les"],
        difficulty: "purple",
        explanation: "The controversial object pronouns: le (indirect/leísmo direct), la (direct feminine/laísmo indirect), lo (direct masculine/neuter), les (indirect plural). Their 'correct' use varies by region.",
      },
    ],
    vibeClues: [
      "One group is Spain's most passionate grammar debate — two tiny letters, endless arguments",
      "These four words only work if you 'put' something into them",
      "One group names the building blocks of language; the other is named after places on a map",
    ],
  },
  {
    number: 28,
    language: "es",
    date: "2026-03-16",
    categories: [
      {
        name: "Planetas del sistema solar",
        words: ["Júpiter", "Saturno", "Marte", "Venus"],
        difficulty: "yellow",
        explanation: "Solar system planets — Júpiter (Jupiter), Saturno (Saturn), Marte (Mars), Venus (Venus).",
      },
      {
        name: "Gestos españoles (Spanish gestures)",
        words: ["codo", "dedo", "ojo", "hombro"],
        difficulty: "green",
        explanation: "Body parts used in Spanish gestures/idioms: codo (elbow — ser codo = be stingy), dedo (finger — no mover un dedo = not lift a finger), ojo (eye — ¡ojo! = watch out!), hombro (shoulder — arrimar el hombro = pitch in).",
      },
      {
        name: "Subjuntivo imperfecto (Imperfect subjunctive)",
        words: ["fuera", "tuviera", "pudiera", "quisiera"],
        difficulty: "blue",
        explanation: "Imperfect subjunctive -ra forms: fuera (were, ser/ir), tuviera (had, tener), pudiera (could, poder), quisiera (wanted, querer). Used in hypotheticals and polite requests.",
      },
      {
        name: "Arabismos que empiezan por 'al-' (Arabic-origin 'al-' words)",
        words: ["algebra", "algoritmo", "alquimia", "alfil"],
        difficulty: "purple",
        explanation: "Academic/technical words from Arabic with al- prefix: álgebra (algebra), algoritmo (algorithm), alquimia (alchemy), alfil (bishop in chess). All entered Spanish via medieval Islamic scholarship.",
      },
    ],
    vibeClues: [
      "One group orbits the sun; another orbits medieval Islamic knowledge",
      "Four body parts that Spanish uses to express attitudes, not anatomy",
      "If you wanted to be extra polite in Spanish, you'd conjugate like one group",
    ],
  },
  {
    number: 29,
    language: "es",
    date: "2026-03-17",
    categories: [
      {
        name: "Postres españoles (Spanish desserts)",
        words: ["churros", "flan", "turrón", "natillas"],
        difficulty: "yellow",
        explanation: "Spanish desserts — churros (fried dough), flan (caramel custard), turrón (nougat), natillas (custard).",
      },
      {
        name: "Elementos de puntuación (Punctuation marks)",
        words: ["coma", "punto", "guión", "comillas"],
        difficulty: "green",
        explanation: "Punctuation — coma (comma), punto (full stop), guión (hyphen), comillas (quotation marks).",
      },
      {
        name: "Verbos de opinión + indicativo (Opinion verbs + indicative)",
        words: ["creer", "pensar", "opinar", "considerar"],
        difficulty: "blue",
        explanation: "Opinion verbs that take indicative in affirmative: creer (to believe), pensar (to think), opinar (to opine), considerar (to consider). But they switch to subjunctive when negated!",
      },
      {
        name: "Palabras que cambian con el artículo (Gender-swapping words)",
        words: ["capital", "orden", "frente", "cometa"],
        difficulty: "purple",
        explanation: "Words that change meaning with article: el/la capital (capital city vs. financial capital), el/la orden (order vs. religious order), el/la frente (front vs. forehead), el/la cometa (comet vs. kite).",
      },
    ],
    vibeClues: [
      "Four words that are grammatical shapeshifters — change their 'el' to 'la' and they become someone else",
      "One group ends your sentences (literally, on paper)",
      "These verbs play a sneaky game: they change grammatical mood depending on whether you say 'yes' or 'no'",
    ],
  },
  {
    number: 30,
    language: "es",
    date: "2026-03-18",
    categories: [
      {
        name: "Bailes latinos (Latin dances)",
        words: ["salsa", "merengue", "bachata", "cumbia"],
        difficulty: "yellow",
        explanation: "Latin dances — salsa (salsa), merengue (merengue), bachata (bachata), cumbia (cumbia). Trap: salsa and merengue are also food terms!",
      },
      {
        name: "Unidades de medida (Units of measurement)",
        words: ["kilómetro", "litro", "gramo", "grado"],
        difficulty: "green",
        explanation: "Units of measurement — kilómetro (kilometre), litro (litre), gramo (gram), grado (degree).",
      },
      {
        name: "Expresiones con 'andar' (Expressions with 'andar')",
        words: ["perdido", "preocupado", "justo", "buscando"],
        difficulty: "blue",
        explanation: "Expressions with andar: andar perdido (to be lost), andar preocupado (to be worried), andar justo (to be tight on money/time), andar buscando (to be looking for). Andar replaces estar in colloquial speech.",
      },
      {
        name: "Arcaísmos todavía usados (Still-used archaisms)",
        words: ["menester", "antaño", "otorgar", "acaparar"],
        difficulty: "purple",
        explanation: "Archaic words still in modern use: menester (necessary — es menester), antaño (in years past), otorgar (to grant), acaparar (to hoard). These feel medieval but appear in newspapers.",
      },
    ],
    vibeClues: [
      "Two words in one group are also things you eat. But here, they make you dance.",
      "One group walks around being things — replace their verb with 'estar' and they still work",
      "Four words your great-grandparents used — and your newspaper still does",
    ],
  },
];