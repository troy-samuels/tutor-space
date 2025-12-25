"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
} from "@/components/ui/sheet";
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
  ArrowLeft,
  Pencil,
  X,
  Users,
  MessageSquare,
  Calendar,
  ChevronRight,
  Settings2,
  Save,
} from "lucide-react";
import type { PracticeScenario } from "./ScenarioBuilder";

// Shared constants
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

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All levels" },
];

const CONVERSATION_LENGTH_PRESETS = [
  { value: "10", label: "Quick Chat", description: "Brief practice" },
  { value: "20", label: "Standard", description: "Typical session" },
  { value: "30", label: "Extended", description: "Deep dive" },
];

interface ScenarioDetailSheetProps {
  scenario: PracticeScenario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: PracticeScenario) => void;
  onDelete: (id: string) => void;
}

export function ScenarioDetailSheet({
  scenario,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ScenarioDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "",
    level: "",
    topic: "",
    system_prompt: "",
    vocabulary_focus: [] as string[],
    grammar_focus: [] as string[],
    max_messages: "",
  });

  // Tag input state
  const [vocabInput, setVocabInput] = useState("");
  const [grammarInput, setGrammarInput] = useState("");

  const startEditing = () => {
    if (!scenario) return;
    setForm({
      title: scenario.title,
      description: scenario.description || "",
      language: scenario.language,
      level: scenario.level || "intermediate",
      topic: scenario.topic || "",
      system_prompt: scenario.system_prompt,
      vocabulary_focus: [...scenario.vocabulary_focus],
      grammar_focus: [...scenario.grammar_focus],
      max_messages: String(scenario.max_messages),
    });
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
    setVocabInput("");
    setGrammarInput("");
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    setVocabInput("");
    setGrammarInput("");
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!scenario || !form.title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/practice/scenarios/${scenario.id}`, {
          method: "PATCH",
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

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to save changes");
          return;
        }

        const data = await response.json();
        onUpdate(data.scenario);
        setIsEditing(false);
        setError(null);
      } catch {
        setError("Failed to save changes");
      }
    });
  };

  const handleDelete = () => {
    if (!scenario) return;
    if (!confirm("Delete this scenario? This cannot be undone.")) return;
    onDelete(scenario.id);
    handleClose();
  };

  // Tag handlers
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

  if (!scenario) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetOverlay onClick={handleClose} />
      <SheetContent className="w-full sm:w-[480px] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/60 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="rounded-lg"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm bg-destructive/10 text-destructive">
              {error}
            </div>
          )}

          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Title & Topic */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="h-11 rounded-xl border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Topic</label>
                  <Input
                    value={form.topic}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, topic: e.target.value }))
                    }
                    className="h-11 rounded-xl border-border/60"
                  />
                </div>
              </div>

              {/* Language & Level */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Language</label>
                  <Select
                    value={form.language}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/60">
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
                    <SelectTrigger className="h-11 rounded-xl border-border/60">
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

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="min-h-[80px] rounded-xl border-border/60 resize-none"
                />
              </div>

              {/* Key Vocabulary */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Key Vocabulary</label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 p-3 min-h-[48px]">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVocabTag(vocabInput);
                      }
                    }}
                    onBlur={() => vocabInput && addVocabTag(vocabInput)}
                    placeholder={form.vocabulary_focus.length === 0 ? "Type and press Enter..." : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Grammar Topics */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Grammar Topics</label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 p-3 min-h-[48px]">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGrammarTag(grammarInput);
                      }
                    }}
                    onBlur={() => grammarInput && addGrammarTag(grammarInput)}
                    placeholder={form.grammar_focus.length === 0 ? "Type and press Enter..." : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Conversation Length */}
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
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                        form.max_messages === preset.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.value} msgs
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
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
                  <div className="pt-4 space-y-2">
                    <label className="text-sm font-medium text-foreground">AI Instructions</label>
                    <Textarea
                      value={form.system_prompt}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, system_prompt: e.target.value }))
                      }
                      className="min-h-[140px] rounded-xl border-border/60 font-mono text-xs resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {scenario.title}
                  </h2>
                  {!scenario.is_active && (
                    <Badge variant="secondary" className="rounded-full">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
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
              </div>

              {/* Description */}
              {scenario.description && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-foreground">{scenario.description}</p>
                </div>
              )}

              {/* Key Vocabulary */}
              {scenario.vocabulary_focus.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Key Vocabulary
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scenario.vocabulary_focus.map((word) => (
                      <span
                        key={word}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Topics */}
              {scenario.grammar_focus.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Grammar Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scenario.grammar_focus.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-foreground"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Length */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Conversation Length
                </h3>
                <p className="text-sm text-foreground">
                  {scenario.max_messages} messages per session
                </p>
              </div>

              {/* AI Instructions (collapsible) */}
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
                  AI Instructions
                </button>
                {showAdvanced && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {scenario.system_prompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              <div className="border-t border-border/60 pt-6">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Usage Statistics
                </h3>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Used {scenario.times_used} times
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    {scenario.max_messages} messages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(scenario.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
