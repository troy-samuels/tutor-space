import type { ConnectionsPuzzle } from "./types";

/**
 * German Lingua Connections puzzles.
 */
export const PUZZLES_DE: ConnectionsPuzzle[] = [
  {
    number: 1,
    language: "de",
    date: "2026-02-17",
    categories: [
      {
        name: "Körperteile (Body parts)",
        words: ["Arm", "Bein", "Kopf", "Hand"],
        difficulty: "yellow",
        explanation: "Body parts — Arm (arm), Bein (leg), Kopf (head), Hand (hand).",
      },
      {
        name: "Falsche Freunde — sie bedeuten nicht, was sie scheinen (False friends)",
        words: ["Gift", "Handy", "fast", "bald"],
        difficulty: "green",
        explanation:
          "False friends: Gift (poison, not gift), Handy (mobile phone, not handy), fast (almost, not fast), bald (soon, not bald). These are the most dangerous German words for English speakers.",
        isFalseFriends: true,
      },
      {
        name: "Zusammengesetzte Wörter mit 'Schule' (Compound words with 'Schule')",
        words: ["Grundschule", "Hochschule", "Fahrschule", "Tanzschule"],
        difficulty: "blue",
        explanation:
          "Compound words with Schule: Grundschule (primary school), Hochschule (university), Fahrschule (driving school), Tanzschule (dance school). German loves building compounds!",
      },
      {
        name: "Wörter, die ihr Geschlecht ändern und die Bedeutung wechseln (Gender changes meaning)",
        words: ["See", "Band", "Steuer", "Leiter"],
        difficulty: "purple",
        explanation:
          "Gender changes meaning: der See (lake) vs die See (sea), das Band (ribbon) vs die Band (band), das Steuer (steering wheel) vs die Steuer (tax), der Leiter (leader) vs die Leiter (ladder).",
      },
    ],
    vibeClues: [
      "These four look friendly in English but could poison your conversation in German. Literally.",
      "One group is built like LEGO — each word snaps a piece onto 'Schule'",
      "The hardest group: it's not about WHAT the word means, but WHETHER you say 'der', 'die', or 'das'",
    ],
  },
  {
    number: 2,
    language: "de",
    date: "2026-02-18",
    categories: [
      {
        name: "Farben (Colours)",
        words: ["rot", "blau", "grün", "schwarz"],
        difficulty: "yellow",
        explanation: "Colours — rot (red), blau (blue), grün (green), schwarz (black).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Rock", "Chef", "Rat", "Brief"],
        difficulty: "green",
        explanation:
          "False friends: Rock (skirt, not rock), Chef (boss, not chef), Rat (advice, not rat), Brief (letter, not brief).",
        isFalseFriends: true,
      },
      {
        name: "Trennbare Verben — Vorsilben (Separable verb prefixes)",
        words: ["auf", "an", "aus", "mit"],
        difficulty: "blue",
        explanation:
          "Separable prefixes that completely change verb meanings: aufmachen (open), anfangen (begin), ausgehen (go out), mitkommen (come along). These tiny words are the key to German verbs.",
      },
      {
        name: "Wörter, die Engländer zum Lachen bringen (Words that make English speakers laugh)",
        words: ["Fahrt", "Ausfahrt", "Gymnasium", "Schmuck"],
        difficulty: "purple",
        explanation:
          "Innocent German words that sound funny in English: Fahrt (trip/journey), Ausfahrt (exit/off-ramp), Gymnasium (secondary school), Schmuck (jewellery). None mean what English speakers think!",
      },
    ],
    vibeClues: [
      "Your English brain will assign completely wrong meanings to one group. Trust nothing.",
      "Four tiny words that, when stuck to a verb, transform its meaning entirely",
      "One group will make you giggle — but only because you're thinking in the wrong language",
    ],
  },
  {
    number: 3,
    language: "de",
    date: "2026-02-19",
    categories: [
      {
        name: "Lebensmittel (Food)",
        words: ["Brot", "Käse", "Wurst", "Kartoffel"],
        difficulty: "yellow",
        explanation: "German staples — Brot (bread), Käse (cheese), Wurst (sausage), Kartoffel (potato).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Wand", "Kind", "Mist", "Taste"],
        difficulty: "green",
        explanation:
          "False friends: Wand (wall, not wand), Kind (child, not kind), Mist (manure/rubbish, not mist), Taste (key/button, not taste).",
        isFalseFriends: true,
      },
      {
        name: "Modalverben (Modal verbs)",
        words: ["müssen", "können", "dürfen", "sollen"],
        difficulty: "blue",
        explanation:
          "Modal verbs — müssen (must), können (can), dürfen (may/allowed to), sollen (should). Dürfen vs können is a classic trap — können = ability, dürfen = permission.",
      },
      {
        name: "Lange zusammengesetzte Wörter (Long compound words)",
        words: ["Handschuh", "Kühlschrank", "Staubsauger", "Schildkröte"],
        difficulty: "purple",
        explanation:
          "Compound words with hidden meanings: Handschuh (glove = 'hand shoe'), Kühlschrank (fridge = 'cool cupboard'), Staubsauger (vacuum = 'dust sucker'), Schildkröte (turtle = 'shield toad'). German describes things literally!",
      },
    ],
    vibeClues: [
      "One group's words are tiny lies. They look like English friends but they're not.",
      "The hardest group? Take them apart. Each is two simpler words wearing a trench coat.",
      "These four verbs are the spine of German grammar — and they're all the same type",
    ],
  },
  {
    number: 4,
    language: "de",
    date: "2026-02-20",
    categories: [
      {
        name: "Tiere (Animals)",
        words: ["Hund", "Katze", "Vogel", "Fisch"],
        difficulty: "yellow",
        explanation: "Animals — Hund (dog), Katze (cat), Vogel (bird), Fisch (fish).",
      },
      {
        name: "Redewendungen mit Tieren (Animal idioms)",
        words: ["Schwein", "Bär", "Fuchs", "Esel"],
        difficulty: "green",
        explanation:
          "Animals in idioms: Schwein haben (to be lucky), jemandem einen Bären aufbinden (to lie to someone), schlau wie ein Fuchs (clever as a fox), Esel (used like 'donkey' = stupid).",
      },
      {
        name: "Wörter die im Dativ anders funktionieren (Dative case changers)",
        words: ["mir", "dir", "ihm", "ihr"],
        difficulty: "blue",
        explanation:
          "Dative pronouns: mir (to me), dir (to you), ihm (to him), ihr (to her). These tiny words trip up every German learner — they change meaning based on case.",
      },
      {
        name: "Denglisch — Englische Wörter, die Deutsche anders verwenden (German pseudo-English)",
        words: ["Oldtimer", "Smoking", "Beamer", "Public Viewing"],
        difficulty: "purple",
        explanation:
          "German 'English' words that don't exist or mean differently: Oldtimer (vintage car, not elderly person), Smoking (tuxedo), Beamer (projector, not BMW), Public Viewing (watching sports on big screens, not a funeral viewing!).",
      },
    ],
    vibeClues: [
      "Two groups have animals. One is literal, the other uses them to express human qualities.",
      "The hardest group? Germans think these are English words. English speakers are very confused by them.",
      "Four tiny words that answer the question 'to whom?' — the bane of every German student",
    ],
  },
  {
    number: 5,
    language: "de",
    date: "2026-02-21",
    categories: [
      {
        name: "Möbel (Furniture)",
        words: ["Stuhl", "Tisch", "Bett", "Schrank"],
        difficulty: "yellow",
        explanation: "Furniture — Stuhl (chair), Tisch (table), Bett (bed), Schrank (wardrobe/cupboard).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["bekommen", "Fabrik", "sensibel", "aktuell"],
        difficulty: "green",
        explanation:
          "False friends: bekommen (to receive, not become), Fabrik (factory, not fabric), sensibel (sensitive, not sensible), aktuell (current, not actual).",
        isFalseFriends: true,
      },
      {
        name: "Ausdrücke mit 'machen' (Expressions with 'machen')",
        words: ["Spaß", "Sinn", "Angst", "Schluss"],
        difficulty: "blue",
        explanation:
          "Expressions with 'machen': Spaß machen (to be fun), Sinn machen (to make sense), Angst machen (to frighten), Schluss machen (to break up/end).",
      },
      {
        name: "Wörter mit drei Geschlechtern je nach Bedeutung (Words that can be all three genders)",
        words: ["Moment", "Schild", "Tau", "Gehalt"],
        difficulty: "purple",
        explanation:
          "Words with multiple genders: der Moment (moment) vs das Moment (factor), das Schild (sign) vs der Schild (shield), das Tau (rope) vs der Tau (dew), das Gehalt (salary) vs der Gehalt (content). German gender at its most diabolical.",
      },
    ],
    vibeClues: [
      "These four words will betray you in a German office. They don't mean what your English brain says.",
      "Add 'machen' and these four isolated nouns suddenly become common phrases",
      "One group is the final boss of German grammar: the same word, three possible genders, three different meanings",
    ],
  },
  {
    number: 6,
    language: "de",
    date: "2026-02-22",
    categories: [
      {
        name: "Wetter (Weather)",
        words: ["Regen", "Schnee", "Gewitter", "Nebel"],
        difficulty: "yellow",
        explanation: "Weather — Regen (rain), Schnee (snow), Gewitter (thunderstorm), Nebel (fog).",
      },
      {
        name: "Konnektoren (Connectors)",
        words: ["jedoch", "trotzdem", "dennoch", "allerdings"],
        difficulty: "green",
        explanation:
          "All mean roughly 'however/nevertheless': jedoch, trotzdem, dennoch, allerdings. They look random but serve the same grammatical function.",
      },
      {
        name: "Lustige Zusammensetzungen (Funny compounds)",
        words: ["Nacktschnecke", "Glühbirne", "Brustwarze", "Zahnfleisch"],
        difficulty: "blue",
        explanation:
          "Literally translated compounds: Nacktschnecke (slug = 'naked snail'), Glühbirne (lightbulb = 'glow pear'), Brustwarze (nipple = 'breast wart'), Zahnfleisch (gums = 'tooth meat'). German is brutally literal.",
      },
      {
        name: "Wörter die aus dem Jiddischen kommen (Words from Yiddish)",
        words: ["Schlamassel", "Ganove", "meschugge", "Schmock"],
        difficulty: "purple",
        explanation:
          "Yiddish-origin words in German: Schlamassel (mess/disaster), Ganove (crook), meschugge (crazy), Schmock (fool). German absorbed many Yiddish words, reflecting centuries of Jewish-German cultural exchange.",
      },
    ],
    vibeClues: [
      "Four synonyms disguised as different words. They all mean 'but actually...'",
      "Take these apart literally and you'll either laugh or cringe. German doesn't sugarcoat.",
      "The hardest group arrived in German from another language — one with deep historical roots",
    ],
  },
  {
    number: 7,
    language: "de",
    date: "2026-02-23",
    categories: [
      {
        name: "Berufe (Jobs)",
        words: ["Arzt", "Lehrer", "Bäcker", "Friseur"],
        difficulty: "yellow",
        explanation: "Jobs — Arzt (doctor), Lehrer (teacher), Bäcker (baker), Friseur (hairdresser).",
      },
      {
        name: "Wörter mit Umlauten die die Bedeutung ändern (Words where umlauts change meaning)",
        words: ["schon/schön", "schwül/schwul", "Mutter/Mütter", "Bruder/Brüder"],
        difficulty: "green",
        explanation:
          "Umlaut pairs: schon (already) vs schön (beautiful), schwül (humid) vs schwul (gay), Mutter (mother) vs Mütter (mothers), Bruder (brother) vs Brüder (brothers). Two dots can change everything!",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Gymnasium", "See", "Oldtimer", "Smoking"],
        difficulty: "blue",
        explanation:
          "False friends: Gymnasium (secondary school, not gym), See (lake/sea depending on gender), Oldtimer (vintage car, not old person), Smoking (tuxedo, not smoking).",
        isFalseFriends: true,
      },
      {
        name: "Nur auf Deutsch: Unübersetzbare Wörter (Only in German: Untranslatable words)",
        words: ["Schadenfreude", "Fernweh", "Weltschmerz", "Torschlusspanik"],
        difficulty: "purple",
        explanation:
          "Untranslatable German concepts: Schadenfreude (joy from others' misfortune), Fernweh (longing for faraway places), Weltschmerz (world-weariness), Torschlusspanik (fear of diminishing opportunities — literally 'gate-closing panic').",
      },
    ],
    vibeClues: [
      "Two tiny dots above a vowel can completely change what you're saying. One group proves it.",
      "These words have been borrowed by English because no English word captures what they mean",
      "One group looks very English. But in Germany, these words have completely different lives.",
    ],
  },
];
