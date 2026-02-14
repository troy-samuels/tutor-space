"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AIPracticeChat, type ChatMessage } from "@/components/student/AIPracticeChat";
import { ModeSelectionScreen, type PracticeMode } from "@/components/student/ModeSelectionScreen";
import UpgradeGate from "@/components/practice/UpgradeGate";
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

type UpgradeGateState = {
  variant: "tutor-linked" | "solo";
  upgradePriceCents: number | null;
};

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
  const [upgradeGate, setUpgradeGate] = useState<UpgradeGateState | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleBack = () => {
    router.push("/student/progress");
  };

  const handleSessionEnd = (feedback: any) => {
    console.log("Session ended with feedback:", feedback);
  };

  /** Creates a new session for the selected practice mode. */
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
        if (response.status === 402 && (error.code === "SESSION_LIMIT_REACHED" || error.code === "FEATURE_LOCKED")) {
          const upgradePriceCents = typeof error.upgradePriceCents === "number"
            ? error.upgradePriceCents
            : null;
          setUpgradeGate({
            variant: upgradePriceCents === 999 ? "solo" : "tutor-linked",
            upgradePriceCents,
          });
        }
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

  /** Starts checkout for the recommended paid practice tier. */
  const handleUpgrade = useCallback(async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/practice/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const payload = await response.json();
      if (!response.ok || !payload.checkoutUrl) {
        console.error("[Practice] Failed to create upgrade checkout:", payload);
        setIsUpgrading(false);
        return;
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      console.error("[Practice] Failed to open upgrade checkout:", error);
      setIsUpgrading(false);
    }
  }, []);

  // Calculate usage percentages for mode selection
  const percentTextUsed = initialUsage?.percentTextUsed ?? 0;
  const percentAudioUsed = initialUsage?.percentAudioUsed ?? 0;
  const textExhausted = percentTextUsed >= 100;
  const audioExhausted = percentAudioUsed >= 100;

  // Show mode selection if no session yet
  if (!sessionId) {
    return (
      <>
        {upgradeGate && (
          <UpgradeGate
            variant={upgradeGate.variant}
            onUpgrade={handleUpgrade}
            onDismiss={() => setUpgradeGate(null)}
            isLoading={isUpgrading}
          />
        )}
        <ModeSelectionScreen
          assignmentTitle={assignmentTitle}
          percentTextUsed={percentTextUsed}
          percentAudioUsed={percentAudioUsed}
          textExhausted={textExhausted}
          audioExhausted={audioExhausted}
          onSelectMode={handleModeSelect}
          isLoading={isCreatingSession}
        />
      </>
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
