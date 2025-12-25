"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Check,
  X,
  MessageSquare,
  Users,
  Sparkles,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { ScenarioDetailSheet } from "./ScenarioDetailSheet";

// Conversation length presets for user-friendly selection
const CONVERSATION_LENGTH_PRESETS = [
  { value: "10", label: "Quick Chat", description: "Brief practice" },
  { value: "20", label: "Standard", description: "Typical session" },
  { value: "30", label: "Extended", description: "Deep dive" },
];
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "Spanish",
    level: "intermediate",
    topic: "",
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    vocabulary_focus: [] as string[],
    grammar_focus: [] as string[],
    max_messages: "20",
  });

  // State for tag input fields
  const [vocabInput, setVocabInput] = useState("");
  const [grammarInput, setGrammarInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State for detail sheet
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleCardClick = (scenario: PracticeScenario) => {
    setSelectedScenario(scenario);
    setIsDetailOpen(true);
  };

  const handleScenarioUpdate = (updated: PracticeScenario) => {
    setItems((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      language: "Spanish",
      level: "intermediate",
      topic: "",
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      vocabulary_focus: [],
      grammar_focus: [],
      max_messages: "20",
    });
    setVocabInput("");
    setGrammarInput("");
    setShowAdvanced(false);
    setIsCreating(false);
  };

  // Tag input handlers
  const addVocabTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !form.vocabulary_focus.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        vocabulary_focus: [...prev.vocabulary_focus, trimmed],
      }));
    }
    setVocabInput("");
  };

  const removeVocabTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      vocabulary_focus: prev.vocabulary_focus.filter((t) => t !== tag),
    }));
  };

  const addGrammarTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !form.grammar_focus.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        grammar_focus: [...prev.grammar_focus, trimmed],
      }));
    }
    setGrammarInput("");
  };

  const removeGrammarTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      grammar_focus: prev.grammar_focus.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    addFn: (tag: string) => void
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFn(value);
    }
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
            vocabulary_focus: form.vocabulary_focus,
            grammar_focus: form.grammar_focus,
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
      } catch {
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
    <div className="space-y-8">
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.includes("Failed") || message.includes("Please")
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}>
          {message}
        </div>
      )}

      {/* Create button or form */}
      {!isCreating ? (
        <Button onClick={() => setIsCreating(true)} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Create New Scenario
        </Button>
      ) : (
        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          {/* Card Header */}
          <div className="border-b border-border/60 px-6 py-5">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              New Practice Scenario
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a conversation template for AI practice
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleCreate} className="space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Restaurant Ordering"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="h-11 rounded-xl border-border/60 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Topic</label>
                    <Input
                      placeholder="e.g., Food & Dining"
                      value={form.topic}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, topic: e.target.value }))
                      }
                      className="h-11 rounded-xl border-border/60 bg-background"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Language</label>
                    <Select
                      value={form.language}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
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
                    <label className="text-sm font-medium text-foreground">Level</label>
                    <Select
                      value={form.level}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, level: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background">
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    placeholder="Brief description of the scenario"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="min-h-[80px] rounded-xl border-border/60 bg-background resize-none"
                  />
                </div>
              </div>

              {/* Focus Areas Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Focus Areas
                  </h3>
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </div>

                {/* Key Vocabulary - Tag Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Key Vocabulary</label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background p-3 min-h-[48px]">
                    {form.vocabulary_focus.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeVocabTag(tag)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <input
                      type="text"
                      value={vocabInput}
                      onChange={(e) => setVocabInput(e.target.value)}
                      onKeyDown={(e) => handleTagKeyDown(e, vocabInput, addVocabTag)}
                      onBlur={() => vocabInput && addVocabTag(vocabInput)}
                      placeholder={form.vocabulary_focus.length === 0 ? "Type and press Enter..." : ""}
                      className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    e.g., menú, pedir, cuenta
                  </p>
                </div>

                {/* Grammar Topics - Tag Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Grammar Topics</label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background p-3 min-h-[48px]">
                    {form.grammar_focus.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeGrammarTag(tag)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <input
                      type="text"
                      value={grammarInput}
                      onChange={(e) => setGrammarInput(e.target.value)}
                      onKeyDown={(e) => handleTagKeyDown(e, grammarInput, addGrammarTag)}
                      onBlur={() => grammarInput && addGrammarTag(grammarInput)}
                      placeholder={form.grammar_focus.length === 0 ? "Type and press Enter..." : ""}
                      className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    e.g., conditional tense, polite requests
                  </p>
                </div>

                {/* Conversation Length - Preset Buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Conversation Length</label>
                  <div className="grid grid-cols-3 gap-3">
                    {CONVERSATION_LENGTH_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, max_messages: preset.value }))
                        }
                        className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition ${
                          form.max_messages === preset.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                        }`}
                      >
                        <span className="text-sm font-medium">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.value} messages
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Settings - Collapsible */}
              <div className="border-t border-border/60 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      showAdvanced ? "rotate-90" : ""
                    }`}
                  />
                  <Settings2 className="h-4 w-4" />
                  Advanced Settings
                </button>
                {showAdvanced && (
                  <div className="pt-5 space-y-2">
                    <label className="text-sm font-medium text-foreground">AI Instructions</label>
                    <Textarea
                      placeholder="Instructions for the AI..."
                      value={form.system_prompt}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, system_prompt: e.target.value }))
                      }
                      className="min-h-[140px] rounded-xl border-border/60 bg-background font-mono text-xs resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Customize how the AI behaves during practice conversations.
                      The default prompt works well for most scenarios.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-xl px-6"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="rounded-xl px-6">
                  {isSaving ? "Creating..." : "Create Scenario"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Active scenarios */}
      {activeScenarios.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">
              Active Scenarios
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {activeScenarios.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onCardClick={handleCardClick}
                disabled={isSaving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive scenarios */}
      {inactiveScenarios.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Inactive Scenarios
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {inactiveScenarios.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {inactiveScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onCardClick={handleCardClick}
                disabled={isSaving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state - matches the warm welcome card style */}
      {items.length === 0 && !isCreating && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-foreground">
            No scenarios yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Create practice scenarios to assign AI conversation practice to your students.
          </p>
          <Button onClick={() => setIsCreating(true)} className="mt-6 rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Scenario
          </Button>
        </div>
      )}

      {/* Scenario Detail Sheet */}
      <ScenarioDetailSheet
        scenario={selectedScenario}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={handleScenarioUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

function ScenarioCard({
  scenario,
  onDelete,
  onToggleActive,
  onCardClick,
  disabled,
}: {
  scenario: PracticeScenario;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onCardClick: (scenario: PracticeScenario) => void;
  disabled: boolean;
}) {
  return (
    <Card
      className={`rounded-2xl border border-border/60 shadow-sm transition cursor-pointer hover:border-primary/40 hover:shadow-md ${scenario.is_active ? "bg-card" : "bg-muted/30 opacity-70"}`}
      onClick={() => onCardClick(scenario)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {scenario.title}
              </h3>
              {!scenario.is_active && (
                <Badge variant="secondary" className="text-[10px] rounded-full">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
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
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {scenario.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Used {scenario.times_used} times
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {scenario.max_messages} messages
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(scenario.id, scenario.is_active);
              }}
              disabled={disabled}
              title={scenario.is_active ? "Deactivate" : "Activate"}
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
              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(scenario.id);
              }}
              disabled={disabled}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
