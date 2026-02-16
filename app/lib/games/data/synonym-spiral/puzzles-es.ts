import type { SynonymSpiralPuzzle } from "./types";

/**
 * Spanish Synonym Spiral puzzles.
 * Each puzzle has 5 chains. Each chain has 5 depth levels.
 */
export const PUZZLES_ES: SynonymSpiralPuzzle[] = [
  {
    number: 1,
    language: "es",
    date: "2026-02-17",
    chains: [
      {
        starterWord: "grande",
        starterTranslation: "big",
        levels: [
          { depth: 1, validWords: ["alto", "amplio", "ancho"], label: "Básico" },
          { depth: 2, validWords: ["enorme", "extenso", "vasto"], label: "Intermedio" },
          { depth: 3, validWords: ["inmenso", "colosal", "gigantesco"], label: "Avanzado" },
          { depth: 4, validWords: ["descomunal", "monumental", "titánico"], label: "Literario" },
          { depth: 5, validWords: ["inconmensurable", "desmesurado", "ciclópeo"], label: "Poético" },
        ],
      },
      {
        starterWord: "bueno",
        starterTranslation: "good",
        levels: [
          { depth: 1, validWords: ["bien", "mejor", "bonito"], label: "Básico" },
          { depth: 2, validWords: ["excelente", "estupendo", "genial"], label: "Intermedio" },
          { depth: 3, validWords: ["magnífico", "espléndido", "formidable"], label: "Avanzado" },
          { depth: 4, validWords: ["soberbio", "sublime", "excepcional"], label: "Literario" },
          { depth: 5, validWords: ["insuperable", "excelso", "preclaro"], label: "Poético" },
        ],
      },
      {
        starterWord: "triste",
        starterTranslation: "sad",
        levels: [
          { depth: 1, validWords: ["mal", "bajo", "serio"], label: "Básico" },
          { depth: 2, validWords: ["melancólico", "deprimido", "apenado"], label: "Intermedio" },
          { depth: 3, validWords: ["afligido", "abatido", "apesadumbrado"], label: "Avanzado" },
          { depth: 4, validWords: ["desconsolado", "desolado", "acongojado"], label: "Literario" },
          { depth: 5, validWords: ["atribulado", "contrito", "lánguido"], label: "Poético" },
        ],
      },
      {
        starterWord: "rápido",
        starterTranslation: "fast",
        levels: [
          { depth: 1, validWords: ["pronto", "ligero", "ágil"], label: "Básico" },
          { depth: 2, validWords: ["veloz", "raudo", "presuroso"], label: "Intermedio" },
          { depth: 3, validWords: ["vertiginoso", "impetuoso", "acelerado"], label: "Avanzado" },
          { depth: 4, validWords: ["fulminante", "fulgurante", "trepidante"], label: "Literario" },
          { depth: 5, validWords: ["meteórico", "arrebatado", "celerísimo"], label: "Poético" },
        ],
      },
      {
        starterWord: "bonito",
        starterTranslation: "pretty",
        levels: [
          { depth: 1, validWords: ["lindo", "guapo", "bello"], label: "Básico" },
          { depth: 2, validWords: ["hermoso", "precioso", "atractivo"], label: "Intermedio" },
          { depth: 3, validWords: ["espléndido", "radiante", "magnífico"], label: "Avanzado" },
          { depth: 4, validWords: ["deslumbrante", "exquisito", "sublime"], label: "Literario" },
          { depth: 5, validWords: ["fastuoso", "impoluto", "primoroso"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 2,
    language: "es",
    date: "2026-02-18",
    chains: [
      {
        starterWord: "pequeño",
        starterTranslation: "small",
        levels: [
          { depth: 1, validWords: ["bajo", "corto", "chico"], label: "Básico" },
          { depth: 2, validWords: ["reducido", "diminuto", "menudo"], label: "Intermedio" },
          { depth: 3, validWords: ["minúsculo", "ínfimo", "exiguo"], label: "Avanzado" },
          { depth: 4, validWords: ["microscópico", "imperceptible", "inapreciable"], label: "Literario" },
          { depth: 5, validWords: ["liliputiense", "infinitesimal", "corpuscular"], label: "Poético" },
        ],
      },
      {
        starterWord: "fuerte",
        starterTranslation: "strong",
        levels: [
          { depth: 1, validWords: ["duro", "firme", "sólido"], label: "Básico" },
          { depth: 2, validWords: ["potente", "robusto", "vigoroso"], label: "Intermedio" },
          { depth: 3, validWords: ["formidable", "hercúleo", "recio"], label: "Avanzado" },
          { depth: 4, validWords: ["inquebrantable", "inexpugnable", "férreo"], label: "Literario" },
          { depth: 5, validWords: ["inconmovible", "adamantino", "invulnerable"], label: "Poético" },
        ],
      },
      {
        starterWord: "viejo",
        starterTranslation: "old",
        levels: [
          { depth: 1, validWords: ["mayor", "pasado", "usado"], label: "Básico" },
          { depth: 2, validWords: ["antiguo", "ancestral", "añejo"], label: "Intermedio" },
          { depth: 3, validWords: ["vetusto", "arcaico", "longevo"], label: "Avanzado" },
          { depth: 4, validWords: ["antediluviano", "inmemorial", "milenario"], label: "Literario" },
          { depth: 5, validWords: ["primigenio", "sempiterno", "prístino"], label: "Poético" },
        ],
      },
      {
        starterWord: "malo",
        starterTranslation: "bad",
        levels: [
          { depth: 1, validWords: ["feo", "pobre", "peor"], label: "Básico" },
          { depth: 2, validWords: ["terrible", "horrible", "pésimo"], label: "Intermedio" },
          { depth: 3, validWords: ["nefasto", "atroz", "funesto"], label: "Avanzado" },
          { depth: 4, validWords: ["execrable", "abominable", "deplorable"], label: "Literario" },
          { depth: 5, validWords: ["ignominioso", "deleznable", "oprobioso"], label: "Poético" },
        ],
      },
      {
        starterWord: "feliz",
        starterTranslation: "happy",
        levels: [
          { depth: 1, validWords: ["alegre", "contento", "bien"], label: "Básico" },
          { depth: 2, validWords: ["dichoso", "encantado", "jubiloso"], label: "Intermedio" },
          { depth: 3, validWords: ["eufórico", "exultante", "radiante"], label: "Avanzado" },
          { depth: 4, validWords: ["bienaventurado", "venturoso", "alborozado"], label: "Literario" },
          { depth: 5, validWords: ["beatífico", "arrebatado", "extasiado"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 3,
    language: "es",
    date: "2026-02-19",
    chains: [
      {
        starterWord: "difícil",
        starterTranslation: "difficult",
        levels: [
          { depth: 1, validWords: ["duro", "malo", "serio"], label: "Básico" },
          { depth: 2, validWords: ["complicado", "complejo", "arduo"], label: "Intermedio" },
          { depth: 3, validWords: ["intrincado", "peliagudo", "escabroso"], label: "Avanzado" },
          { depth: 4, validWords: ["insondable", "inextricable", "enrevesado"], label: "Literario" },
          { depth: 5, validWords: ["laberíntico", "abstruso", "recóndito"], label: "Poético" },
        ],
      },
      {
        starterWord: "importante",
        starterTranslation: "important",
        levels: [
          { depth: 1, validWords: ["serio", "grande", "clave"], label: "Básico" },
          { depth: 2, validWords: ["esencial", "fundamental", "crucial"], label: "Intermedio" },
          { depth: 3, validWords: ["trascendental", "primordial", "cardinal"], label: "Avanzado" },
          { depth: 4, validWords: ["insoslayable", "ineludible", "imperioso"], label: "Literario" },
          { depth: 5, validWords: ["perentorio", "magisterial", "basilar"], label: "Poético" },
        ],
      },
      {
        starterWord: "rico",
        starterTranslation: "rich",
        levels: [
          { depth: 1, validWords: ["bueno", "sabroso", "fino"], label: "Básico" },
          { depth: 2, validWords: ["adinerado", "acaudalado", "próspero"], label: "Intermedio" },
          { depth: 3, validWords: ["opulento", "pudiente", "holgado"], label: "Avanzado" },
          { depth: 4, validWords: ["fastuoso", "esplendoroso", "suntuoso"], label: "Literario" },
          { depth: 5, validWords: ["dadivoso", "craso", "munificente"], label: "Poético" },
        ],
      },
      {
        starterWord: "miedo",
        starterTranslation: "fear",
        levels: [
          { depth: 1, validWords: ["susto", "temor", "horror"], label: "Básico" },
          { depth: 2, validWords: ["pánico", "terror", "espanto"], label: "Intermedio" },
          { depth: 3, validWords: ["pavor", "angustia", "desasosiego"], label: "Avanzado" },
          { depth: 4, validWords: ["consternación", "zozobra", "congoja"], label: "Literario" },
          { depth: 5, validWords: ["desazón", "tribulación", "aciago"], label: "Poético" },
        ],
      },
      {
        starterWord: "oscuro",
        starterTranslation: "dark",
        levels: [
          { depth: 1, validWords: ["negro", "gris", "sombrío"], label: "Básico" },
          { depth: 2, validWords: ["tenebroso", "lúgubre", "opaco"], label: "Intermedio" },
          { depth: 3, validWords: ["caliginoso", "umbrío", "penumbroso"], label: "Avanzado" },
          { depth: 4, validWords: ["ominoso", "insondable", "abismal"], label: "Literario" },
          { depth: 5, validWords: ["estigio", "crepuscular", "noctívago"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 4,
    language: "es",
    date: "2026-02-20",
    chains: [
      {
        starterWord: "hablar",
        starterTranslation: "to speak",
        levels: [
          { depth: 1, validWords: ["decir", "contar", "charlar"], label: "Básico" },
          { depth: 2, validWords: ["conversar", "dialogar", "comentar"], label: "Intermedio" },
          { depth: 3, validWords: ["departir", "disertar", "parlamentar"], label: "Avanzado" },
          { depth: 4, validWords: ["perorar", "arengar", "proclamar"], label: "Literario" },
          { depth: 5, validWords: ["declamar", "apostrofar", "pontificar"], label: "Poético" },
        ],
      },
      {
        starterWord: "andar",
        starterTranslation: "to walk",
        levels: [
          { depth: 1, validWords: ["ir", "pasar", "mover"], label: "Básico" },
          { depth: 2, validWords: ["caminar", "pasear", "recorrer"], label: "Intermedio" },
          { depth: 3, validWords: ["deambular", "transitar", "vagar"], label: "Avanzado" },
          { depth: 4, validWords: ["peregrinar", "errabundear", "merodear"], label: "Literario" },
          { depth: 5, validWords: ["trashumar", "divagar", "hollar"], label: "Poético" },
        ],
      },
      {
        starterWord: "comer",
        starterTranslation: "to eat",
        levels: [
          { depth: 1, validWords: ["tomar", "probar", "cenar"], label: "Básico" },
          { depth: 2, validWords: ["devorar", "saborear", "ingerir"], label: "Intermedio" },
          { depth: 3, validWords: ["degustar", "engullir", "zampar"], label: "Avanzado" },
          { depth: 4, validWords: ["paladear", "deglutir", "yantar"], label: "Literario" },
          { depth: 5, validWords: ["libar", "manducar", "trasegar"], label: "Poético" },
        ],
      },
      {
        starterWord: "llorar",
        starterTranslation: "to cry",
        levels: [
          { depth: 1, validWords: ["gritar", "gemir", "sufrir"], label: "Básico" },
          { depth: 2, validWords: ["sollozar", "lamentarse", "gimotear"], label: "Intermedio" },
          { depth: 3, validWords: ["plañir", "lloriquear", "desahogarse"], label: "Avanzado" },
          { depth: 4, validWords: ["deplorar", "dolerse", "condolerse"], label: "Literario" },
          { depth: 5, validWords: ["lacrimear", "clamar", "apostrofar"], label: "Poético" },
        ],
      },
      {
        starterWord: "brillar",
        starterTranslation: "to shine",
        levels: [
          { depth: 1, validWords: ["lucir", "alumbrar", "iluminar"], label: "Básico" },
          { depth: 2, validWords: ["relucir", "resplandecer", "centellear"], label: "Intermedio" },
          { depth: 3, validWords: ["fulgurar", "destellar", "rielar"], label: "Avanzado" },
          { depth: 4, validWords: ["irradiar", "refulgir", "rutilar"], label: "Literario" },
          { depth: 5, validWords: ["coruscar", "cintilar", "fosforecer"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 5,
    language: "es",
    date: "2026-02-21",
    chains: [
      {
        starterWord: "frío",
        starterTranslation: "cold",
        levels: [
          { depth: 1, validWords: ["helado", "freso", "duro"], label: "Básico" },
          { depth: 2, validWords: ["gélido", "glacial", "congelado"], label: "Intermedio" },
          { depth: 3, validWords: ["álgido", "invernal", "inclemente"], label: "Avanzado" },
          { depth: 4, validWords: ["hiperbóreo", "boreal", "crudo"], label: "Literario" },
          { depth: 5, validWords: ["cierzo", "septentrional", "brumoso"], label: "Poético" },
        ],
      },
      {
        starterWord: "caliente",
        starterTranslation: "hot",
        levels: [
          { depth: 1, validWords: ["tibio", "cálido", "templado"], label: "Básico" },
          { depth: 2, validWords: ["ardiente", "abrasador", "sofocante"], label: "Intermedio" },
          { depth: 3, validWords: ["candente", "tórrido", "incandescente"], label: "Avanzado" },
          { depth: 4, validWords: ["ígneo", "flamígero", "volcánico"], label: "Literario" },
          { depth: 5, validWords: ["pirético", "canicular", "estival"], label: "Poético" },
        ],
      },
      {
        starterWord: "nuevo",
        starterTranslation: "new",
        levels: [
          { depth: 1, validWords: ["joven", "fresco", "reciente"], label: "Básico" },
          { depth: 2, validWords: ["moderno", "actual", "flamante"], label: "Intermedio" },
          { depth: 3, validWords: ["novedoso", "innovador", "inédito"], label: "Avanzado" },
          { depth: 4, validWords: ["vanguardista", "precursor", "incipiente"], label: "Literario" },
          { depth: 5, validWords: ["primicial", "neófito", "prístino"], label: "Poético" },
        ],
      },
      {
        starterWord: "lento",
        starterTranslation: "slow",
        levels: [
          { depth: 1, validWords: ["despacio", "suave", "tranquilo"], label: "Básico" },
          { depth: 2, validWords: ["pausado", "gradual", "calmoso"], label: "Intermedio" },
          { depth: 3, validWords: ["parsimonioso", "cachazudo", "moroso"], label: "Avanzado" },
          { depth: 4, validWords: ["flemático", "indolente", "soporífero"], label: "Literario" },
          { depth: 5, validWords: ["cadencioso", "lánguido", "aletargado"], label: "Poético" },
        ],
      },
      {
        starterWord: "inteligente",
        starterTranslation: "intelligent",
        levels: [
          { depth: 1, validWords: ["listo", "hábil", "sabio"], label: "Básico" },
          { depth: 2, validWords: ["brillante", "ingenioso", "astuto"], label: "Intermedio" },
          { depth: 3, validWords: ["perspicaz", "sagaz", "agudo"], label: "Avanzado" },
          { depth: 4, validWords: ["clarividente", "preclaro", "lúcido"], label: "Literario" },
          { depth: 5, validWords: ["erudito", "prístino", "sapiente"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 6,
    language: "es",
    date: "2026-02-22",
    chains: [
      {
        starterWord: "silencio",
        starterTranslation: "silence",
        levels: [
          { depth: 1, validWords: ["paz", "calma", "quietud"], label: "Básico" },
          { depth: 2, validWords: ["tranquilidad", "serenidad", "sosiego"], label: "Intermedio" },
          { depth: 3, validWords: ["mutismo", "sigilo", "taciturnidad"], label: "Avanzado" },
          { depth: 4, validWords: ["hermetismo", "recogimiento", "clausura"], label: "Literario" },
          { depth: 5, validWords: ["enmudecimiento", "aquietamiento", "ataraxia"], label: "Poético" },
        ],
      },
      {
        starterWord: "raro",
        starterTranslation: "strange",
        levels: [
          { depth: 1, validWords: ["extraño", "diferente", "único"], label: "Básico" },
          { depth: 2, validWords: ["peculiar", "singular", "insólito"], label: "Intermedio" },
          { depth: 3, validWords: ["estrambótico", "extravagante", "pintoresco"], label: "Avanzado" },
          { depth: 4, validWords: ["peregrino", "bizarro", "inclasificable"], label: "Literario" },
          { depth: 5, validWords: ["quimérico", "esperpéntico", "kafkiano"], label: "Poético" },
        ],
      },
      {
        starterWord: "valiente",
        starterTranslation: "brave",
        levels: [
          { depth: 1, validWords: ["fuerte", "duro", "seguro"], label: "Básico" },
          { depth: 2, validWords: ["audaz", "intrépido", "decidido"], label: "Intermedio" },
          { depth: 3, validWords: ["osado", "temerario", "denodado"], label: "Avanzado" },
          { depth: 4, validWords: ["aguerrido", "impávido", "indomable"], label: "Literario" },
          { depth: 5, validWords: ["estoico", "invicto", "impertérrito"], label: "Poético" },
        ],
      },
      {
        starterWord: "peligroso",
        starterTranslation: "dangerous",
        levels: [
          { depth: 1, validWords: ["malo", "duro", "grave"], label: "Básico" },
          { depth: 2, validWords: ["arriesgado", "amenazante", "temible"], label: "Intermedio" },
          { depth: 3, validWords: ["aciago", "funesto", "pernicioso"], label: "Avanzado" },
          { depth: 4, validWords: ["deletéreo", "insidioso", "mortífero"], label: "Literario" },
          { depth: 5, validWords: ["letal", "ignífugo", "fulminante"], label: "Poético" },
        ],
      },
      {
        starterWord: "agua",
        starterTranslation: "water",
        levels: [
          { depth: 1, validWords: ["lluvia", "río", "mar"], label: "Básico" },
          { depth: 2, validWords: ["torrente", "oleaje", "caudal"], label: "Intermedio" },
          { depth: 3, validWords: ["raudal", "manantial", "afluente"], label: "Avanzado" },
          { depth: 4, validWords: ["venero", "vertiente", "hontanar"], label: "Literario" },
          { depth: 5, validWords: ["fontana", "linfa", "piélago"], label: "Poético" },
        ],
      },
    ],
  },
  {
    number: 7,
    language: "es",
    date: "2026-02-23",
    chains: [
      {
        starterWord: "luz",
        starterTranslation: "light",
        levels: [
          { depth: 1, validWords: ["sol", "brillo", "claro"], label: "Básico" },
          { depth: 2, validWords: ["resplandor", "luminosidad", "claridad"], label: "Intermedio" },
          { depth: 3, validWords: ["fulgor", "destello", "centelleo"], label: "Avanzado" },
          { depth: 4, validWords: ["refulgencia", "iridiscencia", "fosforescencia"], label: "Literario" },
          { depth: 5, validWords: ["nimbosidad", "aureola", "nimbo"], label: "Poético" },
        ],
      },
      {
        starterWord: "camino",
        starterTranslation: "path",
        levels: [
          { depth: 1, validWords: ["calle", "ruta", "vía"], label: "Básico" },
          { depth: 2, validWords: ["sendero", "trayecto", "recorrido"], label: "Intermedio" },
          { depth: 3, validWords: ["travesía", "vereda", "derrotero"], label: "Avanzado" },
          { depth: 4, validWords: ["periplo", "itinerario", "singladura"], label: "Literario" },
          { depth: 5, validWords: ["peregrinaje", "deambular", "éxodo"], label: "Poético" },
        ],
      },
      {
        starterWord: "casa",
        starterTranslation: "house",
        levels: [
          { depth: 1, validWords: ["piso", "hogar", "lugar"], label: "Básico" },
          { depth: 2, validWords: ["residencia", "vivienda", "domicilio"], label: "Intermedio" },
          { depth: 3, validWords: ["morada", "mansión", "hacienda"], label: "Avanzado" },
          { depth: 4, validWords: ["alcázar", "palacete", "bastión"], label: "Literario" },
          { depth: 5, validWords: ["aposento", "recinto", "solar"], label: "Poético" },
        ],
      },
      {
        starterWord: "amigo",
        starterTranslation: "friend",
        levels: [
          { depth: 1, validWords: ["compañero", "colega", "socio"], label: "Básico" },
          { depth: 2, validWords: ["camarada", "confidente", "aliado"], label: "Intermedio" },
          { depth: 3, validWords: ["cómplice", "allegado", "correligionario"], label: "Avanzado" },
          { depth: 4, validWords: ["cofrade", "conmilitón", "acólito"], label: "Literario" },
          { depth: 5, validWords: ["álter ego", "consanguíneo", "deudo"], label: "Poético" },
        ],
      },
      {
        starterWord: "pensar",
        starterTranslation: "to think",
        levels: [
          { depth: 1, validWords: ["creer", "saber", "ver"], label: "Básico" },
          { depth: 2, validWords: ["reflexionar", "considerar", "meditar"], label: "Intermedio" },
          { depth: 3, validWords: ["cavilar", "deliberar", "discurrir"], label: "Avanzado" },
          { depth: 4, validWords: ["elucubrar", "rumiar", "especular"], label: "Literario" },
          { depth: 5, validWords: ["filosofar", "conjeturar", "musitar"], label: "Poético" },
        ],
      },
    ],
  },
];
