"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Bot,
  Send,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  Mic,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioInputButton, type PronunciationAssessment } from "./AudioInputButton";
import { PronunciationFeedback } from "./PronunciationFeedback";
import { LimitReachedOverlay } from "./LimitReachedOverlay";
import type { PracticeUsage } from "@/lib/actions/progress";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
} from "@/lib/practice/constants";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  vocabulary_used?: string[];
  pronunciation?: PronunciationAssessment;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  language: string;
  level: string | null;
  topic: string | null;
  message_count: number;
  started_at: string;
  ended_at: string | null;
}

export type PracticeMode = "text" | "audio";

interface AIPracticeChatProps {
  sessionId: string;
  assignmentTitle: string;
  language: string;
  level?: string | null;
  topic?: string | null;
  systemPrompt?: string;
  initialMessages?: ChatMessage[];
  maxMessages?: number;
  initialUsage?: PracticeUsage | null;
  mode?: PracticeMode;
  onBack?: () => void;
  onSessionEnd?: (feedback: any) => void;
  onSwitchMode?: (newMode: PracticeMode) => void;
}

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All levels",
};

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function AIPracticeChat({
  sessionId,
  assignmentTitle,
  language,
  level,
  topic,
  initialMessages = [],
  maxMessages = 20,
  initialUsage,
  mode = "text",
  onBack,
  onSessionEnd,
  onSwitchMode,
}: AIPracticeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [latestPronunciation, setLatestPronunciation] = useState<PronunciationAssessment | null>(null);
  const [usage, setUsage] = useState<PracticeUsage | null>(initialUsage || null);
  const [failedMessage, setFailedMessage] = useState<{
    content: string;
    retryable: boolean;
  } | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [endSessionError, setEndSessionError] = useState<string | null>(null);
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);

  // Streaming state
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCorrections, setStreamingCorrections] = useState<Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldEndSessionRef = useRef(false);
  const greetingPollAttemptsRef = useRef(0);
  const greetingPollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!sessionId || messages.length > 0) {
      return;
    }

    const maxAttempts = 12;
    const pollIntervalMs = 1500;
    let cancelled = false;

    greetingPollAttemptsRef.current = 0;

    const pollForGreeting = async () => {
      if (cancelled || greetingPollAttemptsRef.current >= maxAttempts) {
        return;
      }

      greetingPollAttemptsRef.current += 1;

      try {
        const response = await fetch(`/api/practice/messages?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }
      } catch {
        // Ignore polling errors and retry within limits.
      }

      if (!cancelled) {
        greetingPollTimeoutRef.current = setTimeout(pollForGreeting, pollIntervalMs);
      }
    };

    void pollForGreeting();

    return () => {
      cancelled = true;
      if (greetingPollTimeoutRef.current) {
        clearTimeout(greetingPollTimeoutRef.current);
      }
    };
  }, [sessionId, messages.length]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Handle audio transcript - prepend to input
  const handleAudioTranscript = (transcript: string) => {
    if (transcript) {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
  };

  // Handle pronunciation assessment
  const handlePronunciationAssessment = (assessment: PronunciationAssessment) => {
    setLatestPronunciation(assessment);
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (messageContent?: string, retryCount = 0) => {
    const content = messageContent || input.trim();
    if (!content || isLoading || isEnded) return;

    // If this is a new message (not a retry), add it to the UI
    if (!messageContent) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    setError(null);
    setFailedMessage(null);
    setUpgradeUrl(null);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent("");
    setStreamingCorrections([]);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      // Use streaming endpoint
      const response = await fetch("/api/practice/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        // Auto-retry for 409 conflicts (session busy) with exponential backoff
        if (response.status === 409 && retryCount < 3) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, retryCount)));
          return handleSend(content, retryCount + 1);
        }

        // Handle specific error codes
        if (data.code === "FREE_TIER_EXHAUSTED") {
          setUpgradeUrl(data.upgradeUrl || null);
          setShowLimitOverlay(true);
          setFailedMessage({ content, retryable: false });
          setIsStreaming(false);
          return;
        }

        if (data.code === "TUTOR_NOT_STUDIO") {
          setError("Your tutor needs to upgrade to enable AI Practice");
          setFailedMessage({ content, retryable: false });
          setIsStreaming(false);
          return;
        }

        // Track retryable errors
        setFailedMessage({
          content,
          retryable: data.retryable ?? false,
        });

        throw new Error(data.error || "Failed to send message");
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalContent = "";
      let finalCorrections: Array<{ original: string; corrected: string; explanation: string }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content") {
                // Update streaming content
                setStreamingContent(parsed.content || "");
                finalContent = parsed.content || "";

                // Update corrections if available
                if (parsed.corrections && parsed.corrections.length > 0) {
                  setStreamingCorrections(parsed.corrections);
                  finalCorrections = parsed.corrections;
                }

                scrollToBottom();
              } else if (parsed.type === "done") {
                // Final message with complete data
                finalContent = parsed.content || finalContent;
                finalCorrections = parsed.corrections || finalCorrections;
              } else if (parsed.type === "error") {
                throw new Error(parsed.error || "Stream error");
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Clear streaming state and add final message
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingCorrections([]);
      setFailedMessage(null);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: finalContent,
        corrections: finalCorrections.length > 0 ? finalCorrections : undefined,
        created_at: new Date().toISOString(),
      };

      // Update messages and check limit
      shouldEndSessionRef.current = false;
      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        const messageCount = updated.filter((m) => m.role !== "system").length;
        if (messageCount >= maxMessages) {
          shouldEndSessionRef.current = true;
        }
        return updated;
      });

      // End session if limit reached
      if (shouldEndSessionRef.current) {
        handleEndSession();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!failedMessage?.content) return;
    await handleSend(failedMessage.content);
  };

  const handleEndSession = async () => {
    setIsLoading(true);
    setEndSessionError(null);
    try {
      const response = await fetch("/api/practice/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setIsEnded(true);
        onSessionEnd?.(data.feedback);
      } else {
        const data = await response.json().catch(() => ({}));
        setEndSessionError(data.error || "Couldn't save session feedback");
      }
    } catch (err) {
      console.error("Failed to end session:", err);
      setEndSessionError("Couldn't save session feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const messageCount = messages.filter((m) => m.role !== "system").length;
  const remainingMessages = maxMessages - messageCount;

  // Calculate other mode availability
  const otherMode = mode === "text" ? "audio" : "text";
  const otherModePercentUsed = usage
    ? (otherMode === "text" ? usage.percentTextUsed : usage.percentAudioUsed)
    : 0;
  const otherModeAvailable = otherModePercentUsed < 100;

  const handleSwitchMode = () => {
    setShowLimitOverlay(false);
    onSwitchMode?.(otherMode);
  };

  return (
    <div data-testid="practice-chat-interface" className="flex h-full flex-col bg-background-alt/30">
      {/* Limit Reached Overlay */}
      {showLimitOverlay && (
        <LimitReachedOverlay
          mode={mode}
          otherModeAvailable={otherModeAvailable && !!onSwitchMode}
          otherModePercentUsed={otherModePercentUsed}
          upgradeUrl={upgradeUrl}
          onSwitchMode={onSwitchMode ? handleSwitchMode : undefined}
          onDismiss={onBack}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md transition-all">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="font-semibold text-foreground tracking-tight">{assignmentTitle}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {language}
              </span>
              {level && (
                <>
                  <span className="text-border">•</span>
                  <span>{levelLabels[level] || level}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode badge */}
          <Badge variant="secondary" className="h-7 px-3 text-xs font-medium bg-muted text-muted-foreground border border-border/50">
            {mode === "text" ? (
              <><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Writing Practice</>
            ) : (
              <><Mic className="mr-1.5 h-3.5 w-3.5" />Speaking Practice</>
            )}
          </Badge>

          {/* Subtle hint when approaching limit */}
          {usage && (mode === "text" ? usage.percentTextUsed : usage.percentAudioUsed) >= 85 && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Almost done for today
            </span>
          )}

          {!isEnded && messageCount >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndSession}
              disabled={isLoading}
              data-testid="practice-end-session"
              className="h-8 text-xs"
            >
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Ready to chat in {language}?
              </h3>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                {topic
                  ? `Today's topic is "${topic}".`
                  : "Say hello to start the conversation!"}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "group flex gap-3 transition-all duration-300 animate-in slide-in-from-bottom-2",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50 shadow-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "relative max-w-[85%] sm:max-w-[75%] space-y-2",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "px-5 py-3 shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-[20px] rounded-tr-sm"
                      : "bg-card text-card-foreground border border-border/50 rounded-[20px] rounded-tl-sm"
                  )}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Corrections */}
                {message.corrections && message.corrections.length > 0 && (
                  <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-3.5 text-sm animate-in fade-in slide-in-from-top-1">
                    <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800/70">
                      <Sparkles className="h-3 w-3" />
                      Corrections
                    </p>
                    <div className="space-y-3">
                      {message.corrections.map((c, i) => (
                        <div key={i} className="text-amber-900/90">
                          <div className="flex items-baseline gap-2 text-sm">
                            <span className="line-through decoration-red-400/50 decoration-2 text-muted-foreground">{c.original}</span>
                            <span className="text-muted-foreground/40">→</span>
                            <span className="font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{c.corrected}</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-700/80 leading-relaxed pl-2 border-l-2 border-amber-200">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vocabulary */}
                {message.vocabulary_used && message.vocabulary_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {message.vocabulary_used.map((word, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                      >
                        {word}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex gap-3 animate-in fade-in">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                <div className="rounded-[20px] rounded-tl-sm bg-card border border-border/50 px-5 py-3 shadow-sm">
                  {streamingContent ? (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {streamingContent}
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/40 animate-pulse rounded-full" />
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>

                {/* Streaming corrections - show as they arrive */}
                {streamingCorrections.length > 0 && (
                   <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-3.5 text-sm animate-in fade-in slide-in-from-bottom-2">
                    <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800/70">
                      <Sparkles className="h-3 w-3" />
                      Corrections
                    </p>
                    <div className="space-y-3">
                      {streamingCorrections.map((c, i) => (
                        <div key={i} className="text-amber-900/90">
                           <div className="flex items-baseline gap-2 text-sm">
                            <span className="line-through decoration-red-400/50 decoration-2 text-muted-foreground">{c.original}</span>
                            <span className="text-muted-foreground/40">→</span>
                            <span className="font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{c.corrected}</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-700/80 leading-relaxed pl-2 border-l-2 border-amber-200">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading indicator (only shows briefly before streaming starts) */}
          {isLoading && !isStreaming && (
            <div className="flex gap-3 animate-in fade-in">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="rounded-[20px] rounded-tl-sm bg-card border border-border/50 px-5 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-sm rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center animate-in zoom-in-95">
              <div className="flex flex-col items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
              {failedMessage?.retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="mt-3 border-destructive/20 hover:bg-destructive/5"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Try Again
                </Button>
              )}
              {upgradeUrl && (
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href={upgradeUrl}>Get more practice credits</Link>
                </Button>
              )}
            </div>
          )}

          {endSessionError && (
             <div className="mx-auto max-w-sm rounded-xl border border-amber-200/50 bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-800 mb-3">{endSessionError}</p>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndSession}
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Retry Ending Session
                </Button>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Session ended feedback */}
      {isEnded && feedback && (
        <div className="border-t border-border/50 bg-background/50 p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 shadow-lg ring-1 ring-black/5">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                 <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Session Complete!</h3>
              <p className="text-sm text-muted-foreground">Here&apos;s how you did</p>
            </div>

            {feedback.overall_rating && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 bg-muted/50 px-4 py-2 rounded-full border border-border/50">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={cn(
                        "h-5 w-5 rounded-full transition-all",
                        star <= feedback.overall_rating
                          ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                          : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Key Takeaways
                </p>
                <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                  {feedback.suggestions.map((s: string, i: number) => (
                    <div key={i} className="flex gap-3 text-sm text-foreground/90">
                      <span className="text-primary font-bold">•</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {feedback.vocabulary_used && feedback.vocabulary_used.length > 0 && (
              <div className="text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vocabulary Mastered
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {feedback.vocabulary_used.map((word: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-background text-foreground/80 font-normal">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {onBack && (
              <Button onClick={onBack} size="lg" className="mt-8 w-full rounded-xl shadow-md shadow-primary/20">
                Continue Learning
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pronunciation Feedback */}
      {latestPronunciation && !isEnded && (
        <div className="border-t border-border bg-muted/30 p-4 animate-in slide-in-from-bottom-10">
          <div className="mx-auto max-w-2xl">
            <PronunciationFeedback
              assessment={latestPronunciation}
              className="shadow-sm border-border/50"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs text-muted-foreground hover:bg-background/50"
              onClick={() => setLatestPronunciation(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isEnded && (
        <div className="border-t border-border/50 bg-background/80 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-3xl space-y-2">
            {mode === "audio" ? (
              /* Audio-only mode */
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-primary/5 animate-pulse" />
                  <AudioInputButton
                    sessionId={sessionId}
                    language={language}
                    onTranscript={handleAudioTranscript}
                    onAssessment={handlePronunciationAssessment}
                    disabled={isLoading}
                    className="h-20 w-20 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tap to speak in {language}
                </p>
                {/* Show transcript for review before sending */}
                {input && (
                  <div className="w-full rounded-2xl border border-border/50 bg-card p-4 shadow-sm animate-in slide-in-from-bottom-2">
                    <p className="text-sm text-foreground mb-3">{input}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSend()}
                        disabled={isLoading}
                        className="flex-1 rounded-xl"
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Message
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setInput("")}
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text-only mode */
              <div className="flex items-end gap-2 bg-card rounded-2xl border border-border/50 p-1.5 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type your message in ${language}...`}
                  rows={1}
                  disabled={isLoading}
                  data-testid="practice-message-input"
                  className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 max-h-[150px]"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  data-testid="practice-send-button"
                  className="h-11 w-11 shrink-0 rounded-xl mb-[1px] shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
