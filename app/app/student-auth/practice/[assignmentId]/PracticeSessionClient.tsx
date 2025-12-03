"use client";

import { useRouter } from "next/navigation";
import { AIPracticeChat, type ChatMessage } from "@/components/student/AIPracticeChat";

interface PracticeSessionClientProps {
  sessionId: string;
  assignmentId: string;
  assignmentTitle: string;
  language: string;
  level?: string | null;
  topic?: string | null;
  systemPrompt?: string;
  maxMessages: number;
  initialMessages: ChatMessage[];
}

export function PracticeSessionClient({
  sessionId,
  assignmentId,
  assignmentTitle,
  language,
  level,
  topic,
  systemPrompt,
  maxMessages,
  initialMessages,
}: PracticeSessionClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/student-auth/progress");
  };

  const handleSessionEnd = (feedback: any) => {
    // Could show a toast or handle completion
    console.log("Session ended with feedback:", feedback);
  };

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
      onBack={handleBack}
      onSessionEnd={handleSessionEnd}
    />
  );
}
