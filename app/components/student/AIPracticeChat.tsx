"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioInputButton, type PronunciationAssessment } from "./AudioInputButton";
import { PronunciationFeedback } from "./PronunciationFeedback";
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
  onBack?: () => void;
  onSessionEnd?: (feedback: any) => void;
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
  onBack,
  onSessionEnd,
}: AIPracticeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [latestPronunciation, setLatestPronunciation] = useState<PronunciationAssessment | null>(null);
  const [usage, setUsage] = useState<PracticeUsage | null>(initialUsage || null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading || isEnded) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/practice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await response.json();

      // Update usage stats if returned from API
      if (data.usage) {
        setUsage((prev) => ({
          ...prev,
          textTurnsUsed: data.usage.text_turns_used,
          textTurnsAllowance: data.usage.text_turns_allowance,
          audioSecondsUsed: data.usage.audio_seconds_used,
          audioSecondsAllowance: data.usage.audio_seconds_allowance,
          blocksConsumed: data.usage.blocks_consumed,
          percentTextUsed: Math.round((data.usage.text_turns_used / data.usage.text_turns_allowance) * 100),
          percentAudioUsed: Math.round((data.usage.audio_seconds_used / data.usage.audio_seconds_allowance) * 100),
          currentTierPriceCents: AI_PRACTICE_BASE_PRICE_CENTS + (data.usage.blocks_consumed * AI_PRACTICE_BLOCK_PRICE_CENTS),
          periodEnd: prev?.periodEnd || null,
        }));
      }

      const assistantMessage: ChatMessage = {
        id: data.messageId || `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        corrections: data.corrections,
        vocabulary_used: data.vocabulary_used,
        created_at: new Date().toISOString(),
      };

      // Update messages and check limit using the updated count
      shouldEndSessionRef.current = false;
      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        // Count non-system messages in the updated list
        const messageCount = updated.filter((m) => m.role !== "system").length;
        if (messageCount >= maxMessages) {
          shouldEndSessionRef.current = true;
        }
        return updated;
      });

      // End session if limit reached (checked after state update via ref)
      if (shouldEndSessionRef.current) {
        handleEndSession();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    setIsLoading(true);
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
      }
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const messageCount = messages.filter((m) => m.role !== "system").length;
  const remainingMessages = maxMessages - messageCount;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <div className="flex items-center gap-2">
          {usage ? (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={getUsageColor(usage.percentTextUsed)}>
                  {usage.textTurnsUsed}/{usage.textTurnsAllowance}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={getUsageColor(usage.percentAudioUsed)}>
                  {formatSeconds(usage.audioSecondsUsed)}/{formatSeconds(usage.audioSecondsAllowance)}
                </span>
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              {remainingMessages} messages left
            </Badge>
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
                Ready to practice {language}!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {topic
                  ? `Today's topic: ${topic}`
                  : "Start the conversation and I'll help you practice."}
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
                      : "bg-muted/60"
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
                        className="text-[11px] bg-emerald-50 text-emerald-700"
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

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-muted/60 px-4 py-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mb-1 inline h-4 w-4" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Session ended feedback */}
      {isEnded && feedback && (
        <div className="border-t border-border/50 bg-muted/30 px-4 py-6">
          <div className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-background p-5 shadow-sm">
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
        <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
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
        <div className="border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-2xl space-y-2">
            <div className="flex items-end gap-2">
              {/* Audio input button */}
              <AudioInputButton
                sessionId={sessionId}
                language={language}
                onTranscript={handleAudioTranscript}
                onAssessment={handlePronunciationAssessment}
                disabled={isLoading}
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Write or speak in ${language}...`}
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
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
            <p className="text-[10px] text-muted-foreground">
              <Mic className="mr-1 inline h-3 w-3" />
              Click the microphone to practice pronunciation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
