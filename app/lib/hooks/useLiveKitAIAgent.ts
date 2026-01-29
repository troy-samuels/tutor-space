"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  RemoteParticipant,
  RoomEvent,
  Participant,
} from "livekit-client";
import {
  AGENT_IDENTITY_PREFIX,
  AGENT_DATA_CHANNEL,
  type AgentMessage,
  parseAgentMessage,
  encodeAgentMessage,
  createAgentMessage,
} from "@/lib/livekit-agents";

// ============================================
// TYPES
// ============================================

export interface AIAgentState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  agentIdentity: string | null;
  agentType: string | null;
  lastMessage: AgentMessage | null;
  sessionStartedAt: number | null;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  category: string;
  timestamp: number;
}

export interface VocabularyItem {
  word: string;
  translation?: string;
  definition?: string;
  example?: string;
  learnedAt: number;
}

export interface UseLiveKitAIAgentOptions {
  /**
   * Callback when agent sends a message
   */
  onAgentMessage?: (message: AgentMessage) => void;

  /**
   * Callback when agent starts speaking
   */
  onAgentSpeaking?: (speaking: boolean) => void;

  /**
   * Callback when grammar correction is received
   */
  onGrammarCorrection?: (correction: GrammarCorrection) => void;

  /**
   * Callback when vocabulary item is received
   */
  onVocabularyItem?: (item: VocabularyItem) => void;

  /**
   * Callback when agent connects/disconnects
   */
  onAgentConnectionChange?: (connected: boolean) => void;

  /**
   * Enable debug logging
   */
  enableLogging?: boolean;
}

// ============================================
// MAIN HOOK
// ============================================

export function useLiveKitAIAgent(options: UseLiveKitAIAgentOptions = {}) {
  const {
    onAgentMessage,
    onAgentSpeaking,
    onGrammarCorrection,
    onVocabularyItem,
    onAgentConnectionChange,
    enableLogging = false,
  } = options;

  const room = useRoomContext();

  // State
  const [agentState, setAgentState] = useState<AIAgentState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    agentIdentity: null,
    agentType: null,
    lastMessage: null,
    sessionStartedAt: null,
  });

  const [messageHistory, setMessageHistory] = useState<AgentMessage[]>([]);
  const [grammarCorrections, setGrammarCorrections] = useState<
    GrammarCorrection[]
  >([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  // Refs
  const agentParticipantRef = useRef<RemoteParticipant | null>(null);

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (enableLogging) {
        console.log(`[AIAgent] ${message}`, data ?? "");
      }
    },
    [enableLogging]
  );

  /**
   * Check if a participant is an AI agent
   */
  const isAIAgent = useCallback((participant: Participant): boolean => {
    return participant.identity.startsWith(AGENT_IDENTITY_PREFIX);
  }, []);

  /**
   * Get agent type from participant metadata
   */
  const getAgentType = useCallback((participant: Participant): string | null => {
    if (!participant.metadata) return null;
    try {
      const meta = JSON.parse(participant.metadata);
      return meta.agentType || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Find the AI agent participant in the room
   */
  const findAgentParticipant = useCallback((): RemoteParticipant | null => {
    if (!room) return null;

    for (const [, participant] of room.remoteParticipants) {
      if (isAIAgent(participant)) {
        return participant;
      }
    }
    return null;
  }, [room, isAIAgent]);

  /**
   * Handle incoming data channel messages
   */
  const handleDataReceived = useCallback(
    (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic && topic !== AGENT_DATA_CHANNEL) return;
      if (!participant || !isAIAgent(participant)) return;

      const message = parseAgentMessage(payload);
      if (!message) {
        log("Failed to parse agent message");
        return;
      }

      log("Received agent message", message);

      // Update message history
      setMessageHistory((prev) => [...prev, message]);
      setAgentState((prev) => ({ ...prev, lastMessage: message }));

      // Call message callback
      onAgentMessage?.(message);

      // Handle specific message types
      switch (message.type) {
        case "correction":
          if (message.metadata?.grammarCorrections) {
            const corrections = message.metadata.grammarCorrections.map(
              (c) => ({
                ...c,
                timestamp: message.timestamp,
              })
            );
            setGrammarCorrections((prev) => [...prev, ...corrections]);
            corrections.forEach((c) => onGrammarCorrection?.(c));
          }
          break;

        case "vocabulary":
          if (message.metadata?.newVocabulary) {
            const items = message.metadata.newVocabulary.map((v) => ({
              ...v,
              learnedAt: message.timestamp,
            }));
            setVocabulary((prev) => [...prev, ...items]);
            items.forEach((v) => onVocabularyItem?.(v));
          }
          break;

        case "end_session":
          log("Agent ending session");
          break;
      }
    },
    [isAIAgent, log, onAgentMessage, onGrammarCorrection, onVocabularyItem]
  );

  /**
   * Send a message to the AI agent
   */
  const sendMessage = useCallback(
    (text: string) => {
      if (!room || !agentState.isConnected) {
        log("Cannot send message: agent not connected");
        return false;
      }

      const message = createAgentMessage("response", text);
      const encoded = encodeAgentMessage(message);

      try {
        room.localParticipant.publishData(encoded, {
          reliable: true,
          topic: AGENT_DATA_CHANNEL,
        });
        log("Sent message to agent", message);
        return true;
      } catch (error) {
        log("Failed to send message", error);
        return false;
      }
    },
    [room, agentState.isConnected, log]
  );

  /**
   * Request the agent to end the session
   */
  const endSession = useCallback(() => {
    if (!room || !agentState.isConnected) return false;

    const message = createAgentMessage("end_session", "User ended session");
    const encoded = encodeAgentMessage(message);

    try {
      room.localParticipant.publishData(encoded, {
        reliable: true,
        topic: AGENT_DATA_CHANNEL,
      });
      return true;
    } catch {
      return false;
    }
  }, [room, agentState.isConnected]);

  /**
   * Clear accumulated data (corrections, vocabulary, history)
   */
  const clearSession = useCallback(() => {
    setMessageHistory([]);
    setGrammarCorrections([]);
    setVocabulary([]);
    setAgentState((prev) => ({ ...prev, lastMessage: null }));
  }, []);

  // Track agent participant
  useEffect(() => {
    if (!room) return;

    const updateAgentState = () => {
      const agent = findAgentParticipant();
      const isConnected = agent !== null;

      agentParticipantRef.current = agent;

      setAgentState((prev) => {
        if (isConnected !== prev.isConnected) {
          onAgentConnectionChange?.(isConnected);
        }

        return {
          ...prev,
          isConnected,
          agentIdentity: agent?.identity || null,
          agentType: agent ? getAgentType(agent) : null,
          isSpeaking: agent?.isSpeaking ?? false,
          sessionStartedAt: isConnected
            ? prev.isConnected
              ? prev.sessionStartedAt
              : Date.now()
            : null,
        };
      });
    };

    // Initial check
    updateAgentState();

    // Listen for participant changes
    const handleParticipantConnected = (participant: RemoteParticipant) => {
      if (isAIAgent(participant)) {
        log("AI agent connected", { identity: participant.identity });
        updateAgentState();
      }
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      if (isAIAgent(participant)) {
        log("AI agent disconnected", { identity: participant.identity });
        updateAgentState();
      }
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [
    room,
    findAgentParticipant,
    isAIAgent,
    getAgentType,
    handleDataReceived,
    log,
    onAgentConnectionChange,
  ]);

  // Track agent speaking state
  useEffect(() => {
    if (!room) return;

    const handleActiveSpeakersChanged = (speakers: Participant[]) => {
      const agent = agentParticipantRef.current;
      if (!agent) return;

      const isSpeaking = speakers.some(
        (speaker) => speaker.identity === agent.identity
      );
      setAgentState((prev) => ({ ...prev, isSpeaking }));
      onAgentSpeaking?.(isSpeaking);
    };

    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
    };
  }, [room, onAgentSpeaking]);

  return {
    // State
    ...agentState,
    messageHistory,
    grammarCorrections,
    vocabulary,

    // Derived state
    hasAgent: agentState.isConnected,
    totalCorrections: grammarCorrections.length,
    totalVocabulary: vocabulary.length,
    sessionDuration: agentState.sessionStartedAt
      ? Date.now() - agentState.sessionStartedAt
      : 0,

    // Actions
    sendMessage,
    endSession,
    clearSession,

    // Utilities
    isAIAgent,
    findAgentParticipant,
  };
}

// ============================================
// AGENT STATUS COMPONENT HELPERS
// ============================================

export function getAgentStatusText(state: AIAgentState): string {
  if (!state.isConnected) {
    return "AI assistant not connected";
  }

  if (state.isSpeaking) {
    return "AI is speaking...";
  }

  if (state.isListening) {
    return "AI is listening...";
  }

  return "AI assistant ready";
}

export function getAgentTypeDisplayName(
  agentType: string | null
): string {
  if (!agentType) return "AI Assistant";

  const names: Record<string, string> = {
    conversation_practice: "Conversation Partner",
    pronunciation_coach: "Pronunciation Coach",
    grammar_assistant: "Grammar Assistant",
    translator: "Translator",
  };

  return names[agentType] || "AI Assistant";
}
