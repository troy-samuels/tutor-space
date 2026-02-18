// Daily Phrasal Verb Challenge — curated data
// 30 phrasal verbs, one shown per day (seeded by day-of-year)

export interface PhrasalVerbQuestion {
  id: number;
  verb: string;          // e.g. "give up"
  sentence: string;      // gap sentence e.g. "She decided to ___ smoking."
  options: string[];     // 4 choices
  correct: number;       // index
  meaning: string;       // short definition
  example: string;       // natural example
  register: "informal" | "neutral" | "formal";
  tip?: string;          // common confusion / L1 interference note
}

export const PHRASAL_VERB_BANK: PhrasalVerbQuestion[] = [
  {
    id: 0,
    verb: "give up",
    sentence: "After years of trying, she finally decided to ___ smoking.",
    options: ["give up", "give in", "give out", "give away"],
    correct: 0,
    meaning: "To stop doing something; to quit.",
    example: "Don't give up — you're almost there!",
    register: "informal",
    tip: "Don't confuse with 'give in' (surrender to someone) or 'give away' (donate/reveal).",
  },
  {
    id: 1,
    verb: "carry out",
    sentence: "The scientists will ___ a series of experiments next month.",
    options: ["carry on", "carry out", "carry off", "carry over"],
    correct: 1,
    meaning: "To perform or complete a task or plan.",
    example: "The team carried out the research successfully.",
    register: "neutral",
    tip: "'Carry on' means to continue. 'Carry out' means to do/execute something.",
  },
  {
    id: 2,
    verb: "look into",
    sentence: "The police are going to ___ the matter further.",
    options: ["look up", "look over", "look into", "look after"],
    correct: 2,
    meaning: "To investigate or examine something.",
    example: "We need to look into the cause of the delay.",
    register: "neutral",
  },
  {
    id: 3,
    verb: "put off",
    sentence: "Stop ___ your homework — do it now!",
    options: ["putting off", "putting out", "putting up", "putting on"],
    correct: 0,
    meaning: "To postpone; to delay doing something.",
    example: "Don't put off until tomorrow what you can do today.",
    register: "informal",
    tip: "Common synonym: 'procrastinate'. 'Put out' means to extinguish a fire.",
  },
  {
    id: 4,
    verb: "set up",
    sentence: "They plan to ___ a new branch office in Tokyo.",
    options: ["set up", "set off", "set in", "set out"],
    correct: 0,
    meaning: "To establish or start an organisation, system, or structure.",
    example: "She set up her own business at the age of 25.",
    register: "neutral",
  },
  {
    id: 5,
    verb: "take over",
    sentence: "The new manager will ___ from next Monday.",
    options: ["take after", "take over", "take up", "take off"],
    correct: 1,
    meaning: "To assume control or responsibility.",
    example: "The deputy will take over while the CEO is on holiday.",
    register: "neutral",
    tip: "'Take off' = a plane leaving the ground, or removing clothing. Don't confuse them!",
  },
  {
    id: 6,
    verb: "make out",
    sentence: "I could barely ___ what he was saying through all the noise.",
    options: ["make out", "make up", "make over", "make off"],
    correct: 0,
    meaning: "To see, hear, or understand something with difficulty.",
    example: "Can you make out the writing on that sign?",
    register: "informal",
    tip: "'Make up' means to invent a story or reconcile after an argument.",
  },
  {
    id: 7,
    verb: "bring about",
    sentence: "The new policies are expected to ___ significant changes.",
    options: ["bring up", "bring out", "bring about", "bring on"],
    correct: 2,
    meaning: "To cause something to happen.",
    example: "The treaty brought about a period of peace.",
    register: "formal",
    tip: "More formal synonym of 'cause'. Used in writing and formal speech.",
  },
  {
    id: 8,
    verb: "fall through",
    sentence: "Our plans for the holiday ___ at the last minute.",
    options: ["fell apart", "fell out", "fell through", "fell behind"],
    correct: 2,
    meaning: "To fail to happen; to not go ahead as planned.",
    example: "The deal fell through when the investors pulled out.",
    register: "neutral",
  },
  {
    id: 9,
    verb: "run out of",
    sentence: "We've ___ milk — can you get some from the shop?",
    options: ["used up", "run into", "run out of", "run over"],
    correct: 2,
    meaning: "To have no more of something.",
    example: "The printer has run out of ink.",
    register: "informal",
  },
  {
    id: 10,
    verb: "come across",
    sentence: "I ___ an interesting article about climate change yesterday.",
    options: ["came across", "came about", "came over", "came up"],
    correct: 0,
    meaning: "To find or encounter something/someone by chance.",
    example: "She came across her old diary while tidying the attic.",
    register: "neutral",
    tip: "'Come across' also means to create a particular impression: 'He came across as confident.'",
  },
  {
    id: 11,
    verb: "work out",
    sentence: "I couldn't ___ why the door wouldn't open.",
    options: ["work over", "work out", "work through", "work off"],
    correct: 1,
    meaning: "To figure out; to solve a problem.",
    example: "Can you work out the answer to this maths problem?",
    register: "informal",
    tip: "'Work out' also means to exercise at a gym.",
  },
  {
    id: 12,
    verb: "get away with",
    sentence: "He thought he could ___ lying, but his boss found out.",
    options: ["get along with", "get away with", "get on with", "get up to"],
    correct: 1,
    meaning: "To avoid punishment or negative consequences for something.",
    example: "You can't get away with cheating forever.",
    register: "informal",
  },
  {
    id: 13,
    verb: "look forward to",
    sentence: "I'm really ___ seeing you at the party next week.",
    options: ["looking forward to", "looking ahead to", "looking up to", "looking on to"],
    correct: 0,
    meaning: "To feel excited or pleased about something in the future.",
    example: "We're looking forward to your visit!",
    register: "neutral",
    tip: "'To' here is a preposition, NOT part of an infinitive — so use a gerund: 'looking forward to seeing' (not 'to see').",
  },
  {
    id: 14,
    verb: "put up with",
    sentence: "I don't know how she ___ his constant complaining.",
    options: ["put up with", "puts up to", "puts across", "put up for"],
    correct: 0,
    meaning: "To tolerate something or someone unpleasant.",
    example: "I can't put up with this noise any longer.",
    register: "informal",
  },
  {
    id: 15,
    verb: "turn down",
    sentence: "She ___ the job offer because the salary was too low.",
    options: ["turned away", "turned down", "turned off", "turned out"],
    correct: 1,
    meaning: "To decline or reject an offer or request.",
    example: "He was disappointed when his proposal was turned down.",
    register: "neutral",
    tip: "'Turn down' also means to lower volume/heat. Context clarifies the meaning.",
  },
  {
    id: 16,
    verb: "go over",
    sentence: "Let's ___ the main points of the contract one more time.",
    options: ["go through", "go over", "go across", "go along"],
    correct: 1,
    meaning: "To review or examine something carefully.",
    example: "The teacher went over the answers after the test.",
    register: "neutral",
  },
  {
    id: 17,
    verb: "break down",
    sentence: "My car ___ on the motorway and I had to call for help.",
    options: ["broke off", "broke up", "broke down", "broke out"],
    correct: 2,
    meaning: "To stop functioning (machinery); also to lose emotional control.",
    example: "The heating system broke down in the middle of winter.",
    register: "neutral",
    tip: "'Break out' = a war or fire starts suddenly. 'Break up' = end a relationship.",
  },
  {
    id: 18,
    verb: "draw up",
    sentence: "The lawyers will ___ the contract by end of day.",
    options: ["draw out", "draw up", "draw on", "draw off"],
    correct: 1,
    meaning: "To write or prepare an official document or plan.",
    example: "We need to draw up a new agreement.",
    register: "formal",
  },
  {
    id: 19,
    verb: "point out",
    sentence: "Could you ___ the key issues with this approach?",
    options: ["point out", "point up", "point to", "point off"],
    correct: 0,
    meaning: "To draw attention to; to make someone aware of something.",
    example: "He pointed out several errors in my report.",
    register: "neutral",
  },
  {
    id: 20,
    verb: "back up",
    sentence: "Always ___ your files before updating your software.",
    options: ["back off", "back down", "back up", "back out"],
    correct: 2,
    meaning: "To save a copy of data; also to support someone.",
    example: "Can you back me up on this? I need a witness.",
    register: "neutral",
  },
  {
    id: 21,
    verb: "hold on",
    sentence: '"___ a moment," said the receptionist, "I\'ll check for you."',
    options: ["Hold on", "Hold out", "Hold up", "Hold off"],
    correct: 0,
    meaning: "To wait; to maintain a grip on something.",
    example: "Hold on — let me find the file.",
    register: "informal",
  },
  {
    id: 22,
    verb: "figure out",
    sentence: "I can't ___ how this machine works.",
    options: ["find out", "figure out", "work up", "sort out"],
    correct: 1,
    meaning: "To understand or solve something after thinking.",
    example: "She finally figured out the solution to the puzzle.",
    register: "informal",
  },
  {
    id: 23,
    verb: "fill in",
    sentence: "Please ___ the application form in block capitals.",
    options: ["fill up", "fill out", "fill in", "fill over"],
    correct: 2,
    meaning: "To complete a form or document.",
    example: "Fill in your details on the registration page.",
    register: "neutral",
    tip: "Both 'fill in' and 'fill out' are acceptable for forms in British and American English respectively.",
  },
  {
    id: 24,
    verb: "sort out",
    sentence: "We need to ___ this mess before the client arrives.",
    options: ["sort through", "sort out", "sort up", "sort over"],
    correct: 1,
    meaning: "To resolve a problem or organise something.",
    example: "Can you sort out the accommodation for the conference?",
    register: "informal",
  },
  {
    id: 25,
    verb: "stand for",
    sentence: "What does the abbreviation 'ASAP' ___?",
    options: ["stand by", "stand out", "stand for", "stand up"],
    correct: 2,
    meaning: "To represent or be an abbreviation for; to tolerate.",
    example: "NATO stands for North Atlantic Treaty Organization.",
    register: "neutral",
  },
  {
    id: 26,
    verb: "show up",
    sentence: "He was supposed to be here at 9 but he still hasn't ___.",
    options: ["shown off", "shown up", "shown out", "shown over"],
    correct: 1,
    meaning: "To arrive; to appear at a place.",
    example: "She showed up an hour late without an apology.",
    register: "informal",
    tip: "'Show off' means to boast or display skills to impress others.",
  },
  {
    id: 27,
    verb: "think over",
    sentence: "Give me a few days to ___ your proposal before I decide.",
    options: ["think about", "think through", "think over", "think out"],
    correct: 2,
    meaning: "To consider something carefully before deciding.",
    example: "Think it over — there's no rush.",
    register: "neutral",
  },
  {
    id: 28,
    verb: "live up to",
    sentence: "The film didn't ___ the hype — it was quite disappointing.",
    options: ["live up to", "live with", "live on", "live through"],
    correct: 0,
    meaning: "To meet expectations or standards.",
    example: "Did the hotel live up to your expectations?",
    register: "neutral",
  },
  {
    id: 29,
    verb: "hand over",
    sentence: "The outgoing president will ___ power next month.",
    options: ["hand out", "hand over", "hand in", "hand down"],
    correct: 1,
    meaning: "To give control or responsibility to someone else.",
    example: "Please hand over all documents to the new manager.",
    register: "neutral",
    tip: "'Hand in' = submit work to someone. 'Hand out' = distribute to many people.",
  },
];

/** Get today's phrasal verb (deterministic by date) */
export function getDailyPhrasalVerb(): PhrasalVerbQuestion {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return PHRASAL_VERB_BANK[dayOfYear % PHRASAL_VERB_BANK.length];
}

/** Get a set of 5 questions for the daily challenge (consecutive from today) */
export function getDailyChallenge(): PhrasalVerbQuestion[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const result: PhrasalVerbQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(PHRASAL_VERB_BANK[(dayOfYear + i) % PHRASAL_VERB_BANK.length]);
  }
  return result;
}

export const REGISTER_LABEL: Record<"informal" | "neutral" | "formal", string> = {
  informal: "💬 Everyday",
  neutral: "📝 Neutral",
  formal: "📊 Formal",
};
