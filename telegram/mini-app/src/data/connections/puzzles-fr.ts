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
];
