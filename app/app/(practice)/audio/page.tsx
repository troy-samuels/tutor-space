"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Clock,
  ChevronRight,
  Lock,
  Star,
  Sparkles,
} from "lucide-react";
import AudioDrillSession from "@/components/practice/AudioDrillSession";

// ─── Sample lesson data ──────────────────────────────────────────

interface AudioLesson {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMin: number;
  lang: string;
  voiceLang: string;
  locked: boolean;
  focusPointsCost: number;
  drills: Array<{
    promptText: string;
    targetText: string;
    hint?: string;
  }>;
}

const SAMPLE_LESSONS: AudioLesson[] = [
  {
    id: "es-greetings",
    title: "Greetings & Introductions",
    description: "Learn to introduce yourself naturally",
    difficulty: "beginner",
    durationMin: 5,
    lang: "es",
    voiceLang: "es-ES",
    locked: false,
    focusPointsCost: 0,
    drills: [
      {
        promptText: "Say: Hello, how are you?",
        targetText: "Hola, ¿cómo estás?",
        hint: "OH-la, KOH-mo es-TAHS",
      },
      {
        promptText: "Say: My name is...",
        targetText: "Me llamo...",
        hint: "meh YAH-mo",
      },
      {
        promptText: "Say: Nice to meet you",
        targetText: "Mucho gusto",
        hint: "MOO-cho GOOS-toh",
      },
      {
        promptText: "Say: Where are you from?",
        targetText: "¿De dónde eres?",
        hint: "deh DOHN-deh EH-rehs",
      },
      {
        promptText: "Say: I am from England",
        targetText: "Soy de Inglaterra",
        hint: "soy deh een-glah-TEH-rra",
      },
    ],
  },
  {
    id: "es-restaurant",
    title: "Restaurant Ordering",
    description: "Order food and drinks with confidence",
    difficulty: "beginner",
    durationMin: 7,
    lang: "es",
    voiceLang: "es-ES",
    locked: false,
    focusPointsCost: 0,
    drills: [
      {
        promptText: "Say: A table for two, please",
        targetText: "Una mesa para dos, por favor",
        hint: "OO-nah MEH-sah PAH-rah dohs por fah-VOR",
      },
      {
        promptText: "Say: I would like the menu",
        targetText: "Me gustaría la carta",
        hint: "meh goos-tah-REE-ah lah KAR-tah",
      },
      {
        promptText: "Say: The bill, please",
        targetText: "La cuenta, por favor",
        hint: "lah KWEN-tah por fah-VOR",
      },
      {
        promptText: "Say: It was delicious",
        targetText: "Estaba delicioso",
        hint: "ehs-TAH-bah deh-lee-see-OH-soh",
      },
    ],
  },
  {
    id: "es-directions",
    title: "Asking for Directions",
    description: "Navigate streets and landmarks",
    difficulty: "intermediate",
    durationMin: 8,
    lang: "es",
    voiceLang: "es-ES",
    locked: true,
    focusPointsCost: 50,
    drills: [
      {
        promptText: "Say: Where is the train station?",
        targetText: "¿Dónde está la estación de tren?",
        hint: "DOHN-deh ehs-TAH lah ehs-tah-see-OHN deh trehn",
      },
      {
        promptText: "Say: Turn left at the corner",
        targetText: "Gira a la izquierda en la esquina",
      },
      {
        promptText: "Say: How far is it?",
        targetText: "¿Qué tan lejos está?",
      },
      {
        promptText: "Say: Is it close to here?",
        targetText: "¿Está cerca de aquí?",
      },
      {
        promptText: "Say: I am lost",
        targetText: "Estoy perdido",
        hint: "ehs-TOY pehr-DEE-doh",
      },
    ],
  },
  {
    id: "es-shopping",
    title: "Shopping & Bargaining",
    description: "Buy things like a local",
    difficulty: "intermediate",
    durationMin: 10,
    lang: "es",
    voiceLang: "es-ES",
    locked: true,
    focusPointsCost: 75,
    drills: [
      {
        promptText: "Say: How much does this cost?",
        targetText: "¿Cuánto cuesta esto?",
      },
      {
        promptText: "Say: Do you have a smaller size?",
        targetText: "¿Tiene una talla más pequeña?",
      },
      {
        promptText: "Say: I'll take it",
        targetText: "Me lo llevo",
      },
    ],
  },
];

// ─── Difficulty badge colours ────────────────────────────────────

const difficultyStyle: Record<AudioLesson["difficulty"], string> = {
  beginner: "bg-accent/15 text-accent",
  intermediate: "bg-primary/15 text-primary",
  advanced: "bg-destructive/15 text-destructive",
};

// ─── Component ───────────────────────────────────────────────────

export default function AudioPage() {
  const [activeLesson, setActiveLesson] = useState<AudioLesson | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [focusPoints] = useState(30); // Mock focus points balance

  if (activeLesson) {
    return (
      <AudioDrillSession
        lessonData={activeLesson.drills}
        voiceLang={activeLesson.voiceLang}
        onComplete={(results) => {
          setCompleted((prev) => new Set(prev).add(activeLesson.id));
          setActiveLesson(null);
        }}
        onExit={() => {
          setActiveLesson(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Audio Lessons
            </h1>
            <p className="text-sm text-muted-foreground">
              Listen, think, speak — no text needed
            </p>
          </div>
        </div>

        {/* Focus Points balance */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-2.5 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {focusPoints} Focus Points
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Earn more by playing games
          </span>
        </div>
      </div>

      {/* Lesson list */}
      <div className="flex-1 px-6 pb-6 space-y-3 overflow-y-auto">
        {SAMPLE_LESSONS.map((lesson, i) => {
          const isCompleted = completed.has(lesson.id);
          const canAfford = focusPoints >= lesson.focusPointsCost;

          return (
            <motion.button
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => {
                if (!lesson.locked || canAfford) {
                  setActiveLesson(lesson);
                }
              }}
              disabled={lesson.locked && !canAfford}
              className={`
                w-full text-left p-4 rounded-2xl border transition-all relative min-h-[80px]
                ${
                  isCompleted
                    ? "bg-accent/5 border-accent/20"
                    : lesson.locked && !canAfford
                      ? "bg-muted/50 border-border opacity-60"
                      : "bg-card border-border hover:border-primary/30 hover:shadow-md"
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Left icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-accent/15"
                      : lesson.locked
                        ? "bg-muted"
                        : "bg-primary/10"
                  }`}
                >
                  {isCompleted ? (
                    <Star className="w-5 h-5 text-accent" />
                  ) : lesson.locked ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Headphones className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {lesson.title}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyStyle[lesson.difficulty]}`}
                    >
                      {lesson.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lesson.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.durationMin} min
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {lesson.drills.length} drills
                    </span>
                    {lesson.locked && (
                      <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                        {lesson.focusPointsCost} FP
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
