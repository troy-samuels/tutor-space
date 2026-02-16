/**
 * Speed Clash scenarios — scenario + 4 response options.
 * 50+ scenarios per language, CEFR-tagged.
 */

import type { CefrLevel } from '@/lib/cefr';

export interface Scenario {
  id: string;
  language: string;
  cefrLevel: CefrLevel;
  situation: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
  explanation?: string;
}

// Spanish scenarios (sample — would have 50+ in production)
export const SPANISH_SCENARIOS: Scenario[] = [
  {
    id: 'es-greet-1',
    language: 'es',
    cefrLevel: 'A1',
    situation: 'Morning greeting',
    prompt: 'Your colleague says: "Buenos días, ¿cómo estás?"',
    options: [
      'Bien, gracias. ¿Y tú?',
      'Buenas noches',
      'Adiós',
      'Por favor',
    ],
    correctIndex: 0,
    explanation: '"Bien, gracias. ¿Y tú?" is the natural response to "How are you?"',
  },
  {
    id: 'es-rest-1',
    language: 'es',
    cefrLevel: 'A2',
    situation: 'Restaurant',
    prompt: 'The waiter asks: "¿Qué desea tomar?"',
    options: [
      'Un café, por favor',
      'Sí, gracias',
      'No hablo español',
      'La cuenta, por favor',
    ],
    correctIndex: 0,
  },
  {
    id: 'es-opin-1',
    language: 'es',
    cefrLevel: 'B1',
    situation: 'Expressing opinion',
    prompt: 'Someone asks: "¿Qué opinas sobre el cambio climático?"',
    options: [
      'Creo que es un problema muy grave',
      'Me gusta el clima',
      'Hace calor',
      'No me gusta',
    ],
    correctIndex: 0,
  },
];

// French scenarios (sample)
export const FRENCH_SCENARIOS: Scenario[] = [
  {
    id: 'fr-greet-1',
    language: 'fr',
    cefrLevel: 'A1',
    situation: 'Morning greeting',
    prompt: 'Your colleague says: "Bonjour, ça va?"',
    options: [
      'Ça va bien, merci. Et toi?',
      'Bonsoir',
      'Au revoir',
      'S\'il vous plaît',
    ],
    correctIndex: 0,
  },
  {
    id: 'fr-rest-1',
    language: 'fr',
    cefrLevel: 'A2',
    situation: 'Restaurant',
    prompt: 'The waiter asks: "Que désirez-vous boire?"',
    options: [
      'Un café, s\'il vous plaît',
      'Oui, merci',
      'Je ne parle pas français',
      'L\'addition, s\'il vous plaît',
    ],
    correctIndex: 0,
  },
];

// German scenarios (sample)
export const GERMAN_SCENARIOS: Scenario[] = [
  {
    id: 'de-greet-1',
    language: 'de',
    cefrLevel: 'A1',
    situation: 'Morning greeting',
    prompt: 'Your colleague says: "Guten Tag, wie geht\'s?"',
    options: [
      'Gut, danke. Und dir?',
      'Gute Nacht',
      'Auf Wiedersehen',
      'Bitte',
    ],
    correctIndex: 0,
  },
  {
    id: 'de-rest-1',
    language: 'de',
    cefrLevel: 'A2',
    situation: 'Restaurant',
    prompt: 'The waiter asks: "Was möchten Sie trinken?"',
    options: [
      'Einen Kaffee, bitte',
      'Ja, danke',
      'Ich spreche kein Deutsch',
      'Die Rechnung, bitte',
    ],
    correctIndex: 0,
  },
];

const ALL_SCENARIOS: Record<string, Scenario[]> = {
  es: SPANISH_SCENARIOS,
  fr: FRENCH_SCENARIOS,
  de: GERMAN_SCENARIOS,
};

/**
 * Get random scenarios for a language.
 */
export function getRandomScenarios(language: string, count: number = 10): Scenario[] {
  const scenarios = ALL_SCENARIOS[language] || SPANISH_SCENARIOS;
  
  // Shuffle and take first N
  const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
