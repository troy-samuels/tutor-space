import type { MissingPiecePuzzle } from "./types";

/**
 * Spanish Missing Piece — A2 (Elementary)
 * Focus: Past tenses, reflexives, object pronouns, comparatives, false friends, por/para
 * Vocabulary: ~1000 words. Travel, shopping, directions, daily routines
 */
export const PUZZLES_ES_A2: MissingPiecePuzzle[] = [
  {
    number: 201,
    language: "es",
    date: "2026-03-15",
    cefrLevel: "A2",
    sentences: [
      { sentence: "Ayer ___ al cine con mis amigos.", options: ["fui", "iba", "iré", "voy"], correctIndex: 0, explanation: "'Ayer' (yesterday) signals a completed past action → preterite 'fui'.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-regular" },
      { sentence: "Cuando era niño, ___ al parque todos los días.", options: ["iba", "fui", "iré", "vaya"], correctIndex: 0, explanation: "Habitual past action → imperfect 'iba'. I USED TO go to the park.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "imperfect-regular" },
      { sentence: "Mañana ___ a visitar a mi abuela.", options: ["voy", "fui", "iba", "iría"], correctIndex: 0, explanation: "'Ir a + infinitive' for near future: I'm GOING TO visit my grandma.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "ir-a-future" },
      { sentence: "Ella se ___ a las siete.", options: ["levanta", "levanto", "levantan", "levantas"], correctIndex: 0, explanation: "'Levantarse' is reflexive: She gets HERSELF up at seven.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "reflexive-verbs" },
      { sentence: "¿___ diste el libro?", options: ["Le", "Lo", "La", "Les"], correctIndex: 0, explanation: "'Le' = indirect object (to him/her). Did you give HIM/HER the book?", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "object-pronouns-indirect" },
      { sentence: "Mi casa es más grande ___ la tuya.", options: ["que", "de", "como", "tan"], correctIndex: 0, explanation: "'Más...que' = more...than. My house is bigger THAN yours.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "comparatives-superlatives" },
      { sentence: "Este regalo es ___ ti.", options: ["para", "por", "a", "de"], correctIndex: 0, explanation: "'Para' for recipient: This gift is FOR you.", category: "preposition", difficulty: 2, cefrLevel: "A2", grammarTopic: "por-vs-para-basic" },
      { sentence: "Gracias ___ tu ayuda.", options: ["por", "para", "de", "a"], correctIndex: 0, explanation: "'Por' for reason/cause: Thanks FOR (because of) your help.", category: "preposition", difficulty: 2, cefrLevel: "A2", grammarTopic: "por-vs-para-basic" },
      { sentence: "Mi padre ___ enojado ayer.", options: ["estuvo", "fue", "era", "estaba"], correctIndex: 0, explanation: "Preterite of estar for a specific completed state: Dad WAS angry yesterday.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-vs-imperfect" },
      { sentence: "Ella es ___ inteligente como su hermano.", options: ["tan", "más", "menos", "tanto"], correctIndex: 0, explanation: "'Tan...como' = as...as. She is AS intelligent AS her brother.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "comparatives-superlatives" },
      { sentence: "Yo ___ ducho todas las mañanas.", options: ["me", "se", "te", "nos"], correctIndex: 0, explanation: "'Ducharse' is reflexive: I shower MYSELF every morning.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "reflexive-verbs" },
      { sentence: "___ vi en el supermercado.", options: ["Lo", "Le", "La", "Se"], correctIndex: 0, explanation: "'Lo' = direct object (him/it masc). I SAW him at the supermarket.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "object-pronouns-direct" },
      { sentence: "Estoy ___ porque no dormí bien.", options: ["cansado", "constipado", "embarazado", "realizando"], correctIndex: 0, explanation: "'Cansado' = tired. 'Constipado' = having a cold (NOT constipated — false friend!).", category: "vocabulary", difficulty: 2, cefrLevel: "A2", grammarTopic: "false-friends" },
      { sentence: "El supermercado está ___ del banco.", options: ["cerca", "lejos", "dentro", "fuera"], correctIndex: 0, explanation: "'Cerca de' = near. The supermarket is near the bank.", category: "preposition", difficulty: 2, cefrLevel: "A2", grammarTopic: "basic-prepositions" },
      { sentence: "De niña, ella ___ mucho.", options: ["leía", "leyó", "leerá", "lee"], correctIndex: 0, explanation: "Habitual past → imperfect. As a girl, she USED TO read a lot.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-vs-imperfect" },
    ],
  },
  {
    number: 202,
    language: "es",
    date: "2026-03-16",
    cefrLevel: "A2",
    sentences: [
      { sentence: "El año pasado ___ a Italia.", options: ["viajé", "viajaba", "viajo", "viajaré"], correctIndex: 0, explanation: "'El año pasado' = completed timeframe → preterite 'viajé'.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-regular" },
      { sentence: "Ella se ___ mucho a su madre.", options: ["parece", "parece a", "parecer", "parecen"], correctIndex: 0, explanation: "'Parecerse a' = to resemble. She looks a lot like her mother.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "reflexive-verbs" },
      { sentence: "Necesito comprar ___ zapatos nuevos.", options: ["unos", "unas", "un", "una"], correctIndex: 0, explanation: "'Zapatos' is masculine plural → 'unos zapatos'. I need some new shoes.", category: "gender", difficulty: 2, cefrLevel: "A2", grammarTopic: "articles-indefinite" },
      { sentence: "¿Puedes ___ la puerta?", options: ["cerrar", "cierras", "cerrando", "cerrado"], correctIndex: 0, explanation: "'Poder + infinitive': Can you CLOSE the door?", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "present-tense-regular" },
      { sentence: "Mientras yo ___, él cocinaba.", options: ["estudiaba", "estudié", "estudio", "estudiaré"], correctIndex: 0, explanation: "Two simultaneous past actions → both imperfect. While I was studying, he was cooking.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-vs-imperfect" },
      { sentence: "Caminé ___ dos horas.", options: ["durante", "por", "para", "desde"], correctIndex: 0, explanation: "'Durante' = for (duration). I walked FOR two hours.", category: "preposition", difficulty: 2, cefrLevel: "A2", grammarTopic: "por-vs-para-basic" },
      { sentence: "La palabra 'actual' en español significa ___.", options: ["current", "actual", "real", "true"], correctIndex: 0, explanation: "'Actual' = CURRENT (not 'actual' in English!). Classic false friend.", category: "vocabulary", difficulty: 2, cefrLevel: "A2", grammarTopic: "false-friends" },
      { sentence: "Nos ___ a las ocho en el café.", options: ["encontramos", "encuentro", "encuentran", "encontrar"], correctIndex: 0, explanation: "'Encontrarse' reflexive: We MEET at eight at the café.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "reflexive-verbs" },
      { sentence: "Él es el chico ___ alto de la clase.", options: ["más", "mucho", "muy", "tan"], correctIndex: 0, explanation: "'El más + adjective' = the most / the -est. He's the tallest in the class.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "comparatives-superlatives" },
      { sentence: "Yo ___ llamé ayer.", options: ["la", "le", "lo", "se"], correctIndex: 0, explanation: "'La' = direct object feminine (her). I called HER yesterday.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "object-pronouns-direct" },
      { sentence: "¿A qué hora ___ el tren?", options: ["sale", "salen", "salir", "salimos"], correctIndex: 0, explanation: "'Salir' = to leave/depart. What time does the train LEAVE?", category: "vocabulary", difficulty: 2, cefrLevel: "A2", grammarTopic: "present-tense-regular" },
      { sentence: "Ayer hacía sol ___ de repente empezó a llover.", options: ["pero", "porque", "y", "también"], correctIndex: 0, explanation: "'Pero' = but. Contrasting two ideas: it was sunny BUT it started raining.", category: "vocabulary", difficulty: 2, cefrLevel: "A2", grammarTopic: "basic-negation" },
      { sentence: "Mi abuelo ___ muy amable.", options: ["era", "fue", "estuvo", "estaba"], correctIndex: 0, explanation: "Describing someone's character in the past → imperfect. My grandfather WAS very kind.", category: "tense", difficulty: 2, cefrLevel: "A2", grammarTopic: "preterite-vs-imperfect" },
      { sentence: "Hay que ___ a la derecha.", options: ["girar", "giras", "girando", "girado"], correctIndex: 0, explanation: "'Hay que + infinitive' = one must / you need to. You need to turn right.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "present-tense-regular" },
      { sentence: "___ acosté tarde anoche.", options: ["Me", "Se", "Te", "Nos"], correctIndex: 0, explanation: "'Acostarse' reflexive: I went to bed late last night.", category: "grammar", difficulty: 2, cefrLevel: "A2", grammarTopic: "reflexive-verbs" },
    ],
  },
];
