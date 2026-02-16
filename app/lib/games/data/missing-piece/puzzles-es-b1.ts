import type { MissingPiecePuzzle } from "./types";

/**
 * Spanish Missing Piece — B1 (Intermediate)
 * Focus: Subjunctive (basic triggers), conditional, por/para advanced, reported speech, idioms
 * Vocabulary: ~2000 words. Work, health, opinions, abstract nouns
 */
export const PUZZLES_ES_B1: MissingPiecePuzzle[] = [
  {
    number: 301,
    language: "es",
    date: "2026-04-01",
    cefrLevel: "B1",
    sentences: [
      { sentence: "Espero que ___ buen tiempo mañana.", options: ["haga", "hace", "hacía", "hará"], correctIndex: 0, explanation: "'Espero que' triggers subjunctive. 'Haga' = present subjunctive of 'hacer'.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Si tuviera más dinero, ___ por el mundo.", options: ["viajaría", "viajo", "viajé", "viaje"], correctIndex: 0, explanation: "Si + imperfect subjunctive → conditional: If I had money, I WOULD travel.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "conditional-tense" },
      { sentence: "Dijo que ___ mañana.", options: ["vendría", "viene", "vendrá", "venga"], correctIndex: 0, explanation: "Reported speech: He said he WOULD come. 'Dijo que' + conditional.", category: "tense", difficulty: 3, cefrLevel: "B1", grammarTopic: "reported-speech" },
      { sentence: "No creo que ___ razón.", options: ["tengas", "tienes", "tiene", "tener"], correctIndex: 0, explanation: "'No creo que' (doubt/negation) triggers subjunctive: 'tengas'.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Llevo tres años ___ en Madrid.", options: ["viviendo", "vivir", "vivo", "viví"], correctIndex: 0, explanation: "'Llevar + time + gerund' = I've been doing X for Y time.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "discourse-markers" },
      { sentence: "Te lo digo ___ que no te sorprendas.", options: ["para", "por", "porque", "como"], correctIndex: 0, explanation: "'Para que' + subjunctive = so that. I'm telling you SO THAT you won't be surprised.", category: "preposition", difficulty: 3, cefrLevel: "B1", grammarTopic: "por-vs-para-advanced" },
      { sentence: "Me pidió que le ___ la verdad.", options: ["dijera", "digo", "diré", "dije"], correctIndex: 0, explanation: "'Pedir que' requires subjunctive. He asked me TO TELL him the truth.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-present-basic" },
      { sentence: "Es importante que todos ___ puntuales.", options: ["sean", "son", "serán", "eran"], correctIndex: 0, explanation: "'Es importante que' triggers subjunctive: It's important that everyone BE on time.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Más vale ___ que curar.", options: ["prevenir", "prevenido", "previniendo", "previene"], correctIndex: 0, explanation: "Proverb: 'Prevention is better than cure.' Infinitive after 'vale'.", category: "idiom", difficulty: 3, cefrLevel: "B1", grammarTopic: "common-idioms" },
      { sentence: "El libro ___ escrito por Cervantes.", options: ["fue", "era", "estuvo", "estaba"], correctIndex: 0, explanation: "Passive voice with 'ser': The book WAS written by Cervantes.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "passive-voice-basic" },
      { sentence: "Ojalá ___ venir a la fiesta.", options: ["puedas", "puedes", "podrías", "podías"], correctIndex: 0, explanation: "'Ojalá' always triggers subjunctive: I hope you CAN come.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Si ___ más tiempo, haría deporte.", options: ["tuviera", "tengo", "tenía", "tendré"], correctIndex: 0, explanation: "Second conditional: Si + imperfect subjunctive. If I HAD more time...", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "conditional-tense" },
      { sentence: "No me di ___ de que estaba lloviendo.", options: ["cuenta", "caso", "vuelta", "razón"], correctIndex: 0, explanation: "'Darse cuenta de' = to realise. I didn't REALISE it was raining.", category: "idiom", difficulty: 3, cefrLevel: "B1", grammarTopic: "common-idioms" },
      { sentence: "El profesor quiere que ___ el examen.", options: ["hagamos", "hacemos", "haremos", "hicimos"], correctIndex: 0, explanation: "'Querer que' + subjunctive: The teacher wants us TO TAKE the exam.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-present-basic" },
      { sentence: "Antes de que ___, quiero decirte algo.", options: ["te vayas", "te vas", "te irás", "te ibas"], correctIndex: 0, explanation: "'Antes de que' always requires subjunctive: Before you LEAVE...", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
    ],
  },
  {
    number: 302,
    language: "es",
    date: "2026-04-02",
    cefrLevel: "B1",
    sentences: [
      { sentence: "Aunque ___ mucho, iré a la fiesta.", options: ["llueva", "llueve", "lloverá", "llovió"], correctIndex: 0, explanation: "'Aunque' + subjunctive = even if (uncertain). Even if it RAINS, I'll go.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Cuando ___ mayor, quiero ser médico.", options: ["sea", "soy", "seré", "era"], correctIndex: 0, explanation: "'Cuando' + future reference → subjunctive. When I AM (become) older...", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Me dijo que ___ enfermo.", options: ["estaba", "está", "esté", "estuviera"], correctIndex: 0, explanation: "Reported speech in past: He told me he WAS sick. Indicative for stating fact.", category: "tense", difficulty: 3, cefrLevel: "B1", grammarTopic: "reported-speech" },
      { sentence: "Esa película me ___ mucho miedo.", options: ["da", "hace", "pone", "tiene"], correctIndex: 0, explanation: "'Dar miedo' = to scare. That film scares me a lot.", category: "idiom", difficulty: 3, cefrLevel: "B1", grammarTopic: "common-idioms" },
      { sentence: "¿Podrías ___ cómo llegar al museo?", options: ["indicarme", "me indicar", "indicándome", "indica me"], correctIndex: 0, explanation: "Infinitive + pronoun attached: Could you TELL ME how to get to the museum?", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "object-pronouns-indirect" },
      { sentence: "Es necesario que ___ una decisión.", options: ["tomemos", "tomamos", "tomaremos", "tomábamos"], correctIndex: 0, explanation: "'Es necesario que' + subjunctive: It's necessary that we MAKE a decision.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Pasé ___ tu casa pero no estabas.", options: ["por", "para", "a", "en"], correctIndex: 0, explanation: "'Pasar por' = to pass by/through. I passed BY your house.", category: "preposition", difficulty: 3, cefrLevel: "B1", grammarTopic: "por-vs-para-advanced" },
      { sentence: "Le aconsejé que ___ más.", options: ["estudiara", "estudia", "estudiará", "estudió"], correctIndex: 0, explanation: "'Aconsejar que' + subjunctive: I advised him TO STUDY more.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-present-basic" },
      { sentence: "No hay nadie que ___ perfecto.", options: ["sea", "es", "será", "era"], correctIndex: 0, explanation: "Subjunctive after 'no hay nadie que' (negated existence). Nobody IS perfect.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "Sin ___, hoy es el mejor día de mi vida.", options: ["embargo", "duda", "más", "razón"], correctIndex: 0, explanation: "'Sin embargo' = however/nevertheless. A key discourse marker.", category: "vocabulary", difficulty: 3, cefrLevel: "B1", grammarTopic: "discourse-markers" },
      { sentence: "Me gustaría que ___ a la cena.", options: ["vinieras", "vienes", "vendrás", "viniste"], correctIndex: 0, explanation: "'Me gustaría que' + imperfect subjunctive: I'd like you TO COME to dinner.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-present-basic" },
      { sentence: "Está lloviendo a ___.", options: ["cántaros", "gotas", "litros", "chorros"], correctIndex: 0, explanation: "'Llover a cántaros' = to rain cats and dogs. Idiom for heavy rain.", category: "idiom", difficulty: 3, cefrLevel: "B1", grammarTopic: "common-idioms" },
      { sentence: "Habla español como si ___ nativo.", options: ["fuera", "es", "fue", "será"], correctIndex: 0, explanation: "'Como si' + imperfect subjunctive: He speaks as if he WERE a native.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-present-basic" },
      { sentence: "En caso de que ___ problemas, llámame.", options: ["haya", "hay", "habrá", "había"], correctIndex: 0, explanation: "'En caso de que' + subjunctive: In case there ARE problems, call me.", category: "grammar", difficulty: 3, cefrLevel: "B1", grammarTopic: "subjunctive-triggers" },
      { sentence: "A pesar de ___ mal tiempo, salimos.", options: ["hacer", "que hace", "hiciera", "haciendo"], correctIndex: 0, explanation: "'A pesar de' + infinitive: Despite the bad weather. Key discourse structure.", category: "vocabulary", difficulty: 3, cefrLevel: "B1", grammarTopic: "discourse-markers" },
    ],
  },
];
