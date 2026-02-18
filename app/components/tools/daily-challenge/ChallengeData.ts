import type { ToolLang } from "@/lib/tools/types";
import { FALSE_FRIENDS } from "@/lib/games/data/false-friends";

export interface ChallengeQuestion {
  id: string;
  lang: ToolLang;
  /** The foreign word being tested */
  word: string;
  /** The sentence with a gap, or a direct question */
  prompt: string;
  options: string[];
  correct: number;
  /** Short explanation shown after answering */
  explanation: string;
  /** Deeper tip / common L1 interference note */
  tip?: string;
  /** Informal / neutral / formal */
  register: "informal" | "neutral" | "formal";
}

// ─── ENGLISH: Phrasal Verbs ────────────────────────────────────────────────────
const EN_PHRASAL_VERBS: ChallengeQuestion[] = [
  { id:"pv1", lang:"en", word:"give up", prompt:"After years of trying, she finally decided to ___ smoking.", options:["give up","give in","give out","give away"], correct:0, explanation:"'Give up' = to stop doing something; to quit.", tip:"Don't confuse with 'give in' (surrender) or 'give away' (donate/reveal).", register:"informal" },
  { id:"pv2", lang:"en", word:"carry out", prompt:"The scientists will ___ a series of experiments next month.", options:["carry on","carry out","carry off","carry over"], correct:1, explanation:"'Carry out' = to perform or complete a task.", tip:"'Carry on' = to continue. 'Carry out' = to do / execute.", register:"neutral" },
  { id:"pv3", lang:"en", word:"look into", prompt:"The police are going to ___ the matter further.", options:["look up","look over","look into","look after"], correct:2, explanation:"'Look into' = to investigate.", register:"neutral" },
  { id:"pv4", lang:"en", word:"put off", prompt:"Stop ___ your homework — do it now!", options:["putting off","putting out","putting up","putting on"], correct:0, explanation:"'Put off' = to postpone; to procrastinate.", tip:"'Put out' = to extinguish a fire.", register:"informal" },
  { id:"pv5", lang:"en", word:"set up", prompt:"They plan to ___ a new branch office in Tokyo.", options:["set up","set off","set in","set out"], correct:0, explanation:"'Set up' = to establish or start something.", register:"neutral" },
  { id:"pv6", lang:"en", word:"take over", prompt:"The new manager will ___ from next Monday.", options:["take after","take over","take up","take off"], correct:1, explanation:"'Take over' = to assume control or responsibility.", tip:"'Take off' = a plane leaving the ground, or removing clothing.", register:"neutral" },
  { id:"pv7", lang:"en", word:"make out", prompt:"I could barely ___ what he was saying through all the noise.", options:["make out","make up","make over","make off"], correct:0, explanation:"'Make out' = to see, hear, or understand something with difficulty.", tip:"'Make up' = to invent a story, or reconcile after an argument.", register:"informal" },
  { id:"pv8", lang:"en", word:"bring about", prompt:"The new policies are expected to ___ significant changes.", options:["bring up","bring out","bring about","bring on"], correct:2, explanation:"'Bring about' = to cause something to happen.", register:"formal" },
  { id:"pv9", lang:"en", word:"fall through", prompt:"Our plans for the holiday ___ at the last minute.", options:["fell apart","fell out","fell through","fell behind"], correct:2, explanation:"'Fall through' = to fail to happen; to not go ahead as planned.", register:"neutral" },
  { id:"pv10", lang:"en", word:"run out of", prompt:"We've ___ milk — can you get some from the shop?", options:["used up","run into","run out of","run over"], correct:2, explanation:"'Run out of' = to have no more of something.", register:"informal" },
  { id:"pv11", lang:"en", word:"come across", prompt:"I ___ an interesting article about climate change yesterday.", options:["came across","came about","came over","came up"], correct:0, explanation:"'Come across' = to find or encounter something by chance.", tip:"Also means to create a particular impression: 'He came across as confident.'", register:"neutral" },
  { id:"pv12", lang:"en", word:"work out", prompt:"I couldn't ___ why the door wouldn't open.", options:["work over","work out","work through","work off"], correct:1, explanation:"'Work out' = to figure out; to solve.", tip:"'Work out' also means to exercise at a gym.", register:"informal" },
  { id:"pv13", lang:"en", word:"get away with", prompt:"He thought he could ___ lying, but his boss found out.", options:["get along with","get away with","get on with","get up to"], correct:1, explanation:"'Get away with' = to avoid punishment for something.", register:"informal" },
  { id:"pv14", lang:"en", word:"look forward to", prompt:"I'm really ___ seeing you at the party next week.", options:["looking forward to","looking ahead to","looking up to","looking on to"], correct:0, explanation:"'Look forward to' = to feel excited about something in the future.", tip:"'To' here is a preposition, not part of an infinitive — use a gerund: 'looking forward to seeing'.", register:"neutral" },
  { id:"pv15", lang:"en", word:"put up with", prompt:"I don't know how she ___ his constant complaining.", options:["put up with","puts up to","puts across","put up for"], correct:0, explanation:"'Put up with' = to tolerate something unpleasant.", register:"informal" },
  { id:"pv16", lang:"en", word:"turn down", prompt:"She ___ the job offer because the salary was too low.", options:["turned away","turned down","turned off","turned out"], correct:1, explanation:"'Turn down' = to decline or reject.", tip:"Also means to lower volume. Context clarifies meaning.", register:"neutral" },
  { id:"pv17", lang:"en", word:"go over", prompt:"Let's ___ the main points of the contract one more time.", options:["go through","go over","go across","go along"], correct:1, explanation:"'Go over' = to review or examine carefully.", register:"neutral" },
  { id:"pv18", lang:"en", word:"break down", prompt:"My car ___ on the motorway and I had to call for help.", options:["broke off","broke up","broke down","broke out"], correct:2, explanation:"'Break down' = to stop functioning (machinery); also to lose emotional control.", tip:"'Break out' = war or fire starts suddenly. 'Break up' = end a relationship.", register:"neutral" },
  { id:"pv19", lang:"en", word:"point out", prompt:"Could you ___ the key issues with this approach?", options:["point out","point up","point to","point off"], correct:0, explanation:"'Point out' = to draw attention to; to make someone aware of.", register:"neutral" },
  { id:"pv20", lang:"en", word:"back up", prompt:"Always ___ your files before updating your software.", options:["back off","back down","back up","back out"], correct:2, explanation:"'Back up' = to save a copy of data; also to support someone.", register:"neutral" },
  { id:"pv21", lang:"en", word:"figure out", prompt:"I can't ___ how this machine works.", options:["find out","figure out","work up","sort out"], correct:1, explanation:"'Figure out' = to understand or solve something after thinking.", register:"informal" },
  { id:"pv22", lang:"en", word:"sort out", prompt:"We need to ___ this mess before the client arrives.", options:["sort through","sort out","sort up","sort over"], correct:1, explanation:"'Sort out' = to resolve a problem or organise something.", register:"informal" },
  { id:"pv23", lang:"en", word:"stand for", prompt:"What does the abbreviation 'ASAP' ___?", options:["stand by","stand out","stand for","stand up"], correct:2, explanation:"'Stand for' = to represent or be an abbreviation for.", register:"neutral" },
  { id:"pv24", lang:"en", word:"show up", prompt:"He was supposed to be here at 9 but he still hasn't ___.", options:["shown off","shown up","shown out","shown over"], correct:1, explanation:"'Show up' = to arrive; to appear at a place.", tip:"'Show off' = to boast or display skills.", register:"informal" },
  { id:"pv25", lang:"en", word:"live up to", prompt:"The film didn't ___ the hype — it was quite disappointing.", options:["live up to","live with","live on","live through"], correct:0, explanation:"'Live up to' = to meet expectations or standards.", register:"neutral" },
  { id:"pv26", lang:"en", word:"hand over", prompt:"The outgoing president will ___ power next month.", options:["hand out","hand over","hand in","hand down"], correct:1, explanation:"'Hand over' = to give control or responsibility to someone.", tip:"'Hand in' = submit work. 'Hand out' = distribute to many people.", register:"neutral" },
  { id:"pv27", lang:"en", word:"hold on", prompt:'"___ a moment," said the receptionist, "I\'ll check for you."', options:["Hold on","Hold out","Hold up","Hold off"], correct:0, explanation:"'Hold on' = to wait; to maintain a grip on something.", register:"informal" },
  { id:"pv28", lang:"en", word:"fill in", prompt:"Please ___ the application form in block capitals.", options:["fill up","fill out","fill in","fill over"], correct:2, explanation:"'Fill in' = to complete a form or document.", tip:"Both 'fill in' (British) and 'fill out' (American) are correct for forms.", register:"neutral" },
  { id:"pv29", lang:"en", word:"think over", prompt:"Give me a few days to ___ your proposal before I decide.", options:["think about","think through","think over","think out"], correct:2, explanation:"'Think over' = to consider something carefully before deciding.", register:"neutral" },
  { id:"pv30", lang:"en", word:"draw up", prompt:"The lawyers will ___ the contract by end of day.", options:["draw out","draw up","draw on","draw off"], correct:1, explanation:"'Draw up' = to prepare an official document or plan.", register:"formal" },
];

// ─── ES / FR / DE: False Friends (from shared database) ────────────────────────

function buildFalseFriendQuestions(lang: ToolLang): ChallengeQuestion[] {
  const items = FALSE_FRIENDS.filter((f) => f.language === lang);
  return items.map((ff, i): ChallengeQuestion => {
    // Build 4 plausible options: actual meaning + 3 distractors
    const distractors: string[] = [];
    // Pool: other false-friend meanings in the same language as distractors
    const pool = items.filter((x) => x.word !== ff.word).map((x) => x.actualMeaning);
    // Shuffle pool and take 3
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    distractors.push(...shuffled);
    // Pad with generic distractors if pool is too small
    const genericPad = [ff.looksLike, "to speak", "small", "big", "quickly", "always"];
    while (distractors.length < 3) {
      const d = genericPad.find((g) => !distractors.includes(g) && g !== ff.actualMeaning);
      if (d) distractors.push(d);
    }

    // Place the correct answer at a deterministic position (based on index)
    const pos = i % 4;
    const opts = [...distractors.slice(0, pos), ff.actualMeaning, ...distractors.slice(pos)].slice(0, 4);

    const langName: Record<ToolLang, string> = { en: "English", es: "Spanish", fr: "French", de: "German" };
    return {
      id: `ff-${lang}-${i}`,
      lang,
      word: ff.word,
      prompt: `What does "${ff.word}" mean in ${langName[lang]}?`,
      options: opts,
      correct: opts.indexOf(ff.actualMeaning),
      explanation: `"${ff.word}" means "${ff.actualMeaning}" — not "${ff.looksLike}" as English speakers often assume.`,
      tip: ff.example,
      register: "neutral",
    };
  });
}

// Memoised at module level (stable random seed per process)
let _esFalseFriends: ChallengeQuestion[] | null = null;
let _frFalseFriends: ChallengeQuestion[] | null = null;
let _deFalseFriends: ChallengeQuestion[] | null = null;

function getFalseFriendsForLang(lang: "es" | "fr" | "de"): ChallengeQuestion[] {
  if (lang === "es") {
    if (!_esFalseFriends) _esFalseFriends = buildFalseFriendQuestions("es");
    return _esFalseFriends;
  }
  if (lang === "fr") {
    if (!_frFalseFriends) _frFalseFriends = buildFalseFriendQuestions("fr");
    return _frFalseFriends;
  }
  if (!_deFalseFriends) _deFalseFriends = buildFalseFriendQuestions("de");
  return _deFalseFriends;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function getChallengeBank(lang: ToolLang): ChallengeQuestion[] {
  if (lang === "en") return EN_PHRASAL_VERBS;
  return getFalseFriendsForLang(lang as "es" | "fr" | "de");
}

/** Get today's 5-question daily challenge (deterministic by day of year) */
export function getDailyChallenge(lang: ToolLang): ChallengeQuestion[] {
  const bank = getChallengeBank(lang);
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const result: ChallengeQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(bank[(dayOfYear + i) % bank.length]);
  }
  return result;
}

export const CHALLENGE_META: Record<ToolLang, { title: string; subtitle: string; intro: string; tipLabel: string }> = {
  en: {
    title: "Phrasal Verb Challenge",
    subtitle: "5 new verbs daily",
    intro: "The #1 challenge for English learners. Fill the gap — choose the right phrasal verb.",
    tipLabel: "💡 Grammar note",
  },
  es: {
    title: "Falsos Amigos",
    subtitle: "5 trampas de vocabulario hoy",
    intro: "Palabras que parecen inglés pero significan algo diferente. ¿Puedes identificarlas?",
    tipLabel: "💡 Ejemplo",
  },
  fr: {
    title: "Faux Amis",
    subtitle: "5 pièges de vocabulaire aujourd'hui",
    intro: "Des mots qui ressemblent à l'anglais mais qui ont un sens complètement différent.",
    tipLabel: "💡 Exemple",
  },
  de: {
    title: "Falsche Freunde",
    subtitle: "5 Vokabelfallen heute",
    intro: "Wörter, die wie Englisch aussehen, aber etwas ganz anderes bedeuten.",
    tipLabel: "💡 Beispiel",
  },
};
