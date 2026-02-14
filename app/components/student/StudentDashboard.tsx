"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  Play,
  Clock,
  Target,
  Award,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StreakWidget from "@/components/engagement/StreakWidget";
import WeeklyCalendar from "@/components/engagement/WeeklyCalendar";
import XPProgressBar from "@/components/engagement/XPProgressBar";
import type { StreakData, DailyGoal, LevelProgress } from "@/lib/engagement/types";

interface StudentDashboardProps {
  streakData?: StreakData;
  dailyGoal?: DailyGoal;
  levelProgress?: LevelProgress;
  activeLanguages?: Array<{
    code: string;
    name: string;
    flag: string;
    level: string;
    progress: number;
  }>;
  nextAction?: {
    type: "practice" | "lesson" | "review";
    title: string;
    description: string;
  };
  recentActivity?: Array<{
    type: string;
    title: string;
    timestamp: string;
    icon: string;
  }>;
  achievements?: Array<{
    icon: string;
    name: string;
  }>;
  upcomingLesson?: {
    tutorName: string;
    time: string;
    language: string;
  } | null;
  weeklyPractice?: boolean[];
  onStartPractice?: () => void;
  onReviewVocab?: () => void;
  onViewAchievements?: () => void;
}

export default function StudentDashboard({
  streakData = {
    current: 0,
    longest: 0,
    freezesAvailable: 2,
    lastPracticeDate: null,
    freezeUsedAt: null,
  },
  dailyGoal = {
    exerciseTarget: 5,
    exercisesCompleted: 0,
    xpTarget: 100,
    xpEarned: 0,
    lastUpdated: new Date().toISOString(),
  },
  levelProgress = {
    currentLevel: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    totalXp: 0,
  },
  activeLanguages = [],
  nextAction,
  recentActivity = [],
  achievements = [],
  upcomingLesson = null,
  weeklyPractice = [false, false, false, false, false, false, false],
  onStartPractice,
  onReviewVocab,
  onViewAchievements,
}: StudentDashboardProps) {
  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">My Learning Journey</h1>
        <p className="text-muted-foreground">
          Keep up the great work! You're making progress every day.
        </p>
      </motion.div>

      {/* Streak & Level */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <StreakWidget streakData={streakData} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <XPProgressBar
              currentLevel={levelProgress.currentLevel}
              currentXp={levelProgress.currentXp}
              xpToNextLevel={levelProgress.xpToNextLevel}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Progress
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
              <Progress
                value={(dailyGoal.exercisesCompleted / dailyGoal.exerciseTarget) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">XP</span>
                <span className="font-medium">
                  {dailyGoal.xpEarned} / {dailyGoal.xpTarget}
                </span>
              </div>
              <Progress
                value={(dailyGoal.xpEarned / dailyGoal.xpTarget) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Action + Upcoming Lesson */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {nextAction && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase mb-1">
                    Recommended
                  </p>
                  <h3 className="font-semibold mb-1">{nextAction.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {nextAction.description}
                  </p>
                  <Button size="sm" onClick={onStartPractice}>
                    Start Now
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {upcomingLesson && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase mb-1">
                    Upcoming Lesson
                  </p>
                  <h3 className="font-semibold mb-1">
                    {upcomingLesson.language} with {upcomingLesson.tutorName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {upcomingLesson.time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Active Languages */}
      {activeLanguages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                My Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLanguages.map((lang, i) => (
                  <div
                    key={lang.code}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{lang.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {lang.level}
                        </Badge>
                      </div>
                      <Progress value={lang.progress} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Practice Calendar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyCalendar practiceDays={weeklyPractice} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Preview */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Recent Achievements
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onViewAchievements}>
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {achievements.slice(0, 6).map((achievement, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <span className="text-[10px] text-muted-foreground text-center line-clamp-2">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
