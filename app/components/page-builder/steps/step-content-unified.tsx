"use client";

import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StepContentUnifiedProps = {
  services: Array<{ id: string; name: string; description: string | null }>;
  reviews: Array<{ id?: string; author: string; quote: string }>;
};

export function StepContentUnified({ services, reviews }: StepContentUnifiedProps) {
  const { state, updatePages, updateFaq } = usePageBuilderWizard();
  const { pages, faq } = state;

  // Services
  const handleServiceToggle = (serviceId: string) => {
    const newIds = pages.selectedServiceIds.includes(serviceId)
      ? pages.selectedServiceIds.filter((id) => id !== serviceId)
      : [...pages.selectedServiceIds, serviceId];
    updatePages({ selectedServiceIds: newIds });
  };

  // Reviews
  const handlePinReview = (reviewId: string | null) => {
    updatePages({ pinnedReviewId: reviewId });
  };

  // FAQ
  const [editingFaq, setEditingFaq] = useState<number | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");

  const handleAddFaq = () => {
    updateFaq([...faq, { q: "", a: "" }]);
    setEditingFaq(faq.length);
    setDraftQ("");
    setDraftA("");
  };

  const handleSaveFaq = () => {
    if (editingFaq !== null) {
      const newFaq = [...faq];
      newFaq[editingFaq] = { q: draftQ, a: draftA };
      updateFaq(newFaq);
      setEditingFaq(null);
    }
  };

  const handleDeleteFaq = (index: number) => {
    updateFaq(faq.filter((_, i) => i !== index));
    if (editingFaq === index) setEditingFaq(null);
  };

  const handleEditFaq = (index: number) => {
    setEditingFaq(index);
    setDraftQ(faq[index].q);
    setDraftA(faq[index].a);
  };

  return (
    <div className="space-y-6">
      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Services</p>
          <span className="text-xs text-muted-foreground">
            {pages.selectedServiceIds.length} selected
          </span>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No services yet. Create services in the Services page.
          </p>
        ) : (
          <div className="space-y-1.5">
            {services.map((service) => {
              const isSelected = pages.selectedServiceIds.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleServiceToggle(service.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{service.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* FAQ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">FAQ</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddFaq}
            disabled={editingFaq !== null}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        {faq.length === 0 && editingFaq === null ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No FAQs yet. Add common questions students ask.
          </p>
        ) : (
          <div className="space-y-2">
            {faq.map((item, index) => (
              <div key={index}>
                {editingFaq === index ? (
                  <div className="rounded-lg border border-primary bg-primary/5 p-3 space-y-2">
                    <Input
                      value={draftQ}
                      onChange={(e) => setDraftQ(e.target.value.slice(0, 240))}
                      placeholder="Question"
                      className="text-sm"
                    />
                  <Textarea
                    value={draftA}
                    onChange={(e) => setDraftA(e.target.value.slice(0, 2000))}
                    placeholder="Answer"
                    rows={2}
                    className="text-sm resize-none"
                  />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Supports **bold** and [links](https://example.com)</span>
                      <span>{draftA.length}/2000</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!item.q && !item.a) handleDeleteFaq(index);
                          else setEditingFaq(null);
                        }}
                        className="h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveFaq}
                        disabled={!draftQ.trim() || !draftA.trim()}
                        className="h-7"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group flex items-start gap-2 rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:border-border transition"
                    onClick={() => handleEditFaq(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.q || "Untitled"}</p>
                      <p
                        className="text-xs text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(item.a || "No answer") }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFaq(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Reviews</p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Show
            <input
              type="checkbox"
              checked={pages.showReviews}
              onChange={(e) => updatePages({ showReviews: e.target.checked })}
              className="h-3.5 w-3.5 rounded"
            />
          </label>
        </div>

        {!pages.showReviews ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Reviews section is hidden.
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No reviews yet. They'll appear here when students submit them.
          </p>
        ) : (
          <div className="space-y-1.5">
            {reviews.map((review, index) => {
              const reviewId = review.id || `review-${index}`;
              const isPinned = pages.pinnedReviewId === reviewId;
              return (
                <div
                  key={reviewId}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition",
                    isPinned ? "border-primary bg-primary/5" : "border-border/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground italic truncate">
                      "{review.quote}"
                    </p>
                    <p className="text-xs font-medium mt-0.5">- {review.author}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePinReview(isPinned ? null : reviewId)}
                    className={cn(
                      "p-1.5 rounded-full transition",
                      isPinned
                        ? "bg-primary text-white"
                        : "bg-muted/50 text-muted-foreground hover:text-primary"
                    )}
                    title={isPinned ? "Unpin" : "Pin to home"}
                  >
                    <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
