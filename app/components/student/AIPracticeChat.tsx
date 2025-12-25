"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

function getUsageColor(percent: number): string {
  if (percent < 70) return "text-emerald-600";
  if (percent < 90) return "text-amber-600";
  return "text-red-600";
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    <div className="flex h-full flex-col">
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
      <div className="flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="font-semibold text-foreground">{assignmentTitle}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{language}</span>
              {level && (
                <>
                  <span>·</span>
                  <span>{levelLabels[level] || level}</span>
                </>
              )}
              {topic && (
                <>
                  <span>·</span>
                  <span>{topic}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode badge */}
          <Badge variant="secondary" className="text-xs">
            {mode === "text" ? (
              <><MessageSquare className="mr-1 h-3 w-3" />Text</>
            ) : (
              <><Mic className="mr-1 h-3 w-3" />Audio</>
            )}
          </Badge>

          {/* Usage progress bar - shows current mode only */}
          {usage && (
            <div className="flex items-center gap-2">
              <Progress
                value={100 - (mode === "text" ? usage.percentTextUsed : usage.percentAudioUsed)}
                className="h-2 w-16"
                indicatorClassName={cn(
                  (mode === "text" ? usage.percentTextUsed : usage.percentAudioUsed) < 70 ? "bg-emerald-500" :
                  (mode === "text" ? usage.percentTextUsed : usage.percentAudioUsed) < 90 ? "bg-amber-500" :
                  "bg-red-500"
                )}
              />
            </div>
          )}

          {!isEnded && messageCount >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndSession}
              disabled={isLoading}
            >
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <Bot className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-2 font-medium text-foreground">
                Ready to chat in {language}!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {topic
                  ? `Today's topic: ${topic}`
                  : "Say hello and let's get started."}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] space-y-2",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Corrections */}
                {message.corrections && message.corrections.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="mb-2 flex items-center gap-1.5 font-medium text-amber-800">
                      <Sparkles className="h-4 w-4" />
                      Corrections
                    </p>
                    <div className="space-y-2">
                      {message.corrections.map((c, i) => (
                        <div key={i} className="text-amber-900">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="line-through opacity-70">{c.original}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-medium">{c.corrected}</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-700">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vocabulary */}
                {message.vocabulary_used && message.vocabulary_used.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {message.vocabulary_used.map((word, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs bg-emerald-50 text-emerald-700"
                      >
                        {word}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs font-medium text-primary-foreground">You</span>
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[85%] space-y-2">
                <div className="rounded-2xl bg-muted/50 px-4 py-2.5">
                  {streamingContent ? (
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}<span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse" /></p>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>

                {/* Streaming corrections - show as they arrive */}
                {streamingCorrections.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="mb-2 flex items-center gap-1.5 font-medium text-amber-800">
                      <Sparkles className="h-4 w-4" />
                      Corrections
                    </p>
                    <div className="space-y-2">
                      {streamingCorrections.map((c, i) => (
                        <div key={i} className="text-amber-900">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="line-through opacity-70">{c.original}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-medium">{c.corrected}</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-700">{c.explanation}</p>
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
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {failedMessage?.retryable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Retry
                  </Button>
                )}
              </div>
              {upgradeUrl && (
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href={upgradeUrl}>Get more practice credits</Link>
                </Button>
              )}
            </div>
          )}

          {endSessionError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{endSessionError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndSession}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Session ended feedback */}
      {isEnded && feedback && (
        <div className="border-t border-border bg-muted/50 p-4">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Session Complete!
            </h3>

            {feedback.overall_rating && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Overall Rating</p>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={cn(
                        "h-6 w-6 rounded-full",
                        star <= feedback.overall_rating
                          ? "bg-yellow-400"
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Suggestions for improvement
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {feedback.suggestions.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.vocabulary_used && feedback.vocabulary_used.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Vocabulary practiced
                </p>
                <div className="flex flex-wrap gap-1">
                  {feedback.vocabulary_used.map((word: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {onBack && (
              <Button onClick={onBack} className="mt-4 w-full">
                Back to Progress
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pronunciation Feedback */}
      {latestPronunciation && !isEnded && (
        <div className="border-t border-border bg-muted/50 p-4">
          <div className="mx-auto max-w-2xl">
            <PronunciationFeedback
              assessment={latestPronunciation}
              className="shadow-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => setLatestPronunciation(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isEnded && (
        <div className="border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-2xl space-y-2">
            {mode === "audio" ? (
              /* Audio-only mode */
              <div className="flex flex-col items-center gap-3">
                <AudioInputButton
                  sessionId={sessionId}
                  language={language}
                  onTranscript={handleAudioTranscript}
                  onAssessment={handlePronunciationAssessment}
                  disabled={isLoading}
                  className="h-16 w-16"
                />
                <p className="text-sm text-muted-foreground">
                  Tap to speak in {language}
                </p>
                {/* Show transcript for review before sending */}
                {input && (
                  <div className="w-full rounded-xl border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground">{input}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => handleSend()}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="mr-1 h-3 w-3" />
                        )}
                        Send
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInput("")}
                        disabled={isLoading}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text-only mode */
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type in ${language}...`}
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
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
