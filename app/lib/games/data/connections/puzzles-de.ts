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
  {
    number: 8,
    language: "de",
    date: "2026-02-24",
    categories: [
      {
        name: "Familie (Family)",
        words: ["Mutter", "Vater", "Schwester", "Bruder"],
        difficulty: "yellow",
        explanation: "Family members — Mutter (mother), Vater (father), Schwester (sister), Bruder (brother).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Billion", "Dose", "Art", "Tag"],
        difficulty: "green",
        explanation:
          "False friends: Billion (trillion, not billion), Dose (can/tin, not dose), Art (type/kind, not art), Tag (day, not tag).",
        isFalseFriends: true,
      },
      {
        name: "Trennbare Verben mit 'an' (Separable verbs with 'an')",
        words: ["anrufen", "anfangen", "ankommen", "anziehen"],
        difficulty: "blue",
        explanation:
          "Separable verbs with 'an': anrufen (to call/phone), anfangen (to begin), ankommen (to arrive), anziehen (to put on/dress). The prefix 'an' jumps to the end of the sentence!",
      },
      {
        name: "Deutsche Wörter im Englischen (German words used in English)",
        words: ["Kindergarten", "Wanderlust", "Doppelgänger", "Zeitgeist"],
        difficulty: "purple",
        explanation:
          "German exports to English: Kindergarten (children's garden), Wanderlust (desire to travel), Doppelgänger (look-alike, literally 'double-goer'), Zeitgeist (spirit of the times). These words filled gaps English couldn't.",
      },
    ],
    vibeClues: [
      "One group looks perfectly English — but the meanings are traitors.",
      "Four verbs share a tiny prefix. In a sentence, that prefix runs away to the end.",
      "The hardest group went on holiday to English and never came back.",
    ],
  },
  {
    number: 9,
    language: "de",
    date: "2026-02-25",
    categories: [
      {
        name: "Obst (Fruit)",
        words: ["Apfel", "Birne", "Kirsche", "Traube"],
        difficulty: "yellow",
        explanation: "Fruits — Apfel (apple), Birne (pear), Kirsche (cherry), Traube (grape).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Rente", "spenden", "Keks", "Mappe"],
        difficulty: "green",
        explanation:
          "False friends: Rente (pension, not rent), spenden (to donate, not spend), Keks (biscuit/cookie, not cakes), Mappe (folder/portfolio, not map).",
        isFalseFriends: true,
      },
      {
        name: "Gefühle (Emotions)",
        words: ["Freude", "Trauer", "Wut", "Angst"],
        difficulty: "blue",
        explanation:
          "Emotions — Freude (joy), Trauer (sorrow/grief), Wut (rage), Angst (fear/anxiety). Angst was borrowed into English because it captures existential dread perfectly.",
      },
      {
        name: "Wörter mit Vorsilbe 'ver-' die Zerstörung bedeuten (Prefix 'ver-' meaning destruction)",
        words: ["verbrennen", "verlieren", "vergessen", "verschwinden"],
        difficulty: "purple",
        explanation:
          "The prefix 'ver-' often implies loss or destruction: verbrennen (to burn up), verlieren (to lose), vergessen (to forget), verschwinden (to disappear). This prefix is one of German's most versatile and treacherous.",
      },
    ],
    vibeClues: [
      "Four words that English speakers confidently mistranslate in every German class.",
      "One group shares a prefix that whispers 'gone, lost, destroyed'.",
      "These four are raw human feelings — one of them English stole because it had no word of its own.",
    ],
  },
  {
    number: 10,
    language: "de",
    date: "2026-02-26",
    categories: [
      {
        name: "Kleidung (Clothing)",
        words: ["Hose", "Hemd", "Jacke", "Schuhe"],
        difficulty: "yellow",
        explanation: "Clothing — Hose (trousers), Hemd (shirt), Jacke (jacket), Schuhe (shoes).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Hose", "Kamera", "Engel", "Lack"],
        difficulty: "green",
        explanation:
          "False friends: Hose (trousers, not hose), Kamera (camera — same meaning but different pronunciation trap), Engel (angel, not angle), Lack (varnish/lacquer, not lack). Hose appears in two groups — it's clothing AND a false friend!",
        isFalseFriends: true,
      },
      {
        name: "Zusammengesetzte Wörter mit 'Haus' (Compound words with 'Haus')",
        words: ["Rathaus", "Krankenhaus", "Bauernhaus", "Baumhaus"],
        difficulty: "blue",
        explanation:
          "Compounds with Haus: Rathaus (town hall = 'advice house'), Krankenhaus (hospital = 'sick house'), Bauernhaus (farmhouse), Baumhaus (treehouse = 'tree house'). The simple word 'Haus' builds an entire vocabulary.",
      },
      {
        name: "Zungenbrecher-Wörter (Tongue-twister words)",
        words: ["Streichholzschächtelchen", "Brötchen", "Eichhörnchen", "Quietscheentchen"],
        difficulty: "purple",
        explanation:
          "Words that torture non-German tongues: Streichholzschächtelchen (matchbox), Brötchen (bread roll), Eichhörnchen (squirrel), Quietscheentchen (rubber duck). The 'ch' and 'ö' sounds are a nightmare for English speakers.",
      },
    ],
    vibeClues: [
      "One word belongs to TWO groups. That's the trap.",
      "Four houses — but one is for the sick and one is for advice.",
      "Try saying the hardest group out loud. Your tongue will file a complaint.",
    ],
  },
  {
    number: 11,
    language: "de",
    date: "2026-02-27",
    categories: [
      {
        name: "Getränke (Drinks)",
        words: ["Bier", "Wein", "Saft", "Milch"],
        difficulty: "yellow",
        explanation: "Drinks — Bier (beer), Wein (wine), Saft (juice), Milch (milk).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["eventuell", "sympathisch", "Konfession", "ordinär"],
        difficulty: "green",
        explanation:
          "False friends: eventuell (possibly, not eventually), sympathisch (likeable, not sympathetic), Konfession (denomination, not confession), ordinär (vulgar, not ordinary).",
        isFalseFriends: true,
      },
      {
        name: "Reflexive Verben (Reflexive verbs)",
        words: ["sich freuen", "sich setzen", "sich waschen", "sich irren"],
        difficulty: "blue",
        explanation:
          "Reflexive verbs — sich freuen (to be happy), sich setzen (to sit down), sich waschen (to wash oneself), sich irren (to be mistaken). The 'sich' makes these actions point back at the subject.",
      },
      {
        name: "Scherzhafte Komposita (Humorous compounds)",
        words: ["Ohrwurm", "Backpfeife", "Innenschweinehund", "Kummerspeck"],
        difficulty: "purple",
        explanation:
          "Humorous compound words: Ohrwurm (catchy tune = 'ear worm'), Backpfeife (slap = 'cheek whistle'), innerer Schweinehund (inner laziness = 'inner pig-dog'), Kummerspeck (weight gained from emotional eating = 'grief bacon').",
      },
    ],
    vibeClues: [
      "Your English instincts will betray you — these four words are linguistic liars.",
      "Each of these verbs does something to itself. Look for the mirror word.",
      "The hardest group paints vivid pictures: pig-dogs, grief bacon, ear worms, and cheek whistles.",
    ],
  },
  {
    number: 12,
    language: "de",
    date: "2026-02-28",
    categories: [
      {
        name: "Schulfächer (School subjects)",
        words: ["Mathe", "Geschichte", "Kunst", "Sport"],
        difficulty: "yellow",
        explanation: "School subjects — Mathe (maths), Geschichte (history), Kunst (art), Sport (PE/sports).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Präservativ", "Rezept", "Roman", "Konkurs"],
        difficulty: "green",
        explanation:
          "False friends: Präservativ (condom, not preservative), Rezept (recipe or prescription, not receipt), Roman (novel, not a name), Konkurs (bankruptcy, not concourse). Ordering a 'Rezept' at a pharmacy gets you something very different!",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Stein' (Words with 'Stein')",
        words: ["Edelstein", "Backstein", "Meilenstein", "Grundstein"],
        difficulty: "blue",
        explanation:
          "Compound words with Stein (stone): Edelstein (gemstone = 'noble stone'), Backstein (brick = 'baking stone'), Meilenstein (milestone), Grundstein (foundation stone). Stein builds both literal and metaphorical structures.",
      },
      {
        name: "Konjunktiv II — Irreale Formen (Subjunctive II — unreal forms)",
        words: ["hätte", "wäre", "könnte", "würde"],
        difficulty: "purple",
        explanation:
          "Konjunktiv II forms: hätte (would have), wäre (would be), könnte (could), würde (would). These create hypothetical, polite, or unreal statements. Mastering them is the gateway to sounding fluent.",
      },
    ],
    vibeClues: [
      "Four words that have caused deeply embarrassing misunderstandings abroad.",
      "One group is built on rock — literally. Each word has a stone at its core.",
      "The hardest group lives in a world of 'what if' — none of these things are actually happening.",
    ],
  },
  {
    number: 13,
    language: "de",
    date: "2026-03-01",
    categories: [
      {
        name: "Natur (Nature)",
        words: ["Baum", "Blume", "Berg", "Fluss"],
        difficulty: "yellow",
        explanation: "Nature — Baum (tree), Blume (flower), Berg (mountain), Fluss (river).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Laden", "Lager", "Meinung", "Patent"],
        difficulty: "green",
        explanation:
          "False friends: Laden (shop, not to load), Lager (warehouse/storage, not lager beer in the English sense), Meinung (opinion, not meaning), Patent (obvious/clever, not just a patent).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Wasser' (Compound words with 'Wasser')",
        words: ["Wasserfall", "Wasserhahn", "Mineralwasser", "Abwasser"],
        difficulty: "blue",
        explanation:
          "Water compounds: Wasserfall (waterfall), Wasserhahn (tap/faucet = 'water rooster'), Mineralwasser (mineral water), Abwasser (sewage = 'off-water'). Wasserhahn literally means 'water rooster' — because old taps looked like roosters!",
      },
      {
        name: "Partizip II unregelmäßig (Irregular past participles)",
        words: ["gegessen", "getrunken", "geschrieben", "geschwommen"],
        difficulty: "purple",
        explanation:
          "Irregular past participles: gegessen (eaten), getrunken (drunk), geschrieben (written), geschwommen (swum). These don't follow the regular 'ge-...-t' pattern — they use 'ge-...-en' with vowel changes. Memorise them!",
      },
    ],
    vibeClues: [
      "One group has a hidden rooster and hidden sewage — all connected by water.",
      "These four look familiar to English eyes but each one lies about its meaning.",
      "The hardest group all start with 'ge-' but break the rules of regular German grammar.",
    ],
  },
  {
    number: 14,
    language: "de",
    date: "2026-03-02",
    categories: [
      {
        name: "Verkehr (Transport)",
        words: ["Zug", "Bus", "Fahrrad", "Straßenbahn"],
        difficulty: "yellow",
        explanation: "Transport — Zug (train), Bus (bus), Fahrrad (bicycle), Straßenbahn (tram).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Gift", "Herd", "Regal", "Kohl"],
        difficulty: "green",
        explanation:
          "False friends: Gift (poison, not gift), Herd (stove/cooker, not herd), Regal (shelf/bookcase, not regal), Kohl (cabbage, not coal).",
        isFalseFriends: true,
      },
      {
        name: "Musikinstrumente (Musical instruments)",
        words: ["Geige", "Klavier", "Flöte", "Schlagzeug"],
        difficulty: "blue",
        explanation:
          "Instruments — Geige (violin), Klavier (piano), Flöte (flute), Schlagzeug (drums = literally 'hitting stuff'). Schlagzeug is peak German: why name it when you can describe what you do with it?",
      },
      {
        name: "Wörter mit doppelter Bedeutung — Nomen und Verb (Words that are both noun and verb)",
        words: ["Fliegen", "Laufen", "Essen", "Fahren"],
        difficulty: "purple",
        explanation:
          "These words are both verbs and nominalised nouns: fliegen/das Fliegen (to fly/flying), laufen/das Laufen (to run/running), essen/das Essen (to eat/food or meal), fahren/das Fahren (to drive/driving). Capitalise a German verb and it becomes a noun!",
      },
    ],
    vibeClues: [
      "Four words wearing English masks. One of them could literally kill you.",
      "One group is a percussion punchline — its name describes violence against objects.",
      "The hardest group: same word, two lives. One starts with a capital letter.",
    ],
  },
  {
    number: 15,
    language: "de",
    date: "2026-03-03",
    categories: [
      {
        name: "Zimmer im Haus (Rooms in a house)",
        words: ["Küche", "Schlafzimmer", "Badezimmer", "Wohnzimmer"],
        difficulty: "yellow",
        explanation:
          "Rooms — Küche (kitchen), Schlafzimmer (bedroom = 'sleep room'), Badezimmer (bathroom = 'bath room'), Wohnzimmer (living room = 'living room').",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Komfort", "Kritik", "Formular", "sparen"],
        difficulty: "green",
        explanation:
          "False friends: Komfort (luxury/convenience, not comfort), Kritik (criticism/review, not just critique), Formular (form/document, not formula), sparen (to save money, not to spare).",
        isFalseFriends: true,
      },
      {
        name: "Verben mit Vokalwechsel (Verbs with vowel change)",
        words: ["sprechen", "helfen", "treffen", "werfen"],
        difficulty: "blue",
        explanation:
          "Strong verbs with e→i vowel change: sprechen→spricht (speak), helfen→hilft (help), treffen→trifft (meet), werfen→wirft (throw). In du/er/sie forms, the 'e' becomes 'i'. This catches every learner off guard.",
      },
      {
        name: "Amtsdeutsch — Bürokratische Wörter (Bureaucratic German)",
        words: ["Aufenthaltsgenehmigung", "Einkommenssteuererklärung", "Krankenversicherung", "Wohnungsanmeldung"],
        difficulty: "purple",
        explanation:
          "German bureaucracy in word form: Aufenthaltsgenehmigung (residence permit), Einkommenssteuererklärung (income tax declaration), Krankenversicherung (health insurance), Wohnungsanmeldung (address registration). Every expat's nightmare vocabulary.",
      },
    ],
    vibeClues: [
      "One group will make you fill out forms just reading it. Welcome to German bureaucracy.",
      "Four verbs that refuse to follow the rules — their vowels rebel in the present tense.",
      "These words look almost English. That's what makes them dangerous.",
    ],
  },
  {
    number: 16,
    language: "de",
    date: "2026-03-04",
    categories: [
      {
        name: "Jahreszeiten und Monate (Seasons and months)",
        words: ["Frühling", "Sommer", "Herbst", "Winter"],
        difficulty: "yellow",
        explanation:
          "Seasons — Frühling (spring = 'early-ling'), Sommer (summer), Herbst (autumn), Winter (winter). Frühling literally means 'little early one'.",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Kredit", "Termin", "Prospekt", "Provision"],
        difficulty: "green",
        explanation:
          "False friends: Kredit (loan, not credit), Termin (appointment, not terminus), Prospekt (brochure, not prospect), Provision (commission/fee, not provision).",
        isFalseFriends: true,
      },
      {
        name: "Präpositionen mit Dativ (Prepositions taking dative)",
        words: ["aus", "bei", "mit", "nach"],
        difficulty: "blue",
        explanation:
          "Dative prepositions: aus (from/out of), bei (at/near), mit (with), nach (after/to). German students memorise these with the mnemonic 'aus-bei-mit-nach, seit-von-zu'. They ALWAYS take dative — no exceptions.",
      },
      {
        name: "Wörter aus dem Arabischen (Words from Arabic)",
        words: ["Zucker", "Matratze", "Alkohol", "Magazin"],
        difficulty: "purple",
        explanation:
          "Words with Arabic origins: Zucker (sugar, from sukkar), Matratze (mattress, from matrah), Alkohol (alcohol, from al-kuḥl), Magazin (magazine/warehouse, from makhāzin). These words traveled through centuries of trade and scholarship.",
      },
    ],
    vibeClues: [
      "Four business words that mean something subtly but critically different in German.",
      "One group insists on the dative case. Always. No negotiations.",
      "The hardest group arrived in German via ancient trade routes from the Middle East.",
    ],
  },
  {
    number: 17,
    language: "de",
    date: "2026-03-05",
    categories: [
      {
        name: "Sportarten (Sports)",
        words: ["Fußball", "Schwimmen", "Tennis", "Turnen"],
        difficulty: "yellow",
        explanation: "Sports — Fußball (football/soccer), Schwimmen (swimming), Tennis (tennis), Turnen (gymnastics).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Krawatte", "Pension", "Rang", "Notiz"],
        difficulty: "green",
        explanation:
          "False friends: Krawatte (tie/necktie, not cravat exactly — similar but used differently), Pension (guesthouse or pension, not just pension), Rang (rank/tier but also balcony in a theatre), Notiz (note/memo, not notice).",
        isFalseFriends: true,
      },
      {
        name: "Diminutive mit '-chen' (Diminutives with '-chen')",
        words: ["Mädchen", "Häuschen", "Brötchen", "Kätzchen"],
        difficulty: "blue",
        explanation:
          "Diminutives with '-chen': Mädchen (girl, from Magd = maid), Häuschen (little house), Brötchen (bread roll, from Brot), Kätzchen (kitten, from Katze). Fun fact: ALL '-chen' words are neuter (das), even das Mädchen — a girl is grammatically 'it'!",
      },
      {
        name: "Partikelverben die Gegensätze bilden (Particle verbs forming opposites)",
        words: ["einsteigen/aussteigen", "aufmachen/zumachen", "hinstellen/wegnehmen", "einschalten/ausschalten"],
        difficulty: "purple",
        explanation:
          "Particle verb opposites: einsteigen/aussteigen (board/alight), aufmachen/zumachen (open/close), hinstellen/wegnehmen (put down/take away), einschalten/ausschalten (switch on/switch off). German builds opposites by swapping tiny prefixes.",
      },
    ],
    vibeClues: [
      "Add '-chen' to make things cute. But there's a grammatical catch — they ALL switch gender.",
      "One group is a lie detector for English speakers. None mean quite what you think.",
      "The hardest group: swap one tiny prefix and the meaning flips 180°.",
    ],
  },
  {
    number: 18,
    language: "de",
    date: "2026-03-06",
    categories: [
      {
        name: "Im Büro (In the office)",
        words: ["Schreibtisch", "Drucker", "Bildschirm", "Tastatur"],
        difficulty: "yellow",
        explanation:
          "Office items — Schreibtisch (desk = 'writing table'), Drucker (printer = 'presser'), Bildschirm (screen = 'picture shield'), Tastatur (keyboard = from Taste, key/button).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Fotograf", "Ambulanz", "Direktor", "Lokal"],
        difficulty: "green",
        explanation:
          "False friends: Fotograf (photographer, same meaning but watch the context), Ambulanz (outpatient clinic, not ambulance vehicle), Direktor (headteacher/director, not movie director usually), Lokal (pub/restaurant, not local).",
        isFalseFriends: true,
      },
      {
        name: "Adjektive mit '-lich' (Adjectives with '-lich')",
        words: ["freundlich", "herzlich", "glücklich", "gemütlich"],
        difficulty: "blue",
        explanation:
          "'-lich' adjectives: freundlich (friendly), herzlich (warm/heartfelt, from Herz = heart), glücklich (happy, from Glück = luck), gemütlich (cosy — famously untranslatable). The suffix '-lich' is like English '-ly' but makes adjectives, not adverbs.",
      },
      {
        name: "Berliner Dialekt (Berlin dialect words)",
        words: ["Kiez", "Schrippe", "icke", "Atze"],
        difficulty: "purple",
        explanation:
          "Berlin dialect: Kiez (neighbourhood), Schrippe (bread roll — standard German: Brötchen), icke (I/me — standard: ich), Atze (mate/buddy). Berlin German is so distinctive that other Germans sometimes struggle with it!",
      },
    ],
    vibeClues: [
      "One group is your desk — but each item's name literally describes what it does.",
      "Four words that sound international but shift meaning at the German border.",
      "The hardest group only makes sense if you're from a very specific city.",
    ],
  },
  {
    number: 19,
    language: "de",
    date: "2026-03-07",
    categories: [
      {
        name: "Gemüse (Vegetables)",
        words: ["Gurke", "Zwiebel", "Paprika", "Bohne"],
        difficulty: "yellow",
        explanation: "Vegetables — Gurke (cucumber), Zwiebel (onion), Paprika (pepper), Bohne (bean).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Sympathie", "Irritation", "Bekenntnis", "genial"],
        difficulty: "green",
        explanation:
          "False friends: Sympathie (liking/affinity, not sympathy), Irritation (confusion/annoyance, not irritation), Bekenntnis (confession/creed, not bequeathment), genial (brilliant/ingenious, not genial).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Zug' (Words containing 'Zug')",
        words: ["Umzug", "Aufzug", "Auszug", "Bezug"],
        difficulty: "blue",
        explanation:
          "Words with Zug (pull/train): Umzug (move/relocation = 'around-pull'), Aufzug (elevator/lift = 'up-pull'), Auszug (excerpt/moving out = 'out-pull'), Bezug (reference/cover = 'to-pull'). One root, four completely different meanings.",
      },
      {
        name: "Kofferwörter und Neuschöpfungen (Portmanteaus and neologisms)",
        words: ["Denglisch", "Jein", "Verschlimmbessern", "Fremdschämen"],
        difficulty: "purple",
        explanation:
          "German wordplay: Denglisch (German-English mix = Deutsch + Englisch), Jein (yes-no = ja + nein), Verschlimmbessern (to make worse while trying to improve), Fremdschämen (to feel embarrassed for someone else = 'foreign-shaming'). Germans invent words for feelings other languages can't name.",
      },
    ],
    vibeClues: [
      "One group is pulled together — literally. Each word has the same root meaning 'pull'.",
      "These four feelings look English but went through a German meaning machine.",
      "The hardest group? Germans invented words because existing ones weren't precise enough.",
    ],
  },
  {
    number: 20,
    language: "de",
    date: "2026-03-08",
    categories: [
      {
        name: "Körperpflege (Personal hygiene)",
        words: ["Seife", "Zahnbürste", "Handtuch", "Shampoo"],
        difficulty: "yellow",
        explanation:
          "Hygiene items — Seife (soap), Zahnbürste (toothbrush = 'tooth brush'), Handtuch (towel = 'hand cloth'), Shampoo (shampoo).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Kantine", "Kaution", "Labor", "Mantel"],
        difficulty: "green",
        explanation:
          "False friends: Kantine (canteen/cafeteria — close but not identical), Kaution (deposit/bail, not caution), Labor (laboratory, not labour), Mantel (coat, not mantel/mantle).",
        isFalseFriends: true,
      },
      {
        name: "Verben mit 'aus' (Verbs with 'aus')",
        words: ["ausgeben", "ausleihen", "ausfallen", "aushalten"],
        difficulty: "blue",
        explanation:
          "Verbs with 'aus': ausgeben (to spend), ausleihen (to borrow/lend), ausfallen (to fail/be cancelled), aushalten (to endure/bear). The prefix 'aus' (out) gives each verb a sense of outward motion or completion.",
      },
      {
        name: "Wörter die wie Schimpfwörter klingen (Words that sound like swear words)",
        words: ["Dicke", "Pumpe", "Schmalz", "Knacker"],
        difficulty: "purple",
        explanation:
          "Innocent words that sound rude: Dicke (thickness/fat one — but just means thick), Pumpe (pump, but slang for heart), Schmalz (lard, also means schmaltz/sentimentality), Knacker (cracker/old thing). Context is everything in German!",
      },
    ],
    vibeClues: [
      "One group has a tiny prefix meaning 'out' — and each verb takes it in a different direction.",
      "These four words could cause diplomatic incidents if you assume the English meaning.",
      "The hardest group sounds offensive to English ears but is completely innocent in German.",
    ],
  },
  {
    number: 21,
    language: "de",
    date: "2026-03-09",
    categories: [
      {
        name: "In der Stadt (In the city)",
        words: ["Bahnhof", "Kirche", "Brücke", "Marktplatz"],
        difficulty: "yellow",
        explanation:
          "City landmarks — Bahnhof (train station), Kirche (church), Brücke (bridge), Marktplatz (market square).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Handy", "Frisur", "sympathisch", "Beamer"],
        difficulty: "green",
        explanation:
          "False friends: Handy (mobile phone, not handy), Frisur (hairstyle, not freezer), sympathisch (likeable, not sympathetic), Beamer (projector, not BMW).",
        isFalseFriends: true,
      },
      {
        name: "Deutsche Zungenbrecher-Laute (German tongue-twister sounds)",
        words: ["Streichholz", "Pflicht", "Strumpf", "Knödel"],
        difficulty: "blue",
        explanation:
          "Words with notoriously difficult consonant clusters: Streichholz (match = str+ch), Pflicht (duty = pfl), Strumpf (stocking = strmpf), Knödel (dumpling = kn). These consonant combinations don't exist in English.",
      },
      {
        name: "Wörter aus dem Französischen (Words from French)",
        words: ["Friseur", "Trottoir", "Portemonnaie", "Etage"],
        difficulty: "purple",
        explanation:
          "French loanwords in German: Friseur (hairdresser), Trottoir (pavement — used in Swiss German), Portemonnaie (wallet/purse), Etage (floor/storey). German absorbed French during centuries of cultural influence, especially in fashion and architecture.",
      },
    ],
    vibeClues: [
      "One group looks like English words having an identity crisis in Germany.",
      "Try pronouncing the blue group. Your mouth will form shapes it's never made before.",
      "The hardest group arrived in German via a romance language — and kept its original flavour.",
    ],
  },
  {
    number: 22,
    language: "de",
    date: "2026-03-10",
    categories: [
      {
        name: "Frühstück (Breakfast)",
        words: ["Brötchen", "Marmelade", "Müsli", "Ei"],
        difficulty: "yellow",
        explanation:
          "Breakfast items — Brötchen (bread roll), Marmelade (jam), Müsli (muesli/granola), Ei (egg). German breakfast is a sacred ritual!",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Chef", "Gymnasium", "Kompass", "Billion"],
        difficulty: "green",
        explanation:
          "False friends: Chef (boss, not chef), Gymnasium (secondary school, not gym), Kompass (compass — actually the same, but used as a trap word), Billion (trillion, not billion).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Feuer' (Fire compounds)",
        words: ["Feuerwehr", "Feuerzeug", "Feuerlöscher", "Feuerwerk"],
        difficulty: "blue",
        explanation:
          "Fire compounds: Feuerwehr (fire brigade = 'fire defence'), Feuerzeug (lighter = 'fire stuff'), Feuerlöscher (fire extinguisher = 'fire extinguisher'), Feuerwerk (fireworks). German builds an entire fire station from one word.",
      },
      {
        name: "Genitivkonstruktionen (Genitive constructions)",
        words: ["trotz", "wegen", "während", "statt"],
        difficulty: "purple",
        explanation:
          "Genitive prepositions: trotz (despite), wegen (because of), während (during), statt (instead of). These demand the genitive case — Germany's endangered grammatical species. Many Germans now use dative instead, causing grammarians despair.",
      },
    ],
    vibeClues: [
      "One group is on fire — literally. Every word burns with the same root.",
      "Four words your English brain will confidently misidentify. Don't trust yourself.",
      "The hardest group demands a dying grammatical case. Even Germans get it wrong now.",
    ],
  },
  {
    number: 23,
    language: "de",
    date: "2026-03-11",
    categories: [
      {
        name: "Im Krankenhaus (In the hospital)",
        words: ["Arzt", "Krankenschwester", "Spritze", "Pflaster"],
        difficulty: "yellow",
        explanation:
          "Hospital words — Arzt (doctor), Krankenschwester (nurse = 'sick sister'), Spritze (injection/syringe), Pflaster (plaster/band-aid).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Fabrik", "aktuell", "sensibel", "Rente"],
        difficulty: "green",
        explanation:
          "False friends: Fabrik (factory, not fabric), aktuell (current, not actual), sensibel (sensitive, not sensible), Rente (pension, not rent).",
        isFalseFriends: true,
      },
      {
        name: "Tierlaute (Animal sounds)",
        words: ["miauen", "bellen", "wiehern", "grunzen"],
        difficulty: "blue",
        explanation:
          "Animal sounds as verbs: miauen (to meow), bellen (to bark), wiehern (to neigh), grunzen (to grunt/oink). Every language hears animal sounds differently — German pigs say 'oink' as 'grunz'!",
      },
      {
        name: "Wörter die aus dem Deutschen ins Japanische gingen (German words in Japanese)",
        words: ["Arbeit", "Allergie", "Rucksack", "Karute"],
        difficulty: "purple",
        explanation:
          "German words borrowed into Japanese: Arbeit (アルバイト arubaito = part-time job), Allergie (アレルギー arerugii = allergy), Rucksack (リュックサック ryukkusakku = backpack), Karute (カルテ karute = medical record, from German Karte). Japan borrowed heavily from German medicine and science.",
      },
    ],
    vibeClues: [
      "One group speaks for the animals — but each sound is a German verb.",
      "These words emigrated to East Asia and took on new lives. German medicine went global.",
      "Four familiar-looking words that mean something different enough to cause real confusion.",
    ],
  },
  {
    number: 24,
    language: "de",
    date: "2026-03-12",
    categories: [
      {
        name: "Süßigkeiten (Sweets)",
        words: ["Schokolade", "Gummibärchen", "Keks", "Bonbon"],
        difficulty: "yellow",
        explanation:
          "Sweets — Schokolade (chocolate), Gummibärchen (gummy bears), Keks (biscuit/cookie, from English 'cakes'), Bonbon (sweet/candy, from French).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Note", "Dose", "Wand", "fast"],
        difficulty: "green",
        explanation:
          "False friends: Note (grade/mark, not note), Dose (can/tin, not dose), Wand (wall, not wand), fast (almost, not fast).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Straße' (Compound words with 'Straße')",
        words: ["Autobahn", "Sackgasse", "Einbahnstraße", "Kreuzung"],
        difficulty: "blue",
        explanation:
          "Road/street words: Autobahn (motorway = 'car track'), Sackgasse (dead end = 'sack alley'), Einbahnstraße (one-way street), Kreuzung (intersection = 'crossing'). Not all contain Straße but all belong to road vocabulary.",
      },
      {
        name: "Österreichisches Deutsch (Austrian German)",
        words: ["Erdapfel", "Paradeiser", "Schlagobers", "Jänner"],
        difficulty: "purple",
        explanation:
          "Austrian German: Erdapfel (potato = 'earth apple', standard: Kartoffel), Paradeiser (tomato, standard: Tomate), Schlagobers (whipped cream, standard: Sahne), Jänner (January, standard: Januar). Austrian German is a recognised variety with its own protected vocabulary in the EU!",
      },
    ],
    vibeClues: [
      "One group wears English faces but speaks German truths.",
      "The blue group puts you on the road — dead ends, motorways, and all.",
      "The hardest group speaks German... but a version from south of Munich.",
    ],
  },
  {
    number: 25,
    language: "de",
    date: "2026-03-13",
    categories: [
      {
        name: "Im Supermarkt (In the supermarket)",
        words: ["Kasse", "Regal", "Einkaufswagen", "Quittung"],
        difficulty: "yellow",
        explanation:
          "Supermarket words — Kasse (checkout), Regal (shelf), Einkaufswagen (shopping trolley = 'buying wagon'), Quittung (receipt).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Rezept", "Roman", "Konkurs", "Präservativ"],
        difficulty: "green",
        explanation:
          "False friends: Rezept (recipe/prescription, not receipt), Roman (novel, not Roman), Konkurs (bankruptcy, not concourse), Präservativ (condom, not preservative). These have caused truly memorable mix-ups!",
        isFalseFriends: true,
      },
      {
        name: "Verben mit 'um' (Verbs with 'um')",
        words: ["umziehen", "umsteigen", "umdrehen", "umtauschen"],
        difficulty: "blue",
        explanation:
          "Verbs with 'um' (around/change): umziehen (to move house or change clothes), umsteigen (to change trains), umdrehen (to turn around), umtauschen (to exchange/return). The prefix 'um' implies transformation or reversal.",
      },
      {
        name: "Schweizerdeutsch (Swiss German)",
        words: ["Velo", "Natel", "Zmorge", "Grüezi"],
        difficulty: "purple",
        explanation:
          "Swiss German: Velo (bicycle, standard: Fahrrad, from French vélo), Natel (mobile phone, standard: Handy), Zmorge (breakfast, standard: Frühstück), Grüezi (hello, standard: Guten Tag). Swiss German is so different that German TV shows subtitle it!",
      },
    ],
    vibeClues: [
      "One group transforms things — clothes, trains, directions, purchases. All with the same prefix.",
      "Four words that have ruined many English speakers' attempts at German conversation.",
      "The hardest group requires subtitles — even for Germans.",
    ],
  },
  {
    number: 26,
    language: "de",
    date: "2026-03-14",
    categories: [
      {
        name: "Werkzeuge (Tools)",
        words: ["Hammer", "Schere", "Zange", "Bohrer"],
        difficulty: "yellow",
        explanation: "Tools — Hammer (hammer), Schere (scissors), Zange (pliers), Bohrer (drill).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Taste", "Gift", "Brief", "Rock"],
        difficulty: "green",
        explanation:
          "False friends: Taste (key/button, not taste), Gift (poison, not gift), Brief (letter, not brief), Rock (skirt, not rock).",
        isFalseFriends: true,
      },
      {
        name: "Verben mit Doppelbedeutung (Verbs with double meanings)",
        words: ["umfahren", "übersetzen", "durchschauen", "unterstellen"],
        difficulty: "blue",
        explanation:
          "Verbs where separable vs inseparable changes meaning: umfahren (to drive around vs to run over), übersetzen (to translate vs to cross over), durchschauen (to see through vs to look through), unterstellen (to take shelter vs to insinuate). Stress placement determines meaning!",
      },
      {
        name: "Plattdeutsch (Low German dialect)",
        words: ["Moin", "Deern", "Büx", "Klönschnack"],
        difficulty: "purple",
        explanation:
          "Low German (Plattdeutsch): Moin (hello — used any time of day), Deern (girl, standard: Mädchen), Büx (trousers, standard: Hose), Klönschnack (casual chat). Plattdeutsch is a separate language family, closer to English and Dutch than to standard German!",
      },
    ],
    vibeClues: [
      "Four classic traps — the words English speakers always get wrong on day one.",
      "One group has split personalities: same spelling, but stress changes everything.",
      "The hardest group isn't even standard German — it's closer to English than you'd think.",
    ],
  },
  {
    number: 27,
    language: "de",
    date: "2026-03-15",
    categories: [
      {
        name: "Im Garten (In the garden)",
        words: ["Rasen", "Zaun", "Gießkanne", "Beet"],
        difficulty: "yellow",
        explanation:
          "Garden words — Rasen (lawn), Zaun (fence), Gießkanne (watering can = 'pouring can'), Beet (flowerbed, not the vegetable!).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Rat", "Mist", "Kind", "Herd"],
        difficulty: "green",
        explanation:
          "False friends: Rat (advice, not rat), Mist (manure, not mist), Kind (child, not kind), Herd (stove, not herd).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Zeit' (Time compounds)",
        words: ["Freizeit", "Mahlzeit", "Zeitgeist", "Halbzeit"],
        difficulty: "blue",
        explanation:
          "Time compounds: Freizeit (free time/leisure), Mahlzeit (meal, also a greeting at lunchtime!), Zeitgeist (spirit of the times), Halbzeit (half-time). 'Mahlzeit!' is what Germans say instead of 'bon appétit' — or just as a midday greeting.",
      },
      {
        name: "Gendern — Neue geschlechtergerechte Formen (Gender-inclusive neologisms)",
        words: ["Studierende", "Lehrende", "Mitarbeitende", "Forschende"],
        difficulty: "purple",
        explanation:
          "Gender-inclusive forms: Studierende (students), Lehrende (teachers), Mitarbeitende (employees), Forschende (researchers). These participle-based forms avoid the masculine default (Studenten) and are hotly debated in German society. A cultural flashpoint in modern Germany!",
      },
    ],
    vibeClues: [
      "One group shares a ticking core — every word has time at its heart.",
      "Four words that sound perfectly English but mean something completely different in Germany.",
      "The hardest group exists because of an ongoing cultural debate about language and identity.",
    ],
  },
  {
    number: 28,
    language: "de",
    date: "2026-03-16",
    categories: [
      {
        name: "Insekten (Insects)",
        words: ["Biene", "Fliege", "Ameise", "Schmetterling"],
        difficulty: "yellow",
        explanation:
          "Insects — Biene (bee), Fliege (fly — also means bow tie!), Ameise (ant), Schmetterling (butterfly — from schmettern, to smash, because of folk beliefs about butter-stealing witches in butterfly form).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Kredit", "Lokal", "Termin", "Provision"],
        difficulty: "green",
        explanation:
          "False friends: Kredit (loan, not credit), Lokal (pub/restaurant, not local), Termin (appointment, not terminus), Provision (commission, not provision).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Herz' (Heart compounds)",
        words: ["Herzschlag", "herzhaft", "herzlos", "Herzinfarkt"],
        difficulty: "blue",
        explanation:
          "Heart words: Herzschlag (heartbeat), herzhaft (hearty/savoury), herzlos (heartless), Herzinfarkt (heart attack). German builds emotion and medicine from the same root — Herz is both physical and metaphorical.",
      },
      {
        name: "Bayerisch (Bavarian dialect)",
        words: ["Servus", "Brezn", "Gaudi", "Schmankerl"],
        difficulty: "purple",
        explanation:
          "Bavarian German: Servus (hello/goodbye, from Latin 'servant'), Brezn (pretzel, standard: Brezel), Gaudi (fun/good time), Schmankerl (treat/delicacy). Bavarian is so distinct that northern Germans may not understand it at all.",
      },
    ],
    vibeClues: [
      "One group has the same organ at its core — it beats, it breaks, and it feeds you.",
      "Four words dressed in English that mean something else entirely in German.",
      "The hardest group comes from the south — where the mountains are and the beer flows.",
    ],
  },
  {
    number: 29,
    language: "de",
    date: "2026-03-17",
    categories: [
      {
        name: "Auf dem Spielplatz (At the playground)",
        words: ["Schaukel", "Rutsche", "Sandkasten", "Wippe"],
        difficulty: "yellow",
        explanation:
          "Playground equipment — Schaukel (swing), Rutsche (slide), Sandkasten (sandbox = 'sand box'), Wippe (seesaw).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["bekommen", "spenden", "Mappe", "Krawatte"],
        difficulty: "green",
        explanation:
          "False friends: bekommen (to receive, not become), spenden (to donate, not spend), Mappe (folder, not map), Krawatte (necktie, not cravat in the English sense).",
        isFalseFriends: true,
      },
      {
        name: "Verben mit 'vor' (Verbs with 'vor')",
        words: ["vorstellen", "vorbereiten", "vorschlagen", "vorlesen"],
        difficulty: "blue",
        explanation:
          "Verbs with 'vor' (before/in front): vorstellen (to introduce/imagine), vorbereiten (to prepare), vorschlagen (to suggest), vorlesen (to read aloud). The prefix 'vor' suggests presenting something forward.",
      },
      {
        name: "Seemannssprache (Nautical German)",
        words: ["Backbord", "Steuerbord", "Kombüse", "Schott"],
        difficulty: "purple",
        explanation:
          "Nautical terms: Backbord (port side), Steuerbord (starboard), Kombüse (ship's kitchen/galley), Schott (bulkhead). German sailing vocabulary reflects centuries of seafaring in the North Sea and Baltic.",
      },
    ],
    vibeClues: [
      "One group puts something 'before' — each verb presents, prepares, or proposes.",
      "Four words that betray English speakers. The most dangerous? It doesn't mean 'become'.",
      "The hardest group belongs at sea — you'd hear these words on a ship, not on land.",
    ],
  },
  {
    number: 30,
    language: "de",
    date: "2026-03-18",
    categories: [
      {
        name: "Im Restaurant (In the restaurant)",
        words: ["Speisekarte", "Rechnung", "Trinkgeld", "Kellner"],
        difficulty: "yellow",
        explanation:
          "Restaurant words — Speisekarte (menu = 'food card'), Rechnung (bill), Trinkgeld (tip = 'drink money'), Kellner (waiter).",
      },
      {
        name: "Falsche Freunde (False friends)",
        words: ["Ambulanz", "Formular", "Komfort", "Notiz"],
        difficulty: "green",
        explanation:
          "False friends: Ambulanz (outpatient clinic, not ambulance), Formular (form/document, not formula), Komfort (luxury/amenity, not comfort), Notiz (note/memo, not notice).",
        isFalseFriends: true,
      },
      {
        name: "Wörter mit 'Licht' (Light compounds)",
        words: ["Tageslicht", "Ampel", "Scheinwerfer", "Blitz"],
        difficulty: "blue",
        explanation:
          "Light-related words: Tageslicht (daylight), Ampel (traffic light), Scheinwerfer (headlight/spotlight = 'shine thrower'), Blitz (lightning/flash — yes, the word English borrowed for speed). Not all contain 'Licht' but all relate to light.",
      },
      {
        name: "Endgegner: Die längsten echten deutschen Wörter (Final boss: Longest real German words)",
        words: ["Rechtsschutzversicherung", "Geschwindigkeitsbegrenzung", "Sehenswürdigkeit", "Bezirksschornsteinfeger"],
        difficulty: "purple",
        explanation:
          "The final boss of German: Rechtsschutzversicherung (legal protection insurance), Geschwindigkeitsbegrenzung (speed limit), Sehenswürdigkeit (tourist attraction = 'seeing-worthiness'), Bezirksschornsteinfeger (district chimney sweep). If you can read these aloud, you've completed German.",
      },
    ],
    vibeClues: [
      "One group shines, flashes, and illuminates — it's all about light in different forms.",
      "Four words where English meanings will lead you astray in a German office.",
      "The final group is the ultimate German challenge. If you can pronounce them all, you win the language.",
    ],
  },
];
