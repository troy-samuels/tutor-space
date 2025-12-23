/**
 * LiveKit Mock Utilities for Enterprise-Grade Testing
 *
 * Provides factories for creating mock LiveKit objects:
 * - Webhook events (egress_started, egress_ended, room_started, room_finished)
 * - Egress info with file results
 * - Room and participant info
 * - Token generation mocks
 */

// ============================================
// ID GENERATORS
// ============================================

let idCounter = 0;

export function generateLiveKitId(prefix: string): string {
  return `${prefix}_test_${Date.now()}_${++idCounter}`;
}

export const generateEgressId = () => generateLiveKitId("EG");
export const generateRoomSid = () => generateLiveKitId("RM");
export const generateParticipantSid = () => generateLiveKitId("PA");
export const generateTrackSid = () => generateLiveKitId("TR");

// ============================================
// TYPES (Matching LiveKit SDK event structure)
// ============================================

export type EgressStatus =
  | "EGRESS_STARTING"
  | "EGRESS_ACTIVE"
  | "EGRESS_ENDING"
  | "EGRESS_COMPLETE"
  | "EGRESS_FAILED"
  | "EGRESS_ABORTED"
  | "EGRESS_LIMIT_REACHED";

export interface MockFileResult {
  filename: string;
  location: string;
  duration: string; // Nanoseconds as string (e.g., "1800000000000" for 30 min)
  size: string; // Bytes as string
  startedAt?: string;
  endedAt?: string;
}

export interface MockEgressInfo {
  egressId: string;
  roomId?: string;
  roomName: string; // This is the booking ID
  status: EgressStatus;
  startedAt?: string;
  endedAt?: string;
  error?: string;
  fileResults?: MockFileResult[];
  streamResults?: any[];
  segmentResults?: any[];
}

export interface MockRoom {
  sid: string;
  name: string;
  emptyTimeout?: number;
  maxParticipants?: number;
  creationTime?: string;
  turnPassword?: string;
  metadata?: string;
  numParticipants?: number;
  numPublishers?: number;
}

export interface MockParticipant {
  sid: string;
  identity: string;
  state: "JOINING" | "JOINED" | "ACTIVE" | "DISCONNECTED";
  tracks?: MockTrackInfo[];
  metadata?: string;
  joinedAt?: string;
  name?: string;
  version?: number;
  permission?: {
    canSubscribe: boolean;
    canPublish: boolean;
    canPublishData: boolean;
  };
  region?: string;
}

export interface MockTrackInfo {
  sid: string;
  type: "AUDIO" | "VIDEO" | "DATA";
  name?: string;
  muted: boolean;
  width?: number;
  height?: number;
  simulcast?: boolean;
  source: "CAMERA" | "MICROPHONE" | "SCREEN_SHARE" | "SCREEN_SHARE_AUDIO" | "UNKNOWN";
}

export type WebhookEventType =
  | "room_started"
  | "room_finished"
  | "participant_joined"
  | "participant_left"
  | "track_published"
  | "track_unpublished"
  | "egress_started"
  | "egress_updated"
  | "egress_ended";

export interface MockLiveKitWebhookEvent {
  event: WebhookEventType;
  room?: MockRoom;
  participant?: MockParticipant;
  track?: MockTrackInfo;
  egressInfo?: MockEgressInfo;
  createdAt: number; // Unix timestamp in seconds
  id?: string;
}

// ============================================
// EGRESS INFO FACTORY
// ============================================

export interface CreateEgressInfoOptions {
  egressId?: string;
  roomName?: string; // booking ID
  status?: EgressStatus;
  storagePath?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  error?: string;
}

export function createMockEgressInfo(options: CreateEgressInfoOptions = {}): MockEgressInfo {
  const egressId = options.egressId || generateEgressId();
  const roomName = options.roomName || "booking-" + Date.now();
  const status = options.status || "EGRESS_COMPLETE";
  const durationNs = (options.durationSeconds ?? 1800) * 1_000_000_000;
  const fileSize = options.fileSizeBytes ?? 150_000_000; // 150MB default

  const baseInfo: MockEgressInfo = {
    egressId,
    roomId: generateRoomSid(),
    roomName,
    status,
    startedAt: new Date(Date.now() - (options.durationSeconds ?? 1800) * 1000).toISOString(),
    endedAt: new Date().toISOString(),
  };

  if (options.error) {
    baseInfo.error = options.error;
  }

  if (status === "EGRESS_COMPLETE" || status === "EGRESS_ENDING") {
    const storagePath =
      options.storagePath || `recordings/bookings/${roomName}/${Date.now()}.mp4`;

    baseInfo.fileResults = [
      {
        filename: storagePath.split("/").pop() || "recording.mp4",
        location: storagePath,
        duration: String(durationNs),
        size: String(fileSize),
        startedAt: baseInfo.startedAt,
        endedAt: baseInfo.endedAt,
      },
    ];
  }

  return baseInfo;
}

// ============================================
// ROOM FACTORY
// ============================================

export interface CreateRoomOptions {
  sid?: string;
  name?: string;
  numParticipants?: number;
  numPublishers?: number;
  metadata?: string;
}

export function createMockRoom(options: CreateRoomOptions = {}): MockRoom {
  return {
    sid: options.sid || generateRoomSid(),
    name: options.name || "booking-" + Date.now(),
    emptyTimeout: 300,
    maxParticipants: 10,
    creationTime: new Date().toISOString(),
    numParticipants: options.numParticipants ?? 2,
    numPublishers: options.numPublishers ?? 2,
    metadata: options.metadata,
  };
}

// ============================================
// PARTICIPANT FACTORY
// ============================================

export interface CreateParticipantOptions {
  sid?: string;
  identity?: string;
  name?: string;
  state?: MockParticipant["state"];
  isPublisher?: boolean;
  metadata?: string;
}

export function createMockParticipant(options: CreateParticipantOptions = {}): MockParticipant {
  const participant: MockParticipant = {
    sid: options.sid || generateParticipantSid(),
    identity: options.identity || "user_" + Date.now(),
    state: options.state || "ACTIVE",
    name: options.name || "Test User",
    joinedAt: new Date().toISOString(),
    version: 1,
    permission: {
      canSubscribe: true,
      canPublish: options.isPublisher ?? true,
      canPublishData: true,
    },
    metadata: options.metadata,
    tracks: [],
  };

  if (options.isPublisher !== false) {
    participant.tracks = [
      {
        sid: generateTrackSid(),
        type: "AUDIO",
        name: "microphone",
        muted: false,
        source: "MICROPHONE",
      },
      {
        sid: generateTrackSid(),
        type: "VIDEO",
        name: "camera",
        muted: false,
        width: 1280,
        height: 720,
        source: "CAMERA",
      },
    ];
  }

  return participant;
}

// ============================================
// WEBHOOK EVENT FACTORY
// ============================================

export interface CreateWebhookEventOptions {
  event?: WebhookEventType;
  room?: MockRoom | CreateRoomOptions;
  participant?: MockParticipant | CreateParticipantOptions;
  egressInfo?: MockEgressInfo | CreateEgressInfoOptions;
  createdAt?: number;
}

export function createMockLiveKitEvent(
  options: CreateWebhookEventOptions = {}
): MockLiveKitWebhookEvent {
  const event: MockLiveKitWebhookEvent = {
    event: options.event || "room_started",
    createdAt: options.createdAt ?? Math.floor(Date.now() / 1000),
    id: generateLiveKitId("ev"),
  };

  // Handle room
  if (options.room) {
    event.room =
      "sid" in options.room ? options.room : createMockRoom(options.room as CreateRoomOptions);
  }

  // Handle participant
  if (options.participant) {
    event.participant =
      "sid" in options.participant
        ? options.participant
        : createMockParticipant(options.participant as CreateParticipantOptions);
  }

  // Handle egress
  if (options.egressInfo) {
    event.egressInfo =
      "egressId" in options.egressInfo
        ? options.egressInfo
        : createMockEgressInfo(options.egressInfo as CreateEgressInfoOptions);
  }

  return event;
}

// ============================================
// SCENARIO FACTORIES
// ============================================

export const MockLiveKitEvents = {
  /**
   * Room started event
   */
  roomStarted: (roomName: string): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "room_started",
      room: { name: roomName, numParticipants: 0, numPublishers: 0 },
    });
  },

  /**
   * Room finished event
   */
  roomFinished: (roomName: string): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "room_finished",
      room: { name: roomName, numParticipants: 0, numPublishers: 0 },
    });
  },

  /**
   * Participant joined event
   */
  participantJoined: (options: {
    roomName: string;
    identity: string;
    name?: string;
    isTutor?: boolean;
  }): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "participant_joined",
      room: { name: options.roomName },
      participant: {
        identity: options.identity,
        name: options.name || (options.isTutor ? "Tutor" : "Student"),
        state: "JOINED",
      },
    });
  },

  /**
   * Participant left event
   */
  participantLeft: (options: {
    roomName: string;
    identity: string;
  }): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "participant_left",
      room: { name: options.roomName },
      participant: {
        identity: options.identity,
        state: "DISCONNECTED",
      },
    });
  },

  /**
   * Egress started event (recording started)
   */
  egressStarted: (bookingId: string, egressId?: string): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "egress_started",
      egressInfo: {
        egressId,
        roomName: bookingId,
        status: "EGRESS_ACTIVE",
      },
    });
  },

  /**
   * Egress ended event (recording completed)
   */
  egressEnded: (options: {
    bookingId: string;
    egressId?: string;
    storagePath?: string;
    durationSeconds?: number;
  }): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "egress_ended",
      egressInfo: {
        egressId: options.egressId,
        roomName: options.bookingId,
        storagePath:
          options.storagePath ||
          `recordings/bookings/${options.bookingId}/${Date.now()}.mp4`,
        durationSeconds: options.durationSeconds ?? 1800,
        status: "EGRESS_COMPLETE",
      },
    });
  },

  /**
   * Egress failed event
   */
  egressFailed: (options: {
    bookingId: string;
    egressId?: string;
    error: string;
  }): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "egress_ended",
      egressInfo: {
        egressId: options.egressId,
        roomName: options.bookingId,
        status: "EGRESS_FAILED",
        error: options.error,
      },
    });
  },

  /**
   * Egress aborted event (manually stopped)
   */
  egressAborted: (options: {
    bookingId: string;
    egressId?: string;
    durationSeconds?: number;
  }): MockLiveKitWebhookEvent => {
    return createMockLiveKitEvent({
      event: "egress_ended",
      egressInfo: {
        egressId: options.egressId,
        roomName: options.bookingId,
        status: "EGRESS_ABORTED",
        durationSeconds: options.durationSeconds,
      },
    });
  },

  /**
   * Full lesson recording flow (room start → participants join → egress → room end)
   */
  fullLessonFlow: (options: {
    bookingId: string;
    tutorId: string;
    studentId: string;
    durationSeconds?: number;
  }): MockLiveKitWebhookEvent[] => {
    const egressId = generateEgressId();
    const duration = options.durationSeconds ?? 1800;

    return [
      // Room starts
      MockLiveKitEvents.roomStarted(options.bookingId),

      // Tutor joins
      MockLiveKitEvents.participantJoined({
        roomName: options.bookingId,
        identity: options.tutorId,
        name: "Tutor",
        isTutor: true,
      }),

      // Student joins
      MockLiveKitEvents.participantJoined({
        roomName: options.bookingId,
        identity: options.studentId,
        name: "Student",
        isTutor: false,
      }),

      // Recording starts
      MockLiveKitEvents.egressStarted(options.bookingId, egressId),

      // Recording ends
      MockLiveKitEvents.egressEnded({
        bookingId: options.bookingId,
        egressId,
        durationSeconds: duration,
      }),

      // Student leaves
      MockLiveKitEvents.participantLeft({
        roomName: options.bookingId,
        identity: options.studentId,
      }),

      // Tutor leaves
      MockLiveKitEvents.participantLeft({
        roomName: options.bookingId,
        identity: options.tutorId,
      }),

      // Room ends
      MockLiveKitEvents.roomFinished(options.bookingId),
    ];
  },
};

// ============================================
// MOCK WEBHOOK RECEIVER
// ============================================

/**
 * Creates a mock webhook receiver for testing webhook handlers
 */
export function createMockWebhookReceiver() {
  return {
    /**
     * Mock receive function that simulates LiveKit webhook validation
     */
    receive: async (
      body: string,
      authHeader?: string
    ): Promise<MockLiveKitWebhookEvent> => {
      // In real implementation, this would validate the signature
      // For testing, we just parse the body
      try {
        const event = JSON.parse(body) as MockLiveKitWebhookEvent;
        return event;
      } catch {
        throw new Error("Invalid webhook payload");
      }
    },

    /**
     * Generate a mock auth header for testing
     */
    generateAuthHeader: (apiKey: string, apiSecret: string): string => {
      // In real implementation, this would generate a proper JWT
      return `Bearer mock_token_${apiKey}_${Date.now()}`;
    },
  };
}

// ============================================
// MOCK TOKEN GENERATOR
// ============================================

export interface MockAccessTokenOptions {
  identity: string;
  roomName: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
  ttl?: number; // seconds
  metadata?: string;
}

/**
 * Creates a mock access token for testing
 */
export function createMockAccessToken(options: MockAccessTokenOptions): string {
  // In real implementation, this would be a proper JWT
  // For testing, we create a simple mock token
  const tokenData = {
    identity: options.identity,
    roomName: options.roomName,
    canPublish: options.canPublish ?? true,
    canSubscribe: options.canSubscribe ?? true,
    canPublishData: options.canPublishData ?? true,
    exp: Math.floor(Date.now() / 1000) + (options.ttl ?? 21600), // 6 hours default
    metadata: options.metadata,
    iat: Math.floor(Date.now() / 1000),
  };

  // Encode as base64 (not a real JWT, but works for testing)
  const encoded = Buffer.from(JSON.stringify(tokenData)).toString("base64");
  return `mock_lk_token.${encoded}.mock_signature`;
}

/**
 * Decode a mock access token (for testing)
 */
export function decodeMockAccessToken(
  token: string
): MockAccessTokenOptions & { exp: number; iat: number } {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0].startsWith("mock_lk_token")) {
    throw new Error("Invalid mock token format");
  }

  const decoded = Buffer.from(parts[1], "base64").toString("utf-8");
  return JSON.parse(decoded);
}

// ============================================
// MOCK LIVEKIT CLIENT
// ============================================

export interface MockLiveKitClientOptions {
  failStartRecording?: boolean;
  failStopRecording?: boolean;
  recordingDuration?: number;
}

/**
 * Creates a mock LiveKit client for dependency injection
 */
export function createMockLiveKitClient(options: MockLiveKitClientOptions = {}) {
  let activeEgresses: Map<string, MockEgressInfo> = new Map();

  return {
    /**
     * Mock room service client
     */
    roomService: {
      listRooms: async (): Promise<MockRoom[]> => {
        return [];
      },

      deleteRoom: async (roomName: string): Promise<void> => {
        // No-op for testing
      },

      listParticipants: async (roomName: string): Promise<MockParticipant[]> => {
        return [
          createMockParticipant({ identity: "tutor_123", name: "Tutor" }),
          createMockParticipant({ identity: "student_456", name: "Student" }),
        ];
      },

      removeParticipant: async (roomName: string, identity: string): Promise<void> => {
        // No-op for testing
      },

      updateParticipant: async (
        roomName: string,
        identity: string,
        metadata?: string,
        permission?: any
      ): Promise<MockParticipant> => {
        return createMockParticipant({ identity, metadata });
      },
    },

    /**
     * Mock egress client
     */
    egressClient: {
      startRoomCompositeEgress: async (
        roomName: string,
        outputConfig: any
      ): Promise<MockEgressInfo> => {
        if (options.failStartRecording) {
          throw new Error("Failed to start recording");
        }

        const egress = createMockEgressInfo({
          roomName,
          status: "EGRESS_ACTIVE",
        });

        activeEgresses.set(egress.egressId, egress);
        return egress;
      },

      stopEgress: async (egressId: string): Promise<MockEgressInfo> => {
        if (options.failStopRecording) {
          throw new Error("Failed to stop recording");
        }

        const egress = activeEgresses.get(egressId);
        if (!egress) {
          throw new Error("Egress not found");
        }

        egress.status = "EGRESS_COMPLETE";
        egress.endedAt = new Date().toISOString();
        egress.fileResults = [
          {
            filename: `${egress.roomName}-${Date.now()}.mp4`,
            location: `recordings/bookings/${egress.roomName}/${Date.now()}.mp4`,
            duration: String((options.recordingDuration ?? 1800) * 1_000_000_000),
            size: "150000000",
          },
        ];

        activeEgresses.delete(egressId);
        return egress;
      },

      listEgress: async (roomName?: string): Promise<MockEgressInfo[]> => {
        if (roomName) {
          return Array.from(activeEgresses.values()).filter(
            (e) => e.roomName === roomName
          );
        }
        return Array.from(activeEgresses.values());
      },
    },

    /**
     * Mock token generation
     */
    createToken: (options: MockAccessTokenOptions): string => {
      return createMockAccessToken(options);
    },

    /**
     * Reset state (for test cleanup)
     */
    reset: () => {
      activeEgresses.clear();
    },
  };
}
