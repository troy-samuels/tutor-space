"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publishSite, upsertSiteConfig } from "@/lib/actions/tutor-sites";
import type { FAQItem, SiteBlockType, SiteConfig, SiteTheme } from "@/lib/types/site";
import { SITE_THEMES } from "@/lib/themes";
import ThemeShell from "@/components/site/ThemeShell";
import { cn } from "@/lib/utils";
import {
  Copy,
  Share2,
  ExternalLink,
  Check,
  ChevronDown,
  Upload,
  Instagram,
  Facebook,
  Globe,
  Music4,
  Twitter,
  Trash2,
} from "lucide-react";
import { uploadHeroImage } from "@/lib/actions/tutor-sites";
import { motion, AnimatePresence } from "framer-motion";

// Font pairing options
type FontPairing = "modern" | "editorial" | "clean" | "academic";

const FONT_PAIRINGS: Record<FontPairing, { heading: string; body: string; label: string }> = {
  modern: { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", label: "Modern" },
  editorial: { heading: "'DM Serif Display', serif", body: "'Manrope', sans-serif", label: "Editorial" },
  clean: { heading: "'Plus Jakarta Sans', sans-serif", body: "'Inter', sans-serif", label: "Clean" },
  academic: { heading: "'Merriweather', serif", body: "'Source Sans 3', sans-serif", label: "Academic" },
};

// Block labels (minimalist - no icons)
const BLOCK_LABELS: Record<SiteBlockType, string> = {
  hero: "Cover",
  services: "Services",
  products: "Products",
  about: "About",
  reviews: "Reviews",
  faq: "FAQ",
};

type StudioProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_handle?: string | null;
  x_handle?: string | null;
  website_url?: string | null;
};

type ControlDeckProps = {
  config: SiteConfig;
  profile: StudioProfile;
  onConfigChange: (next: SiteConfig) => void;
  onBlockChange: (id: string, update: Partial<{ isVisible: boolean; order: number }>) => void;
  onThemeChange: (theme: SiteTheme) => void;
  saveStatus: SaveStatus;
  publishStatus: PublishStatus;
  onPublish: () => Promise<void>;
  shareUrl: string;
  shareHandle: string;
  isBgUploading: boolean;
  bgUploadError: string | null;
  setBgUploadError: (error: string | null) => void;
  startBgUpload: (callback: () => Promise<void>) => void;
  customStyling: CustomStyling;
  onCustomStylingChange: (styling: CustomStyling) => void;
  useCustomColors: boolean;
  onToggleCustomColors: (checked: boolean) => void;
  services: ServiceLite[];
  products: ProductLite[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PublishStatus = "idle" | "publishing" | "published" | "error";

// Custom styling state
type CustomStyling = {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  fontPairing: FontPairing;
};

export type ServiceLite = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean | null;
  duration_minutes?: number | null;
  price?: number | null;
  currency?: string | null;
};

export type ProductLite = {
  id: string;
  title: string;
  is_active?: boolean | null;
  published?: boolean | null;
};

type StudioEditorClientProps = {
  siteId: string | null;
  initialConfig: SiteConfig;
  profile: StudioProfile;
  services: ServiceLite[];
  products: ProductLite[];
  shareUrl: string;
  shareHandle: string;
};

export default function StudioEditorClient({
  siteId,
  initialConfig,
  profile,
  services,
  products,
  shareUrl,
  shareHandle,
}: StudioEditorClientProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [shareState, setShareState] = useState<{ url: string; handle: string }>({
    url: shareUrl,
    handle: shareHandle,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [isBgUploading, startBgUpload] = useTransition();
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);
  const [customStyling, setCustomStyling] = useState<CustomStyling>({
    primaryColor: SITE_THEMES[initialConfig.themeId]?.accentColor || "#D36135",
    backgroundColor: SITE_THEMES[initialConfig.themeId]?.bgPage || "#FAFAF9",
    accentColor: "#D36135",
    fontPairing: "editorial",
  });
  const [useCustomColors, setUseCustomColors] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!initialConfig.servicesEnabled?.length && services.length > 0) {
      const defaults = services.filter((svc) => svc.is_active !== false).map((svc) => svc.id);
      setConfig((prev) => ({ ...prev, servicesEnabled: defaults }));
    }
    if (!initialConfig.productsEnabled?.length && products.length > 0) {
      const defaults = products.filter((prod) => prod.is_active !== false && prod.published !== false).map((prod) => prod.id);
      setConfig((prev) => ({ ...prev, productsEnabled: defaults }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (useCustomColors) return;
    const theme = SITE_THEMES[config.themeId] ?? SITE_THEMES.academic;
    setCustomStyling((prev) => ({
      ...prev,
      backgroundColor: theme.bgPage,
      accentColor: theme.accentColor,
    }));
  }, [config.themeId, useCustomColors]);

  // Auto-save with debounce
  useEffect(() => {
    if (!ready) return;

    setSaveStatus("idle");
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const result = await upsertSiteConfig(config);
        if ("error" in result) {
          setSaveStatus("error");
          return;
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [config, ready]);

  const handleBlockChange = useCallback(
    (id: string, update: Partial<{ isVisible: boolean; order: number }>) => {
      setConfig((prev) => ({
        ...prev,
        blocks: (prev.blocks || []).map((block) =>
          block.id === id ? { ...block, ...update } : block
        ),
      }));
    },
    []
  );

  const handleThemeChange = useCallback((theme: SiteTheme) => {
    setConfig((prev) => ({ ...prev, themeId: theme }));
  }, []);

  const handlePublish = useCallback(async () => {
    setPublishStatus("publishing");
    setSaveStatus("saving");
    try {
      const saved = await upsertSiteConfig(config);
      if ("error" in saved) {
        setPublishStatus("error");
        setSaveStatus("error");
        return;
      }

      const publishResult = await publishSite(siteId ?? saved.siteId);
      if ("error" in publishResult) {
        setPublishStatus("error");
        setSaveStatus("error");
        return;
      }

      if ("username" in publishResult && publishResult.username) {
        setShareState((prev) => {
          const base = prev.url.replace(/\/[^/]*$/, "");
          return { handle: publishResult.username as string, url: `${base}/${publishResult.username}` };
        });
      }

      setPublishStatus("published");
      setSaveStatus("saved");
      setTimeout(() => setPublishStatus("idle"), 3000);
    } catch {
      setPublishStatus("error");
      setSaveStatus("error");
    }
  }, [config, siteId]);

  const handleCustomColorToggle = useCallback(
    (next: boolean) => {
      setUseCustomColors(next);
      if (!next) {
        const theme = SITE_THEMES[config.themeId] ?? SITE_THEMES.academic;
        setCustomStyling((prev) => ({
          ...prev,
          backgroundColor: theme.bgPage,
          accentColor: theme.accentColor,
        }));
      }
    },
    [config.themeId]
  );

  const controlDeck = (
    <ControlDeck
      config={config}
      profile={profile}
      onConfigChange={setConfig}
      onBlockChange={handleBlockChange}
      onThemeChange={handleThemeChange}
      saveStatus={saveStatus}
      publishStatus={publishStatus}
      onPublish={handlePublish}
      shareUrl={shareState.url}
      shareHandle={shareState.handle}
      isBgUploading={isBgUploading}
      bgUploadError={bgUploadError}
      setBgUploadError={setBgUploadError}
      startBgUpload={startBgUpload}
      customStyling={customStyling}
      onCustomStylingChange={setCustomStyling}
      useCustomColors={useCustomColors}
      onToggleCustomColors={handleCustomColorToggle}
      services={services}
      products={products}
    />
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Desktop: Narrow sidebar + full-height preview */}
      <div className="hidden gap-6 p-4 lg:grid lg:grid-cols-[300px_1fr]">
        {/* Design Panel - Narrower */}
        <div className="h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
          <ScrollArea className="h-full">
            {controlDeck}
          </ScrollArea>
        </div>

        {/* Live Preview - Full height */}
        <ThemeShell themeId={config.themeId}>
          <div className="relative h-[calc(100vh-32px)] rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 p-6">
            {/* Subtle pattern background */}
            <div className="absolute inset-0 rounded-3xl opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

            <div className="relative h-full">
              <PreviewContainer>
                <StudioPreview
                  profile={profile}
                  services={services}
                  products={products}
                  themeId={config.themeId}
                  config={config}
                  customStyling={customStyling}
                  useCustomColors={useCustomColors}
                />
              </PreviewContainer>
            </div>
          </div>
        </ThemeShell>
      </div>

      {/* Tablet: Narrow sidebar + full preview */}
      <div className="hidden gap-4 p-4 md:grid md:grid-cols-[280px_1fr] lg:hidden">
        <div className="h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
          <ScrollArea className="h-full">
            {controlDeck}
          </ScrollArea>
        </div>

        <ThemeShell themeId={config.themeId}>
          <div className="relative h-[calc(100vh-32px)] rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 p-4">
            <div className="relative h-full">
              <PreviewContainer>
                <StudioPreview
                  profile={profile}
                  services={services}
                  products={products}
                  themeId={config.themeId}
                  config={config}
                  customStyling={customStyling}
                  useCustomColors={useCustomColors}
                />
              </PreviewContainer>
            </div>
          </div>
        </ThemeShell>
      </div>

      {/* Mobile: Preview first, edit in a Sheet */}
      <div className="md:hidden">
        <ThemeShell themeId={config.themeId}>
          <div className="relative min-h-screen bg-gradient-to-br from-stone-100 to-stone-50 px-4 pb-24 pt-6">
            <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center">
              <PreviewContainer>
                <StudioPreview
                  profile={profile}
                  services={services}
                  products={products}
                  themeId={config.themeId}
                  config={config}
                  customStyling={customStyling}
                  useCustomColors={useCustomColors}
                />
              </PreviewContainer>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="fixed bottom-5 left-5 right-5"
            >
              <Button
                size="lg"
                className="w-full rounded-full bg-stone-900 py-6 text-white shadow-xl transition-all hover:bg-stone-800 hover:shadow-2xl active:scale-[0.98]"
                onClick={() => setMobileOpen(true)}
              >
                Customize Your Site
              </Button>
            </motion.div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="bottom">
              <SheetOverlay />
              <SheetContent className="h-[85vh] max-h-[85vh] w-full overflow-hidden rounded-t-3xl border-t border-stone-100 bg-white">
                <div className="h-full overflow-y-auto">{controlDeck}</div>
              </SheetContent>
            </Sheet>
          </div>
        </ThemeShell>
      </div>
    </div>
  );
}

function ControlDeck({
  config,
  profile,
  onConfigChange,
  onBlockChange,
  onThemeChange,
  saveStatus,
  publishStatus,
  onPublish,
  shareUrl,
  shareHandle,
  isBgUploading,
  bgUploadError,
  setBgUploadError,
  startBgUpload,
  customStyling,
  onCustomStylingChange,
  useCustomColors,
  onToggleCustomColors,
  services,
  products,
}: ControlDeckProps) {
  const sortedBlocks = [...(config.blocks || [])].sort((a, b) => a.order - b.order);
  const contentBlocks = sortedBlocks.filter((b) => b.type !== "hero");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const handleVideoFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    onConfigChange({
      ...config,
      hero: { ...(config.hero ?? {}), videoUrl: objectUrl },
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-4 py-3.5 backdrop-blur-sm"
      >
        <div>
          <h1 className="font-serif text-xl text-stone-900">Studio</h1>
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600">Saving...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-600">All changes saved</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-rose-600">Save failed</span>
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                <span className="text-stone-500">Ready</span>
              </span>
            )}
          </div>
        </div>
        <Button
          disabled={publishStatus === "publishing"}
          onClick={onPublish}
          className="relative rounded-full bg-stone-900 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md active:scale-[0.98]"
        >
          {publishStatus !== "published" && (
            <span
              className="pointer-events-none absolute -inset-0.5 rounded-full border border-amber-300/60 animate-pulse"
              aria-hidden="true"
            />
          )}
          {publishStatus === "publishing" ? "Publishing..." : publishStatus === "published" ? <><Check className="mr-1.5 h-3.5 w-3.5" />Published</> : "Publish"}
        </Button>
      </motion.div>

      {/* Share URL Bar - Icon only */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-2"
      >
        <span className="text-sm font-medium text-stone-600">@{shareHandle}</span>

        <div className="flex items-center gap-1">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            title="View live site"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            onClick={(event) => {
              if (publishStatus !== "published") {
                event.preventDefault();
                setShareMessage("Publish to view live");
                setTimeout(() => setShareMessage(null), 2000);
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(shareUrl);
              setShareMessage("Copied!");
              setTimeout(() => setShareMessage(null), 2000);
            }}
            title="Copy link"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            {shareMessage ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ url: shareUrl, title: "My mini-site" });
                } catch {
                  // cancelled
                }
              } else {
                await navigator.clipboard?.writeText(shareUrl);
                setShareMessage("Copied!");
                setTimeout(() => setShareMessage(null), 2000);
              }
            }}
            title="Share"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Sections Container */}
      <div className="flex-1 space-y-4 p-4">
        {/* Style Studio Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StyleStudio
            theme={config.themeId}
            onThemeChange={onThemeChange}
            customStyling={customStyling}
            onCustomStylingChange={onCustomStylingChange}
            useCustomColors={useCustomColors}
            onToggleCustomColors={onToggleCustomColors}
          />
        </motion.div>

        {/* Hero Builder Panel (Cover) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <HeroBuilder
            config={config}
            profile={profile}
            onConfigChange={onConfigChange}
            onVideoUpload={handleVideoFile}
            isBgUploading={isBgUploading}
            bgUploadError={bgUploadError}
            setBgUploadError={setBgUploadError}
            startBgUpload={startBgUpload}
          />
        </motion.div>

        {/* Content Blocks Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ContentBlocksPanel
            contentBlocks={contentBlocks}
            onBlockChange={onBlockChange}
            config={config}
            onConfigChange={onConfigChange}
            services={services}
            products={products}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// STYLE STUDIO PANEL - Theme & Custom Styling
// ============================================================

function StyleStudio({
  theme,
  onThemeChange,
  customStyling,
  onCustomStylingChange,
  useCustomColors,
  onToggleCustomColors,
}: {
  theme: SiteTheme;
  onThemeChange: (theme: SiteTheme) => void;
  customStyling: CustomStyling;
  onCustomStylingChange: (styling: CustomStyling) => void;
  useCustomColors: boolean;
  onToggleCustomColors: (checked: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleColorChange = (key: keyof CustomStyling, value: string) => {
    onCustomStylingChange({ ...customStyling, [key]: value });
  };

  return (
    <section className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 hover:bg-stone-50/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-medium text-stone-900">Style</h3>
          <p className="text-xs text-stone-500">Theme & colors</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-stone-400 transition-transform duration-200", isExpanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 p-4 space-y-5">
              {/* Theme Presets */}
              <div>
                <Label className="text-xs uppercase tracking-wide text-stone-500 mb-2.5 block">Theme</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(SITE_THEMES) as SiteTheme[]).map((t) => (
                    <ThemePresetCard key={t} theme={t} isActive={theme === t} onClick={() => onThemeChange(t)} />
                  ))}
                </div>
              </div>

              {/* Font Selector */}
              <div>
                <Label className="text-xs uppercase tracking-wide text-stone-500 mb-2 block">Font</Label>
                <Select
                  value={customStyling.fontPairing}
                  onValueChange={(v) => handleColorChange("fontPairing", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FONT_PAIRINGS) as FontPairing[]).map((key) => (
                      <SelectItem key={key} value={key} className="text-sm">
                        {FONT_PAIRINGS[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Colors Toggle */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-900">Custom</span>
                  <Switch
                    checked={useCustomColors}
                    onCheckedChange={onToggleCustomColors}
                  />
                </div>

                {/* Expandable custom pickers */}
                <AnimatePresence>
                  {useCustomColors && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <ColorPicker
                            value={customStyling.backgroundColor}
                            onChange={(c) => handleColorChange("backgroundColor", c)}
                          />
                          <span className="text-[10px] text-stone-500">Background</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <ColorPicker
                            value={customStyling.accentColor}
                            onChange={(c) => handleColorChange("accentColor", c)}
                          />
                          <span className="text-[10px] text-stone-500">Accent</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ThemePresetCard({
  theme,
  isActive,
  onClick,
}: {
  theme: SiteTheme;
  isActive: boolean;
  onClick: () => void;
}) {
  const themeData = SITE_THEMES[theme];
  const label = theme.charAt(0).toUpperCase() + theme.slice(1);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-[4/3] rounded-xl border-2 overflow-hidden transition-all duration-200",
        isActive ? "border-stone-900" : "border-transparent hover:border-stone-200"
      )}
      style={{ backgroundColor: themeData.bgPage }}
    >
      {/* Typography preview only - no label */}
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl"
        style={{ fontFamily: themeData.fontHeading, color: themeData.accentColor }}
      >
        Aa
      </span>
    </button>
  );
}

// ============================================================
// HERO BUILDER PANEL
// ============================================================

function HeroBuilder({
  config,
  profile,
  onConfigChange,
  onVideoUpload,
  isBgUploading,
  bgUploadError,
  setBgUploadError,
  startBgUpload,
}: {
  config: SiteConfig;
  profile: StudioProfile;
  onConfigChange: (next: SiteConfig) => void;
  onVideoUpload: (file: File) => void;
  isBgUploading: boolean;
  bgUploadError: string | null;
  setBgUploadError: (error: string | null) => void;
  startBgUpload: (callback: () => Promise<void>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleHeroChange = (key: keyof NonNullable<SiteConfig["hero"]>, value: string) => {
    onConfigChange({
      ...config,
      hero: { ...config.hero, [key]: value },
    });
  };

  const handleBackgroundFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setBgUploadError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBgUploadError("File is too large. Maximum 5MB.");
      return;
    }

    setBgUploadError(null);
    startBgUpload(async () => {
      const result = await uploadHeroImage(file);
      if ("error" in result) {
        setBgUploadError(result.error || "Upload failed. Please try again.");
      } else if (result.url) {
        handleHeroChange("backgroundUrl", result.url);
      } else {
        setBgUploadError("Upload failed. Please try again.");
      }
    });
  };

  const previewUrl = config.hero?.videoUrl || config.hero?.backgroundUrl || profile.avatar_url;

  return (
    <section className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-medium text-stone-900">Cover</h3>
          <p className="text-xs text-stone-500">Your first impression</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-stone-400 transition-transform duration-200", isExpanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 p-5 space-y-5">
              {/* Cover Image Uploader (3:1 aspect) */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-stone-500">Cover Image</Label>
                <div className="relative aspect-[3/1] overflow-hidden rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 group">
                  {config.hero?.coverImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={config.hero.coverImage}
                        alt="Cover preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50">
                            <Upload className="h-3.5 w-3.5" />
                            Change
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const validTypes = ["image/jpeg", "image/png", "image/webp"];
                              if (!validTypes.includes(file.type)) {
                                setBgUploadError("Please upload a JPG, PNG, or WebP image.");
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setBgUploadError("File is too large. Maximum 5MB.");
                                return;
                              }
                              setBgUploadError(null);
                              startBgUpload(async () => {
                                const result = await uploadHeroImage(file);
                                if ("error" in result) {
                                  setBgUploadError(result.error || "Upload failed.");
                                } else if (result.url) {
                                  handleHeroChange("coverImage", result.url);
                                }
                              });
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors">
                      <Upload className="h-5 w-5 text-stone-400 mb-1" strokeWidth={1.5} />
                      <span className="text-xs text-stone-400">1500 × 500px</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const validTypes = ["image/jpeg", "image/png", "image/webp"];
                          if (!validTypes.includes(file.type)) {
                            setBgUploadError("Please upload a JPG, PNG, or WebP image.");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setBgUploadError("File is too large. Maximum 5MB.");
                            return;
                          }
                          setBgUploadError(null);
                          startBgUpload(async () => {
                            const result = await uploadHeroImage(file);
                            if ("error" in result) {
                              setBgUploadError(result.error || "Upload failed.");
                            } else if (result.url) {
                              handleHeroChange("coverImage", result.url);
                            }
                          });
                        }}
                      />
                    </label>
                  )}
                  {isBgUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Uploading...</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-stone-400">Recommended 1500×500px</p>
              </div>

              {/* Profile Photo - Circular Preview */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-stone-500">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-stone-200 bg-stone-50 group">
                    {profile.avatar_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer">
                            <Upload className="h-4 w-4 text-white" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleBackgroundFileChange(e);
                              }}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors">
                        <Upload className="h-5 w-5 text-stone-300" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleBackgroundFileChange}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">Square image, shown as circle</p>
                </div>
              </div>
              {bgUploadError && <p className="text-xs text-red-500">{bgUploadError}</p>}

              {/* Headline */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-stone-500">Headline</Label>
                <Input
                  placeholder="Your custom headline..."
                  value={config.hero?.customHeadline || ""}
                  onChange={(e) => handleHeroChange("customHeadline", e.target.value)}
                  className="rounded-xl border-stone-200 bg-stone-50/50 text-sm focus:ring-2 focus:ring-stone-200"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-stone-500">Intro</Label>
                <Textarea
                  placeholder="A short introduction about yourself..."
                  value={config.bio || ""}
                  onChange={(e) => onConfigChange({ ...config, bio: e.target.value })}
                  className="min-h-[80px] rounded-xl border-stone-200 bg-stone-50/50 text-sm resize-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ============================================================
// CONTENT BLOCKS PANEL
// ============================================================

function ContentBlocksPanel({
  contentBlocks,
  onBlockChange,
  config,
  onConfigChange,
  services,
  products,
}: {
  contentBlocks: { id: string; type: SiteBlockType; isVisible: boolean; order: number }[];
  onBlockChange: (id: string, update: Partial<{ isVisible: boolean; order: number }>) => void;
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  services: ServiceLite[];
  products: ProductLite[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-medium text-stone-900">Sections</h3>
          <p className="text-xs text-stone-500">Toggle visibility</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-stone-400 transition-transform duration-200", isExpanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 p-4 space-y-2">
              {contentBlocks.map((block) => (
                <ContentBlockCard
                  key={block.id}
                  block={block}
                  onToggle={(v) => onBlockChange(block.id, { isVisible: v })}
                  config={config}
                  onConfigChange={onConfigChange}
                  services={services}
                  products={products}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ContentBlockCard({
  block,
  onToggle,
  config,
  onConfigChange,
  services,
  products,
}: {
  block: { id: string; type: SiteBlockType; isVisible: boolean };
  onToggle: (visible: boolean) => void;
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  services: ServiceLite[];
  products: ProductLite[];
}) {
  const [isBlockExpanded, setIsBlockExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 transition-all",
        "border-stone-100 hover:border-stone-200",
        !block.isVisible && "opacity-50"
      )}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsBlockExpanded(!isBlockExpanded)}
      >
        <span className="font-medium text-sm text-stone-900 flex-1">{BLOCK_LABELS[block.type]}</span>

        <ChevronDown className={cn("h-4 w-4 text-stone-400 transition-transform duration-200", isBlockExpanded && "rotate-180")} />

        <Switch
          checked={block.isVisible}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
      </div>

      <AnimatePresence>
        {isBlockExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-stone-100">
              <BlockEditContent
                type={block.type}
                config={config}
                onConfigChange={onConfigChange}
                services={services}
                products={products}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlockEditContent({
  type,
  config,
  onConfigChange,
  services,
  products,
}: {
  type: SiteBlockType;
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  services: ServiceLite[];
  products: ProductLite[];
}) {
  switch (type) {
    case "about":
      return (
        <Textarea
          placeholder="Write about yourself..."
          value={config.bio || ""}
          onChange={(e) => onConfigChange({ ...config, bio: e.target.value })}
          className="min-h-[80px] text-sm resize-none"
        />
      );

    case "services":
      return (
        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="text-xs text-stone-400">No services yet</p>
          ) : (
            services.map((s) => (
              <label key={s.id} className="flex items-center gap-2.5 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.servicesEnabled?.includes(s.id) ?? true}
                  onChange={(e) => {
                    const current = new Set(config.servicesEnabled || services.map(x => x.id));
                    if (e.target.checked) current.add(s.id);
                    else current.delete(s.id);
                    onConfigChange({ ...config, servicesEnabled: Array.from(current) });
                  }}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                {s.name}
              </label>
            ))
          )}
        </div>
      );

    case "products":
      return (
        <div className="space-y-2">
          {products.length === 0 ? (
            <p className="text-xs text-stone-400">No products yet</p>
          ) : (
            products.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.productsEnabled?.includes(p.id) ?? true}
                  onChange={(e) => {
                    const current = new Set(config.productsEnabled || products.map(x => x.id));
                    if (e.target.checked) current.add(p.id);
                    else current.delete(p.id);
                    onConfigChange({ ...config, productsEnabled: Array.from(current) });
                  }}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                {p.title}
              </label>
            ))
          )}
        </div>
      );

    case "reviews":
      return (
        <p className="text-xs text-stone-400 italic">Auto-generated from your data</p>
      );

    case "faq":
      return <FaqEditor config={config} onConfigChange={onConfigChange} />;

    default:
      return null;
  }
}

// FAQ Editor Component - Minimalist Stone Aesthetic
function FaqEditor({
  config,
  onConfigChange,
}: {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");

  const faqs = config.faq ?? [];

  const handleAdd = () => {
    const newFaq: FAQItem = { q: "", a: "" };
    onConfigChange({ ...config, faq: [...faqs, newFaq] });
    setEditingIndex(faqs.length);
    setDraftQ("");
    setDraftA("");
  };

  const handleDelete = (index: number) => {
    const updated = faqs.filter((_, i) => i !== index);
    onConfigChange({ ...config, faq: updated });
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setDraftQ(faqs[index].q);
    setDraftA(faqs[index].a);
  };

  const handleSave = () => {
    if (editingIndex === null) return;
    const updated = [...faqs];
    updated[editingIndex] = { q: draftQ, a: draftA };
    onConfigChange({ ...config, faq: updated });
    setEditingIndex(null);
  };

  const handleCancel = () => {
    if (editingIndex !== null && faqs[editingIndex].q === "" && faqs[editingIndex].a === "") {
      handleDelete(editingIndex);
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {faqs.length === 0 && editingIndex === null ? (
        <p className="text-xs text-stone-400 text-center py-3">
          No FAQs yet. Add questions your students commonly ask.
        </p>
      ) : (
        <div className="space-y-2">
          {faqs.map((item, index) => (
            <div key={index}>
              {editingIndex === index ? (
                /* Edit Mode */
                <div className="rounded-xl border border-stone-300 ring-1 ring-stone-200 bg-white p-3 space-y-2">
                  <input
                    type="text"
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value.slice(0, 240))}
                    placeholder="Question..."
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stone-300"
                  />
                  <textarea
                    value={draftA}
                    onChange={(e) => setDraftA(e.target.value.slice(0, 2000))}
                    placeholder="Answer..."
                    rows={2}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 text-sm px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-stone-300"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!draftQ.trim() || !draftA.trim()}
                      className="text-xs bg-stone-900 text-white px-3 py-1 rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div
                  onClick={() => handleStartEdit(index)}
                  className="rounded-xl border border-stone-100 bg-stone-50/30 p-3 cursor-pointer group hover:border-stone-200 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 line-clamp-1">
                        {item.q || "Untitled question"}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                        {item.a || "No answer yet"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add FAQ Button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={editingIndex !== null}
        className="w-full rounded-xl border border-dashed border-stone-200 py-2 text-xs text-stone-500 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        + Add FAQ
      </button>
    </div>
  );
}

// ============================================================
// PREVIEW CONTAINER - Clean floating card (no device frame)
// ============================================================

function PreviewContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full">
      {/* Full-height scrollable preview */}
      <div className="h-full w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5">
        <div className="h-full w-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PREMIUM MINI-SITE PREVIEW
// ============================================================

// Shared props type for layout components
type LayoutProps = {
  profile: StudioProfile;
  services: ServiceLite[];
  products: ProductLite[];
  fonts: { heading: string; body: string };
  bgColor: string;
  accentColor: string;
  coverImage?: string | null;
  heroMedia: string | null;
  heroVideo?: string | null;
  heroPoster?: string | null;
  headline: string;
  aboutCopy: string;
  contentBlocks: Array<{ id: string; type: SiteBlockType; order: number; isVisible?: boolean }>;
  showHero: boolean;
  faqs: FAQItem[];
};

function StudioPreview({
  profile,
  services,
  products,
  themeId,
  config,
  customStyling,
  useCustomColors,
}: {
  profile: StudioProfile;
  services: ServiceLite[];
  products: ProductLite[];
  themeId: SiteTheme;
  config: SiteConfig;
  customStyling: CustomStyling;
  useCustomColors: boolean;
}) {
  const theme = SITE_THEMES[themeId] ?? SITE_THEMES.academic;
  const pairing = FONT_PAIRINGS[customStyling.fontPairing] ?? FONT_PAIRINGS.clean;

  const fonts = {
    heading: pairing.heading || theme.fontHeading,
    body: pairing.body || theme.fontBody,
  };

  const accentColor = useCustomColors ? customStyling.accentColor || theme.accentColor : theme.accentColor;
  const bgColor = useCustomColors ? customStyling.backgroundColor || theme.bgPage : theme.bgPage;

  const coverImage = config.hero?.coverImage || null;
  const heroVideo = config.hero?.videoUrl || null;
  const heroMedia = config.hero?.backgroundUrl || config.hero?.posterUrl || profile.avatar_url;
  const heroPoster = config.hero?.posterUrl || profile.avatar_url || null;
  const headline = config.hero?.customHeadline || profile.tagline || "Welcome";
  const aboutCopy = config.bio || profile.bio || "Share a concise intro so students know what makes your lessons unique.";

  const servicesEnabled = config.servicesEnabled ? new Set(config.servicesEnabled) : null;
  const productsEnabled = config.productsEnabled ? new Set(config.productsEnabled) : null;

  const visibleServices = services
    .filter((svc) => svc.is_active !== false)
    .filter((svc) => !servicesEnabled || servicesEnabled.has(svc.id))
    .slice(0, 4);

  const visibleProducts = products
    .filter((prod) => prod.is_active !== false && prod.published !== false)
    .filter((prod) => !productsEnabled || productsEnabled.has(prod.id))
    .slice(0, 3);

  const orderedBlocks = [...(config.blocks || [])]
    .filter((block) => block.isVisible !== false)
    .sort((a, b) => a.order - b.order);

  const heroBlock = orderedBlocks.find((block) => block.type === "hero");
  const contentBlocks = orderedBlocks.filter((block) => block.type !== "hero");

  const previewStyle = {
    "--preview-heading": fonts.heading,
    "--preview-body": fonts.body,
    "--preview-accent": accentColor,
    "--preview-bg": bgColor,
  } as CSSProperties;

  const layoutProps: LayoutProps = {
    profile,
    services: visibleServices,
    products: visibleProducts,
    fonts,
    bgColor,
    accentColor,
    coverImage,
    heroMedia: heroMedia || null,
    heroVideo,
    heroPoster,
    headline,
    aboutCopy,
    contentBlocks,
    showHero: Boolean(heroBlock),
    faqs: config.faq ?? [],
  };

  // Single Creator Layout
  return (
    <div style={previewStyle} className="relative min-h-full bg-[var(--preview-bg)] p-4 text-neutral-900 font-[family-name:var(--preview-body)]">
      <MinimalistLayout {...layoutProps} />
    </div>
  );
}

// ============================================================
// LAYOUTS
// ============================================================

function BentoLayout({
  profile,
  services,
  products,
  fonts,
  bgColor,
  accentColor,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  aboutCopy,
  contentBlocks,
  showHero,
}: LayoutProps) {
  const hasAboutBlock = contentBlocks.some((b) => b.type === "about");
  const hasServicesBlock = contentBlocks.some((b) => b.type === "services");
  const hasProductsBlock = contentBlocks.some((b) => b.type === "products");
  const hasReviewsBlock = contentBlocks.some((b) => b.type === "reviews");

  // Compute enabled tabs based on content availability
  const enabledTabs = useMemo(() => {
    const tabs: { id: TabId; label: string }[] = [
      { id: "home", label: "Home" }, // Always enabled
    ];
    if (services.length > 0 && hasServicesBlock) {
      tabs.push({ id: "services", label: "Services" });
    }
    if (products.length > 0 && hasProductsBlock) {
      tabs.push({ id: "products", label: "Shop" });
    }
    if (hasReviewsBlock) {
      tabs.push({ id: "reviews", label: "Reviews" });
    }
    return tabs;
  }, [hasServicesBlock, hasProductsBlock, hasReviewsBlock, services.length, products.length]);

  const [activeTab, setActiveTab] = useState<TabId>("home");

  // Auto-switch if current tab is disabled
  useEffect(() => {
    const isActiveTabEnabled = enabledTabs.some((t) => t.id === activeTab);
    if (!isActiveTabEnabled) {
      setActiveTab("home");
    }
  }, [enabledTabs, activeTab]);

  const hasNoContent = !hasAboutBlock && services.length === 0 && products.length === 0;

  return (
    <div className="relative flex h-full min-h-[600px] flex-col" style={{ backgroundColor: bgColor }}>
      {/* Hero - Bento 2-column grid */}
      <div className="relative z-10 shrink-0">
        {showHero && (
          <BentoHero
            profile={profile}
            heroMedia={heroMedia}
            heroVideo={heroVideo}
            heroPoster={heroPoster}
            headline={headline}
            fonts={fonts}
          />
        )}
      </div>

      {/* TabBar - Segmented Control */}
      {enabledTabs.length > 1 && (
        <div className="relative z-10 shrink-0">
          <TabBar
            tabs={enabledTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="segmented"
          />
        </div>
      )}

      {/* Body - Scrollable, only active tab */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {hasNoContent ? (
          <ComingSoonPlaceholder profile={profile} fonts={fonts} accentColor={accentColor} />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <TabContent tabId="home">
                <HomeTabContent
                  profile={profile}
                  services={services}
                  fonts={fonts}
                  accentColor={accentColor}
                />
              </TabContent>
            )}
            {activeTab === "services" && services.length > 0 && hasServicesBlock && (
              <TabContent tabId="services">
                <ServicesTabContent services={services} fonts={fonts} />
              </TabContent>
            )}
            {activeTab === "products" && products.length > 0 && hasProductsBlock && (
              <TabContent tabId="products">
                <ProductsSection products={products} fonts={fonts} accentColor={accentColor} />
              </TabContent>
            )}
            {activeTab === "reviews" && hasReviewsBlock && (
              <TabContent tabId="reviews">
                <ReviewsTabContent fonts={fonts} />
              </TabContent>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* CTA - Fixed at bottom */}
      <div className="relative z-10 shrink-0 p-4">
        <StickyCTA accentColor={accentColor} />
      </div>
    </div>
  );
}

function MinimalistLayout({
  profile,
  services,
  products,
  fonts,
  bgColor,
  accentColor,
  coverImage,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  aboutCopy,
  contentBlocks,
  showHero,
  faqs,
}: LayoutProps) {
  const hasAboutBlock = contentBlocks.some((b) => b.type === "about");
  const hasServicesBlock = contentBlocks.some((b) => b.type === "services");
  const hasProductsBlock = contentBlocks.some((b) => b.type === "products");
  const hasReviewsBlock = contentBlocks.some((b) => b.type === "reviews");
  const hasFaqBlock = contentBlocks.some((b) => b.type === "faq");

  // Compute enabled tabs based on content availability
  const enabledTabs = useMemo(() => {
    const tabs: { id: TabId; label: string }[] = [
      { id: "home", label: "Home" }, // Always enabled
    ];
    if (services.length > 0 && hasServicesBlock) {
      tabs.push({ id: "services", label: "Services" });
    }
    if (products.length > 0 && hasProductsBlock) {
      tabs.push({ id: "products", label: "Shop" });
    }
    if (hasReviewsBlock) {
      tabs.push({ id: "reviews", label: "Reviews" });
    }
    if (hasFaqBlock) {
      tabs.push({ id: "faq", label: "FAQ" });
    }
    return tabs;
  }, [hasServicesBlock, hasProductsBlock, hasReviewsBlock, hasFaqBlock, services.length, products.length]);

  const [activeTab, setActiveTab] = useState<TabId>("home");

  // Auto-switch if current tab is disabled
  useEffect(() => {
    const isActiveTabEnabled = enabledTabs.some((t) => t.id === activeTab);
    if (!isActiveTabEnabled) {
      setActiveTab("home");
    }
  }, [enabledTabs, activeTab]);

  const hasNoContent = !hasAboutBlock && services.length === 0 && products.length === 0;

  return (
    <div className="relative flex h-full min-h-[600px] flex-col" style={{ backgroundColor: bgColor }}>
      {/* Hero - Creator Profile style */}
      <div className="relative z-10 shrink-0">
        {showHero && (
          <MinimalistHero
            profile={profile}
            coverImage={coverImage}
            heroMedia={heroMedia}
            heroVideo={heroVideo}
            heroPoster={heroPoster}
            headline={headline}
            aboutCopy={aboutCopy}
            fonts={fonts}
            accentColor={accentColor}
            bgColor={bgColor}
          />
        )}
      </div>

      {/* TabBar - Underline style */}
      {enabledTabs.length > 1 && (
        <div className="relative z-10 shrink-0">
          <TabBar
            tabs={enabledTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />
        </div>
      )}

      {/* Body - Scrollable, only active tab */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {hasNoContent ? (
          <ComingSoonPlaceholder profile={profile} fonts={fonts} accentColor={accentColor} />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <TabContent tabId="home">
                <HomeTabContent
                  profile={profile}
                  services={services}
                  fonts={fonts}
                  accentColor={accentColor}
                />
              </TabContent>
            )}
            {activeTab === "services" && services.length > 0 && hasServicesBlock && (
              <TabContent tabId="services">
                <ServicesTabContent services={services} fonts={fonts} />
              </TabContent>
            )}
            {activeTab === "products" && products.length > 0 && hasProductsBlock && (
              <TabContent tabId="products">
                <ProductsSection products={products} fonts={fonts} accentColor={accentColor} />
              </TabContent>
            )}
            {activeTab === "reviews" && hasReviewsBlock && (
              <TabContent tabId="reviews">
                <ReviewsTabContent fonts={fonts} />
              </TabContent>
            )}
            {activeTab === "faq" && hasFaqBlock && (
              <TabContent tabId="faq">
                <FaqPreview fonts={fonts} faqs={faqs} />
              </TabContent>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* CTA - Fixed at bottom */}
      <div className="relative z-10 shrink-0 p-4">
        <StickyCTA accentColor={accentColor} />
      </div>
    </div>
  );
}

function CardLayout({
  profile,
  services,
  products,
  fonts,
  bgColor,
  accentColor,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  aboutCopy,
  contentBlocks,
  showHero,
}: LayoutProps) {
  const hasAboutBlock = contentBlocks.some((b) => b.type === "about");
  const hasServicesBlock = contentBlocks.some((b) => b.type === "services");
  const hasProductsBlock = contentBlocks.some((b) => b.type === "products");
  const hasReviewsBlock = contentBlocks.some((b) => b.type === "reviews");

  // Compute enabled tabs based on content availability
  const enabledTabs = useMemo(() => {
    const tabs: { id: TabId; label: string }[] = [
      { id: "home", label: "Home" }, // Always enabled
    ];
    if (services.length > 0 && hasServicesBlock) {
      tabs.push({ id: "services", label: "Services" });
    }
    if (products.length > 0 && hasProductsBlock) {
      tabs.push({ id: "products", label: "Shop" });
    }
    if (hasReviewsBlock) {
      tabs.push({ id: "reviews", label: "Reviews" });
    }
    return tabs;
  }, [hasServicesBlock, hasProductsBlock, hasReviewsBlock, services.length, products.length]);

  const [activeTab, setActiveTab] = useState<TabId>("home");

  // Auto-switch if current tab is disabled
  useEffect(() => {
    const isActiveTabEnabled = enabledTabs.some((t) => t.id === activeTab);
    if (!isActiveTabEnabled) {
      setActiveTab("home");
    }
  }, [enabledTabs, activeTab]);

  const hasNoContent = !hasAboutBlock && services.length === 0 && products.length === 0;

  return (
    <div className="relative flex h-full min-h-[600px] flex-col" style={{ backgroundColor: bgColor }}>
      {/* Hero - Card style with text below */}
      <div className="relative z-10 shrink-0">
        {showHero && (
          <CardHero
            profile={profile}
            heroMedia={heroMedia}
            heroVideo={heroVideo}
            heroPoster={heroPoster}
            headline={headline}
            fonts={fonts}
          />
        )}
      </div>

      {/* TabBar - Dot indicator style */}
      {enabledTabs.length > 1 && (
        <div className="relative z-10 shrink-0">
          <TabBar
            tabs={enabledTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="dot"
          />
        </div>
      )}

      {/* Body - Scrollable, only active tab */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {hasNoContent ? (
          <ComingSoonPlaceholder profile={profile} fonts={fonts} accentColor={accentColor} />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <TabContent tabId="home">
                <HomeTabContent
                  profile={profile}
                  services={services}
                  fonts={fonts}
                  accentColor={accentColor}
                />
              </TabContent>
            )}
            {activeTab === "services" && services.length > 0 && hasServicesBlock && (
              <TabContent tabId="services">
                <ServicesTabContent services={services} fonts={fonts} />
              </TabContent>
            )}
            {activeTab === "products" && products.length > 0 && hasProductsBlock && (
              <TabContent tabId="products">
                <ProductsSection products={products} fonts={fonts} accentColor={accentColor} />
              </TabContent>
            )}
            {activeTab === "reviews" && hasReviewsBlock && (
              <TabContent tabId="reviews">
                <ReviewsTabContent fonts={fonts} />
              </TabContent>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* CTA - Fixed at bottom */}
      <div className="relative z-10 shrink-0 p-4">
        <StickyCTA accentColor={accentColor} />
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

type SectionId = "about" | "services" | "products";
type TabId = "home" | "services" | "products" | "reviews" | "faq";
type TabBarVariant = "segmented" | "underline" | "dot";

// Segmented Control TabBar (Bento layout)
function SegmentedTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: TabId; label: string }[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="mx-4 mt-4 flex bg-stone-100/50 p-1 rounded-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 py-2 text-xs font-medium rounded-full transition-colors",
            activeTab === tab.id
              ? "bg-white text-stone-900"
              : "text-stone-500 hover:text-stone-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Underline TabBar (Minimalist layout)
function UnderlineTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: TabId; label: string }[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="flex w-full border-b border-stone-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 py-2.5 text-xs font-medium transition-colors",
            activeTab === tab.id
              ? "text-black border-b-2 border-black"
              : "text-stone-400 hover:text-stone-600"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Dot Indicator TabBar (Card layout)
function DotTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: TabId; label: string }[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="flex border-b border-stone-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex-1 py-2.5 text-xs font-medium transition-colors",
            activeTab === tab.id ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-stone-900" />
          )}
        </button>
      ))}
    </div>
  );
}

// Main TabBar component that delegates to variants
function TabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
}: {
  tabs: { id: TabId; label: string }[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  variant?: TabBarVariant;
}) {
  switch (variant) {
    case "segmented":
      return <SegmentedTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />;
    case "dot":
      return <DotTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />;
    default:
      return <UnderlineTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />;
  }
}

function TabContent({ tabId, children }: { tabId: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="p-4"
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Tab Content Components
// ============================================================================

const SOCIAL_PLATFORM_CONFIG = {
  instagram: {
    icon: Instagram,
    label: "Instagram",
    getUrl: (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`,
  },
  tiktok: {
    icon: Music4,
    label: "TikTok",
    getUrl: (h: string) => `https://tiktok.com/@${h.replace(/^@/, "")}`,
  },
  facebook: {
    icon: Facebook,
    label: "Facebook",
    getUrl: (h: string) => `https://facebook.com/${h.replace(/^@/, "")}`,
  },
  x: {
    icon: Twitter,
    label: "X",
    getUrl: (h: string) => `https://x.com/${h.replace(/^@/, "")}`,
  },
  website: {
    icon: Globe,
    label: "Website",
    getUrl: (u: string) => (u.startsWith("http") ? u : `https://${u}`),
  },
} as const;

function BioBlock({ bio, fonts }: { bio: string; fonts: { heading: string; body: string } }) {
  return (
    <section className="space-y-2">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        About
      </h2>
      <p
        className="text-sm leading-relaxed text-stone-600"
        style={{ fontFamily: fonts.body }}
      >
        {bio}
      </p>
    </section>
  );
}

function SocialGrid({
  profile,
  fonts,
}: {
  profile: StudioProfile;
  fonts: { heading: string; body: string };
}) {
  const links: Array<{
    platform: string;
    handle: string | null;
    url: string;
    icon: typeof Instagram;
    label: string;
  }> = [];

  if (profile.instagram_handle) {
    links.push({
      platform: "instagram",
      handle: profile.instagram_handle,
      url: SOCIAL_PLATFORM_CONFIG.instagram.getUrl(profile.instagram_handle),
      icon: Instagram,
      label: "Instagram",
    });
  }
  if (profile.tiktok_handle) {
    links.push({
      platform: "tiktok",
      handle: profile.tiktok_handle,
      url: SOCIAL_PLATFORM_CONFIG.tiktok.getUrl(profile.tiktok_handle),
      icon: Music4,
      label: "TikTok",
    });
  }
  if (profile.website_url) {
    links.push({
      platform: "website",
      handle: null,
      url: SOCIAL_PLATFORM_CONFIG.website.getUrl(profile.website_url),
      icon: Globe,
      label: "Website",
    });
  }
  if (profile.facebook_handle) {
    links.push({
      platform: "facebook",
      handle: profile.facebook_handle,
      url: SOCIAL_PLATFORM_CONFIG.facebook.getUrl(profile.facebook_handle),
      icon: Facebook,
      label: "Facebook",
    });
  }
  if (profile.x_handle) {
    links.push({
      platform: "x",
      handle: profile.x_handle,
      url: SOCIAL_PLATFORM_CONFIG.x.getUrl(profile.x_handle),
      icon: Twitter,
      label: "X",
    });
  }

  if (links.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        Connect
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-[var(--radius)] border border-black/5 bg-white transition-colors hover:bg-stone-50"
          >
            <link.icon className="h-5 w-5 text-stone-600 shrink-0" />
            <span
              className="text-sm font-medium text-stone-900 truncate"
              style={{ fontFamily: fonts.body }}
            >
              {link.handle ? `@${link.handle.replace(/^@/, "")}` : link.label}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function FeaturedServiceCard({
  service,
  fonts,
  accentColor,
}: {
  service: ServiceLite;
  fonts: { heading: string; body: string };
  accentColor: string;
}) {
  const price = service.price ? `$${(service.price / 100).toFixed(0)}` : "Book";
  const duration = service.duration_minutes
    ? `${service.duration_minutes} min`
    : "Flexible";

  return (
    <section className="space-y-2">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        Featured
      </h2>
      <div className="border-b border-black/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-medium text-stone-900 truncate"
              style={{ fontFamily: fonts.heading }}
            >
              {service.name}
            </h3>
            <p
              className="text-sm text-stone-500 mt-0.5"
              style={{ fontFamily: fonts.body }}
            >
              {duration}
            </p>
          </div>
          <span
            className="ml-3 shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {price}
          </span>
        </div>
      </div>
    </section>
  );
}

function HomeTabContent({
  profile,
  services,
  fonts,
  accentColor,
}: {
  profile: StudioProfile;
  services: ServiceLite[];
  fonts: { heading: string; body: string };
  accentColor: string;
}) {
  const firstActiveService = services.find((s) => s.is_active !== false);

  return (
    <div className="space-y-6">
      <BioBlock bio={profile.bio} fonts={fonts} />
      <SocialGrid profile={profile} fonts={fonts} />
      {firstActiveService && (
        <FeaturedServiceCard
          service={firstActiveService}
          fonts={fonts}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}

function ServicesTabContent({
  services,
  fonts,
}: {
  services: ServiceLite[];
  fonts: { heading: string; body: string };
}) {
  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-stone-500" style={{ fontFamily: fonts.body }}>
          No services available
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-0">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-4"
        style={{ fontFamily: fonts.heading }}
      >
        Services
      </h2>
      <div className="divide-y divide-black/5">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between py-4 min-h-[56px]"
          >
            <div className="min-w-0 flex-1 pr-4">
              <p
                className="text-sm font-medium text-stone-900 truncate"
                style={{ fontFamily: fonts.heading }}
              >
                {service.name}
              </p>
              {service.description && (
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                  {service.description}
                </p>
              )}
              {service.duration_minutes && (
                <p className="text-xs text-stone-400 mt-0.5">
                  {service.duration_minutes} min
                </p>
              )}
            </div>
            <span className="text-sm font-semibold text-stone-900 tabular-nums">
              {service.price ? `$${(service.price / 100).toFixed(0)}` : "—"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsTabContent({
  fonts,
}: {
  fonts: { heading: string; body: string };
}) {
  const reviews = [
    {
      id: "1",
      author: "Alex",
      quote: "Clear explanations and engaging sessions.",
      rating: 5,
    },
    {
      id: "2",
      author: "Priya",
      quote: "I felt confident speaking after just a few lessons.",
      rating: 5,
    },
  ];

  return (
    <section className="space-y-4">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        Reviews
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-stone-50 p-4 rounded-[var(--radius)]"
          >
            <p
              className="text-sm text-stone-700 leading-relaxed"
              style={{ fontFamily: fonts.body }}
            >
              "{review.quote}"
            </p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs font-medium text-stone-500">
                — {review.author}
              </p>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < review.rating
                        ? "text-amber-400 text-xs"
                        : "text-stone-200 text-xs"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// End Tab Content Components
// ============================================================================

function SectionIndicator({
  sections,
  activeSection,
  onSectionClick,
}: {
  sections: { id: SectionId; label: string }[];
  activeSection: SectionId;
  onSectionClick: (id: SectionId) => void;
}) {
  if (sections.length <= 1) return null;

  return (
    <div className="sticky top-2 z-20 flex justify-center">
      <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 backdrop-blur-sm">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "rounded-full transition-all duration-200",
              activeSection === section.id
                ? "h-2 w-6 bg-stone-800"
                : "h-2 w-2 bg-stone-300 hover:bg-stone-400"
            )}
            aria-label={`Scroll to ${section.label}`}
          />
        ))}
      </div>
    </div>
  );
}

function ComingSoonPlaceholder({
  profile,
  fonts,
  accentColor,
}: {
  profile: StudioProfile;
  fonts: { heading: string; body: string };
  accentColor: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-stone-100"
        />
      ) : (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-white text-base font-semibold"
          style={{ backgroundColor: accentColor }}
        >
          {profile.full_name?.charAt(0) || "?"}
        </div>
      )}
      <h3
        className="mt-4 text-base font-medium text-stone-800"
        style={{ fontFamily: fonts.heading }}
      >
        Coming Soon
      </h3>
      <p
        className="mt-1 text-sm text-stone-500"
        style={{ fontFamily: fonts.body }}
      >
        Setting up their page
      </p>
    </div>
  );
}

function PreviewBackdrop({ accentColor }: { accentColor: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[28px] opacity-50"
      style={{
        backgroundImage: "radial-gradient(circle at 18px 18px, rgba(0,0,0,0.05) 1px, transparent 0)",
        backgroundSize: "26px 26px",
        boxShadow: `inset 0 0 0 1px ${accentColor}0d`,
      }}
    />
  );
}

// Bento Hero: 2-column grid (Flat Luxury - no gradients, no shadows)
function BentoHero({
  profile,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  fonts,
}: {
  profile: StudioProfile;
  heroMedia: string | null;
  heroVideo?: string | null;
  heroPoster?: string | null;
  headline: string;
  fonts: { heading: string; body: string };
}) {
  return (
    <div className="grid grid-cols-2 gap-0">
      {/* Left: Square Photo */}
      <div className="aspect-square overflow-hidden">
        {heroVideo ? (
          <video
            src={heroVideo}
            poster={heroPoster || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : heroMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroMedia}
            alt={profile.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-stone-200" />
        )}
      </div>
      {/* Right: Name & Tagline */}
      <div className="flex flex-col justify-center bg-stone-50 p-4">
        <h1
          className="text-xl font-semibold text-stone-900 leading-tight"
          style={{ fontFamily: fonts.heading }}
        >
          {profile.full_name}
        </h1>
        {headline && (
          <p
            className="mt-1 text-sm text-stone-600 line-clamp-3"
            style={{ fontFamily: fonts.body }}
          >
            {headline}
          </p>
        )}
      </div>
    </div>
  );
}

// Creator Profile Hero: Banner + Overlapping Avatar + Identity + Socials + About
function MinimalistHero({
  profile,
  coverImage,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  aboutCopy,
  fonts,
  accentColor,
  bgColor,
}: {
  profile: StudioProfile;
  coverImage?: string | null;
  heroMedia: string | null;
  heroVideo?: string | null;
  heroPoster?: string | null;
  headline: string;
  aboutCopy: string;
  fonts: { heading: string; body: string };
  accentColor: string;
  bgColor: string;
}) {
  const avatarUrl = profile.avatar_url || heroMedia;

  return (
    <div className="relative">
      {/* 1. Banner (Top Layer) - h-32, full width with fade */}
      <div className="relative h-32 w-full overflow-hidden">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          // Fallback: Solid accent color
          <div
            className="h-full w-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
        {/* Banner Fade Overlay - seamless transition to page background */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-page)]"
          style={{ "--bg-page": bgColor } as React.CSSProperties}
        />
      </div>

      {/* 2. Avatar (The Overlap) - Centered, overlapping banner */}
      <div className="relative flex justify-center">
        <div className="relative -mt-14">
          {/* Avatar circle */}
          <div
            className="h-28 w-28 overflow-hidden rounded-full border-[4px]"
            style={{ borderColor: bgColor }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-200 text-2xl font-semibold text-stone-400">
                {profile.full_name?.charAt(0) || "T"}
              </div>
            )}
          </div>
          {/* Live Status Indicator (always shown in editor preview) */}
          <LiveStatusIndicator />
        </div>
      </div>

      {/* 3. Identity Block (Below Avatar) - Generous spacing */}
      <div className="mt-6 text-center space-y-3">
        <h1
          className="text-3xl font-semibold text-stone-900"
          style={{ fontFamily: fonts.heading }}
        >
          {profile.full_name}
        </h1>
        {headline && (
          <p
            className="text-sm text-stone-500"
            style={{ fontFamily: fonts.body }}
          >
            {headline}
          </p>
        )}
      </div>

      {/* 4. Social Row */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {/* Instagram */}
        <a
          href="#"
          className="text-stone-600/80 transition-colors hover:text-stone-900"
          aria-label="Instagram"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        {/* LinkedIn */}
        <a
          href="#"
          className="text-stone-600/80 transition-colors hover:text-stone-900"
          aria-label="LinkedIn"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        {/* Website/Globe */}
        <a
          href="#"
          className="text-stone-600/80 transition-colors hover:text-stone-900"
          aria-label="Website"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </a>
      </div>

      {/* 5. Info Chip Row (Metadata Scroll) */}
      <div className="mt-4 flex justify-center overflow-x-auto px-4 py-2 no-scrollbar">
        <div className="flex gap-3">
          <InfoChip icon="flag">English</InfoChip>
          <InfoChip icon="flag">Spanish</InfoChip>
          <InfoChip icon="location">London</InfoChip>
          <InfoChip icon="experience">5 Years</InfoChip>
        </div>
      </div>

      {/* 6. About Block */}
      {aboutCopy && (
        <div className="mx-auto mt-4 max-w-xs px-4 text-center">
          <p
            className="text-sm leading-relaxed text-stone-600"
            style={{ fontFamily: fonts.body }}
          >
            {aboutCopy}
          </p>
        </div>
      )}

      {/* 7. Signature Block */}
      <SignatureBlock firstName={profile.full_name?.split(" ")[0] || "Tutor"} />
    </div>
  );
}

// Info Chip - Pill-shaped badge for metadata
function InfoChip({ icon, children }: { icon: "flag" | "location" | "experience"; children: React.ReactNode }) {
  const iconMap = {
    flag: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    location: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    experience: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-transparent px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-stone-600">
      {iconMap[icon]}
      {children}
    </span>
  );
}

// Live Status Indicator - Pulsing green dot for availability
function LiveStatusIndicator() {
  return (
    <div
      className="absolute bottom-1 right-1 flex items-center justify-center"
      title="Accepting new students"
    >
      {/* Ping animation (outer) */}
      <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
      {/* Solid dot (inner) */}
      <span className="relative h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

// Signature Block - Graceful end to the scrolling experience
function SignatureBlock({ firstName }: { firstName: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-12 text-center">
      {/* Divider */}
      <div className="mx-auto h-px w-12 bg-stone-300" />

      {/* Signature */}
      <p
        className="mt-6 text-2xl text-stone-700"
        style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
      >
        {firstName}
      </p>

      {/* Subtext */}
      <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-stone-400">
        TutorLingua Certified • Member since {currentYear}
      </p>
    </div>
  );
}

// Card Hero: Full-width header with text below (Flat Luxury - no gradients, no shadows)
function CardHero({
  profile,
  heroMedia,
  heroVideo,
  heroPoster,
  headline,
  fonts,
}: {
  profile: StudioProfile;
  heroMedia: string | null;
  heroVideo?: string | null;
  heroPoster?: string | null;
  headline: string;
  fonts: { heading: string; body: string };
}) {
  return (
    <div>
      {/* Full-width header image - NO gradient overlay */}
      <div className="h-48 w-full overflow-hidden">
        {heroVideo ? (
          <video
            src={heroVideo}
            poster={heroPoster || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : heroMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroMedia}
            alt={profile.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-stone-200" />
        )}
      </div>
      {/* Text BELOW image in clean white block */}
      <div className="bg-white p-4 space-y-1">
        <h1
          className="text-xl font-semibold text-stone-900"
          style={{ fontFamily: fonts.heading }}
        >
          {profile.full_name}
        </h1>
        {headline && (
          <p
            className="text-sm text-stone-500"
            style={{ fontFamily: fonts.body }}
          >
            {headline}
          </p>
        )}
      </div>
    </div>
  );
}

function ContentSections({
  blocks,
  aboutCopy,
  services,
  products,
  fonts,
  accentColor,
  faqs,
}: {
  blocks: Array<{ id: string; type: SiteBlockType; order: number }>;
  aboutCopy: string;
  services: ServiceLite[];
  products: ProductLite[];
  fonts: { heading: string; body: string };
  accentColor: string;
  faqs: FAQItem[];
}) {
  if (!blocks.length) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block) => {
        switch (block.type) {
          case "about":
            return <AboutSection key={block.id} copy={aboutCopy} fonts={fonts} />;
          case "services":
            return <ServicesSection key={block.id} displayServices={services} fonts={fonts} accentColor={accentColor} />;
          case "products":
            return <ProductsSection key={block.id} products={products} fonts={fonts} accentColor={accentColor} />;
          case "reviews":
            return <ReviewsPreview key={block.id} fonts={fonts} />;
          case "faq":
            return <FaqPreview key={block.id} fonts={fonts} faqs={faqs} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function AboutSection({ copy, fonts }: { copy: string; fonts: { heading: string; body: string } }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="space-y-2">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        About
      </h2>
      <div className="relative">
        <p
          className={cn(
            "text-sm leading-relaxed text-stone-600",
            !isExpanded && "max-h-24 overflow-hidden"
          )}
          style={{ fontFamily: fonts.body }}
        >
          {copy}
        </p>

        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--bg-page)] pt-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
            >
              Read more
            </button>
          </div>
        )}

        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </section>
  );
}

function ServicesSection({
  displayServices,
  fonts,
  accentColor,
}: {
  displayServices: ServiceLite[];
  fonts: { heading: string; body: string };
  accentColor: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
          style={{ fontFamily: fonts.heading }}
        >
          Services
        </h2>
        {displayServices.length > 0 && (
          <span className="text-[10px] font-medium text-stone-400">{displayServices.length} available</span>
        )}
      </div>
      <div className="space-y-2">
        {displayServices.length > 0 ? (
          displayServices.map((service) => {
            const formattedPrice = service.price ? `$${(service.price / 100).toFixed(0)}` : "Book";
            const durationLabel = service.duration_minutes ? `${service.duration_minutes} min` : "Flexible";
            return (
              <div
                key={service.id}
                className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate text-sm font-medium text-stone-900"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {service.name}
                  </span>
                  <span className="text-xs text-stone-500" style={{ fontFamily: fonts.body }}>
                    {durationLabel}
                  </span>
                </div>
                <span
                  className="ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {formattedPrice}
                </span>
              </div>
            );
          })
        ) : (
          <>
            <ServicePreviewRow name="Conversation Practice" duration="60 min" price="$40" accentColor={accentColor} />
            <ServicePreviewRow name="Grammar Workshop" duration="45 min" price="$35" accentColor={accentColor} />
            <ServicePreviewRow name="Exam Preparation" duration="90 min" price="$50" accentColor={accentColor} />
          </>
        )}
      </div>
    </section>
  );
}

function ProductsSection({
  products,
  fonts,
  accentColor,
}: {
  products: ProductLite[];
  fonts: { heading: string; body: string };
  accentColor: string;
}) {
  const fallbackProducts = [
    { id: "guide", title: "Study Guide PDF", description: "Downloadable resource", price: "$19" },
    { id: "audio", title: "Audio Drills Pack", description: "Practice on the go", price: "$24" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
          style={{ fontFamily: fonts.heading }}
        >
          Shop
        </h2>
        {products.length > 0 && (
          <span className="text-[10px] font-medium text-stone-400">{products.length} items</span>
        )}
      </div>
      <div className="space-y-2">
        {products.length > 0
          ? products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium text-stone-900"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {product.title}
                  </p>
                  <p className="text-xs text-stone-500" style={{ fontFamily: fonts.body }}>
                    Instant access
                  </p>
                </div>
                <span
                  className="ml-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  View
                </span>
              </div>
            ))
          : fallbackProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium text-stone-900"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {product.title}
                  </p>
                  <p className="text-xs text-stone-500" style={{ fontFamily: fonts.body }}>
                    {product.description}
                  </p>
                </div>
                <span
                  className="ml-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {product.price}
                </span>
              </div>
            ))}
      </div>
    </section>
  );
}

function ReviewsPreview({ fonts }: { fonts: { heading: string; body: string } }) {
  const quotes = [
    { author: "Alex", quote: "Clear explanations and engaging sessions." },
    { author: "Priya", quote: "I felt confident speaking after just a few lessons." },
  ];

  return (
    <section className="space-y-3">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        Reviews
      </h2>
      <div className="space-y-3">
        {quotes.map((review) => (
          <div key={review.author} className="border-l-2 border-stone-200 pl-3">
            <p className="text-sm italic text-stone-600" style={{ fontFamily: fonts.body }}>
              "{review.quote}"
            </p>
            <p className="mt-1 text-xs font-medium text-stone-500">— {review.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqPreview({ fonts, faqs }: { fonts: { heading: string; body: string }; faqs: FAQItem[] }) {
  const placeholderFaqs: FAQItem[] = [
    { q: "How are sessions structured?", a: "We start with goals, then practice with feedback and notes." },
    { q: "Do you give homework?", a: "Yes—short exercises to keep you progressing between calls." },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : placeholderFaqs;
  const isPlaceholder = faqs.length === 0;

  return (
    <section className="space-y-3">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400"
        style={{ fontFamily: fonts.heading }}
      >
        FAQs
      </h2>
      <div className={cn("space-y-3", isPlaceholder && "opacity-50")}>
        {displayFaqs.map((item, index) => (
          <div key={item.q || index} className="space-y-1">
            <p className="text-sm font-medium text-stone-900" style={{ fontFamily: fonts.heading }}>
              {item.q}
            </p>
            <p className="text-xs leading-relaxed text-stone-600" style={{ fontFamily: fonts.body }}>
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StickyCTA({ accentColor }: { accentColor: string }) {
  return (
    <button
      className="h-12 w-full rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
      style={{ backgroundColor: accentColor }}
    >
      Book a Session
    </button>
  );
}

function ServicePreviewRow({
  name,
  duration,
  price,
  accentColor,
}: {
  name: string;
  duration: string;
  price: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <div>
        <span className="block text-sm font-medium text-stone-900">{name}</span>
        <span className="text-xs text-stone-500">{duration}</span>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: accentColor }}
      >
        {price}
      </span>
    </div>
  );
}
