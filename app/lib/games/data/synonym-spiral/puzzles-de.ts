import type { SynonymSpiralPuzzle } from "./types";

/**
 * German Synonym Spiral puzzles.
 * Each puzzle has 5 chains. Each chain has 5 depth levels.
 */
export const PUZZLES_DE: SynonymSpiralPuzzle[] = [
  {
    number: 1,
    language: "de",
    date: "2026-02-17",
    chains: [
      {
        starterWord: "groß",
        starterTranslation: "big",
        levels: [
          { depth: 1, validWords: ["hoch", "breit", "weit"], label: "Grundstufe" },
          { depth: 2, validWords: ["riesig", "enorm", "gewaltig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["immens", "kolossal", "gigantisch"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["monumental", "titanisch", "ungeheuer"], label: "Literarisch" },
          { depth: 5, validWords: ["unermesslich", "zyklopisch", "pharaonisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "gut",
        starterTranslation: "good",
        levels: [
          { depth: 1, validWords: ["fein", "nett", "schön"], label: "Grundstufe" },
          { depth: 2, validWords: ["ausgezeichnet", "hervorragend", "toll"], label: "Mittelstufe" },
          { depth: 3, validWords: ["vorzüglich", "exzellent", "prächtig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["vortrefflich", "formidabel", "grandios"], label: "Literarisch" },
          { depth: 5, validWords: ["unübertrefflich", "sublim", "erhaben"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "traurig",
        starterTranslation: "sad",
        levels: [
          { depth: 1, validWords: ["schlecht", "ernst", "tief"], label: "Grundstufe" },
          { depth: 2, validWords: ["melancholisch", "betrübt", "niedergeschlagen"], label: "Mittelstufe" },
          { depth: 3, validWords: ["bekümmert", "bedrückt", "verzagt"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["untröstlich", "gramgebeugt", "freudlos"], label: "Literarisch" },
          { depth: 5, validWords: ["elegisch", "wehmütig", "schwermütig"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "schnell",
        starterTranslation: "fast",
        levels: [
          { depth: 1, validWords: ["rasch", "flink", "fix"], label: "Grundstufe" },
          { depth: 2, validWords: ["zügig", "flott", "hurtig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["rasant", "blitzschnell", "geschwind"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["pfeilschnell", "atemberaubend", "reißend"], label: "Literarisch" },
          { depth: 5, validWords: ["sturmgleich", "meteorisch", "fulminant"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "schön",
        starterTranslation: "beautiful",
        levels: [
          { depth: 1, validWords: ["hübsch", "nett", "fein"], label: "Grundstufe" },
          { depth: 2, validWords: ["wunderschön", "reizend", "anmutig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["bezaubernd", "prächtig", "strahlend"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["atemberaubend", "blendend", "hinreißend"], label: "Literarisch" },
          { depth: 5, validWords: ["ätherisch", "seraphisch", "elysisch"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 2,
    language: "de",
    date: "2026-02-18",
    chains: [
      {
        starterWord: "klein",
        starterTranslation: "small",
        levels: [
          { depth: 1, validWords: ["kurz", "gering", "niedrig"], label: "Grundstufe" },
          { depth: 2, validWords: ["winzig", "zierlich", "minimal"], label: "Mittelstufe" },
          { depth: 3, validWords: ["mikrig", "unscheinbar", "diminutiv"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["mikroskopisch", "unmerklich", "infinitesimal"], label: "Literarisch" },
          { depth: 5, validWords: ["lilliputanisch", "homöopathisch", "ätherisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "stark",
        starterTranslation: "strong",
        levels: [
          { depth: 1, validWords: ["fest", "hart", "kräftig"], label: "Grundstufe" },
          { depth: 2, validWords: ["mächtig", "robust", "stabil"], label: "Mittelstufe" },
          { depth: 3, validWords: ["unerschütterlich", "herkulisch", "wuchtig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["unbezwingbar", "eisern", "unbeugbar"], label: "Literarisch" },
          { depth: 5, validWords: ["titanisch", "prometheisch", "adamantin"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "alt",
        starterTranslation: "old",
        levels: [
          { depth: 1, validWords: ["lang", "grau", "früher"], label: "Grundstufe" },
          { depth: 2, validWords: ["antik", "historisch", "ehrwürdig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["altertümlich", "archaisch", "betagt"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["vorsintflutlich", "uralt", "altehrwürdig"], label: "Literarisch" },
          { depth: 5, validWords: ["greisenhaft", "antediluvianisch", "urtümlich"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "schlecht",
        starterTranslation: "bad",
        levels: [
          { depth: 1, validWords: ["böse", "übel", "mies"], label: "Grundstufe" },
          { depth: 2, validWords: ["schrecklich", "furchtbar", "grässlich"], label: "Mittelstufe" },
          { depth: 3, validWords: ["abscheulich", "scheußlich", "entsetzlich"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["niederträchtig", "infam", "verwerflich"], label: "Literarisch" },
          { depth: 5, validWords: ["verabscheuungswürdig", "ruchlos", "schmählich"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "glücklich",
        starterTranslation: "happy",
        levels: [
          { depth: 1, validWords: ["froh", "lustig", "heiter"], label: "Grundstufe" },
          { depth: 2, validWords: ["fröhlich", "vergnügt", "begeistert"], label: "Mittelstufe" },
          { depth: 3, validWords: ["euphorisch", "überglücklich", "selig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["hochbeglückt", "wonnig", "entzückt"], label: "Literarisch" },
          { depth: 5, validWords: ["verzückt", "glückselig", "paradiesisch"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 3,
    language: "de",
    date: "2026-02-19",
    chains: [
      {
        starterWord: "schwierig",
        starterTranslation: "difficult",
        levels: [
          { depth: 1, validWords: ["hart", "ernst", "schwer"], label: "Grundstufe" },
          { depth: 2, validWords: ["kompliziert", "komplex", "mühsam"], label: "Mittelstufe" },
          { depth: 3, validWords: ["vertrackt", "verzwickt", "knifflig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["undurchdringlich", "unentwirrbar", "labyrinthisch"], label: "Literarisch" },
          { depth: 5, validWords: ["sibyllinisch", "sphinxhaft", "hermetisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "wichtig",
        starterTranslation: "important",
        levels: [
          { depth: 1, validWords: ["groß", "ernst", "zentral"], label: "Grundstufe" },
          { depth: 2, validWords: ["wesentlich", "bedeutend", "entscheidend"], label: "Mittelstufe" },
          { depth: 3, validWords: ["maßgeblich", "essentiell", "fundamental"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["unerlässlich", "unabdingbar", "unumgänglich"], label: "Literarisch" },
          { depth: 5, validWords: ["peremptorisch", "axiomatisch", "kanonisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "sprechen",
        starterTranslation: "to speak",
        levels: [
          { depth: 1, validWords: ["sagen", "reden", "erzählen"], label: "Grundstufe" },
          { depth: 2, validWords: ["plaudern", "diskutieren", "unterhalten"], label: "Mittelstufe" },
          { depth: 3, validWords: ["erörtern", "debattieren", "dozieren"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["disputieren", "räsonieren", "deklamieren"], label: "Literarisch" },
          { depth: 5, validWords: ["sinnieren", "monologisieren", "orakeln"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "gehen",
        starterTranslation: "to walk",
        levels: [
          { depth: 1, validWords: ["laufen", "kommen", "ziehen"], label: "Grundstufe" },
          { depth: 2, validWords: ["spazieren", "wandern", "schlendern"], label: "Mittelstufe" },
          { depth: 3, validWords: ["flanieren", "streifen", "schweifen"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["pilgern", "vagabundieren", "mäandern"], label: "Literarisch" },
          { depth: 5, validWords: ["lustwandeln", "promenieren", "nomadisieren"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "essen",
        starterTranslation: "to eat",
        levels: [
          { depth: 1, validWords: ["nehmen", "kosten", "speisen"], label: "Grundstufe" },
          { depth: 2, validWords: ["verschlingen", "genießen", "verzehren"], label: "Mittelstufe" },
          { depth: 3, validWords: ["schlemmen", "schmausen", "tafeln"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["labern", "dinieren", "soupieren"], label: "Literarisch" },
          { depth: 5, validWords: ["bankettieren", "schwelgen", "zechen"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 4,
    language: "de",
    date: "2026-02-20",
    chains: [
      {
        starterWord: "Licht",
        starterTranslation: "light",
        levels: [
          { depth: 1, validWords: ["Sonne", "Glanz", "Schein"], label: "Grundstufe" },
          { depth: 2, validWords: ["Helligkeit", "Strahlung", "Leuchten"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Funkeln", "Glühen", "Schimmer"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Phosphoreszenz", "Irideszenz", "Refulgenz"], label: "Literarisch" },
          { depth: 5, validWords: ["Aureole", "Nimbus", "Gloriole"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Weg",
        starterTranslation: "path",
        levels: [
          { depth: 1, validWords: ["Straße", "Pfad", "Gang"], label: "Grundstufe" },
          { depth: 2, validWords: ["Route", "Strecke", "Bahn"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Passage", "Trampelpfad", "Schneise"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Odyssee", "Pilgerweg", "Mäander"], label: "Literarisch" },
          { depth: 5, validWords: ["Wandelgang", "Irrfahrt", "Peregrinatio"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Haus",
        starterTranslation: "house",
        levels: [
          { depth: 1, validWords: ["Wohnung", "Heim", "Bau"], label: "Grundstufe" },
          { depth: 2, validWords: ["Residenz", "Domizil", "Anwesen"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Gemach", "Herrenhaus", "Refugium"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Palais", "Bastion", "Zitadelle"], label: "Literarisch" },
          { depth: 5, validWords: ["Arkadien", "Klause", "Olymp"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Freund",
        starterTranslation: "friend",
        levels: [
          { depth: 1, validWords: ["Kumpel", "Kollege", "Partner"], label: "Grundstufe" },
          { depth: 2, validWords: ["Kamerad", "Gefährte", "Vertrauter"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Weggefährte", "Gesinnungsgenosse", "Verbündeter"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Seelenverwandter", "Waffenbruder", "Busenfreund"], label: "Literarisch" },
          { depth: 5, validWords: ["Alter Ego", "Intimus", "Fidus Achates"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "denken",
        starterTranslation: "to think",
        levels: [
          { depth: 1, validWords: ["meinen", "glauben", "wissen"], label: "Grundstufe" },
          { depth: 2, validWords: ["überlegen", "nachdenken", "bedenken"], label: "Mittelstufe" },
          { depth: 3, validWords: ["grübeln", "sinnen", "reflektieren"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["philosophieren", "kontemplieren", "spekulieren"], label: "Literarisch" },
          { depth: 5, validWords: ["meditieren", "räsonnieren", "sinnieren"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 5,
    language: "de",
    date: "2026-02-21",
    chains: [
      {
        starterWord: "kalt",
        starterTranslation: "cold",
        levels: [
          { depth: 1, validWords: ["kühl", "frisch", "eisig"], label: "Grundstufe" },
          { depth: 2, validWords: ["frostig", "winterlich", "arktisch"], label: "Mittelstufe" },
          { depth: 3, validWords: ["sibirisch", "klirrkalt", "grimmig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["hyperboräisch", "boreal", "nördlich"], label: "Literarisch" },
          { depth: 5, validWords: ["glazial", "permafrost", "kryogen"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "heiß",
        starterTranslation: "hot",
        levels: [
          { depth: 1, validWords: ["warm", "lauwarm", "schwül"], label: "Grundstufe" },
          { depth: 2, validWords: ["glühend", "brütend", "sengend"], label: "Mittelstufe" },
          { depth: 3, validWords: ["glutvoll", "lodernd", "flammend"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["vulkanisch", "feurig", "siedend"], label: "Literarisch" },
          { depth: 5, validWords: ["solarisch", "magmatisch", "incandeszent"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "dunkel",
        starterTranslation: "dark",
        levels: [
          { depth: 1, validWords: ["schwarz", "grau", "finster"], label: "Grundstufe" },
          { depth: 2, validWords: ["düster", "trübe", "schattig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["nachtdunkel", "lichtlos", "undurchsichtig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["stygisch", "abgründig", "unergründlich"], label: "Literarisch" },
          { depth: 5, validWords: ["nachtumwoben", "rabenschwarz", "plutonisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Stille",
        starterTranslation: "silence",
        levels: [
          { depth: 1, validWords: ["Ruhe", "Frieden", "Pause"], label: "Grundstufe" },
          { depth: 2, validWords: ["Gelassenheit", "Besonnenheit", "Schweigen"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Verstummen", "Lautlosigkeit", "Schweigsamkeit"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Kontemplation", "Versunkenheit", "Einkehr"], label: "Literarisch" },
          { depth: 5, validWords: ["Ataraxie", "Aphasie", "Grabesstille"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "mutig",
        starterTranslation: "brave",
        levels: [
          { depth: 1, validWords: ["tapfer", "kühn", "stark"], label: "Grundstufe" },
          { depth: 2, validWords: ["furchtlos", "verwegen", "wagemutig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["tollkühn", "unerschrocken", "beherzt"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["heldenhaft", "unbeugsam", "kampferprobt"], label: "Literarisch" },
          { depth: 5, validWords: ["leoninisch", "stoisch", "unbesiegbar"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 6,
    language: "de",
    date: "2026-02-22",
    chains: [
      {
        starterWord: "seltsam",
        starterTranslation: "strange",
        levels: [
          { depth: 1, validWords: ["komisch", "anders", "fremd"], label: "Grundstufe" },
          { depth: 2, validWords: ["eigenartig", "sonderbar", "merkwürdig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["kurios", "skurril", "absonderlich"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["grotesk", "bizarr", "wunderlich"], label: "Literarisch" },
          { depth: 5, validWords: ["kafkaesk", "surreal", "phantasmagorisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "reich",
        starterTranslation: "rich",
        levels: [
          { depth: 1, validWords: ["viel", "teuer", "fein"], label: "Grundstufe" },
          { depth: 2, validWords: ["wohlhabend", "vermögend", "begütert"], label: "Mittelstufe" },
          { depth: 3, validWords: ["opulent", "luxuriös", "prunkvoll"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["verschwenderisch", "fürstlich", "üppig"], label: "Literarisch" },
          { depth: 5, validWords: ["krösushaft", "mäzenatisch", "munifizent"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Wasser",
        starterTranslation: "water",
        levels: [
          { depth: 1, validWords: ["Regen", "Fluss", "See"], label: "Grundstufe" },
          { depth: 2, validWords: ["Strom", "Welle", "Bach"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Sturzbach", "Quelle", "Zufluss"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Springquell", "Kaskade", "Gischt"], label: "Literarisch" },
          { depth: 5, validWords: ["Fontäne", "Lethe", "Najade"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "gefährlich",
        starterTranslation: "dangerous",
        levels: [
          { depth: 1, validWords: ["schlimm", "böse", "wild"], label: "Grundstufe" },
          { depth: 2, validWords: ["riskant", "bedrohlich", "brenzlig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["verhängnisvoll", "verderblich", "heimtückisch"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["deletär", "perniziös", "tückisch"], label: "Literarisch" },
          { depth: 5, validWords: ["letal", "mephitisch", "thanatisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "leuchten",
        starterTranslation: "to shine",
        levels: [
          { depth: 1, validWords: ["scheinen", "strahlen", "glänzen"], label: "Grundstufe" },
          { depth: 2, validWords: ["funkeln", "blitzen", "flimmern"], label: "Mittelstufe" },
          { depth: 3, validWords: ["erstrahlen", "schimmern", "gleißen"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["phosphoreszieren", "irisieren", "fluoreszieren"], label: "Literarisch" },
          { depth: 5, validWords: ["koruszieren", "nimbusstrahlen", "opalisieren"], label: "Poetisch" },
        ],
      },
    ],
  },
  {
    number: 7,
    language: "de",
    date: "2026-02-23",
    chains: [
      {
        starterWord: "neu",
        starterTranslation: "new",
        levels: [
          { depth: 1, validWords: ["jung", "frisch", "modern"], label: "Grundstufe" },
          { depth: 2, validWords: ["aktuell", "neuartig", "zeitgemäß"], label: "Mittelstufe" },
          { depth: 3, validWords: ["innovativ", "bahnbrechend", "unerhört"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["avantgardistisch", "wegweisend", "epochemachend"], label: "Literarisch" },
          { depth: 5, validWords: ["pristinisch", "jungfräulich", "prototypisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "langsam",
        starterTranslation: "slow",
        levels: [
          { depth: 1, validWords: ["ruhig", "still", "sachte"], label: "Grundstufe" },
          { depth: 2, validWords: ["gemächlich", "bedächtig", "träge"], label: "Mittelstufe" },
          { depth: 3, validWords: ["schleppend", "zögerlich", "phlegmatisch"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["lethargisch", "somnambul", "indolent"], label: "Literarisch" },
          { depth: 5, validWords: ["somnambulistisch", "torpid", "komatös"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "klug",
        starterTranslation: "intelligent",
        levels: [
          { depth: 1, validWords: ["schlau", "weise", "clever"], label: "Grundstufe" },
          { depth: 2, validWords: ["scharfsinnig", "geistreich", "pfiffig"], label: "Mittelstufe" },
          { depth: 3, validWords: ["brillant", "genial", "weitsichtig"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["hellsichtig", "salomonisch", "feinsinnig"], label: "Literarisch" },
          { depth: 5, validWords: ["sapient", "omniszient", "olympisch"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "weinen",
        starterTranslation: "to cry",
        levels: [
          { depth: 1, validWords: ["heulen", "schreien", "klagen"], label: "Grundstufe" },
          { depth: 2, validWords: ["schluchzen", "jammern", "wimmern"], label: "Mittelstufe" },
          { depth: 3, validWords: ["wehklagen", "greinen", "flennen"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["lamentieren", "betrauern", "beklagen"], label: "Literarisch" },
          { depth: 5, validWords: ["beweinen", "bejammern", "jeremiade"], label: "Poetisch" },
        ],
      },
      {
        starterWord: "Angst",
        starterTranslation: "fear",
        levels: [
          { depth: 1, validWords: ["Furcht", "Sorge", "Panik"], label: "Grundstufe" },
          { depth: 2, validWords: ["Schrecken", "Grauen", "Entsetzen"], label: "Mittelstufe" },
          { depth: 3, validWords: ["Beklemmung", "Unbehagen", "Bangigkeit"], label: "Fortgeschritten" },
          { depth: 4, validWords: ["Bestürzung", "Verstörung", "Beklommenheit"], label: "Literarisch" },
          { depth: 5, validWords: ["Numinose", "Tremendum", "Weltangst"], label: "Poetisch" },
        ],
      },
    ],
  },
];
