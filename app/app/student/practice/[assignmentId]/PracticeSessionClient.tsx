"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AIPracticeChat, type ChatMessage } from "@/components/student/AIPracticeChat";
import { ModeSelectionScreen, type PracticeMode } from "@/components/student/ModeSelectionScreen";
import type { PracticeUsage } from "@/lib/actions/progress";

interface PracticeSessionClientProps {
  // Session data (may be null if no active session)
  sessionId?: string | null;
  sessionMode?: PracticeMode | null;
  // Assignment data (always available)
  assignmentId: string;
  assignmentTitle: string;
  language: string;
  level?: string | null;
  topic?: string | null;
  systemPrompt?: string;
  maxMessages: number;
  initialUsage?: PracticeUsage | null;
  initialMessages?: ChatMessage[];
}

export function PracticeSessionClient({
  sessionId: initialSessionId,
  sessionMode: initialSessionMode,
  assignmentId,
  assignmentTitle,
  language,
  level,
  topic,
  systemPrompt,
  maxMessages,
  initialUsage,
  initialMessages = [],
}: PracticeSessionClientProps) {
  const router = useRouter();

  // Track session state locally
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [sessionMode, setSessionMode] = useState<PracticeMode | null>(initialSessionMode || null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleBack = () => {
    router.push("/student/progress");
  };

  const handleSessionEnd = (feedback: any) => {
    console.log("Session ended with feedback:", feedback);
  };

  const handleModeSelect = useCallback(async (mode: PracticeMode) => {
    setIsCreatingSession(true);

    try {
      const response = await fetch("/api/practice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[Practice] Failed to create session:", error);
        setIsCreatingSession(false);
        return;
      }

      const data = await response.json();
      setSessionId(data.session.id);
      setSessionMode(data.session.mode || mode);
    } catch (error) {
      console.error("[Practice] Error creating session:", error);
      setIsCreatingSession(false);
    }
  }, [assignmentId]);

  // Calculate usage percentages for mode selection
  const percentTextUsed = initialUsage?.percentTextUsed ?? 0;
  const percentAudioUsed = initialUsage?.percentAudioUsed ?? 0;
  const textExhausted = percentTextUsed >= 100;
  const audioExhausted = percentAudioUsed >= 100;

  // Show mode selection if no session yet
  if (!sessionId) {
    return (
      <ModeSelectionScreen
        assignmentTitle={assignmentTitle}
        percentTextUsed={percentTextUsed}
        percentAudioUsed={percentAudioUsed}
        textExhausted={textExhausted}
        audioExhausted={audioExhausted}
        onSelectMode={handleModeSelect}
        isLoading={isCreatingSession}
      />
    );
  }

  // Show chat with mode locked
  return (
    <AIPracticeChat
      sessionId={sessionId}
      assignmentTitle={assignmentTitle}
      language={language}
      level={level}
      topic={topic}
      systemPrompt={systemPrompt}
      initialMessages={initialMessages}
      maxMessages={maxMessages}
      initialUsage={initialUsage}
      mode={sessionMode || "text"}
      onBack={handleBack}
      onSessionEnd={handleSessionEnd}
    />
  );
}
