"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Users,
  Sparkles,
} from "lucide-react";
// Common languages for practice scenarios
const SUPPORTED_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
  "Dutch",
  "Polish",
  "Turkish",
];

export type PracticeScenario = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  level: string | null;
  topic: string | null;
  system_prompt: string;
  vocabulary_focus: string[];
  grammar_focus: string[];
  max_messages: number;
  is_active: boolean;
  times_used: number;
  created_at: string;
};

interface ScenarioBuilderProps {
  scenarios: PracticeScenario[];
}

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All levels" },
];

const DEFAULT_SYSTEM_PROMPT = `You are a friendly language practice partner. Your role is to:
1. Have natural conversations in the target language
2. Gently correct significant errors
3. Ask follow-up questions to encourage speaking
4. Adjust difficulty based on the student's responses
5. Keep responses conversational (2-4 sentences)

When correcting errors, use this format:
[Correction: 'original' should be 'corrected' - brief explanation]`;

export function ScenarioBuilder({ scenarios }: ScenarioBuilderProps) {
  const [items, setItems] = useState<PracticeScenario[]>(scenarios);
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "Spanish",
    level: "intermediate",
    topic: "",
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    vocabulary_focus: "",
    grammar_focus: "",
    max_messages: "20",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      language: "Spanish",
      level: "intermediate",
      topic: "",
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      vocabulary_focus: "",
      grammar_focus: "",
      max_messages: "20",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage("Please enter a title");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/practice/scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            language: form.language,
            level: form.level || null,
            topic: form.topic.trim() || null,
            system_prompt: form.system_prompt.trim(),
            vocabulary_focus: form.vocabulary_focus
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            grammar_focus: form.grammar_focus
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            max_messages: parseInt(form.max_messages, 10) || 20,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Failed to create scenario");
          return;
        }

        setItems((prev) => [data.scenario, ...prev]);
        resetForm();
        setMessage("Scenario created!");
      } catch (error) {
        setMessage("Failed to create scenario");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scenario? This cannot be undone.")) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/practice/scenarios/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          setMessage("Scenario deleted");
        } else {
          setMessage("Failed to delete scenario");
        }
      } catch {
        setMessage("Failed to delete scenario");
      }
    });
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/practice/scenarios/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !isActive }),
        });

        if (response.ok) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, is_active: !isActive } : item
            )
          );
        }
      } catch {
        console.error("Failed to toggle scenario");
      }
    });
  };

  const activeScenarios = items.filter((s) => s.is_active);
  const inactiveScenarios = items.filter((s) => !s.is_active);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.includes("Failed") || message.includes("Please")
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}>
          {message}
        </div>
      )}

      {/* Create button or form */}
      {!isCreating ? (
        <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create New Scenario
        </Button>
      ) : (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              New Practice Scenario
            </CardTitle>
            <CardDescription>
              Create a conversation template for AI practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="e.g., Restaurant Ordering"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Input
                    placeholder="e.g., Food & Dining"
                    value={form.topic}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, topic: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={form.language}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select
                    value={form.level}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Messages</label>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={form.max_messages}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, max_messages: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of the scenario"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="min-h-[60px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Vocabulary Focus (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., menú, pedir, cuenta"
                    value={form.vocabulary_focus}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, vocabulary_focus: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Grammar Focus (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., conditional tense, polite requests"
                    value={form.grammar_focus}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, grammar_focus: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  placeholder="Instructions for the AI..."
                  value={form.system_prompt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, system_prompt: e.target.value }))
                  }
                  className="min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt guides the AI&apos;s behavior during practice conversations.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create Scenario"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active scenarios */}
      {activeScenarios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Active Scenarios ({activeScenarios.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                disabled={isSaving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive scenarios */}
      {inactiveScenarios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Inactive Scenarios ({inactiveScenarios.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {inactiveScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                disabled={isSaving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !isCreating && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No scenarios yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create practice scenarios to assign AI conversation practice to your students.
            </p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Scenario
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  onDelete,
  onToggleActive,
  disabled,
}: {
  scenario: PracticeScenario;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  disabled: boolean;
}) {
  return (
    <Card className={scenario.is_active ? "" : "opacity-60"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {scenario.title}
              </h3>
              {!scenario.is_active && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{scenario.language}</span>
              {scenario.level && (
                <>
                  <span>·</span>
                  <span className="capitalize">{scenario.level}</span>
                </>
              )}
              {scenario.topic && (
                <>
                  <span>·</span>
                  <span>{scenario.topic}</span>
                </>
              )}
            </div>
            {scenario.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {scenario.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Used {scenario.times_used} times
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {scenario.max_messages} msg limit
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleActive(scenario.id, scenario.is_active)}
              disabled={disabled}
            >
              {scenario.is_active ? (
                <X className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(scenario.id)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
