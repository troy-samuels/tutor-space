/**
 * ImportReview — Full review screen for imported profile data
 *
 * Shows all scraped & mapped data with inline editing.
 * User confirms → POST /api/import/apply → redirect to page builder.
 */

"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  Star,
  Users,
  BookOpen,
  Video,
  Globe,
  Rocket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/import/resolve-platform";
import type {
  Platform,
  MappedPageBuilderData,
  MappedService,
  MappedReview,
} from "@/lib/import/types";

// ── Props ────────────────────────────────────────────────────────────

type ImportReviewProps = {
  importId: string;
  platform: Platform;
  mappedData: MappedPageBuilderData;
  onBack: () => void;
};

// ── Editable field wrapper ───────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
            rows={4}
            className="text-sm rounded-lg"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            autoFocus
            className="text-sm rounded-lg"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer rounded-lg px-3 py-2 -mx-3 hover:bg-muted/50 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-foreground mt-0.5 line-clamp-3">
        {value || <span className="italic text-muted-foreground">Not set</span>}
      </p>
    </div>
  );
}

// ── Service toggle ───────────────────────────────────────────────────

function ServiceRow({
  service,
  enabled,
  onToggle,
}: {
  service: MappedService;
  enabled: boolean;
  onToggle: () => void;
}) {
  const priceDisplay =
    service.price > 0
      ? `$${(service.price / 100).toFixed(0)}`
      : "Free";

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all",
        enabled
          ? "bg-primary/5 border border-primary/20"
          : "bg-muted/30 border border-transparent opacity-50"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
          enabled
            ? "bg-primary border-primary"
            : "border-muted-foreground/30"
        )}
      >
        {enabled && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{service.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {service.duration_minutes}min
      </span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {priceDisplay}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {service.offer_type}
      </span>
    </button>
  );
}

// ── Review toggle ────────────────────────────────────────────────────

function ReviewRow({
  review,
  enabled,
  onToggle,
}: {
  review: MappedReview;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all",
        enabled
          ? "bg-primary/5 border border-primary/20"
          : "bg-muted/30 border border-transparent opacity-50"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
          enabled
            ? "bg-primary border-primary"
            : "border-muted-foreground/30"
        )}
      >
        {enabled && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">
          &ldquo;{review.quote}&rdquo;
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          — {review.author_name}
        </p>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────

export function ImportReview({
  importId,
  platform,
  mappedData,
  onBack,
}: ImportReviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Editable profile fields
  const [name, setName] = useState(mappedData.profile.full_name);
  const [tagline, setTagline] = useState(mappedData.profile.tagline);
  const [bio, setBio] = useState(mappedData.profile.bio);

  // Service toggles
  const [enabledServices, setEnabledServices] = useState<boolean[]>(
    mappedData.services.map(() => true)
  );

  // Review toggles
  const [enabledReviews, setEnabledReviews] = useState<boolean[]>(
    mappedData.reviews.map(() => true)
  );
  const [showAllReviews, setShowAllReviews] = useState(false);

  const platformLabel = PLATFORM_LABELS[platform] || platform;

  const toggleService = useCallback((index: number) => {
    setEnabledServices((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const toggleReview = useCallback((index: number) => {
    setEnabledReviews((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  // Apply import
  const handleApply = useCallback(() => {
    setError(null);

    startTransition(async () => {
      try {
        const edits: Partial<MappedPageBuilderData> = {
          profile: {
            ...mappedData.profile,
            full_name: name,
            tagline,
            bio,
          },
          services: mappedData.services.filter((_, i) => enabledServices[i]),
          reviews: mappedData.reviews.filter((_, i) => enabledReviews[i]),
        };

        const res = await fetch("/api/import/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importId, edits }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to apply import.");
          return;
        }

        // Redirect to page builder
        router.push("/dashboard/page-builder");
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }, [
    importId,
    name,
    tagline,
    bio,
    enabledServices,
    enabledReviews,
    mappedData,
    router,
  ]);

  const visibleReviews = showAllReviews
    ? mappedData.reviews
    : mappedData.reviews.slice(0, 3);

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Import from {platformLabel}
          </h2>
          <p className="text-xs text-muted-foreground">
            Review and edit before building your page
          </p>
        </div>
      </div>

      {/* Avatar + name card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-background p-4 mb-4">
        {mappedData.profile.avatar_url ? (
          <Image
            src={mappedData.profile.avatar_url}
            alt={name}
            width={56}
            height={56}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{tagline}</p>
          {mappedData.site.about_subtitle && (
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              {mappedData.site.about_subtitle.split(" · ").map((stat, i) => (
                <span key={i} className="flex items-center gap-1">
                  {stat.includes("rating") && <Star className="h-3 w-3" />}
                  {stat.includes("lesson") && <BookOpen className="h-3 w-3" />}
                  {stat.includes("student") && <Users className="h-3 w-3" />}
                  {stat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Profile fields */}
        <section className="rounded-2xl border border-border/30 bg-background p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Profile
          </h4>
          <div className="space-y-1">
            <EditableField label="Name" value={name} onChange={setName} />
            <EditableField
              label="Tagline"
              value={tagline}
              onChange={setTagline}
            />
            <EditableField
              label="Bio"
              value={bio}
              onChange={setBio}
              multiline
            />
          </div>
        </section>

        {/* Services */}
        {mappedData.services.length > 0 && (
          <section className="rounded-2xl border border-border/30 bg-background p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Services ({mappedData.services.filter((_, i) => enabledServices[i]).length} of{" "}
              {mappedData.services.length} selected)
            </h4>
            <div className="space-y-2">
              {mappedData.services.map((service, i) => (
                <ServiceRow
                  key={i}
                  service={service}
                  enabled={enabledServices[i]}
                  onToggle={() => toggleService(i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {mappedData.reviews.length > 0 && (
          <section className="rounded-2xl border border-border/30 bg-background p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Reviews ({mappedData.reviews.filter((_, i) => enabledReviews[i]).length} of{" "}
              {mappedData.reviews.length} selected)
            </h4>
            <div className="space-y-2">
              {visibleReviews.map((review, i) => (
                <ReviewRow
                  key={i}
                  review={review}
                  enabled={enabledReviews[i]}
                  onToggle={() => toggleReview(i)}
                />
              ))}
            </div>
            {mappedData.reviews.length > 3 && (
              <Button
                onClick={() => setShowAllReviews(!showAllReviews)}
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
              >
                {showAllReviews ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {mappedData.reviews.length - 3} more
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Video */}
        {mappedData.profile.intro_video_url && (
          <section className="rounded-2xl border border-border/30 bg-background p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Video className="h-3 w-3 inline mr-1" />
              Intro Video
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {mappedData.profile.intro_video_url}
            </p>
          </section>
        )}

        {/* Theme auto-detection */}
        <section className="rounded-2xl border border-border/30 bg-background p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Globe className="h-3 w-3 inline mr-1" />
            Theme
          </h4>
          <p className="text-sm text-foreground">
            Auto-detected:{" "}
            <span className="font-medium capitalize">
              {mappedData.site.theme_archetype}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You can change this in the page builder after import
          </p>
        </section>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-6 pb-8">
        <Button
          onClick={handleApply}
          disabled={isPending}
          size="lg"
          className="w-full rounded-xl min-h-[48px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Building your page…
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Build My Page
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
