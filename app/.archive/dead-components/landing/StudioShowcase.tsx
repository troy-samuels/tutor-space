"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Easing } from "framer-motion";
import { Captions, History, Mic, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TranscriptLine = {
  id: string;
  speaker: "Tutor" | "Student";
  text: string;
  highlight?: {
    word: string;
    tooltip: string;
  };
};

type CharacterStreamProps = {
  text: string;
  highlight?: TranscriptLine["highlight"];
  showTooltip: boolean;
  reduceMotion: boolean;
};

type Feature = {
  icon: typeof Captions;
  label: string;
  tone: "primary" | "muted";
};

const transcriptScript: TranscriptLine[] = [
  {
    id: "1",
    speaker: "Tutor",
    text: "Let's warm up with vowels — give me your best take on bouquet.",
    highlight: { word: "bouquet", tooltip: "Pronunciation score: 92%" },
  },
  {
    id: "2",
    speaker: "Student",
    text: "Bouquet... I'm focusing on the second syllable like you said.",
  },
  {
    id: "3",
    speaker: "Tutor",
    text: "Nice! Notice how the /kei/ glides. Synonyms could be arrangement or bunch depending on context.",
    highlight: { word: "Synonyms", tooltip: "Alternative: Synonyms" },
  },
  {
    id: "4",
    speaker: "Student",
    text: "Got it. Could you repeat the glide one more time?",
  },
];

const features: Feature[] = [
  { icon: Captions, label: "Captions in sync", tone: "primary" },
  { icon: Zap, label: "AI listening", tone: "primary" },
  { icon: Sparkles, label: "Feedback hints", tone: "muted" },
  { icon: History, label: "Session saved", tone: "muted" },
];

const easeOut: Easing = [0.16, 1, 0.3, 1];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function StudioShowcase() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [autoTooltipIndex, setAutoTooltipIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(transcriptScript.length);
      return;
    }

    const interval = setInterval(() => {
      setVisibleCount((prev) => Math.min(prev + 1, transcriptScript.length));
    }, 1500);

    return () => clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    const highlightIndex = transcriptScript
      .slice(0, visibleCount)
      .map((line, index) => (line.highlight ? index : -1))
      .filter((index) => index >= 0)
      .pop();

    if (highlightIndex === undefined || highlightIndex === null) return;

    const openTimer = setTimeout(() => setAutoTooltipIndex(highlightIndex), 420);
    const closeTimer = setTimeout(() => setAutoTooltipIndex(null), 2400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [visibleCount]);

  const visibleLines = useMemo(
    () => transcriptScript.slice(0, visibleCount),
    [visibleCount],
  );

  return (
    <section className="relative isolate overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-background via-background-alt to-white p-6 shadow-xl sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(211,97,53,0.14), transparent 38%), radial-gradient(circle at 82% 8%, rgba(62,86,65,0.16), transparent 32%), radial-gradient(circle at 80% 80%, rgba(162,73,54,0.14), transparent 36%)",
        }}
      />

      <div className="relative grid gap-6 lg:grid-cols-[1.05fr,1fr]">
        <Card className="border border-border/70 bg-white/70 shadow-lg backdrop-blur">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-[#1d1a16] via-[#221c16] to-[#163226] shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_12%,transparent_45%,rgba(255,255,255,0.08)_65%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(211,97,53,0.28),transparent_40%),radial-gradient(circle_at_82%_72%,rgba(62,86,65,0.35),transparent_45%)]" />
              <div className="flex h-full min-h-[280px] flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
                    <Sparkles className="h-4 w-4 text-amber-200" />
                    Studio classroom
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                    <span className="relative inline-flex h-8 w-8 items-center justify-center">
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emerald-400/35"
                        animate={{ scale: [1, 1.15, 1.3], opacity: [0.4, 0.25, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emerald-400/25"
                        animate={{ scale: [1, 1.25, 1.45], opacity: [0.28, 0.18, 0] }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-inner">
                        <Mic className="h-4 w-4" />
                      </span>
                    </span>
                    Mic active
                  </div>
                </div>

                <div className="space-y-2 text-white">
                  <div className="text-lg font-semibold">Tutor view</div>
                  <p className="text-sm text-white/80">
                    Warm-toned video feed with live analysis layered on top to keep the
                    session feeling human, not robotic.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {features.map(({ icon: Icon, label, tone }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm",
                    tone === "primary"
                      ? "border-amber-200/70 bg-amber-50 text-amber-900"
                      : "border-border/70 bg-secondary/70 text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      tone === "primary" ? "text-amber-700" : "text-primary",
                    )}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white/85 shadow-lg">
          <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Captions className="h-5 w-5 text-primary" />
                  Smart transcript
                </div>
                <p className="text-xs text-muted-foreground">
                  Deepgram-style stream with inline pronunciation feedback.
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 shadow-sm">Live</Badge>
            </div>

            <ScrollArea className="h-[420px] rounded-2xl border border-border/70 bg-secondary/60 p-4 sm:p-5">
              <AnimatePresence initial={false}>
                <div className="space-y-3">
                  {visibleLines.map((line, index) => {
                    const isTutor = line.speaker === "Tutor";
                    return (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.45, ease: easeOut }}
                        className={cn(
                          "rounded-2xl border p-4 shadow-sm",
                          isTutor
                            ? "border-primary/20 bg-white/90"
                            : "border-border/80 bg-background-alt/90",
                        )}
                      >
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full px-2 py-1",
                              isTutor
                                ? "bg-primary/10 text-primary"
                                : "bg-emerald-50 text-emerald-700",
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {line.speaker}
                          </span>
                          <span className="text-muted-foreground/70">listening + scoring</span>
                        </div>

                        <div className="mt-2 text-sm leading-relaxed text-foreground/90">
                          <CharacterStream
                            text={line.text}
                            highlight={line.highlight}
                            showTooltip={autoTooltipIndex === index}
                            reduceMotion={reduceMotion}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CharacterStream({
  text,
  highlight,
  showTooltip,
  reduceMotion,
}: CharacterStreamProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (!highlight) return;

    if (!showTooltip) {
      setTooltipOpen(false);
      return;
    }

    const openTimer = setTimeout(() => setTooltipOpen(true), 120);
    const closeTimer = setTimeout(() => setTooltipOpen(false), 1900);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [highlight, showTooltip]);

  const segments = useMemo(() => {
    if (!highlight) return [text];
    const pattern = new RegExp(`(${escapeRegExp(highlight.word)})(?!\\w)`, "gi");
    return text.split(pattern).filter(Boolean);
  }, [text, highlight]);

  let globalIndex = 0;

  const renderChar = (char: string, keyPrefix: string) => {
    const delay = reduceMotion ? 0 : globalIndex * 0.015;
    const node = (
      <motion.span
        key={`${keyPrefix}-${globalIndex}`}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.2, ease: easeOut }}
        className="inline-block"
      >
        {char}
      </motion.span>
    );
    globalIndex += 1;
    return node;
  };

  return (
    <span className="inline">
      {segments.map((segment, segmentIndex) => {
        const isHighlight =
          highlight && segment.toLowerCase() === highlight.word.toLowerCase();
        const characters = Array.from(segment);

        if (isHighlight && highlight) {
          return (
            <Tooltip
              key={`highlight-${segmentIndex}`}
              open={tooltipOpen}
              onOpenChange={setTooltipOpen}
              delayDuration={120}
            >
              <TooltipTrigger asChild>
                <span className="relative mx-0.5 inline-flex cursor-help items-center">
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500" />
                  {characters.map((char) => renderChar(char, `highlight-${segmentIndex}`))}
                </span>
              </TooltipTrigger>
              <TooltipContent className="border border-border bg-card text-foreground shadow-lg">
                <p className="text-xs font-semibold">{highlight.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return characters.map((char) => renderChar(char, `segment-${segmentIndex}`));
      })}
    </span>
  );
}
