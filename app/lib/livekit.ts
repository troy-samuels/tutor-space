import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  TrackSource,
} from "livekit-server-sdk";

// Trim to handle env vars with accidental whitespace/newlines (e.g., from Vercel CLI)
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY?.trim();
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET?.trim();
const LIVEKIT_URL = normalizeLiveKitUrl(
  process.env.LIVEKIT_URL ??
    process.env.LIVEKIT_SERVER_URL ??
    process.env.NEXT_PUBLIC_LIVEKIT_URL
);

// S3-compatible storage credentials (DigitalOcean Spaces)
const S3_ENDPOINT = normalizeS3Endpoint(
  process.env.DIGITALOCEAN_SPACES_ENDPOINT ??
    process.env.S3_ENDPOINT ??
    process.env.SUPABASE_S3_ENDPOINT
);
const S3_ACCESS_KEY =
  process.env.DIGITALOCEAN_ACCESS_KEY ?? process.env.SUPABASE_S3_ACCESS_KEY;
const S3_SECRET_KEY =
  process.env.DIGITALOCEAN_SECRET_KEY ?? process.env.SUPABASE_S3_SECRET_KEY;
const S3_BUCKET = process.env.SUPABASE_S3_BUCKET || process.env.S3_BUCKET || "recordings";

const MAX_PARTICIPANT_NAME_LENGTH = 120;

function normalizeLiveKitUrl(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/^(wss?|https?):\/\//.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function toHttpUrl(url: string): string {
  if (url.startsWith("wss://")) {
    return url.replace(/^wss:\/\//, "https://");
  }
  if (url.startsWith("ws://")) {
    return url.replace(/^ws:\/\//, "http://");
  }
  return url;
}

function normalizeS3Endpoint(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * LiveKit Room Service Client
 * Used for managing rooms (create, delete, list participants, etc.)
 */
export function getRoomServiceClient() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit environment variables are not configured");
  }

  // Convert ws(s):// to http(s):// for REST API
  const httpUrl = toHttpUrl(LIVEKIT_URL);

  return new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

/**
 * Create a LiveKit access token for joining a room
 *
 * @param identity - Unique identifier for the participant (usually user_id)
 * @param roomName - Name of the room to join (usually booking_id)
 * @param options - Additional options for token generation
 * @returns JWT token string for connecting to LiveKit
 */
export async function createAccessToken(
  identity: string,
  roomName: string,
  options?: {
    isTutor?: boolean;
    participantName?: string;
    tokenTtlSeconds?: number;
  }
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit API credentials are not configured");
  }

  if (!identity?.trim()) {
    throw new Error("LiveKit identity is required");
  }

  if (!roomName?.trim()) {
    throw new Error("LiveKit room name is required");
  }

  const participantName = options?.participantName?.trim();
  const safeParticipantName = participantName
    ? participantName.slice(0, MAX_PARTICIPANT_NAME_LENGTH)
    : undefined;

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: safeParticipantName,
    ttl: options?.tokenTtlSeconds ?? "6h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishSources: [
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
    ],
    canSubscribe: true,
    // Required for in-room chat and interactive features.
    canPublishData: true,
  });

  return await token.toJwt();
}

/**
 * Check if LiveKit is properly configured
 */
export function isLiveKitConfigured(): boolean {
  return !!(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}

/**
 * LiveKit Egress Client
 * Used for recording rooms to external storage
 */
export function getEgressClient(): EgressClient {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit environment variables are not configured");
  }

  // Convert ws(s):// to http(s):// for REST API
  const httpUrl = toHttpUrl(LIVEKIT_URL);

  return new EgressClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

/**
 * Check if S3 storage is configured for recordings
 */
export function isS3Configured(): boolean {
  return !!(
    S3_ENDPOINT &&
    S3_ACCESS_KEY &&
    S3_SECRET_KEY
  );
}

/**
 * Get S3 output configuration for LiveKit Egress
 */
export function getS3OutputConfig(filepath: string): EncodedFileOutput {
  if (!isS3Configured()) {
    throw new Error("S3 storage is not configured for recordings");
  }

  return new EncodedFileOutput({
    fileType: EncodedFileType.OGG,
    filepath,
    output: {
      case: "s3",
      value: {
        accessKey: S3_ACCESS_KEY!,
        secret: S3_SECRET_KEY!,
        bucket: S3_BUCKET,
        endpoint: S3_ENDPOINT!,
        forcePathStyle: true, // Required for DigitalOcean Spaces
      },
    },
  });
}

/**
 * Start recording a room using LiveKit Egress
 * @returns The egress info including egressId
 */
export async function startRoomRecording(roomName: string) {
  const egressClient = getEgressClient();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filepath = `bookings/${roomName}/${timestamp}.ogg`;

  console.log("[LiveKit Recording] S3 config:", {
    endpoint: S3_ENDPOINT,
    bucket: S3_BUCKET,
    filepath,
    hasAccessKey: !!S3_ACCESS_KEY,
    hasSecretKey: !!S3_SECRET_KEY,
  });

  const output = getS3OutputConfig(filepath);

  console.log("[LiveKit Recording] Attempting startRoomCompositeEgress...");
  const egressInfo = await egressClient.startRoomCompositeEgress(
    roomName,
    { file: output },
    {
      audioOnly: true,
    }
  );

  return {
    egressId: egressInfo.egressId,
    roomName,
    filepath,
    status: egressInfo.status,
  };
}

/**
 * Stop an active recording
 */
export async function stopRoomRecording(egressId: string) {
  const egressClient = getEgressClient();
  const egressInfo = await egressClient.stopEgress(egressId);

  return {
    egressId: egressInfo.egressId,
    status: egressInfo.status,
  };
}

/**
 * List active egress sessions for a room
 */
export async function listRoomEgress(roomName: string) {
  const egressClient = getEgressClient();
  const egresses = await egressClient.listEgress({ roomName });

  return egresses.map((e) => ({
    egressId: e.egressId,
    roomName: e.roomName,
    status: e.status,
  }));
}
