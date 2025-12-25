import type { Meta, StoryObj } from "@storybook/react";
import { AIPracticeChat } from "./AIPracticeChat";
import {
  mockChatMessages,
  mockChatWithPronunciation,
  mockPracticeUsage,
  mockHighUsage,
} from "./__mocks__/student-data";
import type { ChatMessage } from "./AIPracticeChat";

const meta: Meta<typeof AIPracticeChat> = {
  title: "Student/AIPracticeChat",
  component: AIPracticeChat,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "warm",
      values: [
        { name: "warm", value: "#FDF8F5" },
        { name: "white", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AIPracticeChat>;

/**
 * Welcome screen - no messages yet.
 * Shows the topic prompt and ready to chat message.
 */
export const NewConversation: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Restaurant Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "Restaurant & Dining",
    initialMessages: [],
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Active conversation with 8 messages.
 * Shows the chat flow between user and AI tutor.
 */
export const WithConversation: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Restaurant Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "Restaurant & Dining",
    initialMessages: mockChatMessages,
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Conversation with grammar corrections displayed.
 * Shows how inline corrections appear after user messages.
 */
export const WithGrammarCorrections: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Restaurant Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "Restaurant & Dining",
    initialMessages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Hola! Bienvenido a nuestra clase de conversacion. Cuéntame sobre tu día.",
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        role: "user",
        content: "Hoy yo tiene mucho trabajo en la oficina.",
        corrections: [
          {
            original: "yo tiene",
            corrected: "yo tengo",
            explanation: "The verb 'tener' must agree with the subject. 'Yo' uses 'tengo', not 'tiene' which is for él/ella/usted.",
          },
        ],
        vocabulary_used: ["trabajo", "oficina"],
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        role: "assistant",
        content: "Muy bien, veo que tienes mucho trabajo. *Nota: Decimos 'Yo tengo' no 'yo tiene'.* ¿Qué tipo de trabajo haces?",
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-4",
        role: "user",
        content: "Yo soy un programador. Me gusta escribir codigo.",
        corrections: [
          {
            original: "codigo",
            corrected: "código",
            explanation: "Remember the accent mark! 'Código' (code) has an accent on the 'o'.",
          },
        ],
        vocabulary_used: ["programador", "escribir"],
        created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-5",
        role: "assistant",
        content: "¡Qué interesante! Ser programador es una profesión muy demandada. ¿Qué lenguajes de programación usas más?",
        created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      },
    ] as ChatMessage[],
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Session nearing end - few messages remaining.
 * Shows the message count warning state.
 */
export const SessionEnding: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Restaurant Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "Restaurant & Dining",
    initialMessages: Array(16)
      .fill(null)
      .map((_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? "assistant" : "user",
        content:
          i % 2 === 0
            ? "Esta es una respuesta del asistente de IA para continuar la conversación."
            : "Esta es una respuesta del estudiante para practicar español.",
        created_at: new Date(Date.now() - (20 - i) * 60 * 1000).toISOString(),
      })) as ChatMessage[],
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * High usage warning state.
 * Shows usage meters in warning colors (amber/red).
 */
export const LowUsageRemaining: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Job Interview Practice",
    language: "Spanish",
    level: "advanced",
    topic: "Professional & Career",
    initialMessages: mockChatMessages.slice(0, 4),
    maxMessages: 25,
    initialUsage: mockHighUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Beginner level conversation.
 * Simple greetings and basic vocabulary.
 */
export const BeginnerLevel: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Basic Greetings",
    language: "French",
    level: "beginner",
    topic: "Introductions",
    initialMessages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Bonjour! Je m'appelle Marie. Comment vous appelez-vous?",
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        role: "user",
        content: "Bonjour Marie! Je m'appelle Carlos. Enchanté!",
        vocabulary_used: ["bonjour", "enchanté"],
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        role: "assistant",
        content: "Enchanté, Carlos! Comment allez-vous aujourd'hui?",
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
    ] as ChatMessage[],
    maxMessages: 15,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Advanced conversation with complex corrections.
 */
export const AdvancedLevel: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Business Negotiation",
    language: "German",
    level: "advanced",
    topic: "Business & Contracts",
    initialMessages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Guten Tag, Herr Martinez. Ich freue mich, Sie kennenzulernen. Möchten Sie über die Vertragsbedingungen sprechen?",
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        role: "user",
        content: "Ja, ich möchte gerne die Preis diskutieren.",
        corrections: [
          {
            original: "die Preis diskutieren",
            corrected: "den Preis diskutieren",
            explanation: "Preis is masculine (der Preis), so in accusative case it becomes 'den Preis'.",
          },
        ],
        vocabulary_used: ["Preis", "diskutieren"],
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        role: "assistant",
        content: "Sehr gut! *Hinweis: 'den Preis' (Akkusativ).* Was genau möchten Sie bezüglich des Preises besprechen?",
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
    ] as ChatMessage[],
    maxMessages: 30,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * No usage data - shows message count only.
 * Fallback when usage tracking is not available.
 */
export const WithoutUsageTracking: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Restaurant Practice",
    language: "Spanish",
    level: "intermediate",
    topic: "Restaurant & Dining",
    initialMessages: mockChatMessages.slice(0, 4),
    maxMessages: 20,
    onBack: () => console.log("Back clicked"),
  },
};

/**
 * Without back button.
 * Used when embedded in a full-page view.
 */
export const WithoutBackButton: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Travel Directions",
    language: "Italian",
    level: "intermediate",
    topic: "Travel & Navigation",
    initialMessages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Buongiorno! Sono qui per aiutarti a trovare la strada. Dove vuoi andare?",
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ] as ChatMessage[],
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
  },
};

/**
 * Vocabulary tracking showcase.
 * Multiple messages with vocabulary badges.
 */
export const VocabularyTracking: Story = {
  args: {
    sessionId: "session-1",
    assignmentTitle: "Everyday Vocabulary",
    language: "Spanish",
    level: "intermediate",
    topic: "Daily Life",
    initialMessages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Hola! Cuéntame sobre tu rutina diaria. ¿A qué hora te levantas?",
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        role: "user",
        content: "Me levanto a las siete de la mañana. Después desayuno café y tostadas.",
        vocabulary_used: ["levantarse", "mañana", "desayunar", "café", "tostadas"],
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        role: "assistant",
        content: "¡Muy bien! Un desayuno clásico. ¿Qué haces después del desayuno?",
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-4",
        role: "user",
        content: "Después me ducho y me visto. Luego voy al trabajo en metro.",
        vocabulary_used: ["ducharse", "vestirse", "trabajo", "metro"],
        created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-5",
        role: "assistant",
        content: "Excelente uso de los verbos reflexivos. ¿Cuánto tiempo tardas en llegar al trabajo?",
        created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      },
    ] as ChatMessage[],
    maxMessages: 20,
    initialUsage: mockPracticeUsage,
    onBack: () => console.log("Back clicked"),
  },
};
