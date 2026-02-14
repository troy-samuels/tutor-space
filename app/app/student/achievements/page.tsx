"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Lock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ACHIEVEMENTS, getAchievementProgress } from "@/lib/engagement/achievements";
import type { Achievement } from "@/lib/engagement/types";

const rarityColors: Record<Achievement["rarity"], string> = {
  common: "border-gray-500/30 bg-gray-500/5",
  rare: "border-blue-500/30 bg-blue-500/5",
  epic: "border-purple-500/30 bg-purple-500/5",
  legendary: "border-amber-500/30 bg-amber-500/5",
};

const rarityBadges: Record<Achievement["rarity"], string> = {
  common: "bg-gray-500/20 text-gray-400",
  rare: "bg-blue-500/20 text-blue-400",
  epic: "bg-purple-500/20 text-purple-400",
  legendary: "bg-amber-500/20 text-amber-400",
};

export default function AchievementsPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    // Load unlocked achievements from localStorage
    const stored = localStorage.getItem("tl_achievements");
    if (stored) {
      try {
        setUnlockedAchievements(JSON.parse(stored));
      } catch {
        // Ignore
      }
    }
  }, []);

  const progress = getAchievementProgress(unlockedAchievements);
  
  const filteredAchievements =
    selectedCategory === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const categories = [
    { id: "all", label: "All", icon: Trophy },
    { id: "practice", label: "Practice", icon: Award },
    { id: "streak", label: "Streaks", icon: Star },
    { id: "mastery", label: "Mastery", icon: Trophy },
    { id: "milestone", label: "Milestones", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">
            Track your learning milestones and celebrate progress
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {progress.unlocked} / {progress.total}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Achievements Unlocked
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">
                  {progress.xpEarned} XP
                </p>
                <p className="text-sm text-muted-foreground">From Achievements</p>
              </div>
            </div>
            <Progress value={progress.percentage} className="h-3" />
            <p className="text-center text-xs text-muted-foreground mt-2">
              {progress.percentage}% Complete
            </p>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, index) => {
            const isUnlocked = unlockedAchievements.some(
              (a) => a.id === achievement.id && a.unlockedAt
            );

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`${
                    isUnlocked
                      ? rarityColors[achievement.rarity]
                      : "border-border bg-background opacity-60"
                  } transition-all hover:scale-105`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl relative">
                        {isUnlocked ? (
                          achievement.icon
                        ) : (
                          <div className="relative">
                            <span className="opacity-30">{achievement.icon}</span>
                            <Lock className="absolute inset-0 w-4 h-4 text-muted-foreground m-auto" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${rarityBadges[achievement.rarity]}`}
                          >
                            {achievement.rarity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
