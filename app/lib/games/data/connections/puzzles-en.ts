import type { ConnectionsPuzzle } from "./types";

/**
 * English Lingua Connections puzzles.
 * Designed for ESL/EFL learners — each puzzle highlights common English language pitfalls.
 */
export const PUZZLES_EN: ConnectionsPuzzle[] = [
  {
    number: 1,
    language: "en",
    date: "2026-02-17",
    categories: [
      {
        name: "Homophones (sound like 'there')",
        words: ["their", "there", "they're", "there's"],
        difficulty: "yellow",
        explanation:
          "All sound similar: their (possessive), there (place), they're (they are), there's (there is). One of the most common ESL mistakes.",
      },
      {
        name: "Phrasal verbs with 'up'",
        words: ["give up", "make up", "turn up", "break up"],
        difficulty: "green",
        explanation:
          "Phrasal verbs with 'up': give up (surrender), make up (invent/reconcile), turn up (arrive/appear), break up (end a relationship).",
      },
      {
        name: "Uncountable nouns (no plural!)",
        words: ["information", "advice", "furniture", "luggage"],
        difficulty: "blue",
        explanation:
          "Common ESL mistake: these nouns are NEVER plural. NOT 'informations', 'advices', 'furnitures', or 'luggages'.",
      },
      {
        name: "Words that look like adjectives but are nouns",
        words: ["arrival", "refusal", "survival", "approval"],
        difficulty: "purple",
        explanation:
          "Despite ending in '-al' (like adjectives 'final', 'formal'), these are all nouns. ESL learners often confuse them with adjectives.",
      },
    ],
    vibeClues: [
      "One group sounds exactly the same when spoken — spelling is the only difference",
      "One group will get you in trouble if you add an 's'",
      "These four all need a second word to make sense",
    ],
  },
  {
    number: 2,
    language: "en",
    date: "2026-02-18",
    categories: [
      {
        name: "Irregular past tenses (common mistakes)",
        words: ["went", "bought", "taught", "thought"],
        difficulty: "yellow",
        explanation:
          "Irregular past tenses: go→went, buy→bought, teach→taught, think→thought. ESL learners often say 'goed', 'buyed', etc.",
      },
      {
        name: "Silent letters",
        words: ["knife", "write", "honest", "island"],
        difficulty: "green",
        explanation:
          "Words with silent letters: knife (silent k), write (silent w), honest (silent h), island (silent s).",
      },
      {
        name: "Prepositions of time: 'at'",
        words: ["night", "noon", "midnight", "Christmas"],
        difficulty: "blue",
        explanation:
          "These all use 'at': at night, at noon, at midnight, at Christmas. ESL learners often confuse at/on/in for time.",
      },
      {
        name: "False friends for Spanish speakers",
        words: ["actually", "sensible", "fabric", "library"],
        difficulty: "purple",
        explanation:
          "False friends: actually (= in fact, NOT actualmente), sensible (= practical, NOT sensible), fabric (= cloth, NOT fábrica), library (= book place, NOT librería).",
        isFalseFriends: true,
      },
    ],
    vibeClues: [
      "One group hides letters you never hear",
      "One group's words will fool you if your first language is Spanish",
      "One group answers the question 'when?' with the same tiny preposition",
    ],
  },
  {
    number: 3,
    language: "en",
    date: "2026-02-19",
    categories: [
      {
        name: "Collocations with 'make'",
        words: ["a mistake", "a decision", "progress", "an effort"],
        difficulty: "yellow",
        explanation:
          "Common collocations with MAKE: make a mistake, make a decision, make progress, make an effort. ESL learners often use 'do' instead.",
      },
      {
        name: "Collocations with 'do'",
        words: ["homework", "the dishes", "a favour", "business"],
        difficulty: "green",
        explanation:
          "Common collocations with DO: do homework, do the dishes, do a favour, do business. The make/do distinction confuses ESL learners.",
      },
      {
        name: "Words where stress changes meaning",
        words: ["present", "record", "object", "produce"],
        difficulty: "blue",
        explanation:
          "Stress-shifting words: PREsent (noun/adj) vs preSENT (verb), REcord vs reCORD, OBject vs obJECT, PROduce vs proDUCE.",
      },
      {
        name: "Irregular plurals",
        words: ["children", "mice", "teeth", "feet"],
        difficulty: "purple",
        explanation:
          "Irregular plurals that don't follow the '-s' rule: child→children, mouse→mice, tooth→teeth, foot→feet.",
      },
    ],
    vibeClues: [
      "Two groups answer the question: 'make or do?' — the eternal ESL dilemma",
      "These words are shapeshifters — say them differently and they change class",
      "One group broke the rules of English plurals entirely",
    ],
  },
  {
    number: 4,
    language: "en",
    date: "2026-02-20",
    categories: [
      {
        name: "Phrasal verbs with 'get'",
        words: ["get up", "get on", "get over", "get by"],
        difficulty: "yellow",
        explanation:
          "Phrasal verbs with 'get': get up (wake/rise), get on (board/manage), get over (recover from), get by (survive/manage).",
      },
      {
        name: "Words ending in -ough with different pronunciations",
        words: ["through", "though", "cough", "rough"],
        difficulty: "green",
        explanation:
          "The '-ough' nightmare: through (/uː/), though (/oʊ/), cough (/ɒf/), rough (/ʌf/). Four different pronunciations for the same spelling!",
      },
      {
        name: "Prepositions of place: 'in'",
        words: ["a city", "a country", "a room", "the world"],
        difficulty: "blue",
        explanation:
          "These all use 'in': in a city, in a country, in a room, in the world. ESL learners struggle with in/on/at for place.",
      },
      {
        name: "Commonly confused word pairs (the wrong one)",
        words: ["affect", "principle", "complement", "stationery"],
        difficulty: "purple",
        explanation:
          "The trickier word in common confused pairs: affect (verb) vs effect (noun), principle (rule) vs principal (main), complement (complete) vs compliment (praise), stationery (paper) vs stationary (still).",
      },
    ],
    vibeClues: [
      "One group proves English spelling is completely insane — same ending, four sounds",
      "One group all need the same small word before them to say WHERE",
      "These words have evil twins that sound almost identical",
    ],
  },
  {
    number: 5,
    language: "en",
    date: "2026-02-21",
    categories: [
      {
        name: "Body idioms",
        words: ["cold feet", "sweet tooth", "green thumb", "old hand"],
        difficulty: "yellow",
        explanation:
          "Body part idioms: cold feet (nervousness), sweet tooth (love of sweets), green thumb (good at gardening), old hand (experienced person).",
      },
      {
        name: "Words with the same spelling but different meanings (homonyms)",
        words: ["bat", "bark", "bank", "match"],
        difficulty: "green",
        explanation:
          "Homonyms: bat (animal/sports equipment), bark (tree/dog sound), bank (money/river side), match (game/fire stick).",
      },
      {
        name: "Adjective order violations (which sounds wrong?)",
        words: ["big", "red", "old", "wooden"],
        difficulty: "blue",
        explanation:
          "English has a strict adjective order: opinion→size→age→colour→material. A 'big old red wooden' table — never 'red big wooden old'. ESL learners must learn this unwritten rule.",
      },
      {
        name: "False friends for German speakers",
        words: ["gift", "chef", "billion", "brave"],
        difficulty: "purple",
        explanation:
          "False friends: gift (EN: present, DE: poison), chef (EN: cook, DE: boss), billion (EN: 1,000,000,000, DE: Billion = trillion), brave (EN: courageous, DE: brav = well-behaved).",
        isFalseFriends: true,
      },
    ],
    vibeClues: [
      "One group involves human anatomy — but none of them are literal",
      "Each word in one group secretly lives a double life",
      "One group must always appear in a specific order when used together",
    ],
  },
  {
    number: 6,
    language: "en",
    date: "2026-02-22",
    categories: [
      {
        name: "Common misspellings by ESL learners",
        words: ["accommodate", "necessary", "definitely", "separate"],
        difficulty: "yellow",
        explanation:
          "Frequently misspelled: accommodate (double c, double m), necessary (one c, double s), definitely (not 'definately'), separate (not 'seperate').",
      },
      {
        name: "Phrasal verbs with 'look'",
        words: ["look up", "look after", "look forward to", "look into"],
        difficulty: "green",
        explanation:
          "Phrasal verbs: look up (search/improve), look after (care for), look forward to (anticipate), look into (investigate).",
      },
      {
        name: "Collective nouns",
        words: ["a flock", "a pack", "a swarm", "a herd"],
        difficulty: "blue",
        explanation:
          "Collective nouns for animal groups: a flock (of birds/sheep), a pack (of wolves), a swarm (of bees), a herd (of cattle).",
      },
      {
        name: "Words that change meaning with articles (a/the/Ø)",
        words: ["school", "hospital", "church", "prison"],
        difficulty: "purple",
        explanation:
          "With no article = the purpose (go to school = to study). With 'the' = the building (go to the school = visit the building). A huge ESL pitfall.",
      },
    ],
    vibeClues: [
      "One group are spelling nightmares — even native speakers get them wrong",
      "These four words change their entire meaning depending on one tiny word (or its absence) before them",
      "One group counts animals differently depending on the species",
    ],
  },
  {
    number: 7,
    language: "en",
    date: "2026-02-23",
    categories: [
      {
        name: "Prepositions after adjectives: 'of'",
        words: ["afraid", "aware", "capable", "fond"],
        difficulty: "yellow",
        explanation:
          "Adjectives followed by 'of': afraid of, aware of, capable of, fond of. ESL learners often use wrong prepositions.",
      },
      {
        name: "Words with unexpected plural forms",
        words: ["sheep", "fish", "deer", "aircraft"],
        difficulty: "green",
        explanation:
          "Zero-plural nouns: sheep→sheep, fish→fish, deer→deer, aircraft→aircraft. The plural form is the same as singular.",
      },
      {
        name: "Phrasal verbs with 'put'",
        words: ["put off", "put up with", "put out", "put down"],
        difficulty: "blue",
        explanation:
          "Phrasal verbs: put off (postpone), put up with (tolerate), put out (extinguish), put down (insult/euthanise).",
      },
      {
        name: "Linking words that seem positive but show contrast",
        words: ["however", "nevertheless", "although", "despite"],
        difficulty: "purple",
        explanation:
          "Contrast connectors: however, nevertheless, although, despite. ESL learners struggle to distinguish these from additive connectors like 'moreover' and 'furthermore'.",
      },
    ],
    vibeClues: [
      "One group rebelliously refuses to change in the plural",
      "These four all need the same little preposition after them",
      "One group all mean something like 'but' — just fancier",
    ],
  },
  {
    number: 8,
    language: "en",
    date: "2026-02-24",
    categories: [
      {
        name: "Weather collocations",
        words: ["heavy rain", "strong wind", "bright sunshine", "thick fog"],
        difficulty: "yellow",
        explanation:
          "Natural weather collocations: heavy rain (not 'strong rain'), strong wind (not 'heavy wind'), bright sunshine, thick fog. ESL learners mix these up.",
      },
      {
        name: "Verbs that are often confused",
        words: ["borrow", "lend", "rob", "steal"],
        difficulty: "green",
        explanation:
          "Commonly confused verb pairs: borrow (take temporarily) vs lend (give temporarily), rob (a person/place) vs steal (a thing). ESL learners mix these constantly.",
      },
      {
        name: "Words ending in -tion",
        words: ["education", "information", "station", "nation"],
        difficulty: "blue",
        explanation:
          "All end in '-tion' pronounced /ʃən/. ESL learners often mispronounce as /tɪɒn/. These are all nouns — the suffix turns verbs/adjectives into nouns.",
      },
      {
        name: "Idioms about money",
        words: ["break the bank", "cost an arm and a leg", "make ends meet", "foot the bill"],
        difficulty: "purple",
        explanation:
          "Money idioms: break the bank (too expensive), cost an arm and a leg (very expensive), make ends meet (barely afford living), foot the bill (pay for everything).",
      },
    ],
    vibeClues: [
      "In English, rain is never 'strong' and wind is never 'heavy' — one group gets the right partner",
      "One group is all about money — but never mentions money directly",
      "Two verbs in one group are about giving vs taking; two are about who loses out",
    ],
  },
  {
    number: 9,
    language: "en",
    date: "2026-02-25",
    categories: [
      {
        name: "Question tags",
        words: ["isn't it", "don't you", "haven't we", "won't they"],
        difficulty: "yellow",
        explanation:
          "Question tags flip positive to negative: It's cold, ISN'T IT? You like coffee, DON'T YOU? We've met, HAVEN'T WE? They'll come, WON'T THEY? A nightmare for ESL learners.",
      },
      {
        name: "Phrasal verbs with 'take'",
        words: ["take off", "take on", "take over", "take up"],
        difficulty: "green",
        explanation:
          "Phrasal verbs: take off (remove/depart), take on (accept/challenge), take over (assume control), take up (start a hobby/occupy).",
      },
      {
        name: "Words that look plural but are singular",
        words: ["news", "mathematics", "physics", "economics"],
        difficulty: "blue",
        explanation:
          "Trap for ESL learners: 'The news IS good' (not 'are'). Mathematics, physics, economics — all singular despite the -s ending.",
      },
      {
        name: "Colour idioms",
        words: ["see red", "feel blue", "green with envy", "in the red"],
        difficulty: "purple",
        explanation:
          "Colour idioms: see red (become angry), feel blue (feel sad), green with envy (jealous), in the red (in debt).",
      },
    ],
    vibeClues: [
      "One group ends every sentence with a tiny question — and it always flips",
      "These look like they need a plural verb, but they don't",
      "One group paints emotions with a palette",
    ],
  },
  {
    number: 10,
    language: "en",
    date: "2026-02-26",
    categories: [
      {
        name: "Commonly confused: 'say' vs 'tell' (these go with 'tell')",
        words: ["a lie", "the truth", "a story", "a joke"],
        difficulty: "yellow",
        explanation:
          "These collocate with TELL: tell a lie, tell the truth, tell a story, tell a joke. You 'say' words but 'tell' people things. ESL learners mix these up.",
      },
      {
        name: "Present perfect signal words",
        words: ["already", "yet", "just", "ever"],
        difficulty: "green",
        explanation:
          "These adverbs signal the present perfect tense: I've already eaten. Have you finished yet? I've just arrived. Have you ever been?",
      },
      {
        name: "Compound nouns where meaning isn't obvious",
        words: ["deadline", "butterfly", "breakfast", "blackmail"],
        difficulty: "blue",
        explanation:
          "Compound nouns whose parts don't explain the whole: deadline (not a dead line), butterfly (not butter + fly), breakfast (breaking the fast — but not obvious), blackmail (nothing to do with black or mail).",
      },
      {
        name: "Verbs followed by gerund (-ing) only",
        words: ["enjoy", "avoid", "suggest", "consider"],
        difficulty: "purple",
        explanation:
          "These verbs MUST be followed by -ing: enjoy swimming (not *enjoy to swim), avoid running, suggest going, consider moving. ESL learners often use 'to' instead.",
      },
    ],
    vibeClues: [
      "One group all complete the same verb — and it's not 'say'",
      "These four are time-travel words that put you in a specific tense",
      "One group hates the word 'to' — they only accept '-ing'",
    ],
  },
  {
    number: 11,
    language: "en",
    date: "2026-02-27",
    categories: [
      {
        name: "Words with 'silent e' that changes pronunciation",
        words: ["hate", "hope", "note", "cute"],
        difficulty: "yellow",
        explanation:
          "The silent 'e' makes the vowel long: hat→hate, hop→hope, not→note, cut→cute. Essential pronunciation rule for ESL learners.",
      },
      {
        name: "Phrasal verbs with 'come'",
        words: ["come across", "come up with", "come down with", "come round"],
        difficulty: "green",
        explanation:
          "Phrasal verbs: come across (find by chance), come up with (invent/think of), come down with (become ill), come round (regain consciousness/visit).",
      },
      {
        name: "Dependent prepositions: verbs + 'for'",
        words: ["apologise", "apply", "blame", "search"],
        difficulty: "blue",
        explanation:
          "Verbs followed by 'for': apologise for, apply for, blame for, search for. Wrong preposition choice is a classic ESL error.",
      },
      {
        name: "Intensifiers from weak to strong",
        words: ["quite", "rather", "fairly", "absolutely"],
        difficulty: "purple",
        explanation:
          "Degree adverbs: fairly (mild), quite (moderate), rather (strong-ish), absolutely (extreme). ESL learners often don't distinguish between these.",
      },
    ],
    vibeClues: [
      "Drop the last letter of each word in one group and you get a completely different word",
      "One group all follow the same verb pattern: verb + the same tiny preposition",
      "These four all describe 'how much' — but in different doses",
    ],
  },
  {
    number: 12,
    language: "en",
    date: "2026-02-28",
    categories: [
      {
        name: "Commonly confused: 'since' vs 'for' (these go with 'since')",
        words: ["Monday", "2019", "last week", "I was born"],
        difficulty: "yellow",
        explanation:
          "These use SINCE (point in time): since Monday, since 2019, since last week, since I was born. 'For' is for duration (for 3 years).",
      },
      {
        name: "Animal idioms",
        words: ["raining cats and dogs", "let the cat out of the bag", "the elephant in the room", "a wild goose chase"],
        difficulty: "green",
        explanation:
          "Animal idioms: raining cats and dogs (heavy rain), let the cat out of the bag (reveal a secret), the elephant in the room (obvious problem everyone ignores), a wild goose chase (pointless search).",
      },
      {
        name: "Formal vs informal pairs (the formal word)",
        words: ["commence", "purchase", "enquire", "reside"],
        difficulty: "blue",
        explanation:
          "Formal register words: commence (= start), purchase (= buy), enquire (= ask), reside (= live). ESL learners need to match formality levels.",
      },
      {
        name: "Words where the noun and verb are stressed differently",
        words: ["permit", "desert", "conduct", "conflict"],
        difficulty: "purple",
        explanation:
          "Stress shift: PERmit (noun) → perMIT (verb), DEsert (noun) → deSERT (verb), CONduct (noun) → conDUCT (verb), CONflict (noun) → conFLICT (verb).",
      },
    ],
    vibeClues: [
      "One group answers: 'since WHEN?' — always a starting point, never a duration",
      "One group is the posh version of everyday words",
      "Say these differently and they switch from things to actions",
    ],
  },
  {
    number: 13,
    language: "en",
    date: "2026-03-01",
    categories: [
      {
        name: "Third conditional keywords",
        words: ["if", "had", "would", "have"],
        difficulty: "yellow",
        explanation:
          "Third conditional structure: IF I HAD studied, I WOULD HAVE passed. ESL learners struggle with this unreal past conditional.",
      },
      {
        name: "Words with multiple pronunciations based on part of speech",
        words: ["read", "lead", "live", "wind"],
        difficulty: "green",
        explanation:
          "These change pronunciation by form: read (/riːd/ present, /rɛd/ past), lead (/liːd/ verb, /lɛd/ metal), live (/lɪv/ verb, /laɪv/ adjective), wind (/wɪnd/ noun, /waɪnd/ verb).",
      },
      {
        name: "Phrasal verbs with 'run'",
        words: ["run out of", "run into", "run over", "run through"],
        difficulty: "blue",
        explanation:
          "Phrasal verbs: run out of (exhaust supply), run into (meet by chance/collide), run over (hit with vehicle/exceed time), run through (practise/review).",
      },
      {
        name: "'Have' expressions (not possession)",
        words: ["have a go", "have a word", "have a look", "have a rest"],
        difficulty: "purple",
        explanation:
          "Delexical 'have': have a go (try), have a word (talk briefly), have a look (look), have a rest (rest). 'Have' adds no meaning — it's the noun that carries it. Confuses ESL learners.",
      },
    ],
    vibeClues: [
      "Four tiny words that together build a sentence about regret",
      "These chameleons change their sound depending on their job in a sentence",
      "One group always starts with the same verb — but the verb means nothing",
    ],
  },
  {
    number: 14,
    language: "en",
    date: "2026-03-02",
    categories: [
      {
        name: "Words with 'ght' (silent gh)",
        words: ["thought", "caught", "daughter", "weight"],
        difficulty: "yellow",
        explanation:
          "The 'gh' is silent in these words: thought, caught, daughter, weight. The '-ght' pattern is a common English spelling trap.",
      },
      {
        name: "Adjectives with -ed vs -ing (the -ed form)",
        words: ["bored", "interested", "confused", "excited"],
        difficulty: "green",
        explanation:
          "The -ED form describes how a PERSON feels: I am bored, interested, confused, excited. The -ING form describes the THING causing it. ESL learners constantly mix these.",
      },
      {
        name: "Prepositions of transport",
        words: ["by bus", "on foot", "by train", "by car"],
        difficulty: "blue",
        explanation:
          "Transport prepositions: by bus, on foot (exception!), by train, by car. ESL learners must memorise 'on foot' as the odd one.",
      },
      {
        name: "Food idioms",
        words: ["piece of cake", "spill the beans", "bring home the bacon", "in a nutshell"],
        difficulty: "purple",
        explanation:
          "Food idioms: piece of cake (easy), spill the beans (reveal secret), bring home the bacon (earn money), in a nutshell (briefly summarised).",
      },
    ],
    vibeClues: [
      "One group has letters hiding in plain sight — two phantom letters each time",
      "One group describes YOUR feelings — not the thing causing them",
      "One group is delicious but means something completely different",
    ],
  },
  {
    number: 15,
    language: "en",
    date: "2026-03-03",
    categories: [
      {
        name: "Verbs followed by 'to' + infinitive only",
        words: ["want", "decide", "promise", "refuse"],
        difficulty: "yellow",
        explanation:
          "These verbs MUST use 'to': want to go, decide to leave, promise to help, refuse to pay. They never take -ing. ESL learners confuse gerund/infinitive verbs.",
      },
      {
        name: "British vs American spelling (British form)",
        words: ["colour", "centre", "travelling", "defence"],
        difficulty: "green",
        explanation:
          "British spellings: colour (US: color), centre (US: center), travelling (US: traveling), defence (US: defense). ESL learners must pick one system.",
      },
      {
        name: "Phrasal verbs with 'go'",
        words: ["go on", "go off", "go through", "go ahead"],
        difficulty: "blue",
        explanation:
          "Phrasal verbs: go on (continue), go off (explode/ring/spoil), go through (experience), go ahead (proceed).",
      },
      {
        name: "False friends for French speakers",
        words: ["eventually", "actually", "resume", "demand"],
        difficulty: "purple",
        explanation:
          "False friends: eventually (= finally, NOT éventuellement), actually (= in fact, NOT actuellement), resume (= continue, NOT résumé), demand (= insist, NOT demander politely).",
        isFalseFriends: true,
      },
    ],
    vibeClues: [
      "One group is the same language, twice — two countries, two spellings",
      "One group only accepts 'to' after it — never '-ing'",
      "These words will embarrass you if you translate directly from French",
    ],
  },
  {
    number: 16,
    language: "en",
    date: "2026-03-04",
    categories: [
      {
        name: "Easily confused homophones",
        words: ["piece", "peace", "weather", "whether"],
        difficulty: "yellow",
        explanation:
          "Homophones: piece/peace (sound the same), weather/whether (sound the same). ESL learners must learn which spelling matches which meaning.",
      },
      {
        name: "Phrasal verbs with 'turn'",
        words: ["turn down", "turn out", "turn into", "turn off"],
        difficulty: "green",
        explanation:
          "Phrasal verbs: turn down (reject/lower), turn out (result), turn into (become), turn off (switch off/disgust).",
      },
      {
        name: "Words where 'a' vs 'an' surprises ESL learners",
        words: ["an hour", "a university", "an honest", "a European"],
        difficulty: "blue",
        explanation:
          "Articles depend on SOUND not spelling: an hour (silent h), a university (starts with /j/), an honest (silent h), a European (starts with /j/). Huge ESL trap.",
      },
      {
        name: "Reporting verbs with different patterns",
        words: ["admit", "deny", "suggest", "recommend"],
        difficulty: "purple",
        explanation:
          "These reporting verbs take gerund or that-clause: admit doing, deny doing, suggest that, recommend that. ESL learners must memorise each verb's pattern.",
      },
    ],
    vibeClues: [
      "Two pairs of twins — they sound identical but are spelled differently",
      "One group breaks the 'a for consonants, an for vowels' rule",
      "One group is all about what someone said — but rearranged",
    ],
  },
  {
    number: 17,
    language: "en",
    date: "2026-03-05",
    categories: [
      {
        name: "Extreme adjectives (non-gradable)",
        words: ["freezing", "boiling", "starving", "exhausted"],
        difficulty: "yellow",
        explanation:
          "Extreme adjectives: freezing (=very cold), boiling (=very hot), starving (=very hungry), exhausted (=very tired). You say 'absolutely freezing' NOT 'very freezing'.",
      },
      {
        name: "Words that are both nouns and verbs (same form)",
        words: ["answer", "change", "damage", "experience"],
        difficulty: "green",
        explanation:
          "These function as both noun and verb with the same form and stress: an answer / to answer, a change / to change, the damage / to damage, an experience / to experience.",
      },
      {
        name: "Prepositions after nouns: 'of'",
        words: ["lack", "fear", "kind", "pair"],
        difficulty: "blue",
        explanation:
          "Nouns followed by 'of': lack of, fear of, kind of, pair of. ESL learners often omit or misuse this preposition.",
      },
      {
        name: "Phrasal verbs with 'set'",
        words: ["set up", "set off", "set back", "set out"],
        difficulty: "purple",
        explanation:
          "Phrasal verbs: set up (establish), set off (begin a journey/trigger), set back (delay/cost), set out (begin/intend).",
      },
    ],
    vibeClues: [
      "One group takes 'absolutely' but never 'very' — they're already at maximum",
      "These four lead double lives — same word, different jobs, no change",
      "One group all have an invisible 'of' following them",
    ],
  },
  {
    number: 18,
    language: "en",
    date: "2026-03-06",
    categories: [
      {
        name: "Irregular comparative forms",
        words: ["better", "worse", "further", "less"],
        difficulty: "yellow",
        explanation:
          "Irregular comparatives: good→better (not 'gooder'), bad→worse (not 'badder'), far→further, little→less. ESL learners often regularise these.",
      },
      {
        name: "Words where doubling the consonant matters",
        words: ["dinner", "running", "sitting", "beginning"],
        difficulty: "green",
        explanation:
          "Double consonant rule: dine→dinner, run→running, sit→sitting, begin→beginning. The consonant doubles to keep the vowel short. Spelling trap for ESL learners.",
      },
      {
        name: "Expressions with 'time'",
        words: ["on time", "in time", "time off", "about time"],
        difficulty: "blue",
        explanation:
          "Time expressions: on time (punctual), in time (before it's too late), time off (free time from work), about time (finally!). Each has a very specific meaning.",
      },
      {
        name: "Verbs that change meaning completely in passive voice",
        words: ["born", "supposed", "used", "known"],
        difficulty: "purple",
        explanation:
          "These passives have special meanings: I was born (not 'I borned'), I'm supposed to (should), I'm used to (accustomed), it's known that (people know). ESL learners struggle with these passive constructions.",
      },
    ],
    vibeClues: [
      "One group broke the 'add -er' rule completely",
      "These words all have a letter that appears twice — and it changes everything",
      "One group looks passive but means something active",
    ],
  },
  {
    number: 19,
    language: "en",
    date: "2026-03-07",
    categories: [
      {
        name: "Words commonly mispronounced by ESL learners",
        words: ["comfortable", "vegetable", "Wednesday", "February"],
        difficulty: "yellow",
        explanation:
          "Tricky pronunciation: comfortable (/ˈkʌmftəbəl/ — 3 syllables, not 4), vegetable (/ˈvedʒtəbəl/ — 3, not 4), Wednesday (/ˈwɛnzdeɪ/ — silent d), February (/ˈfɛbjuəri/ — often drops first r).",
      },
      {
        name: "Phrasal verbs with 'bring'",
        words: ["bring up", "bring about", "bring back", "bring out"],
        difficulty: "green",
        explanation:
          "Phrasal verbs: bring up (raise children/mention topic), bring about (cause), bring back (return/remind), bring out (publish/reveal).",
      },
      {
        name: "Abstract uncountable nouns",
        words: ["knowledge", "happiness", "progress", "research"],
        difficulty: "blue",
        explanation:
          "Uncountable abstract nouns: knowledge, happiness, progress, research. You can't say 'a knowledge', 'happinesses', 'progresses', or 'researches'.",
      },
      {
        name: "Conditional zero keywords",
        words: ["if", "when", "whenever", "unless"],
        difficulty: "purple",
        explanation:
          "Zero conditional triggers (general truths): If/When/Whenever you heat water, it boils. Unless you study, you fail. Present + present tense pattern.",
      },
    ],
    vibeClues: [
      "One group will make you stumble if you try to say every letter",
      "One group refuses to be counted — no 'a', no 's', no numbers",
      "These four set up sentences about universal truths",
    ],
  },
  {
    number: 20,
    language: "en",
    date: "2026-03-08",
    categories: [
      {
        name: "Auxiliary verbs",
        words: ["do", "have", "will", "shall"],
        difficulty: "yellow",
        explanation:
          "English auxiliary verbs: do (questions/negatives), have (perfect tenses), will (future), shall (formal future/suggestions). They help main verbs but carry little meaning alone.",
      },
      {
        name: "Words ending in '-ful' (meaning 'full of')",
        words: ["wonderful", "beautiful", "grateful", "powerful"],
        difficulty: "green",
        explanation:
          "The suffix '-ful' means 'full of': wonderful, beautiful, grateful, powerful. Note: always ONE 'l' at the end, not two. Common spelling error.",
      },
      {
        name: "Phrasal verbs with 'work'",
        words: ["work out", "work on", "work off", "work up"],
        difficulty: "blue",
        explanation:
          "Phrasal verbs: work out (exercise/solve/succeed), work on (improve/develop), work off (burn off/repay), work up (build/develop gradually).",
      },
      {
        name: "Words where prefix changes meaning to opposite",
        words: ["unhappy", "impossible", "illegal", "irregular"],
        difficulty: "purple",
        explanation:
          "Negative prefixes: un- (unhappy), im- (impossible), il- (illegal), ir- (irregular). ESL learners must learn which prefix goes with which word — there's no clear rule.",
      },
    ],
    vibeClues: [
      "One group are the invisible helpers in almost every English sentence",
      "These all share an ending that means 'full of' — but it's only half full in spelling",
      "One group uses different front-ends to say 'not'",
    ],
  },
  {
    number: 21,
    language: "en",
    date: "2026-03-09",
    categories: [
      {
        name: "Verbs with irregular past participles (-en/-n)",
        words: ["spoken", "broken", "chosen", "stolen"],
        difficulty: "yellow",
        explanation:
          "Past participles ending in -en/-n: speak→spoken, break→broken, choose→chosen, steal→stolen. ESL learners often say 'speaked', 'breaked'.",
      },
      {
        name: "Expressions with 'get' (not phrasal verbs)",
        words: ["get married", "get lost", "get ready", "get better"],
        difficulty: "green",
        explanation:
          "Delexical 'get' + adjective/past participle: get married, get lost, get ready, get better. 'Get' indicates change of state — very common, very confusing for ESL.",
      },
      {
        name: "Linking words: addition",
        words: ["moreover", "furthermore", "in addition", "besides"],
        difficulty: "blue",
        explanation:
          "Additive connectors: moreover, furthermore, in addition, besides. All mean 'also/and'. ESL learners need these for academic writing.",
      },
      {
        name: "Commonly misspelled words (double letters)",
        words: ["occurrence", "committee", "recommend", "embarrass"],
        difficulty: "purple",
        explanation:
          "Double letter nightmares: occurrence (double r, double c), committee (double m, double t, double e), recommend (one c, double m), embarrass (double r, double s).",
      },
    ],
    vibeClues: [
      "One group are rebels that refuse the '-