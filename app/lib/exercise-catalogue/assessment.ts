import type { CatalogueExercise } from './types';

// Assessment exercises are carefully selected to test across all difficulty levels
// Each language has 10-15 exercises that progressively get harder

export const ASSESSMENT_EXERCISES: Record<string, CatalogueExercise[]> = {
  es: [
    {
      id: 'es-assess-001',
      type: 'multiple-choice',
      language: 'es',
      level: 'beginner',
      topic: 'greetings',
      prompt: 'How do you say "Hello" in Spanish?',
      options: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
      correctIndex: 0,
      explanation: '"Hola" means "Hello" in Spanish.',
      xp: 10
    },
    {
      id: 'es-assess-002',
      type: 'translate',
      language: 'es',
      level: 'elementary',
      topic: 'food-drink',
      prompt: 'Translate to Spanish: "I like coffee"',
      sourceText: 'I like coffee',
      targetText: 'Me gusta el café',
      acceptedAnswers: ['Me gusta el café', 'Me gusta café'],
      explanation: 'Use "me gusta" for "I like" with singular nouns.',
      xp: 15
    },
    {
      id: 'es-assess-003',
      type: 'fill-blank',
      language: 'es',
      level: 'intermediate',
      topic: 'daily-routine',
      prompt: 'Complete: "Yo ___ al trabajo todos los días"',
      sentence: 'Yo ___ al trabajo todos los días',
      blankOptions: ['voy', 'va', 'van', 'vamos'],
      blankCorrectIndex: 0,
      correctAnswer: 'voy',
      explanation: '"Voy" is the first person singular of "ir" (to go).',
      xp: 20
    },
    {
      id: 'es-assess-004',
      type: 'multiple-choice',
      language: 'es',
      level: 'upper-intermediate',
      topic: 'work',
      prompt: 'Which sentence uses the subjunctive correctly?',
      options: [
        'Espero que tengas un buen día',
        'Espero que tienes un buen día',
        'Espero que tener un buen día',
        'Espero que tiene un buen día'
      ],
      correctIndex: 0,
      explanation: 'After "espero que" (I hope that), use the present subjunctive "tengas".',
      xp: 30
    },
    {
      id: 'es-assess-005',
      type: 'translate',
      language: 'es',
      level: 'advanced',
      topic: 'culture',
      prompt: 'Translate: "Si hubiera sabido, habría venido antes"',
      sourceText: 'Si hubiera sabido, habría venido antes',
      targetText: 'If I had known, I would have come earlier',
      acceptedAnswers: [
        'If I had known, I would have come earlier',
        'If I had known, I would have arrived earlier',
        'Had I known, I would have come earlier'
      ],
      explanation: 'This uses the past perfect subjunctive with conditional perfect.',
      xp: 40
    }
  ],
  
  fr: [
    {
      id: 'fr-assess-001',
      type: 'multiple-choice',
      language: 'fr',
      level: 'beginner',
      topic: 'greetings',
      prompt: 'How do you say "Thank you" in French?',
      options: ['Merci', 'Bonjour', 'Au revoir', 'Pardon'],
      correctIndex: 0,
      explanation: '"Merci" means "Thank you" in French.',
      xp: 10
    },
    {
      id: 'fr-assess-002',
      type: 'fill-blank',
      language: 'fr',
      level: 'elementary',
      topic: 'family',
      prompt: 'Complete: "Je ___ trois frères"',
      sentence: 'Je ___ trois frères',
      blankOptions: ['ai', 'suis', 'a', 'es'],
      blankCorrectIndex: 0,
      correctAnswer: 'ai',
      explanation: '"J\'ai" (I have) is used with "avoir" to express possession.',
      xp: 15
    },
    {
      id: 'fr-assess-003',
      type: 'translate',
      language: 'fr',
      level: 'intermediate',
      topic: 'travel',
      prompt: 'Translate to French: "I was traveling in France"',
      sourceText: 'I was traveling in France',
      targetText: 'Je voyageais en France',
      acceptedAnswers: ['Je voyageais en France', 'Je voyageais dans la France'],
      explanation: 'Use the imparfait (imperfect) for ongoing past actions.',
      xp: 20
    },
    {
      id: 'fr-assess-004',
      type: 'multiple-choice',
      language: 'fr',
      level: 'upper-intermediate',
      topic: 'work',
      prompt: 'Which form is correct?',
      options: [
        'Il faut que je fasse mes devoirs',
        'Il faut que je fais mes devoirs',
        'Il faut que je faire mes devoirs',
        'Il faut que je fait mes devoirs'
      ],
      correctIndex: 0,
      explanation: 'After "il faut que", use the subjunctive: "fasse".',
      xp: 30
    },
    {
      id: 'fr-assess-005',
      type: 'translate',
      language: 'fr',
      level: 'advanced',
      topic: 'culture',
      prompt: 'Translate: "Quoi qu\'il en soit, nous devons continuer"',
      sourceText: 'Quoi qu\'il en soit, nous devons continuer',
      targetText: 'Whatever the case may be, we must continue',
      acceptedAnswers: [
        'Whatever the case may be, we must continue',
        'Be that as it may, we must continue',
        'In any case, we must continue'
      ],
      explanation: '"Quoi qu\'il en soit" is an idiomatic expression meaning "whatever the case may be".',
      xp: 40
    }
  ],
  
  // Additional languages will have similar assessment exercises
  de: [],
  it: [],
  pt: [],
  ja: [],
  ko: [],
  zh: [],
  ar: [],
  nl: [],
  ru: [],
  en: []
};

const EMPTY_ASSESSMENT_EXERCISES = Object.freeze([]) as readonly CatalogueExercise[];

export function getAssessmentExercises(language: string): readonly CatalogueExercise[] {
  const normalizedCode = language.trim().toLowerCase();
  return ASSESSMENT_EXERCISES[normalizedCode] ?? EMPTY_ASSESSMENT_EXERCISES;
}
