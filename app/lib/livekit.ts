import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
} from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

// S3-compatible storage credentials (Supabase Storage)
const SUPABASE_S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT;
const SUPABASE_S3_ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY;
const SUPABASE_S3_SECRET_KEY = process.env.SUPABASE_S3_SECRET_KEY;
const SUPABASE_S3_BUCKET = process.env.SUPABASE_S3_BUCKET || "recordings";

/**
 * LiveKit Room Service Client
 * Used for managing rooms (create, delete, list participants, etc.)
 */
export function getRoomServiceClient() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit environment variables are not configured");
  }

  // Convert ws(s):// to http(s):// for REST API
  const httpUrl = LIVEKIT_URL.startsWith("wss://")
    ? LIVEKIT_URL.replace(/^wss:\/\//, "https://")
    : LIVEKIT_URL.startsWith("ws://")
      ? LIVEKIT_URL.replace(/^ws:\/\//, "http://")
      : LIVEKIT_URL;

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
  }
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit API credentials are not configured");
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: options?.participantName,
    ttl: "6h", // Token valid for 6 hours
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
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
  const httpUrl = LIVEKIT_URL.startsWith("wss://")
    ? LIVEKIT_URL.replace(/^wss:\/\//, "https://")
    : LIVEKIT_URL.startsWith("ws://")
      ? LIVEKIT_URL.replace(/^ws:\/\//, "http://")
      : LIVEKIT_URL;

  return new EgressClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

/**
 * Check if S3 storage is configured for recordings
 */
export function isS3Configured(): boolean {
  return !!(
    SUPABASE_S3_ENDPOINT &&
    SUPABASE_S3_ACCESS_KEY &&
    SUPABASE_S3_SECRET_KEY
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
    fileType: EncodedFileType.MP4,
    filepath,
    output: {
      case: "s3",
      value: {
        accessKey: SUPABASE_S3_ACCESS_KEY!,
        secret: SUPABASE_S3_SECRET_KEY!,
        bucket: SUPABASE_S3_BUCKET,
        endpoint: SUPABASE_S3_ENDPOINT!,
        forcePathStyle: true, // Required for Supabase S3
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
  const filepath = `bookings/${roomName}/${timestamp}.mp4`;

  console.log("[LiveKit Recording] S3 config:", {
    endpoint: SUPABASE_S3_ENDPOINT,
    bucket: SUPABASE_S3_BUCKET,
    filepath,
    hasAccessKey: !!SUPABASE_S3_ACCESS_KEY,
    hasSecretKey: !!SUPABASE_S3_SECRET_KEY,
  });

  const output = getS3OutputConfig(filepath);

  console.log("[LiveKit Recording] Attempting startRoomCompositeEgress...");
  const egressInfo = await egressClient.startRoomCompositeEgress(
    roomName,
    { file: output },
    {
      layout: "grid",
      // Optional: customize video settings
      // videoOnly: false,
      // audioOnly: false,
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
