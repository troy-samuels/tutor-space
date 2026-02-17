import type { ConnectionsPuzzle } from "./types";

/**
 * French Lingua Connections puzzles.
 */
export const PUZZLES_FR: ConnectionsPuzzle[] = [
  {
    number: 1,
    language: "fr",
    date: "2026-02-17",
    categories: [
      {
        name: "Parties du corps (Body parts)",
        words: ["bras", "jambe", "tête", "main"],
        difficulty: "yellow",
        explanation: "Basic body parts — bras (arm), jambe (leg), tête (head), main (hand). Note: 'bras' looks like 'bra' in English!",
      },
      {
        name: "Faux amis — ils ne signifient pas ce qu'ils semblent (False friends)",
        words: ["coin", "sale", "figure", "chair"],
        difficulty: "green",
        explanation:
          "False friends: coin (corner, not coin), sale (dirty, not sale), figure (face, not figure), chair (flesh, not chair).",
        isFalseFriends: true,
      },
      {
        name: "Au restaurant (At the restaurant)",
        words: ["entrée", "addition", "serveur", "pourboire"],
        difficulty: "blue",
        explanation:
          "Restaurant words — entrée (starter — NOT main course as in American English!), addition (bill), serveur (waiter), pourboire (tip). 'Entrée' is itself a false friend for Americans.",
      },
      {
        name: "Mots avec le préfixe 're-' qui changent de sens (Words with 're-' that change meaning)",
        words: ["regarder", "résumer", "rester", "retirer"],
        difficulty: "purple",
        explanation:
          "These 're-' words don't mean 'again': regarder (to watch, not re-guard), résumer (to summarise, not resume), rester (to stay, not rest), retirer (to withdraw, not retire).",
      },
    ],
    vibeClues: [
      "One group is hiding in plain sight — they look English but they're lying to you",
      "Imagine you're hungry in Paris. One group gets you fed.",
      "The hardest group shares a prefix that doesn't do what English taught you it should",
    ],
  },
  {
    number: 2,
    language: "fr",
    date: "2026-02-18",
    categories: [
      {
        name: "Fruits (Fruits)",
        words: ["pomme", "fraise", "cerise", "raisin"],
        difficulty: "yellow",
        explanation: "Fruits — pomme (apple), fraise (strawberry), cerise (cherry), raisin (grape — NOT raisin!).",
      },
      {
        name: "Faux amis (False friends)",
        words: ["librairie", "monnaie", "journée", "prune"],
        difficulty: "green",
        explanation:
          "False friends: librairie (bookshop, not library), monnaie (change/coins, not money), journée (day, not journey), prune (plum, not prune). 'Raisin' could trick you here — it's in the fruit group!",
        isFalseFriends: true,
      },
      {
        name: "Expressions avec 'avoir' (Expressions with 'avoir')",
        words: ["faim", "soif", "raison", "tort"],
        difficulty: "blue",
        explanation:
          "French uses 'avoir' (to have) where English uses 'to be': avoir faim (to be hungry), avoir soif (to be thirsty), avoir raison (to be right), avoir tort (to be wrong).",
      },
      {
        name: "Mots d'origine arabe (Arabic-origin words)",
        words: ["alcool", "algèbre", "magasin", "hasard"],
        difficulty: "purple",
        explanation:
          "Words from Arabic: alcool (alcohol, from al-kuḥl), algèbre (algebra, from al-jabr), magasin (shop, from makhāzin), hasard (chance, from az-zahr). French has hundreds of Arabic loanwords.",
      },
    ],
    vibeClues: [
      "One fruit is also a false friend for English speakers. It's hiding in two groups at once.",
      "You don't 'be' hungry in French. You 'have' it. One group works that way.",
      "The hardest group crossed the Mediterranean to reach French — centuries ago",
    ],
  },
  {
    number: 3,
    language: "fr",
    date: "2026-02-19",
    categories: [
      {
        name: "Couleurs (Colours)",
        words: ["rouge", "bleu", "vert", "jaune"],
        difficulty: "yellow",
        explanation: "Colours — rouge (red), bleu (blue), vert (green), jaune (yellow).",
      },
      {
        name: "Mots qui changent de sens au masculin/féminin (Words that change meaning by gender)",
        words: ["tour", "livre", "poste", "voile"],
        difficulty: "green",
        explanation:
          "Gender changes meaning: le tour (turn/tour) vs la tour (tower), le livre (book) vs la livre (pound), le poste (job/position) vs la poste (post office), le voile (veil) vs la voile (sail).",
      },
      {
        name: "Faux amis (False friends)",
        words: ["blessé", "attendre", "assister", "formidable"],
        difficulty: "blue",
        explanation:
          "False friends: blessé (injured, not blessed), attendre (to wait, not attend), assister (to witness, not assist), formidable (wonderful, not formidable).",
        isFalseFriends: true,
      },
      {
        name: "Verlan — mots inversés de l'argot (Verlan — reversed slang words)",
        words: ["meuf", "relou", "chelou", "ouf"],
        difficulty: "purple",
        explanation:
          "Verlan (from 'l'envers' = reverse): meuf (femme reversed = woman), relou (lourd reversed = annoying), chelou (louche reversed = sketchy), ouf (fou reversed = crazy). Essential for understanding young French speakers.",
      },
    ],
    vibeClues: [
      "One group's meaning flips depending on whether you say 'le' or 'la' before it",
      "These four words sound positive in English but might surprise you in French",
      "The street speaks differently in Paris. One group is inside-out.",
    ],
  },
  {
    number: 4,
    language: "fr",
    date: "2026-02-20",
    categories: [
      {
        name: "Animaux de la ferme (Farm animals)",
        words: ["vache", "cochon", "poule", "mouton"],
        difficulty: "yellow",
        explanation: "Farm animals — vache (cow), cochon (pig), poule (hen), mouton (sheep).",
      },
      {
        name: "Expressions avec des animaux (Animal expressions)",
        words: ["canard", "chat", "âne", "loup"],
        difficulty: "green",
        explanation:
          "Animals in idioms: canard (duck — 'un froid de canard' = freezing cold), chat (cat — 'avoir un chat dans la gorge' = to have a frog in one's throat), âne (donkey — 'têtu comme un âne' = stubborn), loup (wolf — 'avoir une faim de loup' = starving).",
      },
      {
        name: "Faux amis culinaires (Culinary false friends)",
        words: ["entrée", "biscuit", "chips", "déjeuner"],
        difficulty: "blue",
        explanation:
          "Food false friends: entrée (starter, not main), biscuit (cookie, not biscuit), chips (crisps, not chips/fries — those are 'frites'), déjeuner (lunch, not dinner — dinner is 'dîner').",
        isFalseFriends: true,
      },
      {
        name: "Homophones grammaticaux (Grammar homophones)",
        words: ["à/a", "où/ou", "ces/ses", "est/et"],
        difficulty: "purple",
        explanation:
          "Pairs that sound identical but have different meanings and spellings: à (to) / a (has), où (where) / ou (or), ces (these) / ses (his/her), est (is) / et (and). The #1 spelling challenge in French.",
      },
    ],
    vibeClues: [
      "Two groups have animals, but one is literal and the other is figurative. A cat isn't always a cat.",
      "This group sounds the same out loud but the accent/spelling changes everything",
      "Ordering food in France? One group will save you from embarrassment",
    ],
  },
  {
    number: 5,
    language: "fr",
    date: "2026-02-21",
    categories: [
      {
        name: "Vêtements (Clothing)",
        words: ["chemise", "pantalon", "jupe", "chapeau"],
        difficulty: "yellow",
        explanation: "Clothing — chemise (shirt), pantalon (trousers), jupe (skirt), chapeau (hat).",
      },
      {
        name: "Mots qui signifient 'très' en argot (Slang for 'very')",
        words: ["vachement", "grave", "trop", "carrément"],
        difficulty: "green",
        explanation:
          "Informal intensifiers: vachement (literally 'cow-ly'), grave (literally 'serious'), trop (literally 'too much'), carrément (literally 'squarely'). All mean 'really/very' in casual French.",
      },
      {
        name: "Métiers en -eur/-euse (Jobs with -eur/-euse)",
        words: ["chanteur", "serveur", "professeur", "vendeur"],
        difficulty: "blue",
        explanation: "Jobs with -eur suffix — chanteur (singer), serveur (waiter), professeur (teacher), vendeur (salesperson).",
      },
      {
        name: "Faux amis (False friends)",
        words: ["location", "préservatif", "actuellement", "résumer"],
        difficulty: "purple",
        explanation:
          "False friends: location (rental, not location), préservatif (condom, not preservative), actuellement (currently, not actually), résumer (to summarise, not resume). Some of these are embarrassingly wrong if misused!",
        isFalseFriends: true,
      },
    ],
    vibeClues: [
      "One group will make your French friends laugh if you use them with their English meaning",
      "Casual Parisians don't say 'très'. They use four words that literally mean something else entirely.",
      "Two groups involve people who work — but one group shares a grammatical ending",
    ],
  },
  {
    number: 6,
    language: "fr",
    date: "2026-02-22",
    categories: [
      {
        name: "Météo (Weather)",
        words: ["pluie", "neige", "orage", "brouillard"],
        difficulty: "yellow",
        explanation: "Weather — pluie (rain), neige (snow), orage (thunderstorm), brouillard (fog).",
      },
      {
        name: "Mots à double sens (Words with double meanings)",
        words: ["glace", "avocat", "pièce", "grève"],
        difficulty: "green",
        explanation:
          "Each has two meanings: glace (ice/mirror/ice cream), avocat (lawyer/avocado), pièce (room/coin/play), grève (strike/beach).",
      },
      {
        name: "Connecteurs logiques (Logical connectors)",
        words: ["cependant", "néanmoins", "toutefois", "pourtant"],
        difficulty: "blue",
        explanation:
          "All mean roughly 'however/nevertheless': cependant, néanmoins, toutefois, pourtant. They look different but are functionally synonymous.",
      },
      {
        name: "Mots empruntés à l'anglais... mais transformés (English loanwords... but changed)",
        words: ["parking", "camping", "footing", "smoking"],
        difficulty: "purple",
        explanation:
          "French 'borrowed' these from English but changed their meaning: parking (car park, not the act), camping (campsite, not the activity), footing (jogging, not footwork), smoking (tuxedo, not the act of smoking).",
      },
    ],
    vibeClues: [
      "One group stole words from English and gave them new identities",
      "Four synonyms hiding among unrelated words. They all mean the same thing.",
      "An avocado, a room, and a beach walk into a group... each has a secret twin meaning",
    ],
  },
  {
    number: 7,
    language: "fr",
    date: "2026-02-23",
    categories: [
      {
        name: "Dans la salle de classe (In the classroom)",
        words: ["crayon", "cahier", "tableau", "gomme"],
        difficulty: "yellow",
        explanation: "Classroom items — crayon (pencil), cahier (notebook), tableau (whiteboard/blackboard), gomme (eraser).",
      },
      {
        name: "Faux amis (False friends)",
        words: ["crayon", "préservatif", "raisin", "blessé"],
        difficulty: "green",
        explanation:
          "Wait — crayon is in TWO groups? No! This is the trap. 'Crayon' in French means PENCIL (not crayon). It belongs in the classroom group. The false friends here are: préservatif (condom), raisin (grape), blessé (injured).",
        isFalseFriends: true,
      },
      {
        name: "Expressions avec 'faire' (Expressions with 'faire')",
        words: ["attention", "beau", "peur", "partie"],
        difficulty: "blue",
        explanation:
          "Expressions with 'faire': faire attention (to pay attention), faire beau (to be nice weather), faire peur (to scare), faire partie (to be part of).",
      },
      {
        name: "Mots invariables au pluriel (Words that don't change in plural)",
        words: ["nez", "voix", "bras", "souris"],
        difficulty: "purple",
        explanation:
          "Words that look identical in singular and plural: nez (nose/noses), voix (voice/voices), bras (arm/arms), souris (mouse/mice). Already end in -s, -x, or -z.",
      },
    ],
    vibeClues: [
      "One word appears to belong to two groups. Trust what it means in FRENCH, not English.",
      "Four words that refuse to change, no matter how many there are. Stubborn grammar.",
      "Add a verb meaning 'to do/make' and these four suddenly make sense as phrases",
    ],
  },
  // ── Puzzle 8 ──────────────────────────────────────────
  {
    number: 8,
    language: "fr",
    date: "2026-02-24",
    categories: [
      {
        name: "Famille (Family)",
        words: ["frère", "sœur", "oncle", "neveu"],
        difficulty: "yellow",
        explanation:
          "Family members — frère (brother), sœur (sister), oncle (uncle), neveu (nephew).",
      },
      {
        name: "Faux amis (False friends)",
        words: ["sympathique", "sensible", "terrible", "excité"],
        difficulty: "green",
        explanation:
          "False friends: sympathique (nice/likeable, not sympathetic), sensible (sensitive, not sensible), terrible (great/terrific colloquially, not only terrible), excité (agitated/hyper, not excited — using it can sound sexual!).",
        isFalseFriends: true,
      },
      {
        name: "Dans la cuisine (In the kitchen)",
        words: ["casserole", "couteau", "cuillère", "planche"],
        difficulty: "blue",
        explanation:
          "Kitchen items — casserole (saucepan, not the oven dish!), couteau (knife), cuillère (spoon), planche (cutting board).",
      },
      {
        name: "Expressions avec 'coup' (Expressions with 'coup')",
        words: ["foudre", "fil", "main", "œil"],
        difficulty: "purple",
        explanation:
          "All form expressions with 'coup de': coup de foudre (love at first sight, lit. lightning strike), coup de fil (phone call), coup de main (helping hand), coup d'œil (glance). 'Main' could trick you into the family/body group!",
      },
    ],
    vibeClues: [
      "One group needs a two-word prefix to make sense. Think 'blow of…'",
      "These adjectives flatter in French but might offend in English — or vice versa",
      "A saucepan is not what Americans bake in the oven. One group cooks differently.",
    ],
  },
  // ── Puzzle 9 ──────────────────────────────────────────
  {
    number: 9,
    language: "fr",
    date: "2026-02-25",
    categories: [
      {
        name: "Sports (Sports)",
        words: ["natation", "escrime", "équitation", "athlétisme"],
        difficulty: "yellow",
        explanation:
          "Sports — natation (swimming), escrime (fencing), équitation (horse riding), athlétisme (athletics/track & field).",
      },
      {
        name: "Faux amis sportifs (Sporty false friends)",
        words: ["football", "basket", "golf", "tennis"],
        difficulty: "green",
        explanation:
          "These look like English sports but have traps: football in France means SOCCER, basket means basketball (not a basket), golf and tennis are the same — but 'tennis' also means trainers/sneakers! And 'basket' also means sneaker.",
        isFalseFriends: true,
      },
      {
        name: "Mots en -tion qui trompent (Tricky -tion words)",
        words: ["location", "application", "formation", "composition"],
        difficulty: "blue",
        explanation:
          "Words ending in -tion that shift meaning: location (rental), application (diligence/effort, not just app), formation (training/education, not rock formation), composition (exam/test, not just a composition).",
      },
      {
        name: "Virelangues — sons difficiles (Tongue twisters — hard sounds)",
        words: ["seize", "dessous", "chasseur", "grenouille"],
        difficulty: "purple",
        explanation:
          "Words that trip up English speakers' pronunciation: seize (sixteen — but sounds nothing like English 'seize'), dessous (underneath — the 'ou' vs 'u' trap), chasseur (hunter — the French 'ch' sound), grenouille (frog — the vowel cluster nightmare).",
      },
    ],
    vibeClues: [
      "One group has words you think you know from English — but France plays by different rules",
      "These four words end the same way but none mean quite what an English speaker expects",
      "Say these out loud. If your French teacher winces, they belong here.",
    ],
  },
  // ── Puzzle 10 ─────────────────────────────────────────
  {
    number: 10,
    language: "fr",
    date: "2026-02-26",
    categories: [
      {
        name: "Émotions positives (Positive emotions)",
        words: ["joie", "bonheur", "fierté", "espoir"],
        difficulty: "yellow",
        explanation:
          "Positive emotions — joie (joy), bonheur (happiness), fierté (pride), espoir (hope).",
      },
      {
        name: "Émotions négatives (Negative emotions)",
        words: ["colère", "tristesse", "honte", "angoisse"],
        difficulty: "green",
        explanation:
          "Negative emotions — colère (anger), tristesse (sadness), honte (shame), angoisse (anguish/anxiety).",
      },
      {
        name: "Faux amis émotionnels (Emotional false friends)",
        words: ["envie", "décevoir", "ennui", "gêné"],
        difficulty: "blue",
        explanation:
          "False friends: envie (desire/craving, not envy — envy is 'jalousie'), décevoir (to disappoint, not deceive), ennui (boredom, not the existential English word), gêné (embarrassed, not a genie!).",
        isFalseFriends: true,
      },
      {
        name: "Émotions cachées dans des expressions (Emotions hidden in idioms)",
        words: ["cafard", "vague", "pêche", "poil"],
        difficulty: "purple",
        explanation:
          "Emotion idioms: avoir le cafard (to feel down — cafard = cockroach), avoir le vague à l'âme (to feel melancholy — vague = wave), avoir la pêche (to feel great — pêche = peach), être de bon poil (to be in a good mood — poil = hair). None obviously suggest emotions!",
      },
    ],
    vibeClues: [
      "Two groups are opposites — one bright, one dark. But beware the group that LOOKS emotional but lies.",
      "Cockroaches, peaches, waves, and hair. Trust French idioms to make it weird.",
      "These four words feel English but their French hearts beat differently",
    ],
  },
  // ── Puzzle 11 ─────────────────────────────────────────
  {
    number: 11,
    language: "fr",
    date: "2026-02-27",
    categories: [
      {
        name: "Arbres (Trees)",
        words: ["chêne", "sapin", "bouleau", "érable"],
        difficulty: "yellow",
        explanation:
          "Trees — chêne (oak), sapin (fir/pine), bouleau (birch), érable (maple — think Canada!).",
      },
      {
        name: "Fleurs (Flowers)",
        words: ["rose", "tulipe", "marguerite", "tournesol"],
        difficulty: "green",
        explanation:
          "Flowers — rose (rose), tulipe (tulip), marguerite (daisy — also a woman's name!), tournesol (sunflower — literally 'turns to sun').",
      },
      {
        name: "Faux amis de la nature (Nature false friends)",
        words: ["pin", "coin", "mousse", "mare"],
        difficulty: "blue",
        explanation:
          "Nature false friends: pin (pine tree, not a pin), coin (corner/spot, not a coin), mousse (moss or foam, not mousse/moose), mare (pond, not a female horse).",
        isFalseFriends: true,
      },
      {
        name: "Mots composés avec 'terre' (Compound words with 'terre')",
        words: ["pomme", "tremblement", "atterrir", "parterre"],
        difficulty: "purple",
        explanation:
          "All relate to 'terre' (earth): pomme de terre (potato, lit. apple of earth), tremblement de terre (earthquake), atterrir (to land — 'à terre'), parterre (flower bed/ground floor — 'par terre'). 'Pomme' tries to lure you to a fruit group!",
      },
    ],
    vibeClues: [
      "Two groups grow in nature but one has roots and the other has petals",
      "These four words earth themselves in a common root. One pretends to be a fruit.",
      "Pin, coin, mousse, mare — you know these words. But do you REALLY know them in French?",
    ],
  },
  // ── Puzzle 12 ─────────────────────────────────────────
  {
    number: 12,
    language: "fr",
    date: "2026-02-28",
    categories: [
      {
        name: "Nombres ordinaux (Ordinal numbers)",
        words: ["premier", "deuxième", "troisième", "dernier"],
        difficulty: "yellow",
        explanation:
          "Ordinals — premier (first), deuxième (second), troisième (third), dernier (last). Note: 'premier' can also mean 'prime minister' (Premier ministre).",
      },
      {
        name: "Faux amis numériques (Number false friends)",
        words: ["nombre", "chiffre", "figure", "numéro"],
        difficulty: "green",
        explanation:
          "Number words that confuse: nombre (number/quantity), chiffre (digit/figure — not cipher), figure (face, not a number), numéro (specific number/issue, not numero uno). 'Figure' is the trickiest — it means face in French!",
        isFalseFriends: true,
      },
      {
        name: "Expressions de temps (Time expressions)",
        words: ["quinzaine", "lendemain", "veille", "jadis"],
        difficulty: "blue",
        explanation:
          "Time words: quinzaine (about fifteen/fortnight), lendemain (the next day), veille (the day before/eve), jadis (long ago/in olden times).",
      },
      {
        name: "Mots avec des chiffres cachés (Words with hidden numbers)",
        words: ["quarantaine", "septembre", "centaine", "quinquennat"],
        difficulty: "purple",
        explanation:
          "Hidden numbers: quarantaine (quarantine — from quarante/40 days), septembre (sept = 7, it was the 7th month in Roman calendar), centaine (about a hundred), quinquennat (5-year presidential term — from cinq/5).",
      },
    ],
    vibeClues: [
      "One group counts things in order. Another group hides numbers inside longer words.",
      "These four all relate to numbers but none of them mean what an English speaker thinks",
      "Time flies — one group is all about when, not how many",
    ],
  },
  // ── Puzzle 13 ─────────────────────────────────────────
  {
    number: 13,
    language: "fr",
    date: "2026-03-01",
    categories: [
      {
        name: "Moyens de transport (Means of transport)",
        words: ["avion", "bateau", "tramway", "vélo"],
        difficulty: "yellow",
        explanation:
          "Transport — avion (plane), bateau (boat), tramway (tram), vélo (bicycle).",
      },
      {
        name: "À l'aéroport (At the airport)",
        words: ["douane", "embarquement", "escale", "vol"],
        difficulty: "green",
        explanation:
          "Airport words — douane (customs), embarquement (boarding), escale (layover/stopover), vol (flight — but also means 'theft'!).",
      },
      {
        name: "Faux amis de voyage (Travel false friends)",
        words: ["car", "conducteur", "péage", "route"],
        difficulty: "blue",
        explanation:
          "Travel false friends: car (coach/bus, not car — car is 'voiture'), conducteur (driver, not conductor), péage (toll, not passage), route (road, not route — though related).",
        isFalseFriends: true,
      },
      {
        name: "Mots qui signifient 'partir' (Words meaning 'to leave')",
        words: ["quitter", "décamper", "filer", "dégager"],
        difficulty: "purple",
        explanation:
          "All mean 'to leave' with different nuances: quitter (to leave/quit someone), décamper (to clear out), filer (to dash off — also means to spin thread), dégager (to clear off/get out — informal and forceful).",
      },
    ],
    vibeClues: [
      "One group moves you, one group processes you, and one group tells you to get lost",
      "A 'car' in France isn't what you think. One group is full of road trip traps.",
      "Four synonyms for the same action — from polite to 'get out of my face'",
    ],
  },
  // ── Puzzle 14 ─────────────────────────────────────────
  {
    number: 14,
    language: "fr",
    date: "2026-03-02",
    categories: [
      {
        name: "Instruments de musique (Musical instruments)",
        words: ["violon", "batterie", "flûte", "guitare"],
        difficulty: "yellow",
        explanation:
          "Instruments — violon (violin), batterie (drums — also means battery!), flûte (flute), guitare (guitar).",
      },
      {
        name: "Genres musicaux (Music genres)",
        words: ["chanson", "rap", "variété", "classique"],
        difficulty: "green",
        explanation:
          "Music genres — chanson (French songwriting tradition), rap, variété (pop/variety — France's mainstream genre), classique (classical).",
      },
      {
        name: "Faux amis musicaux (Musical false friends)",
        words: ["partition", "note", "clé", "accord"],
        difficulty: "blue",
        explanation:
          "Musical false friends: partition (musical score, not partition), note (a musical note but also school grade, not just a written note), clé (key — musical key AND door key, not just clue), accord (chord, not accord/agreement — well, it means both!).",
        isFalseFriends: true,
      },
      {
        name: "Expressions musicales dans la vie quotidienne (Musical expressions in daily life)",
        words: ["tambour", "violon", "trompette", "harpe"],
        difficulty: "purple",
        explanation:
          "Instruments in idioms: tambour battant (at a brisk pace), violon d'Ingres (hobby/side passion), trompette — 'sans tambour ni trompette' (without fanfare), harpe — 'jouer de la harpe' (to play the harp, slang for stealing). 'Violon' appears in both the instrument group AND this idiom group — the trap!",
      },
    ],
    vibeClues: [
      "One word belongs in two groups — pick the one that's literal, not figurative",
      "Score, key, chord, note — you know these in English. French has other plans.",
      "One group plays music. Another plays with language using music.",
    ],
  },
  // ── Puzzle 15 ─────────────────────────────────────────
  {
    number: 15,
    language: "fr",
    date: "2026-03-03",
    categories: [
      {
        name: "Fournitures scolaires (School supplies)",
        words: ["stylo", "règle", "trousse", "classeur"],
        difficulty: "yellow",
        explanation:
          "School supplies — stylo (pen), règle (ruler — also means rule!), trousse (pencil case — not trousseau), classeur (binder/folder).",
      },
      {
        name: "Matières scolaires (School subjects)",
        words: ["histoire", "géographie", "physique", "dessin"],
        difficulty: "green",
        explanation:
          "School subjects — histoire (history — also means story), géographie (geography), physique (physics — also means physical appearance!), dessin (art/drawing, not design).",
      },
      {
        name: "Faux amis de l'école (School false friends)",
        words: ["college", "lecture", "passer", "patron"],
        difficulty: "blue",
        explanation:
          "School false friends: collège (middle school, not college/university), lecture (reading, not lecture — lecture is 'cours'), passer un examen (to take an exam, not pass it!), patron (boss, not patron).",
        isFalseFriends: true,
      },
      {
        name: "Mots à triple sens (Words with triple meanings)",
        words: ["cours", "tableau", "classe", "note"],
        difficulty: "purple",
        explanation:
          "Each has 3+ meanings: cours (class/course/price/run), tableau (painting/board/table-chart), classe (class/classroom/style), note (grade/musical note/bill at restaurant). All seem 'school' but their other meanings pull them in different directions.",
      },
    ],
    vibeClues: [
      "Everything screams 'school' but only two groups actually belong there. The others are impostors.",
      "Taking an exam in French doesn't mean what you hope. One group lies about education.",
      "Four chameleons — each word has at least three lives. Find the shape-shifters.",
    ],
  },
  // ── Puzzle 16 ─────────────────────────────────────────
  {
    number: 16,
    language: "fr",
    date: "2026-03-04",
    categories: [
      {
        name: "Boissons (Drinks)",
        words: ["citronnade", "tisane", "sirop", "jus"],
        difficulty: "yellow",
        explanation:
          "Drinks — citronnade (lemonade), tisane (herbal tea), sirop (syrup/cordial drink), jus (juice).",
      },
      {
        name: "Au café (At the café)",
        words: ["terrasse", "ardoise", "comptoir", "formule"],
        difficulty: "green",
        explanation:
          "Café vocabulary — terrasse (outdoor seating area), ardoise (slate board with specials — also means 'tab'), comptoir (counter/bar), formule (set menu/deal, not formula).",
      },
      {
        name: "Faux amis de la nourriture (Food false friends)",
        words: ["pain", "sauce", "entrée", "menu"],
        difficulty: "blue",
        explanation:
          "Food false friends: pain (bread, not pain), sauce (same word but French sauces are very different culturally), entrée (starter, not main course — again!), menu (set meal, not the card — the card is 'la carte').",
        isFalseFriends: true,
      },
      {
        name: "Argot pour l'argent (Slang for money)",
        words: ["thune", "blé", "fric", "oseille"],
        difficulty: "purple",
        explanation:
          "Money slang: thune (cash — from an old coin), blé (wheat — 'avoir du blé' = to have money), fric (dough/cash), oseille (sorrel herb — slang for money). 'Blé' and 'oseille' are plants, which might trick you into a nature group!",
      },
    ],
    vibeClues: [
      "Two plants and a grain are secretly about what's in your wallet",
      "Bread doesn't hurt in French. One group punishes English assumptions.",
      "One group is where you sit, order, and pay. Think zinc counters and chalkboards.",
    ],
  },
  // ── Puzzle 17 ─────────────────────────────────────────
  {
    number: 17,
    language: "fr",
    date: "2026-03-05",
    categories: [
      {
        name: "Animaux marins (Sea animals)",
        words: ["dauphin", "requin", "méduse", "étoile"],
        difficulty: "yellow",
        explanation:
          "Sea creatures — dauphin (dolphin — also means heir to the French throne!), requin (shark), méduse (jellyfish — named after Medusa), étoile de mer (starfish — 'étoile' means star).",
      },
      {
        name: "Insectes (Insects)",
        words: ["papillon", "fourmi", "coccinelle", "libellule"],
        difficulty: "green",
        explanation:
          "Insects — papillon (butterfly), fourmi (ant), coccinelle (ladybird — also the French name for VW Beetle!), libellule (dragonfly).",
      },
      {
        name: "Faux amis animaliers (Animal false friends)",
        words: ["dragon", "biche", "pie", "grue"],
        difficulty: "blue",
        explanation:
          "Animal false friends: dragon (also a real word but in military/heraldry, not mythical), biche (doe/deer, not b*tch — also a term of endearment 'ma biche'), pie (magpie, not a pastry), grue (crane bird, not groovy — also means 'prostitute' in slang!).",
        isFalseFriends: true,
      },
      {
        name: "Animaux dans les expressions (Animals in expressions)",
        words: ["poule", "vache", "cochon", "renard"],
        difficulty: "purple",
        explanation:
          "Animals as character descriptions: poule mouillée (coward, lit. wet hen), vache (mean person — 'oh la vache!' = wow), cochon (dirty/messy person), rusé comme un renard (sly as a fox). 'Poule', 'vache', and 'cochon' appeared as farm animals in puzzle 4 — here they're personality insults!",
      },
    ],
    vibeClues: [
      "Some of these animals appeared before. This time they're not on the farm — they're judging you.",
      "A magpie is not a dessert. A crane is not a compliment. One group deceives.",
      "Butterfly, ant, ladybird, dragonfly — the small and beautiful group.",
    ],
  },
  // ── Puzzle 18 ─────────────────────────────────────────
  {
    number: 18,
    language: "fr",
    date: "2026-03-06",
    categories: [
      {
        name: "Technologie (Technology)",
        words: ["écran", "souris", "clavier", "réseau"],
        difficulty: "yellow",
        explanation:
          "Tech words — écran (screen), souris (mouse — also the animal!), clavier (keyboard), réseau (network).",
      },
      {
        name: "Réseaux sociaux (Social media)",
        words: ["abonné", "partage", "fil", "publication"],
        difficulty: "green",
        explanation:
          "Social media terms — abonné (follower/subscriber), partage (share), fil (feed — literally 'thread'), publication (post).",
      },
      {
        name: "Faux amis numériques (Digital false friends)",
        words: ["portable", "logiciel", "fichier", "puce"],
        difficulty: "blue",
        explanation:
          "Digital false friends: portable (mobile phone or laptop, not just portable), logiciel (software, not logical), fichier (file/document, not fichier from 'ficher'), puce (chip/microchip — also means flea! 'Ma puce' = sweetheart).",
        isFalseFriends: true,
      },
      {
        name: "Mots anglais rejetés par l'Académie (English words rejected by the Académie française)",
        words: ["courriel", "baladodiffusion", "mot-dièse", "infolettre"],
        difficulty: "purple",
        explanation:
          "Official French replacements for English tech words: courriel (email — from 'courrier électronique'), baladodiffusion (podcast), mot-dièse (hashtag — literally 'sharp-sign word'), infolettre (newsletter). Most French people still use the English versions!",
      },
    ],
    vibeClues: [
      "The Académie française tried to ban English. One group is their revenge — French alternatives nobody uses.",
      "A flea is also a microchip. A mouse is also a mouse. Tech speaks animal in French.",
      "Feed, share, post, follower — but in French, they sound like a completely different conversation",
    ],
  },
  // ── Puzzle 19 ─────────────────────────────────────────
  {
    number: 19,
    language: "fr",
    date: "2026-03-07",
    categories: [
      {
        name: "Saisons et mois (Seasons and months)",
        words: ["printemps", "automne", "juillet", "décembre"],
        difficulty: "yellow",
        explanation:
          "Seasons and months — printemps (spring), automne (autumn), juillet (July), décembre (December).",
      },
      {
        name: "Expressions de temps (Time expressions)",
        words: ["désormais", "auparavant", "dorénavant", "autrefois"],
        difficulty: "green",
        explanation:
          "Time adverbs: désormais (from now on), auparavant (before/previously), dorénavant (henceforth), autrefois (in the past/formerly). Désormais and dorénavant are near-perfect synonyms — a classic exam trap!",
      },
      {
        name: "Faux amis temporels (Time false friends)",
        words: ["journée", "matinée", "soirée", "année"],
        difficulty: "blue",
        explanation:
          "False friends: these look like events (matinee, soirée) but in French they emphasise duration: journée (the whole day), matinée (the whole morning), soirée (the whole evening), année (the whole year). French distinguishes jour/journée, matin/matinée, etc.",
        isFalseFriends: true,
      },
      {
        name: "Le temps qu'il fait (The weather it makes)",
        words: ["verglas", "canicule", "crachin", "éclaircie"],
        difficulty: "purple",
        explanation:
          "Specific weather: verglas (black ice), canicule (heatwave — from the dog days/Sirius), crachin (drizzle — Brittany specialty), éclaircie (sunny spell/break in clouds). These are advanced weather terms most textbooks skip.",
      },
    ],
    vibeClues: [
      "Two groups are about time but one measures the clock and the other measures duration — French makes a distinction English doesn't",
      "Black ice, heatwaves, drizzle, and sunshine — France's weather has words for everything",
      "From now on, henceforth, previously, formerly — four fancy ways to say when",
    ],
  },
  // ── Puzzle 20 ─────────────────────────────────────────
  {
    number: 20,
    language: "fr",
    date: "2026-03-08",
    categories: [
      {
        name: "Professions médicales (Medical professions)",
        words: ["médecin", "infirmier", "chirurgien", "pharmacien"],
        difficulty: "yellow",
        explanation:
          "Medical jobs — médecin (doctor), infirmier (nurse), chirurgien (surgeon), pharmacien (pharmacist).",
      },
      {
        name: "Parties du corps — niveau avancé (Body parts — advanced)",
        words: ["cheville", "nuque", "poignet", "coude"],
        difficulty: "green",
        explanation:
          "Advanced body parts: cheville (ankle), nuque (nape of neck), poignet (wrist), coude (elbow). These come up a lot at the doctor's office!",
      },
      {
        name: "Faux amis médicaux (Medical false friends)",
        words: ["bras", "médecine", "préservatif", "drogué"],
        difficulty: "blue",
        explanation:
          "Medical false friends: bras (arm, not bra), médecine (the field of medicine, not medication — that's 'médicament'), préservatif (condom, not preservative), drogué (drug addict, not drugged — much stronger connotation).",
        isFalseFriends: true,
      },
      {
        name: "Expressions avec des parties du corps (Body part idioms)",
        words: ["doigt", "pied", "ventre", "langue"],
        difficulty: "purple",
        explanation:
          "Body part idioms: se mettre le doigt dans l'œil (to be completely wrong, lit. put finger in eye), avoir bon pied bon œil (to be in good shape), avoir les yeux plus gros que le ventre (eyes bigger than stomach), avoir la langue bien pendue (to be a chatterbox). Each needs 'avoir' or 'se mettre'.",
      },
    ],
    vibeClues: [
      "One group heals you, one group describes you, and one group lies to you about English",
      "Finger, foot, belly, tongue — alone they're body parts, together they're idioms",
      "A bra is not a bras. A preservative is not a préservatif. Medical French is a minefield.",
    ],
  },
  // ── Puzzle 21 ─────────────────────────────────────────
  {
    number: 21,
    language: "fr",
    date: "2026-03-09",
    categories: [
      {
        name: "Meubles (Furniture)",
        words: ["armoire", "canapé", "étagère", "commode"],
        difficulty: "yellow",
        explanation:
          "Furniture — armoire (wardrobe), canapé (sofa — also a type of appetiser!), étagère (shelf/bookcase), commode (chest of drawers — also means 'convenient' as an adjective!).",
      },
      {
        name: "Pièces de la maison (Rooms of the house)",
        words: ["cuisine", "grenier", "salon", "cave"],
        difficulty: "green",
        explanation:
          "House rooms — cuisine (kitchen), grenier (attic), salon (living room — not a hair salon), cave (cellar/basement, not a cave!).",
      },
      {
        name: "Faux amis de la maison (House false friends)",
        words: ["cave", "coin", "store", "appartement"],
        difficulty: "blue",
        explanation:
          "House false friends: cave (cellar, not a cave), coin (corner, not coin), store (blind/shade, not a shop — that's 'magasin'), appartement (flat, not apartment — similar but the French word implies something typically European/smaller).",
        isFalseFriends: true,
      },
      {
        name: "Mots qui décrivent une maison (Words describing a house)",
        words: ["cosy", "spacieux", "lumineux", "délabré"],
        difficulty: "purple",
        explanation:
          "House descriptions: cosy (borrowed from English but now French), spacieux (spacious), lumineux (bright/full of light), délabré (dilapidated/run-down). 'Cosy' is an English import that French uses freely — against the Académie's wishes!",
      },
    ],
    vibeClues: [
      "A cave is not a cave. A store is not a store. One group redesigns your English vocabulary.",
      "One group fills the rooms, one group names the rooms. But some words play both sides.",
      "One group is on estate agent listings — how the French describe dream homes",
    ],
  },
  // ── Puzzle 22 ─────────────────────────────────────────
  {
    number: 22,
    language: "fr",
    date: "2026-03-10",
    categories: [
      {
        name: "Légumes (Vegetables)",
        words: ["carotte", "poireau", "chou", "navet"],
        difficulty: "yellow",
        explanation:
          "Vegetables — carotte (carrot), poireau (leek), chou (cabbage), navet (turnip).",
      },
      {
        name: "Fromages français (French cheeses)",
        words: ["brie", "comté", "roquefort", "camembert"],
        difficulty: "green",
        explanation:
          "French cheeses — brie, comté, roquefort, camembert. De Gaulle famously asked: 'How can you govern a country that has 246 varieties of cheese?'",
      },
      {
        name: "Faux amis culinaires (Culinary false friends)",
        words: ["raisin", "prune", "biscuit", "chips"],
        difficulty: "blue",
        explanation:
          "Culinary false friends: raisin (grape, not raisin — raisin is 'raisin sec'), prune (plum, not prune — prune is 'pruneau'), biscuit (cookie, not biscuit), chips (crisps, not fries — fries are 'frites').",
        isFalseFriends: true,
      },
      {
        name: "Légumes comme insultes (Vegetables as insults)",
        words: ["courge", "patate", "cornichon", "nouille"],
        difficulty: "purple",
        explanation:
          "Vegetable insults: courge (squash = idiot), patate (potato = clumsy oaf), cornichon (gherkin = silly person), nouille (noodle = wimp). French loves food-based insults! 'Chou' (cabbage) almost fits here — 'mon chou' is a term of endearment.",
      },
    ],
    vibeClues: [
      "One group sits in your salad, another sits on your cheese board. Don't mix them up.",
      "In French, calling someone a gherkin is an insult. One group is food that fights.",
      "Grapes are not raisins. Plums are not prunes. English lied to you.",
    ],
  },
  // ── Puzzle 23 ─────────────────────────────────────────
  {
    number: 23,
    language: "fr",
    date: "2026-03-11",
    categories: [
      {
        name: "Vêtements d'hiver (Winter clothing)",
        words: ["écharpe", "bonnet", "gant", "manteau"],
        difficulty: "yellow",
        explanation:
          "Winter clothes — écharpe (scarf), bonnet (beanie/woolly hat — not a bonnet!), gant (glove), manteau (coat).",
      },
      {
        name: "Accessoires (Accessories)",
        words: ["ceinture", "collier", "bague", "montre"],
        difficulty: "green",
        explanation:
          "Accessories — ceinture (belt — also used in 'ceinture de sécurité' = seatbelt), collier (necklace — not collar), bague (ring), montre (watch — also means 'show' as a verb form).",
      },
      {
        name: "Faux amis vestimentaires (Clothing false friends)",
        words: ["veste", "slip", "baskets", "robe"],
        difficulty: "blue",
        explanation:
          "Clothing false friends: veste (jacket, not vest — vest is 'gilet'), slip (underwear/briefs, not a slip/petticoat), baskets (trainers/sneakers, not baskets), robe (dress, not robe — a bathrobe is 'peignoir').",
        isFalseFriends: true,
      },
      {
        name: "Tissus et matières (Fabrics and materials)",
        words: ["soie", "velours", "dentelle", "cuir"],
        difficulty: "purple",
        explanation:
          "Fabrics: soie (silk), velours (velvet), dentelle (lace), cuir (leather). 'Velours' — the expression 'faire du velours' means to purr/be smooth. 'Cuir' also appears in 'cuir chevelu' (scalp).",
      },
    ],
    vibeClues: [
      "A vest is not a veste. A robe is not a robe. French fashion has its own language.",
      "Silk, velvet, lace, leather — the luxury group hides among everyday clothes",
      "Belt, necklace, ring, watch — things that complete an outfit but aren't clothes themselves",
    ],
  },
  // ── Puzzle 24 ─────────────────────────────────────────
  {
    number: 24,
    language: "fr",
    date: "2026-03-12",
    categories: [
      {
        name: "Couleurs secondaires (Secondary colours)",
        words: ["violet", "orange", "marron", "gris"],
        difficulty: "yellow",
        explanation:
          "Colours — violet (purple), orange (orange — and the fruit!), marron (brown — also means chestnut), gris (grey).",
      },
      {
        name: "Expressions avec des couleurs (Colour expressions)",
        words: ["blanc", "noir", "rouge", "vert"],
        difficulty: "green",
        explanation:
          "Colour idioms: carte blanche (free rein), broyer du noir (to be depressed), voir rouge (to see red/get angry), être vert de rage (green with anger — not envy!). French colour idioms often differ from English ones.",
      },
      {
        name: "Faux amis colorés (Colourful false friends)",
        words: ["rose", "prune", "olive", "crème"],
        difficulty: "blue",
        explanation:
          "These are colours in French that English speakers think of differently: rose (pink, not a rose — the flower is also 'rose' but the colour catches people off guard), prune (dark purple shade, and also means plum), olive (olive green — same word, different primary meaning), crème (cream colour, but also just cream).",
        isFalseFriends: true,
      },
      {
        name: "Couleurs qui sont aussi des adjectifs figuratifs (Colours as figurative adjectives)",
        words: ["jaune", "bleu", "doré", "pourpre"],
        difficulty: "purple",
        explanation:
          "Colours with hidden figurative meanings: jaune (yellow — 'rire jaune' = to laugh bitterly/uncomfortably), bleu (blue — 'un cordon bleu' = an excellent cook, 'un bleu' = a novice/bruise), doré (golden — 'la jeunesse dorée' = privileged youth), pourpre (purple — historically reserved for royalty, 'la pourpre' = cardinal's robe).",
      },
    ],
    vibeClues: [
      "Two groups are literally colours. Two groups use colours to say something else entirely.",
      "Pink, plum, olive, cream — colours that are also other things. Which meaning comes first?",
      "If you laugh yellow in French, you're not having a good time. One group is figurative.",
    ],
  },
  // ── Puzzle 25 ─────────────────────────────────────────
  {
    number: 25,
    language: "fr",
    date: "2026-03-13",
    categories: [
      {
        name: "Mots de politesse (Polite words)",
        words: ["merci", "pardon", "excusez-moi", "enchanté"],
        difficulty: "yellow",
        explanation:
          "Polite words — merci (thank you), pardon (sorry/excuse me), excusez-moi (excuse me), enchanté (pleased to meet you — literally 'enchanted').",
      },
      {
        name: "Expressions pour refuser poliment (Polite refusals)",
        words: ["malheureusement", "hélas", "navré", "désolé"],
        difficulty: "green",
        explanation:
          "Polite refusals: malheureusement (unfortunately), hélas (alas), navré (terribly sorry — more formal than désolé), désolé (sorry). Essential for saying no the French way — indirectly!",
      },
      {
        name: "Faux amis de la conversation (Conversational false friends)",
        words: ["demander", "commander", "question", "adresse"],
        difficulty: "blue",
        explanation:
          "Conversation false friends: demander (to ask, not to demand), commander (to order food, not to command), question (same meaning but also used in 'il est question de' = it's about), adresse (address AND skill/dexterity, not just address).",
        isFalseFriends: true,
      },
      {
        name: "Interjections françaises (French interjections)",
        words: ["zut", "mince", "tiens", "bof"],
        difficulty: "purple",
        explanation:
          "French interjections: zut (darn — a mild expletive), mince (shoot/darn — literally 'thin'), tiens (hey/well well — from 'tenir' = to hold), bof (meh/whatever — the most French sound in existence). 'Mince' as an interjection surprises learners who know it as 'thin'.",
      },
    ],
    vibeClues: [
      "One group says hello. One group says no. One group says words you think you know. One group goes 'bof'.",
      "Asking is not demanding. Ordering food is not commanding troops. One group plays tricks.",
      "'Mince' means thin... unless you stub your toe. Then it means something else entirely.",
    ],
  },
  // ── Puzzle 26 ─────────────────────────────────────────
  {
    number: 26,
    language: "fr",
    date: "2026-03-14",
    categories: [
      {
        name: "La mer (The sea)",
        words: ["vague", "sable", "falaise", "marée"],
        difficulty: "yellow",
        explanation:
          "Sea words — vague (wave), sable (sand), falaise (cliff), marée (tide).",
      },
      {
        name: "La montagne (The mountain)",
        words: ["sommet", "sentier", "refuge", "cascade"],
        difficulty: "green",
        explanation:
          "Mountain words — sommet (summit/peak), sentier (trail/path), refuge (mountain shelter), cascade (waterfall).",
      },
      {
        name: "Faux amis de la nature (Nature false friends)",
        words: ["forêt", "campagne", "prairie", "plage"],
        difficulty: "blue",
        explanation:
          "Nature false friends: forêt (forest — seems obvious but the accent matters, and 'foret' without accent = drill bit), campagne (countryside OR campaign, not camping), prairie (meadow, not prairie in the American sense — French prairies are small and green), plage (beach, but also 'range/bracket' in technical French).",
        isFalseFriends: true,
      },
      {
        name: "Catastrophes naturelles (Natural disasters)",
        words: ["séisme", "inondation", "sécheresse", "avalanche"],
        difficulty: "purple",
        explanation:
          "Natural disasters: séisme (earthquake — more formal than 'tremblement de terre'), inondation (flood), sécheresse (drought — from 'sec' = dry), avalanche (avalanche — one of many French words English borrowed unchanged!).",
      },
    ],
    vibeClues: [
      "Two groups are where you holiday. Two groups are what nature throws at you.",
      "Forest, countryside, meadow, beach — they look simple. They're not. One group has hidden meanings.",
      "Wave, sand, cliff, tide — listen to the sea. It's speaking French.",
    ],
  },
  // ── Puzzle 27 ─────────────────────────────────────────
  {
    number: 27,
    language: "fr",
    date: "2026-03-15",
    categories: [
      {
        name: "Métiers créatifs (Creative jobs)",
        words: ["peintre", "écrivain", "acteur", "danseur"],
        difficulty: "yellow",
        explanation:
          "Creative jobs — peintre (painter), écrivain (writer), acteur (actor), danseur (dancer).",
      },
      {
        name: "Métiers traditionnels (Traditional jobs)",
        words: ["boulanger", "boucher", "plombier", "menuisier"],
        difficulty: "green",
        explanation:
          "Traditional trades: boulanger (baker), boucher (butcher), plombier (plumber — from 'plomb' = lead), menuisier (carpenter/joiner — from 'menu' = small/fine, for detailed woodwork).",
      },
      {
        name: "Faux amis des métiers (Job false friends)",
        words: ["médecin", "avocat", "agent", "patron"],
        difficulty: "blue",
        explanation:
          "Job false friends: médecin (doctor — not medicine, that's 'médecine'), avocat (lawyer AND avocado — same word!), agent (officer/agent but 'agent de police' = police officer, not secret agent), patron (boss, not customer/patron — customer is 'client').",
        isFalseFriends: true,
      },
      {
        name: "Professions avec faux féminins (Jobs with tricky feminine forms)",
        words: ["auteur", "professeur", "chef", "écrivain"],
        difficulty: "purple",
        explanation:
          "Jobs where the feminine form is debated: auteur → auteure or autrice? professeur → professeure? chef → cheffe? écrivain → écrivaine? The Académie française fought these for decades. 'Écrivain' appears in both creative jobs AND here — the gender politics group is the correct home.",
      },
    ],
    vibeClues: [
      "One group makes art, one group makes bread. Both make a living.",
      "Is it 'auteure' or 'autrice'? One group is a battlefield of French gender politics.",
      "A lawyer and a fruit share a name. A boss is not a patron. One group misleads.",
    ],
  },
  // ── Puzzle 28 ─────────────────────────────────────────
  {
    number: 28,
    language: "fr",
    date: "2026-03-16",
    categories: [
      {
        name: "Verbes de mouvement (Movement verbs)",
        words: ["courir", "marcher", "sauter", "grimper"],
        difficulty: "yellow",
        explanation:
          "Movement verbs — courir (to run), marcher (to walk — also means 'to work/function'), sauter (to jump), grimper (to climb).",
      },
      {
        name: "Verbes pronominaux courants (Common reflexive verbs)",
        words: ["se lever", "se coucher", "se laver", "se promener"],
        difficulty: "green",
        explanation:
          "Reflexive verbs for daily routine: se lever (to get up), se coucher (to go to bed), se laver (to wash oneself), se promener (to go for a walk). French uses 'se' where English doesn't need it.",
      },
      {
        name: "Faux amis verbaux (Verb false friends)",
        words: ["assister", "supporter", "attendre", "rester"],
        difficulty: "blue",
        explanation:
          "Verb false friends: assister (to attend/witness, not to assist), supporter (to tolerate/bear, not to support — 'je ne le supporte pas' = I can't stand him), attendre (to wait, not to attend), rester (to stay, not to rest).",
        isFalseFriends: true,
      },
      {
        name: "Verbes qui changent avec la préposition (Verbs that change with preposition)",
        words: ["tenir", "mettre", "prendre", "venir"],
        difficulty: "purple",
        explanation:
          "Verbs that transform with prefixes: tenir → retenir (to retain), obtenir (to obtain), maintenir (to maintain). Mettre → permettre (to allow), promettre (to promise). Prendre → comprendre (to understand), apprendre (to learn). Venir → devenir (to become), revenir (to come back). One root = many verbs!",
      },
    ],
    vibeClues: [
      "Four verbs make you move. Four verbs make you reflect. Don't confuse the body with the self.",
      "Support means 'tolerate' here. Attend means 'wait.' One group flips your assumptions.",
      "Hold, put, take, come — simple alone. Add a prefix and they multiply into dozens.",
    ],
  },
  // ── Puzzle 29 ─────────────────────────────────────────
  {
    number: 29,
    language: "fr",
    date: "2026-03-17",
    categories: [
      {
        name: "Desserts français (French desserts)",
        words: ["tarte", "éclair", "macaron", "crêpe"],
        difficulty: "yellow",
        explanation:
          "French desserts — tarte (tart/pie), éclair (éclair — also means lightning!), macaron (not macaroon — they're different!), crêpe (crêpe/pancake).",
      },
      {
        name: "Pâtisserie — termes techniques (Pastry — technical terms)",
        words: ["pâte", "levure", "glaçage", "moule"],
        difficulty: "green",
        explanation:
          "Baking terms: pâte (dough/pastry/batter), levure (yeast), glaçage (icing/glaze), moule (mould/tin — also means mussel the seafood!).",
      },
      {
        name: "Faux amis gourmands (Gourmet false friends)",
        words: ["entrée", "salade", "soupe", "fromage"],
        difficulty: "blue",
        explanation:
          "Gourmet false friends: entrée (starter, again!), salade (salad — but 'raconter des salades' = to tell lies), soupe (thick soup — 'potage' is the refined version, and 'soupe' implies rustic), fromage (cheese — 'en faire tout un fromage' = to make a big deal of nothing).",
        isFalseFriends: true,
      },
      {
        name: "Plats qui sont devenus des mots anglais (Dishes that became English words)",
        words: ["brioche", "croissant", "soufflé", "gratin"],
        difficulty: "purple",
        explanation:
          "French dishes English borrowed: brioche (rich bread — 'Qu'ils mangent de la brioche!' attributed to Marie Antoinette), croissant (crescent-shaped pastry — 'croissant' means 'growing/crescent'), soufflé (from 'souffler' = to blow — it's literally 'puffed'), gratin (from 'gratter' = to scrape — the crispy top you scrape off).",
      },
    ],
    vibeClues: [
      "Four sweet things you'd order in a pâtisserie. One of them is also lightning.",
      "English stole four French dishes and never gave them back. Find the imports.",
      "A mussel and a mould share a name. Yeast and icing sound like they belong in a lab. But it's all baking.",
    ],
  },
  // ── Puzzle 30 ─────────────────────────────────────────
  {
    number: 30,
    language: "fr",
    date: "2026-03-18",
    categories: [
      {
        name: "Mots d'amour (Words of love)",
        words: ["amour", "tendresse", "baiser", "câlin"],
        difficulty: "yellow",
        explanation:
          "Love words — amour (love), tendresse (tenderness), baiser (kiss as a noun — WARNING: as a verb it's vulgar slang for sex!), câlin (cuddle/hug).",
      },
      {
        name: "Termes d'affection (Terms of endearment)",
        words: ["chéri", "chou", "puce", "trésor"],
        difficulty: "green",
        explanation:
          "Terms of endearment: chéri (darling), chou (cabbage — yes, the French call loved ones 'my cabbage'), puce (flea — 'ma puce' = sweetheart), trésor (treasure). French pet names are bizarre by English standards!",
      },
      {
        name: "Faux amis romantiques (Romantic false friends)",
        words: ["embrasser", "aimer", "blesser", "quitter"],
        difficulty: "blue",
        explanation:
          "Romantic false friends: embrasser (to kiss, not to embrace — though it used to mean embrace), aimer (to love AND to like — 'aimer bien' actually means to like LESS), blesser (to hurt/wound, not to bless), quitter (to leave someone, not just to quit).",
        isFalseFriends: true,
      },
      {
        name: "Le grand final — mots qui résument le français (The grand finale — words that sum up French)",
        words: ["dépaysement", "retrouvailles", "flâner", "terroir"],
        difficulty: "purple",
        explanation:
          "Untranslatable French words: dépaysement (the feeling of being in a foreign place — disorientation + wonder), retrouvailles (the joy of reuniting after a long time), flâner (to stroll aimlessly with pleasure — the art of the Parisian wander), terroir (the complete natural environment affecting a food's character). These have no single English equivalent. C'est ça, le français!",
      },
    ],
    vibeClues: [
      "Cabbage, flea, treasure, darling — one group is what the French call the people they love",
      "The hardest group has no English translation. These words ARE France.",
      "To kiss is not to embrace. To love is not always to love. One group rewrites romance in French.",
    ],
  },
];
