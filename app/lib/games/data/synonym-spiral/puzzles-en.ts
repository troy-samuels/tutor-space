import type { SynonymSpiralPuzzle } from "./types";

/**
 * English Synonym Spiral puzzles.
 * Each puzzle has 5 chains. Each chain has 5 depth levels.
 * Perfect for ESL learners expanding vocabulary from basic → advanced → literary.
 */
export const PUZZLES_EN: SynonymSpiralPuzzle[] = [
  {
    number: 1,
    language: "en",
    date: "2026-02-17",
    chains: [
      {
        starterWord: "big",
        starterTranslation: "grande",
        levels: [
          { depth: 1, validWords: ["large", "tall", "wide"], label: "Basic" },
          { depth: 2, validWords: ["enormous", "huge", "vast"], label: "Intermediate" },
          { depth: 3, validWords: ["immense", "colossal", "gigantic"], label: "Advanced" },
          { depth: 4, validWords: ["monumental", "gargantuan", "mammoth"], label: "Literary" },
          { depth: 5, validWords: ["behemoth", "titanic", "brobdingnagian"], label: "Poetic" },
        ],
      },
      {
        starterWord: "good",
        starterTranslation: "bueno",
        levels: [
          { depth: 1, validWords: ["nice", "fine", "great"], label: "Basic" },
          { depth: 2, validWords: ["excellent", "wonderful", "fantastic"], label: "Intermediate" },
          { depth: 3, validWords: ["outstanding", "superb", "exceptional"], label: "Advanced" },
          { depth: 4, validWords: ["magnificent", "sublime", "superlative"], label: "Literary" },
          { depth: 5, validWords: ["transcendent", "peerless", "unparalleled"], label: "Poetic" },
        ],
      },
      {
        starterWord: "sad",
        starterTranslation: "triste",
        levels: [
          { depth: 1, validWords: ["upset", "unhappy", "down"], label: "Basic" },
          { depth: 2, validWords: ["miserable", "gloomy", "depressed"], label: "Intermediate" },
          { depth: 3, validWords: ["melancholy", "despondent", "dejected"], label: "Advanced" },
          { depth: 4, validWords: ["disconsolate", "forlorn", "woebegone"], label: "Literary" },
          { depth: 5, validWords: ["lachrymose", "lugubrious", "crestfallen"], label: "Poetic" },
        ],
      },
      {
        starterWord: "fast",
        starterTranslation: "rápido",
        levels: [
          { depth: 1, validWords: ["quick", "rapid", "speedy"], label: "Basic" },
          { depth: 2, validWords: ["swift", "brisk", "hasty"], label: "Intermediate" },
          { depth: 3, validWords: ["nimble", "fleet", "expeditious"], label: "Advanced" },
          { depth: 4, validWords: ["meteoric", "breakneck", "blistering"], label: "Literary" },
          { depth: 5, validWords: ["fulgurant", "precipitous", "alacritous"], label: "Poetic" },
        ],
      },
      {
        starterWord: "small",
        starterTranslation: "pequeño",
        levels: [
          { depth: 1, validWords: ["little", "tiny", "short"], label: "Basic" },
          { depth: 2, validWords: ["miniature", "compact", "petite"], label: "Intermediate" },
          { depth: 3, validWords: ["diminutive", "minuscule", "microscopic"], label: "Advanced" },
          { depth: 4, validWords: ["infinitesimal", "negligible", "imperceptible"], label: "Literary" },
          { depth: 5, validWords: ["lilliputian", "homuncular", "exiguous"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 2,
    language: "en",
    date: "2026-02-18",
    chains: [
      {
        starterWord: "angry",
        starterTranslation: "enfadado",
        levels: [
          { depth: 1, validWords: ["mad", "cross", "annoyed"], label: "Basic" },
          { depth: 2, validWords: ["furious", "outraged", "livid"], label: "Intermediate" },
          { depth: 3, validWords: ["incensed", "irate", "enraged"], label: "Advanced" },
          { depth: 4, validWords: ["apoplectic", "wrathful", "seething"], label: "Literary" },
          { depth: 5, validWords: ["choleric", "splenetic", "irascible"], label: "Poetic" },
        ],
      },
      {
        starterWord: "beautiful",
        starterTranslation: "hermoso",
        levels: [
          { depth: 1, validWords: ["pretty", "lovely", "attractive"], label: "Basic" },
          { depth: 2, validWords: ["gorgeous", "stunning", "elegant"], label: "Intermediate" },
          { depth: 3, validWords: ["exquisite", "radiant", "ravishing"], label: "Advanced" },
          { depth: 4, validWords: ["resplendent", "sublime", "ethereal"], label: "Literary" },
          { depth: 5, validWords: ["pulchritudinous", "beatific", "ineffable"], label: "Poetic" },
        ],
      },
      {
        starterWord: "smart",
        starterTranslation: "inteligente",
        levels: [
          { depth: 1, validWords: ["clever", "bright", "sharp"], label: "Basic" },
          { depth: 2, validWords: ["brilliant", "gifted", "talented"], label: "Intermediate" },
          { depth: 3, validWords: ["ingenious", "astute", "perceptive"], label: "Advanced" },
          { depth: 4, validWords: ["sagacious", "perspicacious", "erudite"], label: "Literary" },
          { depth: 5, validWords: ["polymathic", "sapient", "omniscient"], label: "Poetic" },
        ],
      },
      {
        starterWord: "scary",
        starterTranslation: "aterrador",
        levels: [
          { depth: 1, validWords: ["frightening", "creepy", "spooky"], label: "Basic" },
          { depth: 2, validWords: ["terrifying", "horrifying", "dreadful"], label: "Intermediate" },
          { depth: 3, validWords: ["harrowing", "ghastly", "macabre"], label: "Advanced" },
          { depth: 4, validWords: ["eldritch", "nightmarish", "abominable"], label: "Literary" },
          { depth: 5, validWords: ["phantasmagoric", "stygian", "sepulchral"], label: "Poetic" },
        ],
      },
      {
        starterWord: "old",
        starterTranslation: "viejo",
        levels: [
          { depth: 1, validWords: ["aged", "elderly", "ancient"], label: "Basic" },
          { depth: 2, validWords: ["vintage", "antique", "mature"], label: "Intermediate" },
          { depth: 3, validWords: ["archaic", "venerable", "decrepit"], label: "Advanced" },
          { depth: 4, validWords: ["primordial", "primeval", "antiquated"], label: "Literary" },
          { depth: 5, validWords: ["antediluvian", "hoary", "immemorial"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 3,
    language: "en",
    date: "2026-02-19",
    chains: [
      {
        starterWord: "happy",
        starterTranslation: "feliz",
        levels: [
          { depth: 1, validWords: ["glad", "cheerful", "pleased"], label: "Basic" },
          { depth: 2, validWords: ["delighted", "thrilled", "overjoyed"], label: "Intermediate" },
          { depth: 3, validWords: ["elated", "euphoric", "ecstatic"], label: "Advanced" },
          { depth: 4, validWords: ["rapturous", "blissful", "exultant"], label: "Literary" },
          { depth: 5, validWords: ["beatific", "rhapsodic", "ebullient"], label: "Poetic" },
        ],
      },
      {
        starterWord: "cold",
        starterTranslation: "frío",
        levels: [
          { depth: 1, validWords: ["cool", "chilly", "icy"], label: "Basic" },
          { depth: 2, validWords: ["freezing", "frosty", "bitter"], label: "Intermediate" },
          { depth: 3, validWords: ["glacial", "frigid", "arctic"], label: "Advanced" },
          { depth: 4, validWords: ["gelid", "hyperborean", "wintry"], label: "Literary" },
          { depth: 5, validWords: ["cryogenic", "boreal", "algid"], label: "Poetic" },
        ],
      },
      {
        starterWord: "loud",
        starterTranslation: "ruidoso",
        levels: [
          { depth: 1, validWords: ["noisy", "rowdy", "booming"], label: "Basic" },
          { depth: 2, validWords: ["deafening", "thunderous", "blaring"], label: "Intermediate" },
          { depth: 3, validWords: ["cacophonous", "clamorous", "resounding"], label: "Advanced" },
          { depth: 4, validWords: ["stentorian", "tumultuous", "vociferous"], label: "Literary" },
          { depth: 5, validWords: ["obstreperous", "stridulent", "fortissimo"], label: "Poetic" },
        ],
      },
      {
        starterWord: "quiet",
        starterTranslation: "silencioso",
        levels: [
          { depth: 1, validWords: ["silent", "soft", "calm"], label: "Basic" },
          { depth: 2, validWords: ["hushed", "muted", "subdued"], label: "Intermediate" },
          { depth: 3, validWords: ["tranquil", "serene", "placid"], label: "Advanced" },
          { depth: 4, validWords: ["quiescent", "reticent", "taciturn"], label: "Literary" },
          { depth: 5, validWords: ["sepulchral", "inaudible", "sotto voce"], label: "Poetic" },
        ],
      },
      {
        starterWord: "strong",
        starterTranslation: "fuerte",
        levels: [
          { depth: 1, validWords: ["tough", "powerful", "solid"], label: "Basic" },
          { depth: 2, validWords: ["mighty", "robust", "sturdy"], label: "Intermediate" },
          { depth: 3, validWords: ["formidable", "resilient", "indomitable"], label: "Advanced" },
          { depth: 4, validWords: ["herculean", "stalwart", "tenacious"], label: "Literary" },
          { depth: 5, validWords: ["adamantine", "invincible", "inexorable"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 4,
    language: "en",
    date: "2026-02-20",
    chains: [
      {
        starterWord: "walk",
        starterTranslation: "caminar",
        levels: [
          { depth: 1, validWords: ["stroll", "step", "pace"], label: "Basic" },
          { depth: 2, validWords: ["stride", "march", "trek"], label: "Intermediate" },
          { depth: 3, validWords: ["saunter", "amble", "meander"], label: "Advanced" },
          { depth: 4, validWords: ["perambulate", "promenade", "traipse"], label: "Literary" },
          { depth: 5, validWords: ["peregrinate", "circumambulate", "sojourn"], label: "Poetic" },
        ],
      },
      {
        starterWord: "eat",
        starterTranslation: "comer",
        levels: [
          { depth: 1, validWords: ["bite", "chew", "munch"], label: "Basic" },
          { depth: 2, validWords: ["devour", "consume", "feast"], label: "Intermediate" },
          { depth: 3, validWords: ["gorge", "savour", "relish"], label: "Advanced" },
          { depth: 4, validWords: ["masticate", "partake", "indulge"], label: "Literary" },
          { depth: 5, validWords: ["gormandize", "ingurgitate", "epicurean"], label: "Poetic" },
        ],
      },
      {
        starterWord: "tired",
        starterTranslation: "cansado",
        levels: [
          { depth: 1, validWords: ["sleepy", "weary", "worn out"], label: "Basic" },
          { depth: 2, validWords: ["exhausted", "drained", "fatigued"], label: "Intermediate" },
          { depth: 3, validWords: ["debilitated", "enervated", "haggard"], label: "Advanced" },
          { depth: 4, validWords: ["languishing", "prostrate", "spent"], label: "Literary" },
          { depth: 5, validWords: ["somnolent", "lassitudinous", "moribund"], label: "Poetic" },
        ],
      },
      {
        starterWord: "dark",
        starterTranslation: "oscuro",
        levels: [
          { depth: 1, validWords: ["dim", "gloomy", "shady"], label: "Basic" },
          { depth: 2, validWords: ["murky", "shadowy", "dusky"], label: "Intermediate" },
          { depth: 3, validWords: ["sombre", "tenebrous", "opaque"], label: "Advanced" },
          { depth: 4, validWords: ["crepuscular", "stygian", "umbral"], label: "Literary" },
          { depth: 5, validWords: ["caliginous", "fuliginous", "nubilous"], label: "Poetic" },
        ],
      },
      {
        starterWord: "rich",
        starterTranslation: "rico",
        levels: [
          { depth: 1, validWords: ["wealthy", "loaded", "well-off"], label: "Basic" },
          { depth: 2, validWords: ["affluent", "prosperous", "thriving"], label: "Intermediate" },
          { depth: 3, validWords: ["opulent", "lavish", "sumptuous"], label: "Advanced" },
          { depth: 4, validWords: ["plutocratic", "magnate", "munificent"], label: "Literary" },
          { depth: 5, validWords: ["Croesean", "sybaritic", "pecunious"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 5,
    language: "en",
    date: "2026-02-21",
    chains: [
      {
        starterWord: "brave",
        starterTranslation: "valiente",
        levels: [
          { depth: 1, validWords: ["bold", "daring", "fearless"], label: "Basic" },
          { depth: 2, validWords: ["courageous", "heroic", "gallant"], label: "Intermediate" },
          { depth: 3, validWords: ["intrepid", "valiant", "audacious"], label: "Advanced" },
          { depth: 4, validWords: ["dauntless", "indomitable", "resolute"], label: "Literary" },
          { depth: 5, validWords: ["lionhearted", "undaunted", "stouthearted"], label: "Poetic" },
        ],
      },
      {
        starterWord: "lazy",
        starterTranslation: "perezoso",
        levels: [
          { depth: 1, validWords: ["idle", "slow", "inactive"], label: "Basic" },
          { depth: 2, validWords: ["sluggish", "lethargic", "listless"], label: "Intermediate" },
          { depth: 3, validWords: ["indolent", "slothful", "languid"], label: "Advanced" },
          { depth: 4, validWords: ["torpid", "supine", "otiose"], label: "Literary" },
          { depth: 5, validWords: ["fainéant", "shiftless", "somniferous"], label: "Poetic" },
        ],
      },
      {
        starterWord: "wet",
        starterTranslation: "mojado",
        levels: [
          { depth: 1, validWords: ["damp", "moist", "soggy"], label: "Basic" },
          { depth: 2, validWords: ["soaked", "drenched", "sopping"], label: "Intermediate" },
          { depth: 3, validWords: ["saturated", "waterlogged", "sodden"], label: "Advanced" },
          { depth: 4, validWords: ["deluged", "inundated", "awash"], label: "Literary" },
          { depth: 5, validWords: ["bedraggled", "cataclysmic", "diluvial"], label: "Poetic" },
        ],
      },
      {
        starterWord: "thin",
        starterTranslation: "delgado",
        levels: [
          { depth: 1, validWords: ["slim", "skinny", "lean"], label: "Basic" },
          { depth: 2, validWords: ["slender", "slight", "svelte"], label: "Intermediate" },
          { depth: 3, validWords: ["gaunt", "wiry", "lanky"], label: "Advanced" },
          { depth: 4, validWords: ["emaciated", "skeletal", "wraith-like"], label: "Literary" },
          { depth: 5, validWords: ["cadaverous", "etiolated", "attenuated"], label: "Poetic" },
        ],
      },
      {
        starterWord: "weird",
        starterTranslation: "raro",
        levels: [
          { depth: 1, validWords: ["strange", "odd", "funny"], label: "Basic" },
          { depth: 2, validWords: ["peculiar", "unusual", "bizarre"], label: "Intermediate" },
          { depth: 3, validWords: ["eccentric", "anomalous", "uncanny"], label: "Advanced" },
          { depth: 4, validWords: ["aberrant", "outlandish", "surreal"], label: "Literary" },
          { depth: 5, validWords: ["eldritch", "preternatural", "ineffable"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 6,
    language: "en",
    date: "2026-02-22",
    chains: [
      {
        starterWord: "look",
        starterTranslation: "mirar",
        levels: [
          { depth: 1, validWords: ["see", "watch", "stare"], label: "Basic" },
          { depth: 2, validWords: ["gaze", "glance", "peer"], label: "Intermediate" },
          { depth: 3, validWords: ["scrutinise", "survey", "ogle"], label: "Advanced" },
          { depth: 4, validWords: ["behold", "contemplate", "discern"], label: "Literary" },
          { depth: 5, validWords: ["descry", "espy", "peruse"], label: "Poetic" },
        ],
      },
      {
        starterWord: "say",
        starterTranslation: "decir",
        levels: [
          { depth: 1, validWords: ["tell", "speak", "talk"], label: "Basic" },
          { depth: 2, validWords: ["state", "declare", "mention"], label: "Intermediate" },
          { depth: 3, validWords: ["proclaim", "assert", "articulate"], label: "Advanced" },
          { depth: 4, validWords: ["pontificate", "expound", "enunciate"], label: "Literary" },
          { depth: 5, validWords: ["declaim", "propound", "promulgate"], label: "Poetic" },
        ],
      },
      {
        starterWord: "think",
        starterTranslation: "pensar",
        levels: [
          { depth: 1, validWords: ["believe", "guess", "feel"], label: "Basic" },
          { depth: 2, validWords: ["consider", "reflect", "ponder"], label: "Intermediate" },
          { depth: 3, validWords: ["contemplate", "deliberate", "ruminate"], label: "Advanced" },
          { depth: 4, validWords: ["cogitate", "meditate", "muse"], label: "Literary" },
          { depth: 5, validWords: ["cerebrate", "philosophise", "ratiocinate"], label: "Poetic" },
        ],
      },
      {
        starterWord: "hot",
        starterTranslation: "caliente",
        levels: [
          { depth: 1, validWords: ["warm", "boiling", "burning"], label: "Basic" },
          { depth: 2, validWords: ["scorching", "sizzling", "sweltering"], label: "Intermediate" },
          { depth: 3, validWords: ["blistering", "torrid", "sultry"], label: "Advanced" },
          { depth: 4, validWords: ["incandescent", "infernal", "volcanic"], label: "Literary" },
          { depth: 5, validWords: ["pyretic", "calorific", "igneous"], label: "Poetic" },
        ],
      },
      {
        starterWord: "new",
        starterTranslation: "nuevo",
        levels: [
          { depth: 1, validWords: ["fresh", "modern", "recent"], label: "Basic" },
          { depth: 2, validWords: ["novel", "innovative", "original"], label: "Intermediate" },
          { depth: 3, validWords: ["pioneering", "cutting-edge", "avant-garde"], label: "Advanced" },
          { depth: 4, validWords: ["nascent", "unprecedented", "groundbreaking"], label: "Literary" },
          { depth: 5, validWords: ["neoteric", "pristine", "inchoate"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 7,
    language: "en",
    date: "2026-02-23",
    chains: [
      {
        starterWord: "hard",
        starterTranslation: "difícil",
        levels: [
          { depth: 1, validWords: ["tough", "difficult", "tricky"], label: "Basic" },
          { depth: 2, validWords: ["challenging", "demanding", "strenuous"], label: "Intermediate" },
          { depth: 3, validWords: ["arduous", "gruelling", "formidable"], label: "Advanced" },
          { depth: 4, validWords: ["Herculean", "laborious", "onerous"], label: "Literary" },
          { depth: 5, validWords: ["Sisyphean", "insuperable", "Promethean"], label: "Poetic" },
        ],
      },
      {
        starterWord: "kind",
        starterTranslation: "amable",
        levels: [
          { depth: 1, validWords: ["nice", "friendly", "gentle"], label: "Basic" },
          { depth: 2, validWords: ["generous", "thoughtful", "caring"], label: "Intermediate" },
          { depth: 3, validWords: ["compassionate", "benevolent", "gracious"], label: "Advanced" },
          { depth: 4, validWords: ["magnanimous", "altruistic", "philanthropic"], label: "Literary" },
          { depth: 5, validWords: ["munificent", "bounteous", "eleemosynary"], label: "Poetic" },
        ],
      },
      {
        starterWord: "mean",
        starterTranslation: "cruel",
        levels: [
          { depth: 1, validWords: ["cruel", "nasty", "harsh"], label: "Basic" },
          { depth: 2, validWords: ["ruthless", "heartless", "vicious"], label: "Intermediate" },
          { depth: 3, validWords: ["malicious", "callous", "vindictive"], label: "Advanced" },
          { depth: 4, validWords: ["nefarious", "diabolical", "pernicious"], label: "Literary" },
          { depth: 5, validWords: ["maleficent", "iniquitous", "flagitious"], label: "Poetic" },
        ],
      },
      {
        starterWord: "clean",
        starterTranslation: "limpio",
        levels: [
          { depth: 1, validWords: ["tidy", "neat", "pure"], label: "Basic" },
          { depth: 2, validWords: ["spotless", "immaculate", "hygienic"], label: "Intermediate" },
          { depth: 3, validWords: ["pristine", "unblemished", "sanitised"], label: "Advanced" },
          { depth: 4, validWords: ["undefiled", "unsullied", "unadulterated"], label: "Literary" },
          { depth: 5, validWords: ["immaculate", "inviolate", "abluted"], label: "Poetic" },
        ],
      },
      {
        starterWord: "run",
        starterTranslation: "correr",
        levels: [
          { depth: 1, validWords: ["jog", "dash", "rush"], label: "Basic" },
          { depth: 2, validWords: ["sprint", "bolt", "race"], label: "Intermediate" },
          { depth: 3, validWords: ["gallop", "hurtle", "career"], label: "Advanced" },
          { depth: 4, validWords: ["careen", "tear", "barrel"], label: "Literary" },
          { depth: 5, validWords: ["scamper", "scarper", "abscond"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 8,
    language: "en",
    date: "2026-02-24",
    chains: [
      {
        starterWord: "important",
        starterTranslation: "importante",
        levels: [
          { depth: 1, validWords: ["key", "major", "main"], label: "Basic" },
          { depth: 2, validWords: ["crucial", "vital", "essential"], label: "Intermediate" },
          { depth: 3, validWords: ["paramount", "pivotal", "indispensable"], label: "Advanced" },
          { depth: 4, validWords: ["cardinal", "preeminent", "imperative"], label: "Literary" },
          { depth: 5, validWords: ["sine qua non", "quintessential", "seminal"], label: "Poetic" },
        ],
      },
      {
        starterWord: "cry",
        starterTranslation: "llorar",
        levels: [
          { depth: 1, validWords: ["weep", "sob", "whine"], label: "Basic" },
          { depth: 2, validWords: ["wail", "howl", "bawl"], label: "Intermediate" },
          { depth: 3, validWords: ["lament", "keen", "mourn"], label: "Advanced" },
          { depth: 4, validWords: ["bewail", "ululate", "blubber"], label: "Literary" },
          { depth: 5, validWords: ["lacrimate", "caterwauling", "keening"], label: "Poetic" },
        ],
      },
      {
        starterWord: "laugh",
        starterTranslation: "reír",
        levels: [
          { depth: 1, validWords: ["giggle", "smile", "grin"], label: "Basic" },
          { depth: 2, validWords: ["chuckle", "snicker", "cackle"], label: "Intermediate" },
          { depth: 3, validWords: ["guffaw", "snigger", "chortle"], label: "Advanced" },
          { depth: 4, validWords: ["cachinnate", "titter", "convulse"], label: "Literary" },
          { depth: 5, validWords: ["risible", "mirthful", "uproarious"], label: "Poetic" },
        ],
      },
      {
        starterWord: "fight",
        starterTranslation: "pelear",
        levels: [
          { depth: 1, validWords: ["battle", "argue", "clash"], label: "Basic" },
          { depth: 2, validWords: ["struggle", "combat", "conflict"], label: "Intermediate" },
          { depth: 3, validWords: ["skirmish", "contend", "grapple"], label: "Advanced" },
          { depth: 4, validWords: ["joust", "feud", "wrangle"], label: "Literary" },
          { depth: 5, validWords: ["bellicose", "pugilistic", "internecine"], label: "Poetic" },
        ],
      },
      {
        starterWord: "boring",
        starterTranslation: "aburrido",
        levels: [
          { depth: 1, validWords: ["dull", "tedious", "bland"], label: "Basic" },
          { depth: 2, validWords: ["monotonous", "dreary", "tiresome"], label: "Intermediate" },
          { depth: 3, validWords: ["insipid", "vapid", "humdrum"], label: "Advanced" },
          { depth: 4, validWords: ["soporific", "pedestrian", "banal"], label: "Literary" },
          { depth: 5, validWords: ["anodyne", "jejune", "platitudinous"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 9,
    language: "en",
    date: "2026-02-25",
    chains: [
      {
        starterWord: "slow",
        starterTranslation: "lento",
        levels: [
          { depth: 1, validWords: ["steady", "gradual", "gentle"], label: "Basic" },
          { depth: 2, validWords: ["sluggish", "leisurely", "unhurried"], label: "Intermediate" },
          { depth: 3, validWords: ["languid", "ponderous", "deliberate"], label: "Advanced" },
          { depth: 4, validWords: ["torpid", "phlegmatic", "lethargic"], label: "Literary" },
          { depth: 5, validWords: ["dilatory", "somnambulant", "glacial"], label: "Poetic" },
        ],
      },
      {
        starterWord: "stupid",
        starterTranslation: "estúpido",
        levels: [
          { depth: 1, validWords: ["dumb", "silly", "foolish"], label: "Basic" },
          { depth: 2, validWords: ["idiotic", "moronic", "senseless"], label: "Intermediate" },
          { depth: 3, validWords: ["asinine", "obtuse", "fatuous"], label: "Advanced" },
          { depth: 4, validWords: ["imbecilic", "vacuous", "witless"], label: "Literary" },
          { depth: 5, validWords: ["cretinous", "puerile", "benighted"], label: "Poetic" },
        ],
      },
      {
        starterWord: "old",
        starterTranslation: "viejo",
        levels: [
          { depth: 1, validWords: ["aged", "elderly", "ancient"], label: "Basic" },
          { depth: 2, validWords: ["vintage", "antique", "mature"], label: "Intermediate" },
          { depth: 3, validWords: ["archaic", "venerable", "decrepit"], label: "Advanced" },
          { depth: 4, validWords: ["primordial", "primeval", "antiquated"], label: "Literary" },
          { depth: 5, validWords: ["antediluvian", "hoary", "immemorial"], label: "Poetic" },
        ],
      },
      {
        starterWord: "crazy",
        starterTranslation: "loco",
        levels: [
          { depth: 1, validWords: ["mad", "wild", "insane"], label: "Basic" },
          { depth: 2, validWords: ["deranged", "unhinged", "frenzied"], label: "Intermediate" },
          { depth: 3, validWords: ["manic", "demented", "delirious"], label: "Advanced" },
          { depth: 4, validWords: ["unbalanced", "psychotic", "certifiable"], label: "Literary" },
          { depth: 5, validWords: ["lunatic", "bedlamite", "maniacal"], label: "Poetic" },
        ],
      },
      {
        starterWord: "shy",
        starterTranslation: "tímido",
        levels: [
          { depth: 1, validWords: ["quiet", "timid", "reserved"], label: "Basic" },
          { depth: 2, validWords: ["bashful", "withdrawn", "introverted"], label: "Intermediate" },
          { depth: 3, validWords: ["reticent", "diffident", "demure"], label: "Advanced" },
          { depth: 4, validWords: ["self-effacing", "retiring", "coy"], label: "Literary" },
          { depth: 5, validWords: ["pusillanimous", "mousy", "wallflower"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 10,
    language: "en",
    date: "2026-02-26",
    chains: [
      {
        starterWord: "cheap",
        starterTranslation: "barato",
        levels: [
          { depth: 1, validWords: ["low-cost", "budget", "affordable"], label: "Basic" },
          { depth: 2, validWords: ["inexpensive", "economical", "bargain"], label: "Intermediate" },
          { depth: 3, validWords: ["frugal", "thrifty", "cut-rate"], label: "Advanced" },
          { depth: 4, validWords: ["penny-pinching", "parsimonious", "miserly"], label: "Literary" },
          { depth: 5, validWords: ["penurious", "niggardly", "cheese-paring"], label: "Poetic" },
        ],
      },
      {
        starterWord: "young",
        starterTranslation: "joven",
        levels: [
          { depth: 1, validWords: ["fresh", "junior", "teenage"], label: "Basic" },
          { depth: 2, validWords: ["youthful", "juvenile", "adolescent"], label: "Intermediate" },
          { depth: 3, validWords: ["nascent", "fledgling", "budding"], label: "Advanced" },
          { depth: 4, validWords: ["callow", "verdant", "neophyte"], label: "Literary" },
          { depth: 5, validWords: ["jejune", "embryonic", "pubescent"], label: "Poetic" },
        ],
      },
      {
        starterWord: "rude",
        starterTranslation: "grosero",
        levels: [
          { depth: 1, validWords: ["mean", "impolite", "cheeky"], label: "Basic" },
          { depth: 2, validWords: ["disrespectful", "insolent", "offensive"], label: "Intermediate" },
          { depth: 3, validWords: ["impudent", "discourteous", "boorish"], label: "Advanced" },
          { depth: 4, validWords: ["uncouth", "churlish", "loutish"], label: "Literary" },
          { depth: 5, validWords: ["philistine", "troglodyte", "boorish"], label: "Poetic" },
        ],
      },
      {
        starterWord: "fat",
        starterTranslation: "gordo",
        levels: [
          { depth: 1, validWords: ["chubby", "plump", "heavy"], label: "Basic" },
          { depth: 2, validWords: ["overweight", "stout", "portly"], label: "Intermediate" },
          { depth: 3, validWords: ["corpulent", "rotund", "stocky"], label: "Advanced" },
          { depth: 4, validWords: ["obese", "adipose", "paunchy"], label: "Literary" },
          { depth: 5, validWords: ["Falstaffian", "Rubenesque", "elephantine"], label: "Poetic" },
        ],
      },
      {
        starterWord: "poor",
        starterTranslation: "pobre",
        levels: [
          { depth: 1, validWords: ["broke", "needy", "skint"], label: "Basic" },
          { depth: 2, validWords: ["impoverished", "destitute", "bankrupt"], label: "Intermediate" },
          { depth: 3, validWords: ["indigent", "penniless", "insolvent"], label: "Advanced" },
          { depth: 4, validWords: ["penurious", "impecunious", "bereft"], label: "Literary" },
          { depth: 5, validWords: ["mendicant", "pauperised", "necessitous"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 11,
    language: "en",
    date: "2026-02-27",
    chains: [
      {
        starterWord: "careful",
        starterTranslation: "cuidadoso",
        levels: [
          { depth: 1, validWords: ["cautious", "safe", "aware"], label: "Basic" },
          { depth: 2, validWords: ["wary", "attentive", "vigilant"], label: "Intermediate" },
          { depth: 3, validWords: ["prudent", "circumspect", "meticulous"], label: "Advanced" },
          { depth: 4, validWords: ["scrupulous", "judicious", "punctilious"], label: "Literary" },
          { depth: 5, validWords: ["assiduous", "sedulous", "fastidious"], label: "Poetic" },
        ],
      },
      {
        starterWord: "empty",
        starterTranslation: "vacío",
        levels: [
          { depth: 1, validWords: ["blank", "bare", "hollow"], label: "Basic" },
          { depth: 2, validWords: ["vacant", "deserted", "barren"], label: "Intermediate" },
          { depth: 3, validWords: ["desolate", "devoid", "forsaken"], label: "Advanced" },
          { depth: 4, validWords: ["bereft", "vacuous", "void"], label: "Literary" },
          { depth: 5, validWords: ["tenantless", "unpeopled", "evacuated"], label: "Poetic" },
        ],
      },
      {
        starterWord: "shiny",
        starterTranslation: "brillante",
        levels: [
          { depth: 1, validWords: ["bright", "glossy", "sparkly"], label: "Basic" },
          { depth: 2, validWords: ["gleaming", "polished", "glittering"], label: "Intermediate" },
          { depth: 3, validWords: ["luminous", "radiant", "lustrous"], label: "Advanced" },
          { depth: 4, validWords: ["resplendent", "scintillating", "incandescent"], label: "Literary" },
          { depth: 5, validWords: ["coruscating", "effulgent", "lambent"], label: "Poetic" },
        ],
      },
      {
        starterWord: "soft",
        starterTranslation: "suave",
        levels: [
          { depth: 1, validWords: ["smooth", "gentle", "tender"], label: "Basic" },
          { depth: 2, validWords: ["silky", "velvety", "plush"], label: "Intermediate" },
          { depth: 3, validWords: ["supple", "yielding", "malleable"], label: "Advanced" },
          { depth: 4, validWords: ["downy", "gossamer", "diaphanous"], label: "Literary" },
          { depth: 5, validWords: ["ethereal", "gossamer", "zephyr-like"], label: "Poetic" },
        ],
      },
      {
        starterWord: "sharp",
        starterTranslation: "afilado",
        levels: [
          { depth: 1, validWords: ["keen", "pointed", "cutting"], label: "Basic" },
          { depth: 2, validWords: ["razor-sharp", "piercing", "incisive"], label: "Intermediate" },
          { depth: 3, validWords: ["trenchant", "acerbic", "caustic"], label: "Advanced" },
          { depth: 4, validWords: ["mordant", "vitriolic", "astringent"], label: "Literary" },
          { depth: 5, validWords: ["excoriating", "corrosive", "aculeate"], label: "Poetic" },
        ],
      },
    ],
  },
  {
    number: 12,
    language: "en",
    date: "2026-02-28",
    chains: [
      {
        starterWord: "scared",
        starterTranslation: "asustado",
        levels: [
          { depth: 1, validWords: ["afraid", "nervous", "worried"], label: "Basic" },
          { depth: 2, validWords: ["terrified", "horrified", "petrified"], label: "Intermediate" },
          { depth: 3, validWords: ["panic-stricken", "aghast", "appalled"], label: "Advanced" },
          { depth: 4, validWords: ["terror-struck", "unnerved", "mortified"], label: "Literary" },
          { depth: 5, validWords: ["trepidatious", "pusillanimous", "tremulous"], label: "Poetic" },
        ],
      },
      {
        starterWord: "delicious",
        starterTranslation: "delicioso",
        levels: [
          { depth: 1, validWords: ["tasty", "yummy", "lovely"], label: "Basic" },
          { depth: 2, validWords: ["scrumptious", "mouth-watering", "flavourful"], label: "Intermediate" },
          { depth: 3, validWords: ["delectable", "palatable", "savoury"], label: "Advanced" },
          { depth: 4, validWords: ["ambrosial", "toothsome", "piquant"], label: "Literary" },
          { depth: 5, validWords: ["nectareous", "sapid", "luscious"], label: "Poetic" },
        ],
      },
      {
        starterWord: "honest",
        starterTranslation: "honesto",
        levels: [
          { depth: 1, validWords: ["truthful", "fair", "real"], label: "Basic" },
          { depth: 2, validWords: ["sincere", "genuine", "trustworthy"], label: "Intermediate" },
          { depth: 3, validWords: ["forthright", "candid", "transparent"], label: "Advanced" },
          { depth: 4, validWords: ["veracious", "guileless", "unimpeachable"], label: "Literary" },
          { depth: 5, validWords: ["incorruptible", "irreproachable", "probity"], label: "Poetic" },
        ],
      },
      {
        starterWord: "deep",
        starterTranslation: "profundo",
        levels: [
          { depth: 1, validWords: ["low", "sunken", "buried"], label: "Basic" },
          { depth: 2, validWords: ["bottomless", "cavernous", "fathomless"], label: "Intermediate" },
          { depth: 3, validWords: ["profound", "abyssal", "unfathomable"], label: "Advanced" },
          { depth: 4, validWords: ["inscrutable", "recondite", "impenetrable"], label: "Literary" },
          { depth: 5, validWords: ["Hadean", "abysmal", "bathypelagic"], label: "Poetic" },
        ],
      },
      {
        starterWord: "crazy",
        starterTranslation: "loco",
        levels: [
          { depth: 1, validWords: ["nuts", "bonkers", "loopy"], label: "Basic" },
          { depth: 2, validWords: ["barmy", "potty", "crackers"], label: "Intermediate" },
          { depth: 3, validWords: ["unhinged", "demented", "deranged"], label: "Advanced" },
          { depth: 4, validWords: ["non compos mentis", "certifiable", "psychotic"], label: "Literary" },
          { depth: 5, validWords: ["insensate", "touched", "distrait"], label: "Poetic" },
        ],
      },
    ],
  },
];
