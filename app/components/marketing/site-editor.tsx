"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import {
  Lock,
  Eye,
  Palette,
  Type,
  Star,
  GraduationCap,
  FileText,
  BookOpen,
  Share2,
  Check,
  Clock,
  Save,
  Rocket,
} from "lucide-react";
import { SitePreview } from "@/components/marketing/site-preview";
import { cn } from "@/lib/utils";
import { sendTestimonialRequest } from "@/lib/actions/engagement";
import { updateSite, publishSite, createSite, type TutorSite, type TutorSiteService, type TutorSiteReview, type TutorSiteResource } from "@/lib/actions/tutor-sites";
import { migrateSiteFromLocalStorage, hasLocalStorageData } from "@/lib/utils/migrate-site-data";

type PlanName = "professional" | "growth" | "studio";

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  email?: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type InitialSiteData = {
  site: TutorSite | null;
  services: TutorSiteService[];
  reviews: TutorSiteReview[];
  resources: TutorSiteResource[];
} | null;

type SiteEditorProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  plan: PlanName;
  students: Array<{ id: string; name: string; hasContact: boolean }>;
  defaultReviewFormUrl: string;
  initialSiteData: InitialSiteData;
};

type ThemeSettings = {
  background: string;
  primary: string;
  font: "system" | "serif" | "mono";
  spacing: "cozy" | "comfortable" | "compact";
};

type ReviewsDraft = Array<{ author: string; quote: string }>;

type PageVisibility = {
  about: boolean;
  lessons: boolean;
  reviews: boolean;
  resources: boolean;
  contact: boolean;
};

type ResourceLink = { id: string; label: string; url: string };
type ContactCTA = { label: string; url: string };

const DEFAULT_PAGE_VISIBILITY: PageVisibility = {
  about: true,
  lessons: true,
  reviews: true,
  resources: false,
  contact: false,
};

export function SiteEditor({
  profile,
  services,
  plan,
  students,
  defaultReviewFormUrl,
  initialSiteData,
}: SiteEditorProps) {
  const [siteId, setSiteId] = useState<string | null>(initialSiteData?.site?.id || null);
  const [status, setStatus] = useState<"draft" | "published">(initialSiteData?.site?.status || "draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Core content
  const [aboutTitle, setAboutTitle] = useState(initialSiteData?.site?.about_title || profile.full_name || "Your name");
  const [aboutSubtitle, setAboutSubtitle] = useState(initialSiteData?.site?.about_subtitle || profile.tagline || "");
  const [aboutBody, setAboutBody] = useState(initialSiteData?.site?.about_body || profile.bio || "");

  // Lessons selection
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    initialSiteData?.services.map((s) => s.service_id) || services.map((s) => s.id)
  );

  // Reviews
  const [reviews, setReviews] = useState<ReviewsDraft>(
    initialSiteData?.reviews.map((r) => ({ author: r.author_name, quote: r.quote })) || []
  );
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewQuote, setNewReviewQuote] = useState("");

  // Theme controls
  const [theme, setTheme] = useState<ThemeSettings>({
    background: initialSiteData?.site?.theme_background || "#ffffff",
    primary: initialSiteData?.site?.theme_primary || "#2563eb",
    font: (initialSiteData?.site?.theme_font as ThemeSettings["font"]) || "system",
    spacing: (initialSiteData?.site?.theme_spacing as ThemeSettings["spacing"]) || "comfortable",
  });

  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({
    about: initialSiteData?.site?.show_about ?? true,
    lessons: initialSiteData?.site?.show_lessons ?? true,
    reviews: initialSiteData?.site?.show_reviews ?? true,
    resources: initialSiteData?.site?.show_resources ?? false,
    contact: initialSiteData?.site?.show_contact ?? false,
  });

  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>(
    initialSiteData?.resources.map((r) => ({ id: r.id, label: r.label, url: r.url })) || []
  );
  const [resourceDraft, setResourceDraft] = useState({ label: "", url: "" });

  const [contactCta, setContactCta] = useState<ContactCTA>({
    label: initialSiteData?.site?.contact_cta_label || "Email me",
    url: initialSiteData?.site?.contact_cta_url || (profile.email ? `mailto:${profile.email}` : ""),
  });

  const [reviewFormUrl, setReviewFormUrl] = useState(defaultReviewFormUrl);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [lessonHighlight, setLessonHighlight] = useState("");
  const [incentive, setIncentive] = useState("");
  const [requestStatus, setRequestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPendingRequest, startRequest] = useTransition();

  // Migration effect - run once on mount
  useEffect(() => {
    async function handleMigration() {
      // Only migrate if no database site exists but localStorage data does
      if (!initialSiteData?.site && hasLocalStorageData(profile.id)) {
        const result = await migrateSiteFromLocalStorage(profile.id);
        if (result.success) {
          // Reload page to get fresh data from database
          window.location.reload();
        }
      }
    }
    handleMigration();
  }, [profile.id, initialSiteData?.site]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const canCustomizeTheme = plan === "growth" || plan === "studio";
  const studentsWithContact = useMemo(
    () => students.filter((student) => student.hasContact),
    [students]
  );

  useEffect(() => {
    if (studentsWithContact.length === 0) {
      setSelectedStudentId("");
      return;
    }
    if (!selectedStudentId) {
      setSelectedStudentId(studentsWithContact[0].id);
    }
  }, [studentsWithContact, selectedStudentId]);

  const hasStudents = students.length > 0;
  const hasReviewableStudent = studentsWithContact.length > 0;
  const reviewRequestDisabled =
    !hasReviewableStudent ||
    !selectedStudentId ||
    !lessonHighlight.trim() ||
    !reviewFormUrl.trim() ||
    isPendingRequest;

  const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 9);

  const togglePageSection = (section: keyof PageVisibility) => {
    setPageVisibility((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addResourceLink = () => {
    if (!resourceDraft.label.trim() || !resourceDraft.url.trim()) {
      return;
    }
    setResourceLinks((prev) => [
      ...prev,
      {
        id: createId(),
        label: resourceDraft.label.trim(),
        url: resourceDraft.url.trim(),
      },
    ]);
    setResourceDraft({ label: "", url: "" });
  };

  const removeResourceLink = (id: string) => {
    setResourceLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleReviewRequest = () => {
    if (reviewRequestDisabled) return;
    setRequestStatus(null);
    startRequest(async () => {
      const result = await sendTestimonialRequest({
        studentId: selectedStudentId,
        lessonHighlight: lessonHighlight.trim(),
        testimonialUrl: reviewFormUrl.trim(),
        incentive: incentive.trim() ? incentive.trim() : undefined,
      });

      if (result && "error" in result && result.error) {
        setRequestStatus({ type: "error", message: result.error });
        return;
      }

      setLessonHighlight("");
      setIncentive("");
      setRequestStatus({
        type: "success",
        message: "Review request sent successfully.",
      });
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const siteData = {
      about_title: aboutTitle,
      about_subtitle: aboutSubtitle,
      about_body: aboutBody,
      theme_background: theme.background,
      theme_primary: theme.primary,
      theme_font: theme.font,
      theme_spacing: theme.spacing,
      show_about: pageVisibility.about,
      show_lessons: pageVisibility.lessons,
      show_reviews: pageVisibility.reviews,
      show_resources: pageVisibility.resources,
      show_contact: pageVisibility.contact,
      contact_cta_label: contactCta.label,
      contact_cta_url: contactCta.url,
      services: selectedServiceIds,
      reviews: reviews.map((r) => ({ author_name: r.author, quote: r.quote })),
      resources: resourceLinks.map((r) => ({ label: r.label, url: r.url })),
    };

    try {
      if (siteId) {
        // Update existing site
        const result = await updateSite(siteId, siteData);
        if (result.error) {
          setSaveMessage(result.error);
        } else {
          setSaveMessage("Draft saved successfully");
          setTimeout(() => setSaveMessage(null), 3000);
        }
      } else {
        // Create new site
        const result = await createSite(siteData);
        if (result.error) {
          setSaveMessage(result.error);
        } else {
          setSiteId(result.site?.id || null);
          setSaveMessage("Draft saved successfully");
          setTimeout(() => setSaveMessage(null), 3000);
        }
      }
    } catch (error) {
      setSaveMessage("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!siteId) {
      // Need to save first
      await handleSaveDraft();
      return;
    }

    setIsPublishing(true);
    setSaveMessage(null);

    try {
      const result = await publishSite(siteId);
      if (result.error) {
        setSaveMessage(result.error);
      } else {
        setStatus("published");
        setSaveMessage("Site published successfully!");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      setSaveMessage("Failed to publish site");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Pages Builder</h1>
          {status === "published" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Draft
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveMessage && (
            <span className="text-sm font-medium text-muted-foreground">{saveMessage}</span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* About Section */}
        <Collapsible title="About" icon={<FileText className="h-4 w-4" />} defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                placeholder="e.g., Maria Garcia — Spanish Tutor"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use clear, scannable text (ui-ux.md: visual hierarchy).
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Subtitle</label>
              <Input
                value={aboutSubtitle}
                onChange={(e) => setAboutSubtitle(e.target.value)}
                placeholder="e.g., Conversation-first lessons for fast fluency"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">About text</label>
              <textarea
                rows={5}
                value={aboutBody}
                onChange={(e) => setAboutBody(e.target.value)}
                placeholder="Write a short, friendly introduction and what students can expect."
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Aim for 80–160 words. Keep paragraphs short (ui-ux.md: readability).
              </p>
            </div>
          </div>
        </Collapsible>

        {/* Lessons Section */}
        <Collapsible title="Lessons" icon={<GraduationCap className="h-4 w-4" />}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select which services to feature on your Pages mini‑site.
            </p>
            <div className="grid gap-2">
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active services yet. Create one in Services.
                </p>
              ) : (
                services.map((svc) => {
                  const checked = selectedServiceIds.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3 py-2 text-sm",
                        checked ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background"
                      )}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-foreground">{svc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {svc.duration_minutes ? `${svc.duration_minutes} min` : ""}{" "}
                          {svc.price != null ? `• ${formatCurrency(svc.price, svc.currency || "USD")}` : ""}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() =>
                          setSelectedServiceIds((prev) =>
                            checked ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                          )
                        }
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </Collapsible>

        {/* Reviews Section */}
        <Collapsible title="Reviews & requests" icon={<Star className="h-4 w-4" />}>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Drop in testimonials you want to highlight on your mini-site. You can paste snippets as you receive them.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Author</label>
                  <Input
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="Parent or student name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Quote</label>
                  <Input
                    value={newReviewQuote}
                    onChange={(e) => setNewReviewQuote(e.target.value)}
                    placeholder="Short testimonial"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!newReviewAuthor || !newReviewQuote) return;
                    setReviews((prev) => [...prev, { author: newReviewAuthor, quote: newReviewQuote }]);
                    setNewReviewAuthor("");
                    setNewReviewQuote("");
                  }}
                >
                  Add review
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReviews([])} className="text-muted-foreground">
                  Clear
                </Button>
              </div>
              {reviews.length > 0 ? (
                <ul className="space-y-2">
                  {reviews.map((r, i) => (
                    <li
                      key={`${r.author}-${i}`}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="truncate">
                        "{r.quote}" — <span className="font-semibold">{r.author}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviews((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Request a review</p>
                  <p className="text-xs text-muted-foreground">
                    Send a templated email to parents or students right from TutorLingua.
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Automated email
                </span>
              </div>

              {hasReviewableStudent ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Choose student</label>
                    <select
                      className="mt-1 block w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={selectedStudentId}
                      onChange={(event) => setSelectedStudentId(event.target.value)}
                    >
                      {studentsWithContact.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Lesson highlight</label>
                    <Input
                      value={lessonHighlight}
                      onChange={(event) => setLessonHighlight(event.target.value)}
                      placeholder="e.g., Nailed all 12 irregular verbs in 10 min."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Review form link</label>
                    <Input
                      value={reviewFormUrl}
                      onChange={(event) => setReviewFormUrl(event.target.value)}
                      placeholder="https://forms.yourdomain.com/tutor-testimonials"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Paste any form URL (Notion, Typeform, etc.). We&apos;ll include it in the automated email.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Incentive (optional)</label>
                    <Input
                      value={incentive}
                      onChange={(event) => setIncentive(event.target.value)}
                      placeholder="e.g., 10% off the next lesson"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={handleReviewRequest}
                    disabled={reviewRequestDisabled}
                  >
                    {isPendingRequest ? "Sending..." : "Request review"}
                  </Button>
                  {requestStatus ? (
                    <p
                      className={cn(
                        "text-xs font-medium",
                        requestStatus.type === "success" ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {requestStatus.message}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>
                    You need at least one student with an email address before automated review requests are available.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/students">Add students</Link>
                  </Button>
                </div>
              )}
              {!hasReviewableStudent && hasStudents ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Tip: add a parent or student email so we can deliver the request automatically.
                </p>
              ) : null}
            </div>
          </div>
        </Collapsible>

        {/* Theme Section */}
        <Collapsible
          title="Theme"
          icon={<Palette className="h-4 w-4" />}
          badge={
            !canCustomizeTheme ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                <Lock className="h-3 w-3" />
                Growth
              </span>
            ) : null
          }
        >
          <div className="space-y-4">
            <div className={cn("grid gap-3 sm:grid-cols-2", !canCustomizeTheme && "pointer-events-none opacity-60")}>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Background</label>
                <Input
                  type="color"
                  value={theme.background}
                  onChange={(e) => setTheme((t) => ({ ...t, background: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Primary</label>
                <Input
                  type="color"
                  value={theme.primary}
                  onChange={(e) => setTheme((t) => ({ ...t, primary: e.target.value }))}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Type className="h-3.5 w-3.5" />
                  Font
                </label>
                <select
                  className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={theme.font}
                  onChange={(e) => setTheme((t) => ({ ...t, font: e.target.value as ThemeSettings["font"] }))}
                >
                  <option value="system">System</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Spacing</label>
                <select
                  className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={theme.spacing}
                  onChange={(e) => setTheme((t) => ({ ...t, spacing: e.target.value as ThemeSettings["spacing"] }))}
                >
                  <option value="cozy">Cozy</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
            {!canCustomizeTheme ? (
              <p className="text-xs text-muted-foreground">
                Customize colors and typography with Growth. Your preview uses defaults.
              </p>
            ) : null}
          </div>
        </Collapsible>

        {/* Pages & Sections */}
        <Collapsible title="Pages & sections" icon={<BookOpen className="h-4 w-4" />}>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Pick which mini-site sections are visible and keep resource/contact buttons up to date.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["about", "About"],
                  ["lessons", "Lessons"],
                  ["reviews", "Reviews"],
                  ["resources", "Resources"],
                  ["contact", "Contact"],
                ] as Array<[keyof PageVisibility, string]>
              ).map(([section, label]) => (
                <label
                  key={section}
                  className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-sm font-semibold text-foreground"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={pageVisibility[section]}
                    onChange={() => togglePageSection(section)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">Resource links</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Label</label>
                  <Input
                    value={resourceDraft.label}
                    onChange={(event) => setResourceDraft((prev) => ({ ...prev, label: event.target.value }))}
                    placeholder="e.g., Practice deck"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Link</label>
                  <Input
                    value={resourceDraft.url}
                    onChange={(event) => setResourceDraft((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={addResourceLink}
                  disabled={!resourceDraft.label.trim() || !resourceDraft.url.trim()}
                >
                  Add resource
                </Button>
                <p className="text-[11px] text-muted-foreground">Share worksheets, playlists, or onboarding docs.</p>
              </div>
              {resourceLinks.length > 0 ? (
                <ul className="space-y-2">
                  {resourceLinks.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{link.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => removeResourceLink(link.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No resources yet. Add one to show the section.</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground">Contact CTA</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Button label</label>
                  <Input
                    value={contactCta.label}
                    onChange={(event) => setContactCta((prev) => ({ ...prev, label: event.target.value }))}
                    placeholder="Message me"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Link</label>
                  <Input
                    value={contactCta.url}
                    onChange={(event) => setContactCta((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="mailto:you@email.com or https://wa.me/..."
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Use mailto, WhatsApp, Calendly, or any landing page.</p>
            </div>
          </div>
        </Collapsible>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <DialogBody className="h-[80vh] overflow-auto">
            <SitePreview
              profile={profile}
              about={{ title: aboutTitle, subtitle: aboutSubtitle, body: aboutBody }}
              services={selectedServices}
              reviews={reviews}
              theme={theme}
              pageVisibility={pageVisibility}
              resources={resourceLinks}
              contactCTA={contactCta}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}
