"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { usePageBuilderWizard, type FAQItem } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_QUESTION_LENGTH = 240;
const MAX_ANSWER_LENGTH = 2000;

export function StepFaq() {
  const { state, updateFaq } = usePageBuilderWizard();
  const { faq } = state;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");

  const handleAddFaq = () => {
    const newFaq: FAQItem = { q: "", a: "" };
    updateFaq([...faq, newFaq]);
    setEditingIndex(faq.length);
    setDraftQuestion("");
    setDraftAnswer("");
  };

  const handleUpdateFaq = (index: number, updates: Partial<FAQItem>) => {
    const newFaq = [...faq];
    newFaq[index] = { ...newFaq[index], ...updates };
    updateFaq(newFaq);
  };

  const handleDeleteFaq = (index: number) => {
    const newFaq = faq.filter((_, i) => i !== index);
    updateFaq(newFaq);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setDraftQuestion(faq[index].q);
    setDraftAnswer(faq[index].a);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      handleUpdateFaq(editingIndex, { q: draftQuestion, a: draftAnswer });
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    // If it's a new empty item, remove it
    if (editingIndex !== null && faq[editingIndex].q === "" && faq[editingIndex].a === "") {
      handleDeleteFaq(editingIndex);
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* FAQ List */}
      {faq.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No FAQs yet. Add your first question to help students understand your teaching.
        </p>
      ) : (
        <div className="space-y-3">
          {faq.map((item, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl border bg-card transition-all",
                editingIndex === index
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border/50 hover:border-border"
              )}
            >
              {editingIndex === index ? (
                /* Edit Mode */
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Question
                    </label>
                    <Input
                      value={draftQuestion}
                      onChange={(e) => setDraftQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                      placeholder="e.g., What is your teaching approach?"
                      className="text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {draftQuestion.length}/{MAX_QUESTION_LENGTH}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Answer
                    </label>
                    <Textarea
                      value={draftAnswer}
                      onChange={(e) => setDraftAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
                      placeholder="Your answer..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Supports **bold** and [links](https://example.com)</span>
                      <span>
                        {draftAnswer.length}/{MAX_ANSWER_LENGTH}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!draftQuestion.trim() || !draftAnswer.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div
                  className="p-4 cursor-pointer group"
                  onClick={() => handleStartEdit(index)}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground line-clamp-1">
                        {item.q || "Untitled question"}
                      </p>
                      <p
                        className="text-xs text-muted-foreground mt-1 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(item.a || "No answer yet") }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFaq(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add FAQ Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddFaq}
        className="w-full"
        disabled={editingIndex !== null}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add FAQ
      </Button>

      {faq.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Click any FAQ to edit. Your FAQs will appear on your FAQ page.
        </p>
      )}
    </div>
  );
}

function renderMarkdownLite(value: string) {
  if (!value) return "";
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withLinks = withBold.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
  );
  return withLinks;
}
