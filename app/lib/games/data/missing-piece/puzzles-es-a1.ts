import type { MissingPiecePuzzle } from "./types";

/**
 * Spanish Missing Piece — A1 (Beginner)
 * Focus: Present tense, articles, gender, basic prepositions, ser/estar, greetings
 * Vocabulary: ~500 most common words
 */
export const PUZZLES_ES_A1: MissingPiecePuzzle[] = [
  {
    number: 101,
    language: "es",
    date: "2026-03-01",
    cefrLevel: "A1",
    sentences: [
      { sentence: "Yo ___ estudiante.", options: ["soy", "estoy", "tengo", "hay"], correctIndex: 0, explanation: "'Ser' for identity/profession: I AM a student.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Ella ___ en la casa.", options: ["es", "está", "hay", "tiene"], correctIndex: 1, explanation: "'Estar' for location: She IS in the house.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "___ libro es interesante.", options: ["El", "La", "Un", "Una"], correctIndex: 0, explanation: "'Libro' is masculine → 'el libro'. The book is interesting.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "articles-definite" },
      { sentence: "¿Cómo ___ llamas?", options: ["te", "se", "me", "le"], correctIndex: 0, explanation: "'¿Cómo te llamas?' = What is your name? 'Te' for informal you.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-questions" },
      { sentence: "Nosotros ___ español.", options: ["hablamos", "hablan", "habla", "hablas"], correctIndex: 0, explanation: "'Nosotros hablamos' = We speak. First person plural -ar verb ending: -amos.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "El gato está ___ la mesa.", options: ["en", "sobre", "debajo de", "al lado de"], correctIndex: 2, explanation: "'Debajo de' = under. The cat is under the table.", category: "preposition", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-prepositions" },
      { sentence: "Yo ___ veinte años.", options: ["tengo", "soy", "estoy", "hay"], correctIndex: 0, explanation: "In Spanish, age uses 'tener': I HAVE twenty years (not I am).", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "¿ ___ hora es?", options: ["Qué", "Cuál", "Cómo", "Dónde"], correctIndex: 0, explanation: "'¿Qué hora es?' = What time is it? Fixed expression.", category: "vocabulary", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-questions" },
      { sentence: "___ manzana es roja.", options: ["La", "El", "Un", "Los"], correctIndex: 0, explanation: "'Manzana' is feminine → 'la manzana'. The apple is red.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "articles-definite" },
      { sentence: "Ellos ___ en un restaurante.", options: ["comen", "come", "comer", "comemos"], correctIndex: 0, explanation: "'Ellos comen' = They eat. Third person plural -er verb ending: -en.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "Mi hermano ___ alto.", options: ["es", "está", "tiene", "hay"], correctIndex: 0, explanation: "'Ser' for physical descriptions (permanent): My brother IS tall.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Yo vivo ___ Madrid.", options: ["en", "a", "de", "por"], correctIndex: 0, explanation: "'Vivir en' = to live in. I live IN Madrid.", category: "preposition", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-prepositions" },
      { sentence: "¿Tú ___ café o té?", options: ["quieres", "quiere", "queremos", "quieren"], correctIndex: 0, explanation: "'Tú quieres' = You want. Second person singular.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "No ___ leche en el frigorífico.", options: ["hay", "es", "está", "tiene"], correctIndex: 0, explanation: "'Hay' = there is/are. There isn't any milk in the fridge.", category: "vocabulary", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-negation" },
      { sentence: "La casa es ___.", options: ["grande", "grandes", "grando", "granda"], correctIndex: 0, explanation: "'Grande' doesn't change for gender: la casa es grande, el coche es grande.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-adjectives" },
    ],
  },
  {
    number: 102,
    language: "es",
    date: "2026-03-02",
    cefrLevel: "A1",
    sentences: [
      { sentence: "Buenos ___, señora.", options: ["días", "noches", "tardes", "lunas"], correctIndex: 0, explanation: "'Buenos días' = Good morning. Used until midday.", category: "vocabulary", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-questions" },
      { sentence: "Ella ___ profesora.", options: ["es", "está", "tiene", "hace"], correctIndex: 0, explanation: "'Ser' for professions: She IS a teacher.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Yo ___ un perro.", options: ["tengo", "soy", "estoy", "hago"], correctIndex: 0, explanation: "'Tener' = to have. I HAVE a dog.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "___ coche es azul.", options: ["El", "La", "Los", "Las"], correctIndex: 0, explanation: "'Coche' is masculine → 'el coche'. The car is blue.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "articles-definite" },
      { sentence: "¿Dónde ___ el baño?", options: ["está", "es", "hay", "tiene"], correctIndex: 0, explanation: "'Estar' for location: Where IS the bathroom?", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Nosotros ___ en la escuela.", options: ["estamos", "somos", "tenemos", "hacemos"], correctIndex: 0, explanation: "'Estar' for location: We ARE at school.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Me gusta ___ música.", options: ["la", "el", "un", "una"], correctIndex: 0, explanation: "'Me gusta LA música' — definite article with general likes.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "articles-definite" },
      { sentence: "Mi madre ___ en un hospital.", options: ["trabaja", "trabajo", "trabajas", "trabajan"], correctIndex: 0, explanation: "'Mi madre trabaja' = My mother works. Third person singular -ar: -a.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "¿Cuántos años ___?", options: ["tienes", "eres", "estás", "haces"], correctIndex: 0, explanation: "'¿Cuántos años tienes?' = How old are you? (How many years do you have?)", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "basic-questions" },
      { sentence: "El agua está ___.", options: ["fría", "frío", "fríos", "frías"], correctIndex: 0, explanation: "'Agua' is feminine (el agua fría). The adjective agrees: fría.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "gender-agreement" },
      { sentence: "Yo ___ de España.", options: ["soy", "estoy", "vengo", "vivo"], correctIndex: 0, explanation: "'Ser de' = to be from. I AM from Spain.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Los niños ___ en el parque.", options: ["juegan", "juega", "jugamos", "juego"], correctIndex: 0, explanation: "'Los niños juegan' = The children play. Third person plural.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
      { sentence: "No me gusta ___ fútbol.", options: ["el", "la", "un", "una"], correctIndex: 0, explanation: "'Fútbol' is masculine → 'el fútbol'. I don't like football.", category: "gender", difficulty: 1, cefrLevel: "A1", grammarTopic: "articles-definite" },
      { sentence: "Yo ___ contento hoy.", options: ["estoy", "soy", "tengo", "hago"], correctIndex: 0, explanation: "'Estar' for temporary emotions: I AM happy today.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "ser-estar-basic" },
      { sentence: "Ella ___ café todas las mañanas.", options: ["bebe", "beben", "bebemos", "bebes"], correctIndex: 0, explanation: "'Ella bebe' = She drinks. Third person singular -er verb: -e.", category: "grammar", difficulty: 1, cefrLevel: "A1", grammarTopic: "present-tense-regular" },
    ],
  },
];
