import {
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
} from "livekit-server-sdk";

// ============================================
// TYPES
// ============================================

export interface AutoEgressConfig {
  /**
   * Enable automatic recording when room is created
   */
  enabled: boolean;

  /**
   * Output format for recordings
   */
  format: "ogg" | "mp4";

  /**
   * Audio only recording (cheaper, smaller files)
   */
  audioOnly: boolean;

  /**
   * Output to S3-compatible storage
   */
  s3Output?: {
    bucket: string;
    endpoint: string;
    accessKey: string;
    secretKey: string;
    pathPrefix?: string;
    forcePathStyle?: boolean;
  };

  /**
   * Advanced egress options
   */
  options?: {
    /**
     * File naming template
     * Available variables: {room_name}, {timestamp}, {room_id}
     * Default: "{room_name}/{timestamp}.{format}"
     */
    filenameTemplate?: string;

    /**
     * Minimum duration in seconds before egress starts
     * Prevents very short recordings from accidental joins
     */
    minDurationSeconds?: number;

    /**
     * Max egress duration in seconds (safety limit)
     * Default: 7200 (2 hours)
     */
    maxDurationSeconds?: number;
  };
}

export interface RoomWithAutoEgressConfig {
  /**
   * Room name (typically booking ID)
   */
  roomName: string;

  /**
   * Empty timeout in seconds (room auto-closes after being empty)
   * Default: 300 (5 minutes)
   */
  emptyTimeout?: number;

  /**
   * Maximum number of participants
   * Default: 10 (for group lessons)
   */
  maxParticipants?: number;

  /**
   * Auto-egress configuration
   */
  autoEgress?: AutoEgressConfig;

  /**
   * Room metadata (JSON string)
   */
  metadata?: string;
}

export interface CreateRoomResult {
  room: {
    name: string;
    sid: string;
    creationTime: number;
    metadata?: string;
  };
  autoEgress?: {
    enabled: boolean;
    format: string;
    estimatedFilepath: string;
  };
}

// ============================================
// CONSTANTS
// ============================================

const FORMAT_TO_FILE_TYPE: Record<string, EncodedFileType> = {
  ogg: EncodedFileType.OGG,
  mp4: EncodedFileType.MP4,
};

const DEFAULT_EMPTY_TIMEOUT = 300; // 5 minutes
const DEFAULT_MAX_PARTICIPANTS = 10;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build the filename from template
 */
function buildFilename(
  template: string,
  roomName: string,
  format: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const roomId = roomName.replace(/[^a-zA-Z0-9-_]/g, "_");

  return template
    .replace("{room_name}", roomName)
    .replace("{timestamp}", timestamp)
    .replace("{room_id}", roomId)
    .replace("{format}", format);
}

// ============================================
// AUTO-EGRESS ROOM CREATION
// ============================================

/**
 * Create a room with optional auto-egress preparation
 *
 * Note: LiveKit's auto-egress is configured at the project level via the dashboard.
 * This function creates the room and returns info for manual egress start if needed.
 */
export async function createRoomWithAutoEgress(
  roomServiceClient: RoomServiceClient,
  config: RoomWithAutoEgressConfig
): Promise<CreateRoomResult> {
  const {
    roomName,
    emptyTimeout = DEFAULT_EMPTY_TIMEOUT,
    maxParticipants = DEFAULT_MAX_PARTICIPANTS,
    autoEgress,
    metadata,
  } = config;

  // Create the room
  const room = await roomServiceClient.createRoom({
    name: roomName,
    emptyTimeout,
    maxParticipants,
    metadata,
  });

  // Build result
  const result: CreateRoomResult = {
    room: {
      name: room.name,
      sid: room.sid,
      creationTime: Number(room.creationTime),
      metadata: room.metadata,
    },
  };

  if (autoEgress?.enabled) {
    const format = autoEgress.format || "ogg";
    const filenameTemplate =
      autoEgress.options?.filenameTemplate || `{room_name}/{timestamp}.${format}`;

    result.autoEgress = {
      enabled: true,
      format,
      estimatedFilepath: buildFilename(filenameTemplate, roomName, format),
    };
  }

  return result;
}

/**
 * Start recording for a room (to be called when participants join)
 * This provides more control than auto-egress at room creation
 */
export async function startAutoRecording(
  egressClient: EgressClient,
  roomName: string,
  config: AutoEgressConfig
): Promise<{
  egressId: string;
  filepath: string;
} | null> {
  if (!config.enabled || !config.s3Output) {
    return null;
  }

  const format = config.format || "ogg";
  const filenameTemplate =
    config.options?.filenameTemplate || `{room_name}/{timestamp}.${format}`;
  const filepath = buildFilename(filenameTemplate, roomName, format);

  const fullPath = config.s3Output.pathPrefix
    ? `${config.s3Output.pathPrefix}/${filepath}`
    : filepath;

  const output = new EncodedFileOutput({
    fileType: FORMAT_TO_FILE_TYPE[format] || EncodedFileType.OGG,
    filepath: fullPath,
    output: {
      case: "s3",
      value: {
        accessKey: config.s3Output.accessKey,
        secret: config.s3Output.secretKey,
        bucket: config.s3Output.bucket,
        endpoint: config.s3Output.endpoint,
        forcePathStyle: config.s3Output.forcePathStyle ?? true,
      },
    },
  });

  const egressInfo = await egressClient.startRoomCompositeEgress(
    roomName,
    { file: output },
    { audioOnly: config.audioOnly }
  );

  return {
    egressId: egressInfo.egressId,
    filepath: fullPath,
  };
}

// ============================================
// AUTO-EGRESS PRESETS
// ============================================

/**
 * Preset: Standard lesson recording (audio-only, OGG format)
 * Cost-optimized for typical 1:1 or small group lessons
 */
export function getStandardLessonEgressConfig(
  s3Config: AutoEgressConfig["s3Output"]
): AutoEgressConfig {
  return {
    enabled: true,
    format: "ogg",
    audioOnly: true,
    s3Output: s3Config,
    options: {
      filenameTemplate: "lessons/{room_name}/{timestamp}.ogg",
      minDurationSeconds: 60,
      maxDurationSeconds: 7200,
    },
  };
}

/**
 * Preset: Premium lesson recording (video + audio, MP4 format)
 * For premium users who want video recordings
 */
export function getPremiumLessonEgressConfig(
  s3Config: AutoEgressConfig["s3Output"]
): AutoEgressConfig {
  return {
    enabled: true,
    format: "mp4",
    audioOnly: false,
    s3Output: s3Config,
    options: {
      filenameTemplate: "lessons/{room_name}/{timestamp}.mp4",
      minDurationSeconds: 60,
      maxDurationSeconds: 10800,
    },
  };
}

/**
 * Preset: Trial lesson recording (audio-only, short duration)
 * For trial lessons with shorter time limits
 */
export function getTrialLessonEgressConfig(
  s3Config: AutoEgressConfig["s3Output"]
): AutoEgressConfig {
  return {
    enabled: true,
    format: "ogg",
    audioOnly: true,
    s3Output: s3Config,
    options: {
      filenameTemplate: "trials/{room_name}/{timestamp}.ogg",
      minDurationSeconds: 30,
      maxDurationSeconds: 1800,
    },
  };
}

// ============================================
// EGRESS MANAGEMENT UTILITIES
// ============================================

/**
 * Check if a room has active egress (recording in progress)
 */
export async function hasActiveEgress(
  egressClient: EgressClient,
  roomName: string
): Promise<boolean> {
  const egresses = await egressClient.listEgress({ roomName });
  return egresses.some(
    (e) => e.status === 0 || e.status === 1 // EGRESS_STARTING or EGRESS_ACTIVE
  );
}

/**
 * Get all egress recordings for a room
 */
export async function getRoomRecordings(
  egressClient: EgressClient,
  roomName: string
): Promise<
  Array<{
    egressId: string;
    status: number;
    startedAt?: number;
    endedAt?: number;
    fileUri?: string;
  }>
> {
  const egresses = await egressClient.listEgress({ roomName });

  return egresses.map((e) => ({
    egressId: e.egressId,
    status: e.status,
    startedAt: e.startedAt ? Number(e.startedAt) : undefined,
    endedAt: e.endedAt ? Number(e.endedAt) : undefined,
    fileUri: e.fileResults?.[0]?.filename,
  }));
}

/**
 * Stop all active egress for a room
 */
export async function stopAllRoomEgress(
  egressClient: EgressClient,
  roomName: string
): Promise<number> {
  const egresses = await egressClient.listEgress({ roomName });
  let stoppedCount = 0;

  for (const egress of egresses) {
    if (egress.status === 0 || egress.status === 1) {
      await egressClient.stopEgress(egress.egressId);
      stoppedCount++;
    }
  }

  return stoppedCount;
}

// ============================================
// CONSENT HELPERS
// ============================================

export interface RecordingConsentConfig {
  /**
   * Require explicit consent before recording starts
   */
  requireConsent: boolean;

  /**
   * Store consent in room metadata
   */
  storeInMetadata: boolean;

  /**
   * Consent expiry in seconds (for remembered consent)
   * Default: 86400 (24 hours)
   */
  consentExpirySeconds?: number;
}

/**
 * Build metadata with recording consent status
 */
export function buildConsentMetadata(
  existingMetadata: string | undefined,
  hasConsent: boolean,
  participantId: string
): string {
  const existing = existingMetadata ? JSON.parse(existingMetadata) : {};

  return JSON.stringify({
    ...existing,
    recordingConsent: {
      ...existing.recordingConsent,
      [participantId]: {
        consented: hasConsent,
        timestamp: Date.now(),
      },
    },
  });
}

/**
 * Check if all participants have consented to recording
 */
export function checkAllConsented(
  metadata: string | undefined,
  participantIds: string[]
): boolean {
  if (!metadata) return false;

  try {
    const parsed = JSON.parse(metadata);
    const consent = parsed.recordingConsent || {};

    return participantIds.every(
      (id) => consent[id]?.consented === true
    );
  } catch {
    return false;
  }
}
