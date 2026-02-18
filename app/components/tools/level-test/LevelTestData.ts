import type { ToolLang } from "@/lib/tools/types";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelQuestion {
  id: string;
  level: CEFRLevel;
  skill: "grammar" | "vocabulary" | "usage";
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ─── ENGLISH ──────────────────────────────────────────────────────────────────
const EN_QUESTIONS: LevelQuestion[] = [
  { id:"en1", level:"A1", skill:"grammar", prompt:"She ___ a teacher.", options:["am","is","are","be"], correct:1, explanation:"'She' takes 'is' — third person singular of 'to be'." },
  { id:"en2", level:"A1", skill:"vocabulary", prompt:"What do you use to tell the time?", options:["a book","a clock","a pen","a chair"], correct:1, explanation:"A clock is used to tell the time." },
  { id:"en3", level:"A1", skill:"grammar", prompt:"I ___ coffee every morning.", options:["drink","drinks","drinking","drank"], correct:0, explanation:"First person singular uses the base form 'drink' in the present simple." },
  { id:"en4", level:"A2", skill:"grammar", prompt:"They ___ TV when the phone rang.", options:["watched","were watching","watch","are watching"], correct:1, explanation:"Past continuous describes an action in progress interrupted by another (rang)." },
  { id:"en5", level:"A2", skill:"vocabulary", prompt:"Which word means the opposite of 'cheap'?", options:["small","expensive","near","easy"], correct:1, explanation:"'Expensive' is the antonym of 'cheap'." },
  { id:"en6", level:"A2", skill:"usage", prompt:"Choose the correct sentence:", options:["She suggested to go to the cinema.","She suggested going to the cinema.","She suggested go to the cinema.","She suggested we going."], correct:1, explanation:"'Suggest' is followed by a gerund (verb + -ing)." },
  { id:"en7", level:"B1", skill:"grammar", prompt:"By the time she arrived, we ___ for two hours.", options:["waited","have waited","had been waiting","were waiting"], correct:2, explanation:"Past perfect continuous shows duration before another past event." },
  { id:"en8", level:"B1", skill:"vocabulary", prompt:"The word 'reluctant' is closest in meaning to:", options:["eager","unwilling","happy","quick"], correct:1, explanation:"'Reluctant' means unwilling or hesitant." },
  { id:"en9", level:"B1", skill:"usage", prompt:"If I ___ you, I would apologise immediately.", options:["am","was","were","had been"], correct:2, explanation:"In the second conditional, we use 'were' for all subjects." },
  { id:"en10", level:"B1", skill:"grammar", prompt:"He asked me where ___ from.", options:["am I","I am","was I","I was"], correct:3, explanation:"In reported speech, the word order is subject-before-verb: 'I was'." },
  { id:"en11", level:"B2", skill:"grammar", prompt:"The report ___ by the committee before the deadline.", options:["has been submitted","had been submitted","was submitted","submitted"], correct:1, explanation:"Past perfect passive ('had been submitted') shows action completed before a past reference point." },
  { id:"en12", level:"B2", skill:"vocabulary", prompt:"'The speech was ___; it convinced almost no one.'", options:["persuasive","compelling","eloquent","unconvincing"], correct:3, explanation:"'Unconvincing' fits — the speech failed to convince." },
  { id:"en13", level:"B2", skill:"grammar", prompt:"Not only ___ the exam, she also received a scholarship.", options:["she passed","did she pass","she did pass","passed she"], correct:1, explanation:"After 'not only' at the start of a clause, inversion is required." },
  { id:"en14", level:"C1", skill:"vocabulary", prompt:"The word 'sanguine' means:", options:["angry and aggressive","optimistic about the future","deeply saddened","completely exhausted"], correct:1, explanation:"'Sanguine' means optimistic, especially in difficult situations." },
  { id:"en15", level:"C1", skill:"grammar", prompt:"Had they known about the risks, they ___ the project.", options:["would not have started","would not start","did not start","had not started"], correct:0, explanation:"Inverted third conditional: 'Had they known' = 'If they had known'. Result needs 'would have + past participle'." },
  { id:"en16", level:"C1", skill:"usage", prompt:"Which uses 'despite' correctly?", options:["Despite of the rain, the match continued.","Despite the rain, the match continued.","Despite that it rained, the match continued.","Despite it rained, the match continued."], correct:1, explanation:"'Despite' is followed directly by a noun/noun phrase — never 'of' or a clause." },
  { id:"en17", level:"C2", skill:"vocabulary", prompt:"A 'pyrrhic victory' is one that:", options:["is achieved without any losses","costs so much it is barely worth winning","is won unexpectedly","results in lasting peace"], correct:1, explanation:"A pyrrhic victory comes at such great cost it is equivalent to defeat." },
  { id:"en18", level:"C2", skill:"grammar", prompt:"The results, ___ further analysis is required, are promising.", options:["pending on whether","for which","notwithstanding that","from which"], correct:1, explanation:"'for which' creates a relative clause qualifying 'results'." },
  { id:"en19", level:"C2", skill:"usage", prompt:"Choose the most precise and natural sentence:", options:["The situation deteriorated to such an extent that intervention became an inevitable necessity.","The situation so deteriorated that intervention became inevitable.","The situation had deteriorated very much and so intervention was made necessary.","Due to the situation's deterioration, there was a necessity for inevitable intervention."], correct:1, explanation:"Option B is concise and avoids redundancy ('inevitable necessity' is a tautology)." },
  { id:"en20", level:"C2", skill:"vocabulary", prompt:"'Laconic' describes speech that is:", options:["highly emotional","excessively elaborate","using very few words","confusingly technical"], correct:2, explanation:"Laconic means terse and brief — the Spartans of Laconia were famed for saying little." },
];

// ─── SPANISH ──────────────────────────────────────────────────────────────────
const ES_QUESTIONS: LevelQuestion[] = [
  { id:"es1", level:"A1", skill:"grammar", prompt:"Ella ___ profesora.", options:["es","está","son","hay"], correct:0, explanation:"'Ser' (es) is used for permanent characteristics like professions." },
  { id:"es2", level:"A1", skill:"vocabulary", prompt:"¿Cuál es el número que sigue después de 'nueve'?", options:["ocho","once","diez","doce"], correct:2, explanation:"'Diez' (ten) comes after 'nueve' (nine)." },
  { id:"es3", level:"A1", skill:"grammar", prompt:"Yo ___ en Madrid.", options:["vivo","vive","vivimos","vivís"], correct:0, explanation:"First person singular of 'vivir' is 'vivo'." },
  { id:"es4", level:"A2", skill:"grammar", prompt:"Ayer yo ___ al cine con mis amigos.", options:["fui","iba","voy","iré"], correct:0, explanation:"'Fui' (preterite) is used for a completed action at a specific time in the past." },
  { id:"es5", level:"A2", skill:"vocabulary", prompt:"¿Qué significa 'embarazada'?", options:["embarrassed","pregnant","excited","worried"], correct:1, explanation:"'Embarazada' is a classic false friend — it means pregnant, not embarrassed." },
  { id:"es6", level:"A2", skill:"usage", prompt:"Llevo tres años ___ español.", options:["estudiado","estudiar","estudiando","estudié"], correct:2, explanation:"'Llevar + gerund' expresses duration: 'I have been studying for three years'." },
  { id:"es7", level:"B1", skill:"grammar", prompt:"No creo que él ___ razón.", options:["tiene","tendrá","tenga","haya tenido"], correct:2, explanation:"'No creer que' triggers the subjunctive: 'tenga'." },
  { id:"es8", level:"B1", skill:"vocabulary", prompt:"'Éxito' significa:", options:["exit","failure","success","effort"], correct:2, explanation:"False friend! 'Éxito' means success. 'Exit' in Spanish is 'salida'." },
  { id:"es9", level:"B1", skill:"usage", prompt:"Si tuviera más dinero, ___ un coche nuevo.", options:["compraría","compraré","compro","compraba"], correct:0, explanation:"Second conditional in Spanish: si + imperfect subjunctive → conditional tense." },
  { id:"es10", level:"B1", skill:"grammar", prompt:"El libro ___ por Gabriel García Márquez.", options:["fue escrito","se escribió","era escrito","estaba escrito"], correct:0, explanation:"'Fue escrito' is the standard passive with 'ser + past participle' for a completed action." },
  { id:"es11", level:"B2", skill:"grammar", prompt:"Para que los estudiantes ___, el profesor debe motivarles.", options:["aprenden","aprendan","aprendieran","aprendían"], correct:1, explanation:"'Para que' (so that) always requires the subjunctive: 'aprendan'." },
  { id:"es12", level:"B2", skill:"vocabulary", prompt:"'Realizar' significa principalmente:", options:["to realise (understand)","to carry out / accomplish","to become real","to perform on stage"], correct:1, explanation:"False friend: 'realizar' means to carry out or accomplish. 'To realise' = 'darse cuenta'." },
  { id:"es13", level:"B2", skill:"grammar", prompt:"La empresa, ___ beneficios crecieron un 20%, anunció nuevas contrataciones.", options:["cuya","cuyo","cuyos","cuyas"], correct:2, explanation:"'Cuyo/a/os/as' agrees with the noun it precedes — 'beneficios' is masculine plural → 'cuyos'." },
  { id:"es14", level:"C1", skill:"grammar", prompt:"Ojalá ___ verte pronto.", options:["puede","pueda","podría","pudiera"], correct:3, explanation:"'Ojalá' expressing an unlikely wish takes the imperfect subjunctive: 'pudiera'." },
  { id:"es15", level:"C1", skill:"vocabulary", prompt:"'Sensible' en español significa:", options:["sensible (reasonable)","sensitive","serious","silly"], correct:1, explanation:"Another classic false friend: 'sensible' in Spanish means sensitive, not sensible." },
  { id:"es16", level:"C1", skill:"usage", prompt:"Cuantos más estudiantes ___ al examen, mejor para la escuela.", options:["aprueben","aprueban","han aprobado","aprobaran"], correct:0, explanation:"Cuanto más + subjunctive in comparative clauses about general/hypothetical situations." },
  { id:"es17", level:"C2", skill:"grammar", prompt:"De haberlo sabido antes, ___ de otra manera.", options:["hubiera actuado","habría actuado","actuara","actuaría"], correct:0, explanation:"'De + infinitive compound' = inverted third conditional. Both 'hubiera' and 'habría' are acceptable, but 'hubiera' is more formal." },
  { id:"es18", level:"C2", skill:"vocabulary", prompt:"Una persona 'pusilánime' es:", options:["extremely brave","overly talkative","cowardly and timid","extremely generous"], correct:2, explanation:"'Pusilánime' means cowardly, lacking courage — from Latin 'pusillus animus' (small spirit)." },
  { id:"es19", level:"C2", skill:"usage", prompt:"¿Cuál es la oración más natural y precisa?", options:["Fue por eso que se tuvo que cancelar el evento.","Eso fue la razón de que el evento se cancelase.","Por ello se procedió a la cancelación del evento.","El evento tuvo que ser cancelado a causa de eso."], correct:2, explanation:"Option C is the most formal and natural in written Spanish. 'Por ello se procedió a' is a standard formal construction." },
  { id:"es20", level:"C2", skill:"grammar", prompt:"Ella habló ___ que todos quedaron impresionados.", options:["tan elocuentemente","tanto elocuente","tal elocuencia","de tal elocuencia"], correct:0, explanation:"'Tan + adverb + que' for results: 'She spoke so eloquently that everyone was impressed'." },
];

// ─── FRENCH ───────────────────────────────────────────────────────────────────
const FR_QUESTIONS: LevelQuestion[] = [
  { id:"fr1", level:"A1", skill:"grammar", prompt:"Elle ___ professeure.", options:["est","a","sont","être"], correct:0, explanation:"'Être' (est) is used for professions in French." },
  { id:"fr2", level:"A1", skill:"vocabulary", prompt:"'Journée' signifie:", options:["journey","day","morning","year"], correct:1, explanation:"False friend! 'Journée' means 'day', not 'journey'. 'Journey' = 'trajet' or 'voyage'." },
  { id:"fr3", level:"A1", skill:"grammar", prompt:"Je ___ du café chaque matin.", options:["boire","bois","boit","boivent"], correct:1, explanation:"First person singular of 'boire' is 'bois'." },
  { id:"fr4", level:"A2", skill:"grammar", prompt:"Hier, nous ___ au cinéma.", options:["allons","allions","sommes allés","serons allés"], correct:2, explanation:"For movement verbs (aller, venir, etc.), the passé composé uses 'être': 'sommes allés'." },
  { id:"fr5", level:"A2", skill:"vocabulary", prompt:"'Attendre' signifie:", options:["to attend","to wait","to listen","to try"], correct:1, explanation:"Classic faux ami: 'attendre' = to wait. 'To attend' = 'assister à'." },
  { id:"fr6", level:"A2", skill:"usage", prompt:"J'apprends le français ___ deux ans.", options:["depuis","pendant","pour","dans"], correct:0, explanation:"'Depuis' + present tense for an action that started in the past and continues now." },
  { id:"fr7", level:"B1", skill:"grammar", prompt:"Je ne crois pas qu'il ___ raison.", options:["a","aura","ait","avait"], correct:2, explanation:"'Ne pas croire que' triggers the subjunctive: 'ait'." },
  { id:"fr8", level:"B1", skill:"vocabulary", prompt:"'Actuellement' signifie:", options:["actually","currently","in fact","really"], correct:1, explanation:"Faux ami: 'actuellement' = currently, at present. 'Actually' = 'en fait' or 'en réalité'." },
  { id:"fr9", level:"B1", skill:"usage", prompt:"Si j'avais plus de temps, je ___ plus.", options:["lirais","lirais","lirai","lis"], correct:0, explanation:"Second conditional: si + imparfait → conditionnel présent: 'lirais'." },
  { id:"fr10", level:"B1", skill:"grammar", prompt:"Le livre ___ écrit par Camus.", options:["a été","est","était","fut"], correct:0, explanation:"'A été' (passé composé passive) is the standard form for a completed past action." },
  { id:"fr11", level:"B2", skill:"grammar", prompt:"Il faut que vous ___ à l'heure.", options:["êtes","serez","soyez","étiez"], correct:2, explanation:"'Il faut que' requires the subjunctive: 'soyez'." },
  { id:"fr12", level:"B2", skill:"vocabulary", prompt:"'Location' en français signifie:", options:["location (place)","rental","job","region"], correct:1, explanation:"Faux ami: 'location' = rental, hire. 'Location' (place) = 'emplacement' or 'endroit'." },
  { id:"fr13", level:"B2", skill:"grammar", prompt:"C'est la meilleure décision ___ il ait jamais prise.", options:["que","qui","dont","laquelle"], correct:0, explanation:"The relative pronoun 'que' is the direct object here. After superlatives, the subjunctive is used." },
  { id:"fr14", level:"C1", skill:"grammar", prompt:"Il est parti sans ___ à personne.", options:["parler","parlant","qu'il parle","parle"], correct:0, explanation:"'Sans' is followed by an infinitive: 'sans parler à personne'." },
  { id:"fr15", level:"C1", skill:"vocabulary", prompt:"'Blessé' signifie:", options:["blessed","injured","offended","surprised"], correct:1, explanation:"Faux ami: 'blessé' = injured, wounded. 'Blessed' = 'béni'." },
  { id:"fr16", level:"C1", skill:"usage", prompt:"___ qu'il fasse mauvais, je sors courir.", options:["Quoique","Bien que","Même si","Malgré que"], correct:1, explanation:"'Bien que' (although) takes the subjunctive: 'fasse'. 'Malgré que' is disputed. 'Même si' takes the indicative." },
  { id:"fr17", level:"C2", skill:"grammar", prompt:"S'il avait travaillé davantage, il ___ son examen.", options:["réussirait","aurait réussi","réussissait","ait réussi"], correct:1, explanation:"Third conditional (past hypothetical): si + plus-que-parfait → conditionnel passé ('aurait réussi')." },
  { id:"fr18", level:"C2", skill:"vocabulary", prompt:"Un discours 'grandiloquent' est:", options:["very brief and clear","using high-flown, pompous language","extremely persuasive","formally structured"], correct:1, explanation:"'Grandiloquent' means using pompous, bombastic language. From Latin 'grandis' (great) + 'loqui' (to speak)." },
  { id:"fr19", level:"C2", skill:"usage", prompt:"Laquelle de ces phrases est la plus élégante?", options:["Il a été contraint à démissionner en raison de sa mauvaise gestion.","Sa mauvaise gestion l'a contraint à la démission.","Il a dû démissionner à cause du fait qu'il gérait mal.","La démission a été rendue nécessaire par sa gestion qui était mauvaise."], correct:1, explanation:"Option B is concise, avoids nominalization traps, and is the most natural formal French." },
  { id:"fr20", level:"C2", skill:"grammar", prompt:"Quelque difficile ___ la tâche, il y parvint.", options:["que soit","qu'ait été","que fût","que soit été"], correct:2, explanation:"Literary/formal concessive: 'quelque + adj + que + subjonctif imparfait'. 'Que fût' is the correct subjunctive imparfait of 'être'." },
];

// ─── GERMAN ───────────────────────────────────────────────────────────────────
const DE_QUESTIONS: LevelQuestion[] = [
  { id:"de1", level:"A1", skill:"grammar", prompt:"Sie ___ Lehrerin.", options:["ist","sind","bin","seid"], correct:0, explanation:"'Sie' (she) takes 'ist' — third person singular of 'sein' (to be)." },
  { id:"de2", level:"A1", skill:"vocabulary", prompt:"'Gift' bedeutet auf Deutsch:", options:["gift (present)","poison","help","food"], correct:1, explanation:"False friend! 'Gift' in German means poison. 'Gift' (present) = 'Geschenk'." },
  { id:"de3", level:"A1", skill:"grammar", prompt:"Ich ___ jeden Morgen Kaffee.", options:["trinke","trinkt","trinkst","trinken"], correct:0, explanation:"First person singular of 'trinken' is 'trinke'." },
  { id:"de4", level:"A2", skill:"grammar", prompt:"Ich fahre ___ Bus zur Arbeit.", options:["mit dem","mit der","mit den","mit das"], correct:0, explanation:"'Mit' always takes the dative case. 'Bus' is masculine → dative = 'dem Bus'." },
  { id:"de5", level:"A2", skill:"vocabulary", prompt:"'Bekommen' bedeutet:", options:["to become","to get / receive","to welcome","to understand"], correct:1, explanation:"Classic false friend: 'bekommen' = to get/receive. 'To become' = 'werden'." },
  { id:"de6", level:"A2", skill:"usage", prompt:"Ich lerne Deutsch, ___ ich in Berlin arbeiten kann.", options:["weil","dass","damit","obwohl"], correct:2, explanation:"'Damit' (so that) expresses purpose. It sends the verb to the end." },
  { id:"de7", level:"B1", skill:"grammar", prompt:"Als ich jung ___, spielte ich oft Fußball.", options:["war","bin","wäre","wurde"], correct:0, explanation:"'Als' (when — single past event) takes Präteritum: 'war'." },
  { id:"de8", level:"B1", skill:"vocabulary", prompt:"'Aktuell' bedeutet:", options:["actual","current / up-to-date","important","original"], correct:1, explanation:"False friend: 'aktuell' = current/present. 'Actual' = 'eigentlich' or 'tatsächlich'." },
  { id:"de9", level:"B1", skill:"grammar", prompt:"Das Buch, ___ ich gerade lese, ist sehr gut.", options:["das","den","dem","der"], correct:0, explanation:"'Lesen' takes an accusative object. 'Buch' is neuter → accusative relative pronoun = 'das'." },
  { id:"de10", level:"B1", skill:"usage", prompt:"Wegen des schlechten Wetters ___ das Spiel abgesagt.", options:["haben","wurde","ist","sein"], correct:1, explanation:"Passive with 'werden': 'wurde...abgesagt' (was cancelled). The agent is implied." },
  { id:"de11", level:"B2", skill:"grammar", prompt:"Er sagte, er ___ krank.", options:["ist","war","sei","wäre"], correct:2, explanation:"Reported speech in German uses Konjunktiv I: 'sei'. (Konjunktiv II 'wäre' is used when K1 is identical to indicative.)" },
  { id:"de12", level:"B2", skill:"vocabulary", prompt:"'Sensibel' bedeutet:", options:["sensible (reasonable)","sensitive","sophisticated","self-confident"], correct:1, explanation:"False friend: 'sensibel' = sensitive (emotionally). 'Sensible' (reasonable) = 'vernünftig'." },
  { id:"de13", level:"B2", skill:"grammar", prompt:"Obwohl er ___ Fieber hatte, ging er zur Arbeit.", options:["ein hohes","hohem","hoher","hohen"], correct:0, explanation:"After 'hatte' as the predicate, 'Fieber' is in the accusative: 'ein hohes Fieber' (strong adj. declension, neuter acc.)." },
  { id:"de14", level:"C1", skill:"grammar", prompt:"Hätte er das gewusst, ___ er anders gehandelt.", options:["hätte","würde","hat","wäre"], correct:0, explanation:"Inverted third conditional: 'Hätte er gewusst...' → result in Konjunktiv II: 'hätte... gehandelt'." },
  { id:"de15", level:"C1", skill:"vocabulary", prompt:"Jemand, der 'wortgewandt' ist, ist:", options:["very quiet","skilled with words / eloquent","stubborn","detail-oriented"], correct:1, explanation:"'Wortgewandt' = eloquent, articulate. From 'Wort' (word) + 'gewandt' (skilled)." },
  { id:"de16", level:"C1", skill:"usage", prompt:"Je mehr er trainierte, ___ besser wurde er.", options:["desto","umso","so","als"], correct:0, explanation:"'Je mehr... desto/umso...' = the more... the more. 'Desto' and 'umso' are interchangeable here." },
  { id:"de17", level:"C2", skill:"grammar", prompt:"Angesichts der Tatsache, dass er ___ hätte wissen müssen, ist sein Verhalten unentschuldbar.", options:["es","das","dies","ihn"], correct:0, explanation:"The pronoun 'es' is required as a placeholder for the subordinate clause content in this formal construction." },
  { id:"de18", level:"C2", skill:"vocabulary", prompt:"'Weltanschauung' bezeichnet:", options:["world domination","a comprehensive worldview or philosophy of life","international relations","cultural heritage"], correct:1, explanation:"'Weltanschauung' = a comprehensive philosophy of life. Used in English too. From 'Welt' (world) + 'Anschauung' (view/perception)." },
  { id:"de19", level:"C2", skill:"usage", prompt:"Welcher Satz ist am treffendsten und elegantesten?", options:["Er wurde dazu gebracht, seinen Rücktritt aufgrund von schlechter Führung einzureichen.","Seine mangelhafte Führung zwang ihn zum Rücktritt.","Er musste zurücktreten, weil er schlecht geführt hat.","Der Rücktritt war notwendig durch seine schlechte Art der Führung."], correct:1, explanation:"Option B is concise and uses the strong verb 'zwingen' effectively, avoiding nominalization traps." },
  { id:"de20", level:"C2", skill:"grammar", prompt:"Das sei dahingestellt — diese Phrase verwendet:", options:["Konjunktiv I to express reported speech","Konjunktiv I to express something left undecided or open","Konjunktiv II for an unreal condition","Imperative mood"], correct:1, explanation:"'Sei dahingestellt' uses Konjunktiv I to mean 'that may remain undecided / be that as it may'. A fixed idiomatic expression." },
];

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export const ALL_LEVEL_QUESTIONS: Record<ToolLang, LevelQuestion[]> = {
  en: EN_QUESTIONS,
  es: ES_QUESTIONS,
  fr: FR_QUESTIONS,
  de: DE_QUESTIONS,
};

export type { ToolLang };

export function getQuestions(lang: ToolLang): LevelQuestion[] {
  return ALL_LEVEL_QUESTIONS[lang] ?? EN_QUESTIONS;
}

export function scoreToLevel(correct: number, total: number): CEFRLevel {
  const pct = (correct / total) * 100;
  if (pct >= 90) return "C2";
  if (pct >= 78) return "C1";
  if (pct >= 63) return "B2";
  if (pct >= 47) return "B1";
  if (pct >= 30) return "A2";
  return "A1";
}

export const LEVEL_META: Record<CEFRLevel, { label: string; colour: string; bg: string; description: string; next: string }> = {
  A1: { label:"A1 – Beginner", colour:"#6B7280", bg:"#F3F4F6", description:"You can understand and use very basic phrases.", next:"Focus on everyday vocabulary and simple present tense." },
  A2: { label:"A2 – Elementary", colour:"#0D9668", bg:"#ECFDF5", description:"You can handle simple, routine exchanges on familiar topics.", next:"Practice past tenses, common connectors, and expand vocabulary." },
  B1: { label:"B1 – Intermediate", colour:"#4A7EC5", bg:"#EFF6FF", description:"You can deal with most situations likely to arise when travelling.", next:"Work on conditionals, reported speech, and idiomatic language." },
  B2: { label:"B2 – Upper Intermediate", colour:"#7C4FD0", bg:"#F5F3FF", description:"You can interact with native speakers with a degree of fluency.", next:"Polish advanced grammar, idiomatic expressions, and register." },
  C1: { label:"C1 – Advanced", colour:"#D48C09", bg:"#FFFBEB", description:"You can express yourself fluently and spontaneously.", next:"Sharpen collocations, nuanced vocabulary, and academic writing." },
  C2: { label:"C2 – Mastery", colour:"#D36135", bg:"#FFF7ED", description:"You can understand virtually everything heard or read with ease.", next:"You're at near-native level. Keep reading widely and challenging yourself!" },
};

export const LEVEL_TEST_META: Record<ToolLang, { title: string; intro: string }> = {
  en: { title:"What's your English level?", intro:"20 questions · Grammar, vocabulary & usage · CEFR A1 to C2" },
  es: { title:"¿Cuál es tu nivel de español?", intro:"20 preguntas · Gramática, vocabulario y uso · MCER A1 a C2" },
  fr: { title:"Quel est votre niveau de français?", intro:"20 questions · Grammaire, vocabulaire et usage · CECRL A1 à C2" },
  de: { title:"Wie gut ist Ihr Deutsch?", intro:"20 Fragen · Grammatik, Wortschatz und Sprachgebrauch · GER A1 bis C2" },
};
