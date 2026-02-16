import type { SynonymSpiralPuzzle } from "./types";

/**
 * French Synonym Spiral puzzles.
 * Each puzzle has 5 chains. Each chain has 5 depth levels.
 */
export const PUZZLES_FR: SynonymSpiralPuzzle[] = [
  {
    number: 1,
    language: "fr",
    date: "2026-02-17",
    chains: [
      {
        starterWord: "grand",
        starterTranslation: "big",
        levels: [
          { depth: 1, validWords: ["large", "haut", "gros"], label: "Basique" },
          { depth: 2, validWords: ["énorme", "vaste", "spacieux"], label: "Intermédiaire" },
          { depth: 3, validWords: ["immense", "colossal", "gigantesque"], label: "Avancé" },
          { depth: 4, validWords: ["démesuré", "monumental", "titanesque"], label: "Littéraire" },
          { depth: 5, validWords: ["incommensurable", "cyclopéen", "pharaonique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "bon",
        starterTranslation: "good",
        levels: [
          { depth: 1, validWords: ["bien", "beau", "joli"], label: "Basique" },
          { depth: 2, validWords: ["excellent", "formidable", "superbe"], label: "Intermédiaire" },
          { depth: 3, validWords: ["magnifique", "splendide", "remarquable"], label: "Avancé" },
          { depth: 4, validWords: ["exquis", "sublime", "incomparable"], label: "Littéraire" },
          { depth: 5, validWords: ["ineffable", "suprême", "insurpassable"], label: "Poétique" },
        ],
      },
      {
        starterWord: "triste",
        starterTranslation: "sad",
        levels: [
          { depth: 1, validWords: ["malheureux", "sombre", "gris"], label: "Basique" },
          { depth: 2, validWords: ["mélancolique", "déprimé", "abattu"], label: "Intermédiaire" },
          { depth: 3, validWords: ["affligé", "accablé", "éploré"], label: "Avancé" },
          { depth: 4, validWords: ["inconsolable", "désolé", "navré"], label: "Littéraire" },
          { depth: 5, validWords: ["languide", "élégiaque", "crépusculaire"], label: "Poétique" },
        ],
      },
      {
        starterWord: "rapide",
        starterTranslation: "fast",
        levels: [
          { depth: 1, validWords: ["vite", "prompt", "agile"], label: "Basique" },
          { depth: 2, validWords: ["véloce", "pressé", "expéditif"], label: "Intermédiaire" },
          { depth: 3, validWords: ["fulgurant", "vertigineux", "impétueux"], label: "Avancé" },
          { depth: 4, validWords: ["foudroyant", "météorique", "effréné"], label: "Littéraire" },
          { depth: 5, validWords: ["sémillant", "prestissimo", "supersonique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "beau",
        starterTranslation: "beautiful",
        levels: [
          { depth: 1, validWords: ["joli", "mignon", "charmant"], label: "Basique" },
          { depth: 2, validWords: ["ravissant", "élégant", "gracieux"], label: "Intermédiaire" },
          { depth: 3, validWords: ["somptueux", "resplendissant", "radieux"], label: "Avancé" },
          { depth: 4, validWords: ["éblouissant", "féerique", "majestueux"], label: "Littéraire" },
          { depth: 5, validWords: ["diaphane", "séraphique", "édénique"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 2,
    language: "fr",
    date: "2026-02-18",
    chains: [
      {
        starterWord: "petit",
        starterTranslation: "small",
        levels: [
          { depth: 1, validWords: ["court", "bas", "fin"], label: "Basique" },
          { depth: 2, validWords: ["minuscule", "réduit", "modeste"], label: "Intermédiaire" },
          { depth: 3, validWords: ["infime", "exigu", "ténu"], label: "Avancé" },
          { depth: 4, validWords: ["microscopique", "imperceptible", "infinitésimal"], label: "Littéraire" },
          { depth: 5, validWords: ["lilliputien", "corpusculaire", "évanescent"], label: "Poétique" },
        ],
      },
      {
        starterWord: "fort",
        starterTranslation: "strong",
        levels: [
          { depth: 1, validWords: ["dur", "solide", "ferme"], label: "Basique" },
          { depth: 2, validWords: ["puissant", "robuste", "vigoureux"], label: "Intermédiaire" },
          { depth: 3, validWords: ["herculéen", "inébranlable", "tenace"], label: "Avancé" },
          { depth: 4, validWords: ["invulnérable", "implacable", "inexpugnable"], label: "Littéraire" },
          { depth: 5, validWords: ["adamantin", "prométhéen", "olympien"], label: "Poétique" },
        ],
      },
      {
        starterWord: "vieux",
        starterTranslation: "old",
        levels: [
          { depth: 1, validWords: ["âgé", "ancien", "usé"], label: "Basique" },
          { depth: 2, validWords: ["ancestral", "antique", "séculaire"], label: "Intermédiaire" },
          { depth: 3, validWords: ["vétuste", "archaïque", "millénaire"], label: "Avancé" },
          { depth: 4, validWords: ["antédiluvien", "immémorial", "révolu"], label: "Littéraire" },
          { depth: 5, validWords: ["primordial", "sempiternel", "mémoriel"], label: "Poétique" },
        ],
      },
      {
        starterWord: "mauvais",
        starterTranslation: "bad",
        levels: [
          { depth: 1, validWords: ["nul", "moche", "pire"], label: "Basique" },
          { depth: 2, validWords: ["terrible", "horrible", "affreux"], label: "Intermédiaire" },
          { depth: 3, validWords: ["néfaste", "funeste", "atroce"], label: "Avancé" },
          { depth: 4, validWords: ["exécrable", "abominable", "détestable"], label: "Littéraire" },
          { depth: 5, validWords: ["ignominieux", "opprobrieux", "délétère"], label: "Poétique" },
        ],
      },
      {
        starterWord: "heureux",
        starterTranslation: "happy",
        levels: [
          { depth: 1, validWords: ["content", "joyeux", "gai"], label: "Basique" },
          { depth: 2, validWords: ["ravi", "enchanté", "comblé"], label: "Intermédiaire" },
          { depth: 3, validWords: ["euphorique", "exalté", "radieux"], label: "Avancé" },
          { depth: 4, validWords: ["bienheureux", "extatique", "transporté"], label: "Littéraire" },
          { depth: 5, validWords: ["béatifique", "séraphique", "édénique"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 3,
    language: "fr",
    date: "2026-02-19",
    chains: [
      {
        starterWord: "difficile",
        starterTranslation: "difficult",
        levels: [
          { depth: 1, validWords: ["dur", "pénible", "rude"], label: "Basique" },
          { depth: 2, validWords: ["compliqué", "complexe", "ardu"], label: "Intermédiaire" },
          { depth: 3, validWords: ["épineux", "scabreux", "laborieux"], label: "Avancé" },
          { depth: 4, validWords: ["inextricable", "insurmontable", "rédhibitoire"], label: "Littéraire" },
          { depth: 5, validWords: ["sibyllin", "abscons", "hermétique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "parler",
        starterTranslation: "to speak",
        levels: [
          { depth: 1, validWords: ["dire", "causer", "raconter"], label: "Basique" },
          { depth: 2, validWords: ["converser", "dialoguer", "discuter"], label: "Intermédiaire" },
          { depth: 3, validWords: ["disserter", "discourir", "s'entretenir"], label: "Avancé" },
          { depth: 4, validWords: ["pérorer", "haranguer", "déclamer"], label: "Littéraire" },
          { depth: 5, validWords: ["pontifier", "soliloquiser", "apostrophiser"], label: "Poétique" },
        ],
      },
      {
        starterWord: "marcher",
        starterTranslation: "to walk",
        levels: [
          { depth: 1, validWords: ["aller", "avancer", "bouger"], label: "Basique" },
          { depth: 2, validWords: ["se promener", "flâner", "parcourir"], label: "Intermédiaire" },
          { depth: 3, validWords: ["déambuler", "arpenter", "errer"], label: "Avancé" },
          { depth: 4, validWords: ["pérégriner", "vagabonder", "cheminer"], label: "Littéraire" },
          { depth: 5, validWords: ["déambulation", "transhumance", "pèlerinage"], label: "Poétique" },
        ],
      },
      {
        starterWord: "manger",
        starterTranslation: "to eat",
        levels: [
          { depth: 1, validWords: ["prendre", "goûter", "dîner"], label: "Basique" },
          { depth: 2, validWords: ["dévorer", "savourer", "ingérer"], label: "Intermédiaire" },
          { depth: 3, validWords: ["déguster", "engloutir", "bâfrer"], label: "Avancé" },
          { depth: 4, validWords: ["se sustenter", "se repaître", "festoyer"], label: "Littéraire" },
          { depth: 5, validWords: ["banqueter", "ripaille", "agape"], label: "Poétique" },
        ],
      },
      {
        starterWord: "peur",
        starterTranslation: "fear",
        levels: [
          { depth: 1, validWords: ["crainte", "angoisse", "stress"], label: "Basique" },
          { depth: 2, validWords: ["terreur", "frayeur", "épouvante"], label: "Intermédiaire" },
          { depth: 3, validWords: ["effroi", "panique", "hantise"], label: "Avancé" },
          { depth: 4, validWords: ["consternation", "sidération", "stupeur"], label: "Littéraire" },
          { depth: 5, validWords: ["tétanie", "saisissement", "transi"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 4,
    language: "fr",
    date: "2026-02-20",
    chains: [
      {
        starterWord: "lumière",
        starterTranslation: "light",
        levels: [
          { depth: 1, validWords: ["soleil", "éclat", "jour"], label: "Basique" },
          { depth: 2, validWords: ["clarté", "luminosité", "brillance"], label: "Intermédiaire" },
          { depth: 3, validWords: ["fulgurance", "scintillement", "lueur"], label: "Avancé" },
          { depth: 4, validWords: ["irradiance", "phosphorescence", "iridescence"], label: "Littéraire" },
          { depth: 5, validWords: ["nimbe", "auréole", "halo"], label: "Poétique" },
        ],
      },
      {
        starterWord: "chemin",
        starterTranslation: "path",
        levels: [
          { depth: 1, validWords: ["route", "rue", "voie"], label: "Basique" },
          { depth: 2, validWords: ["sentier", "trajet", "parcours"], label: "Intermédiaire" },
          { depth: 3, validWords: ["sente", "layon", "traverse"], label: "Avancé" },
          { depth: 4, validWords: ["périple", "sinuosité", "méandre"], label: "Littéraire" },
          { depth: 5, validWords: ["cheminement", "pérégrination", "odyssée"], label: "Poétique" },
        ],
      },
      {
        starterWord: "maison",
        starterTranslation: "house",
        levels: [
          { depth: 1, validWords: ["logement", "foyer", "lieu"], label: "Basique" },
          { depth: 2, validWords: ["résidence", "habitation", "domicile"], label: "Intermédiaire" },
          { depth: 3, validWords: ["demeure", "manoir", "propriété"], label: "Avancé" },
          { depth: 4, validWords: ["bastide", "gentilhommière", "château"], label: "Littéraire" },
          { depth: 5, validWords: ["alcazar", "palais", "bastion"], label: "Poétique" },
        ],
      },
      {
        starterWord: "ami",
        starterTranslation: "friend",
        levels: [
          { depth: 1, validWords: ["copain", "camarade", "pote"], label: "Basique" },
          { depth: 2, validWords: ["compagnon", "confident", "allié"], label: "Intermédiaire" },
          { depth: 3, validWords: ["acolyte", "complice", "frère"], label: "Avancé" },
          { depth: 4, validWords: ["alter ego", "coreligionnaire", "condisciple"], label: "Littéraire" },
          { depth: 5, validWords: ["séide", "féal", "consort"], label: "Poétique" },
        ],
      },
      {
        starterWord: "penser",
        starterTranslation: "to think",
        levels: [
          { depth: 1, validWords: ["croire", "voir", "savoir"], label: "Basique" },
          { depth: 2, validWords: ["réfléchir", "considérer", "méditer"], label: "Intermédiaire" },
          { depth: 3, validWords: ["cogiter", "délibérer", "ruminer"], label: "Avancé" },
          { depth: 4, validWords: ["spéculer", "conjecturer", "philosopher"], label: "Littéraire" },
          { depth: 5, validWords: ["supputer", "extrapoler", "théoriser"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 5,
    language: "fr",
    date: "2026-02-21",
    chains: [
      {
        starterWord: "silence",
        starterTranslation: "silence",
        levels: [
          { depth: 1, validWords: ["paix", "calme", "repos"], label: "Basique" },
          { depth: 2, validWords: ["tranquillité", "sérénité", "quiétude"], label: "Intermédiaire" },
          { depth: 3, validWords: ["mutisme", "taciturnité", "réserve"], label: "Avancé" },
          { depth: 4, validWords: ["hermétisme", "recueillement", "claustration"], label: "Littéraire" },
          { depth: 5, validWords: ["ataraxie", "aphasie", "apaisement"], label: "Poétique" },
        ],
      },
      {
        starterWord: "bizarre",
        starterTranslation: "strange",
        levels: [
          { depth: 1, validWords: ["étrange", "drôle", "curieux"], label: "Basique" },
          { depth: 2, validWords: ["singulier", "insolite", "inhabituel"], label: "Intermédiaire" },
          { depth: 3, validWords: ["saugrenu", "fantasque", "loufoque"], label: "Avancé" },
          { depth: 4, validWords: ["rocambolesque", "abracadabrant", "extravagant"], label: "Littéraire" },
          { depth: 5, validWords: ["ubuesque", "chimérique", "kafkaïen"], label: "Poétique" },
        ],
      },
      {
        starterWord: "courageux",
        starterTranslation: "brave",
        levels: [
          { depth: 1, validWords: ["fort", "brave", "hardi"], label: "Basique" },
          { depth: 2, validWords: ["audacieux", "intrépide", "vaillant"], label: "Intermédiaire" },
          { depth: 3, validWords: ["téméraire", "résolu", "déterminé"], label: "Avancé" },
          { depth: 4, validWords: ["impavide", "indomptable", "aguerri"], label: "Littéraire" },
          { depth: 5, validWords: ["imperturbable", "stoïque", "invaincu"], label: "Poétique" },
        ],
      },
      {
        starterWord: "froid",
        starterTranslation: "cold",
        levels: [
          { depth: 1, validWords: ["glacé", "frais", "gelé"], label: "Basique" },
          { depth: 2, validWords: ["glacial", "hivernal", "polaire"], label: "Intermédiaire" },
          { depth: 3, validWords: ["sibérien", "frigorifique", "rigoureux"], label: "Avancé" },
          { depth: 4, validWords: ["hyperboréen", "boréal", "septentrional"], label: "Littéraire" },
          { depth: 5, validWords: ["brumeux", "aquilon", "givre"], label: "Poétique" },
        ],
      },
      {
        starterWord: "eau",
        starterTranslation: "water",
        levels: [
          { depth: 1, validWords: ["pluie", "rivière", "mer"], label: "Basique" },
          { depth: 2, validWords: ["torrent", "flot", "cascade"], label: "Intermédiaire" },
          { depth: 3, validWords: ["ruissellement", "confluent", "crue"], label: "Avancé" },
          { depth: 4, validWords: ["source", "fontaine", "résurgence"], label: "Littéraire" },
          { depth: 5, validWords: ["onde", "lymphe", "nappe"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 6,
    language: "fr",
    date: "2026-02-22",
    chains: [
      {
        starterWord: "chaud",
        starterTranslation: "hot",
        levels: [
          { depth: 1, validWords: ["tiède", "brûlant", "doux"], label: "Basique" },
          { depth: 2, validWords: ["ardent", "torride", "suffocant"], label: "Intermédiaire" },
          { depth: 3, validWords: ["caniculaire", "incandescent", "embrasé"], label: "Avancé" },
          { depth: 4, validWords: ["volcanique", "ignescent", "pyrotechnique"], label: "Littéraire" },
          { depth: 5, validWords: ["solsticial", "étuvé", "magmatique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "nouveau",
        starterTranslation: "new",
        levels: [
          { depth: 1, validWords: ["jeune", "frais", "récent"], label: "Basique" },
          { depth: 2, validWords: ["moderne", "actuel", "novateur"], label: "Intermédiaire" },
          { depth: 3, validWords: ["inédit", "innovant", "original"], label: "Avancé" },
          { depth: 4, validWords: ["avant-gardiste", "précurseur", "pionnier"], label: "Littéraire" },
          { depth: 5, validWords: ["primesautier", "néophyte", "prémice"], label: "Poétique" },
        ],
      },
      {
        starterWord: "lent",
        starterTranslation: "slow",
        levels: [
          { depth: 1, validWords: ["calme", "doux", "posé"], label: "Basique" },
          { depth: 2, validWords: ["paisible", "graduel", "mesuré"], label: "Intermédiaire" },
          { depth: 3, validWords: ["nonchalant", "indolent", "paresseux"], label: "Avancé" },
          { depth: 4, validWords: ["flegmatique", "apathique", "léthargique"], label: "Littéraire" },
          { depth: 5, validWords: ["languissant", "somnolent", "alangui"], label: "Poétique" },
        ],
      },
      {
        starterWord: "intelligent",
        starterTranslation: "intelligent",
        levels: [
          { depth: 1, validWords: ["malin", "doué", "sage"], label: "Basique" },
          { depth: 2, validWords: ["brillant", "ingénieux", "astucieux"], label: "Intermédiaire" },
          { depth: 3, validWords: ["perspicace", "sagace", "avisé"], label: "Avancé" },
          { depth: 4, validWords: ["clairvoyant", "lucide", "pénétrant"], label: "Littéraire" },
          { depth: 5, validWords: ["omniscient", "érudit", "sapient"], label: "Poétique" },
        ],
      },
      {
        starterWord: "pleurer",
        starterTranslation: "to cry",
        levels: [
          { depth: 1, validWords: ["crier", "gémir", "souffrir"], label: "Basique" },
          { depth: 2, validWords: ["sangloter", "larmoyer", "se lamenter"], label: "Intermédiaire" },
          { depth: 3, validWords: ["gémir", "gémissement", "se morfondre"], label: "Avancé" },
          { depth: 4, validWords: ["déplorer", "élégie", "se consumer"], label: "Littéraire" },
          { depth: 5, validWords: ["thrène", "lamentation", "éploré"], label: "Poétique" },
        ],
      },
    ],
  },
  {
    number: 7,
    language: "fr",
    date: "2026-02-23",
    chains: [
      {
        starterWord: "sombre",
        starterTranslation: "dark",
        levels: [
          { depth: 1, validWords: ["noir", "obscur", "gris"], label: "Basique" },
          { depth: 2, validWords: ["ténébreux", "lugubre", "sinistre"], label: "Intermédiaire" },
          { depth: 3, validWords: ["opaque", "crépusculaire", "ombreux"], label: "Avancé" },
          { depth: 4, validWords: ["stygien", "abyssal", "insondable"], label: "Littéraire" },
          { depth: 5, validWords: ["nyctalope", "caligineux", "achérontique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "important",
        starterTranslation: "important",
        levels: [
          { depth: 1, validWords: ["sérieux", "clé", "majeur"], label: "Basique" },
          { depth: 2, validWords: ["essentiel", "fondamental", "crucial"], label: "Intermédiaire" },
          { depth: 3, validWords: ["primordial", "cardinal", "capital"], label: "Avancé" },
          { depth: 4, validWords: ["impérieux", "incontournable", "prépondérant"], label: "Littéraire" },
          { depth: 5, validWords: ["péremptoire", "apodictique", "axiomatique"], label: "Poétique" },
        ],
      },
      {
        starterWord: "riche",
        starterTranslation: "rich",
        levels: [
          { depth: 1, validWords: ["aisé", "fortuné", "bien"], label: "Basique" },
          { depth: 2, validWords: ["prospère", "nanti", "cossu"], label: "Intermédiaire" },
          { depth: 3, validWords: ["opulent", "somptueux", "fastueux"], label: "Avancé" },
          { depth: 4, validWords: ["magnifique", "splendide", "princier"], label: "Littéraire" },
          { depth: 5, validWords: ["crésus", "mécène", "munificent"], label: "Poétique" },
        ],
      },
      {
        starterWord: "dangereux",
        starterTranslation: "dangerous",
        levels: [
          { depth: 1, validWords: ["grave", "risqué", "dur"], label: "Basique" },
          { depth: 2, validWords: ["périlleux", "menaçant", "redoutable"], label: "Intermédiaire" },
          { depth: 3, validWords: ["funeste", "pernicieux", "nocif"], label: "Avancé" },
          { depth: 4, validWords: ["délétère", "insidieux", "mortifère"], label: "Littéraire" },
          { depth: 5, validWords: ["létal", "fléau", "pestilentiel"], label: "Poétique" },
        ],
      },
      {
        starterWord: "briller",
        starterTranslation: "to shine",
        levels: [
          { depth: 1, validWords: ["luire", "éclairer", "rayonner"], label: "Basique" },
          { depth: 2, validWords: ["resplendir", "scintiller", "étinceler"], label: "Intermédiaire" },
          { depth: 3, validWords: ["flamboyer", "chatoyer", "miroiter"], label: "Avancé" },
          { depth: 4, validWords: ["irradier", "rutiler", "coruscation"], label: "Littéraire" },
          { depth: 5, validWords: ["phosphorer", "opalescence", "nimber"], label: "Poétique" },
        ],
      },
    ],
  },
];
