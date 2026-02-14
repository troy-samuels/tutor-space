"use client";

import { motion } from "framer-motion";
import {
  Flame,
  Target,
  Zap,
  BookOpen,
  MessageSquare,
  Play,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState } from "react";
import { LANGUAGES } from "@/lib/practice/catalogue-bridge";

interface DailyPracticeHomeProps {
  onStartPractice: () => void;
  onContinue?: () => void;
  currentLanguage?: string;
  dailyGoal?: {
    exerciseTarget: number;
    exercisesCompleted: number;
    xpTarget: number;
    xpEarned: number;
  };
  streak?: {
    current: number;
    longest: number;
    todayComplete: boolean;
  };
  reviewsDue?: number;
  weeklyXp?: number[];
  recentTopics?: string[];
  lastSession?: {
    language: string;
    topic: string;
    score: number;
    timestamp: string;
  } | null;
}

const MOTIVATIONAL_TIPS = [
  "🎯 Consistency beats intensity. Even 5 minutes daily builds fluency!",
  "🧠 Your brain forms new neural pathways when you practice. Keep going!",
  "🚀 You're 3x more likely to retain what you learn if you practice today.",
  "🌟 The best time to review is right before you forget. Let's practice!",
  "💪 Every expert was once a beginner. You're making progress!",
  "🎨 Language learning opens doors to new cultures and opportunities.",
  "🔥 Your streak shows discipline. Maintain it and watch your skills soar!",
];

const DAY_LABELS = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export default function DailyPracticeHome({
  onStartPractice,
  onContinue,
  currentLanguage = "es",
  dailyGoal = {
    exerciseTarget: 3,
    exercisesCompleted: 0,
    xpTarget: 50,
    xpEarned: 0,
  },
  streak = {
    current: 0,
    longest: 0,
    todayComplete: false,
  },
  reviewsDue = 0,
  weeklyXp = [0, 0, 0, 0, 0, 0, 0],
  recentTopics = [],
  lastSession = null,
}: DailyPracticeHomeProps) {
  const [tip] = useState(
    MOTIVATIONAL_TIPS[Math.floor(Math.random() * MOTIVATIONAL_TIPS.length)]
  );

  const language = useMemo(
    () => LANGUAGES.find((entry) => entry.code === currentLanguage),
    [currentLanguage]
  );
  const dailyProgress = useMemo(
    () =>
      dailyGoal.exerciseTarget > 0
        ? (dailyGoal.exercisesCompleted / dailyGoal.exerciseTarget) * 100
        : 0,
    [dailyGoal.exerciseTarget, dailyGoal.exercisesCompleted]
  );
  const xpProgress = useMemo(
    () => (dailyGoal.xpTarget > 0 ? (dailyGoal.xpEarned / dailyGoal.xpTarget) * 100 : 0),
    [dailyGoal.xpEarned, dailyGoal.xpTarget]
  );

  const maxWeeklyXp = useMemo(() => Math.max(...weeklyXp, 1), [weeklyXp]);
  const weeklyTotalXp = useMemo(
    () => weeklyXp.reduce((total, dayXp) => total + dayXp, 0),
    [weeklyXp]
  );
  const todayIndex = new Date().getDay();

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl">{language?.flag || "🌍"}</span>
          <h1 className="text-2xl font-bold">
            {language?.name || "Language"} Practice
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {streak.todayComplete
            ? "Great job today! Keep building your streak."
            : "Let's keep your streak alive!"}
        </p>
      </motion.div>

      {/* Streak Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <Flame className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {streak.current}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      day streak
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Longest: {streak.longest} days
                  </p>
                </div>
              </div>
              {streak.todayComplete && (
                <Badge variant="default" className="bg-primary/20 text-primary">
                  ✓ Today
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Exercises</span>
                <span className="font-medium">
                  {dailyGoal.exercisesCompleted} / {dailyGoal.exerciseTarget}
                </span>
              </div>
              <Progress value={dailyProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">XP</span>
                <span className="font-medium">
                  {dailyGoal.xpEarned} / {dailyGoal.xpTarget} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue Session */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Card className="border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Continue where you left off</p>
                    <p className="text-xs text-muted-foreground">
                      {lastSession.topic} • {lastSession.score}% score
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onContinue}
                  className="gap-1"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reviews Due */}
      {reviewsDue > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {reviewsDue} review{reviewsDue !== 1 ? "s" : ""} due
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Spaced repetition review
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="default" className="gap-1">
                  Review
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="cursor-pointer hover:border-primary/40 transition-colors">
          <CardContent className="pt-6 pb-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-sm">Conversation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Practice speaking
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors">
          <CardContent className="pt-6 pb-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <p className="font-medium text-sm">Vocabulary</p>
            <p className="text-xs text-muted-foreground mt-1">Build your bank</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyXp.map((xp, i) => {
                const height = (xp / maxWeeklyXp) * 100;
                const isToday = i === todayIndex;
                return (
                  <div key={`${DAY_LABELS[i]}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                      className={`w-full rounded-t ${
                        isToday ? "bg-primary" : "bg-primary/30"
                      } min-h-[4px]`}
                    />
                    <span
                      className={`text-[10px] ${
                        isToday
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Total: {weeklyTotalXp} XP this week
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Topics */}
      {recentTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Practiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentTopics.map((topic, i) => (
                  <Badge key={`${topic}-${i}`} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Motivational Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20"
      >
        <p className="text-sm text-foreground text-center">{tip}</p>
      </motion.div>

      {/* Start Practice Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      >
        <Button
          size="lg"
          className="w-full"
          onClick={onStartPractice}
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Practice Session
        </Button>
      </motion.div>
    </div>
  );
}
