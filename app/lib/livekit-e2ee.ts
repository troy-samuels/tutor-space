import {
  E2EEOptions,
  ExternalE2EEKeyProvider,
  RoomOptions,
} from "livekit-client";

// ============================================
// TYPES
// ============================================

export interface E2EEConfig {
  /**
   * Enable end-to-end encryption for the room
   */
  enabled: boolean;

  /**
   * Shared passphrase for key derivation (must be shared between participants)
   * For production, use a secure key exchange mechanism
   */
  sharedKey?: string;

  /**
   * Key rotation interval in seconds
   * Default: 3600 (1 hour)
   */
  keyRotationIntervalSeconds?: number;

  /**
   * Number of cryptographic ratchets to perform on key rotation
   * Higher values = more forward secrecy, slightly more CPU
   * Default: 1
   */
  ratchetCount?: number;
}

export interface E2EEStatus {
  enabled: boolean;
  isEncrypted: boolean;
  keyIndex: number;
  failureCount: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_KEY_ROTATION_INTERVAL = 3600; // 1 hour

/**
 * Key derivation parameters (PBKDF2)
 */
const KEY_DERIVATION_PARAMS = {
  iterations: 100000,
  hash: "SHA-256",
  keyLength: 256, // AES-256-GCM
};

// ============================================
// KEY MANAGEMENT
// ============================================

/**
 * Derive an encryption key from a passphrase
 * Uses PBKDF2 with a salt derived from the room name
 */
async function deriveKeyFromPassphrase(
  passphrase: string,
  roomName: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const saltBytes = encoder.encode(`tutorlingua-e2ee-${roomName}`);

  // Import passphrase as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive the actual encryption key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: KEY_DERIVATION_PARAMS.iterations,
      hash: KEY_DERIVATION_PARAMS.hash,
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: KEY_DERIVATION_PARAMS.keyLength,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Export a CryptoKey to raw bytes for use with LiveKit's key provider
 */
async function exportKeyToBytes(key: CryptoKey): Promise<Uint8Array> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(exported);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

/**
 * Generate a random encryption key (for programmatic key generation)
 */
async function generateRandomKey(): Promise<Uint8Array> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return exportKeyToBytes(key);
}

// ============================================
// E2EE KEY PROVIDER IMPLEMENTATION
// ============================================

/**
 * Custom key provider that supports passphrase-based key derivation
 * and automatic key rotation
 */
export class TutorLinguaKeyProvider extends ExternalE2EEKeyProvider {
  private roomName: string;
  private keyRotationInterval: number;
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private currentKeyIndex = 0;

  constructor(
    roomName: string,
    options: {
      keyRotationIntervalSeconds?: number;
    } = {}
  ) {
    super();
    this.roomName = roomName;
    this.keyRotationInterval =
      (options.keyRotationIntervalSeconds ?? DEFAULT_KEY_ROTATION_INTERVAL) * 1000;
  }

  /**
   * Set the encryption key from a passphrase
   */
  async setKeyFromPassphrase(passphrase: string): Promise<void> {
    const derivedKey = await deriveKeyFromPassphrase(passphrase, this.roomName);
    const keyBytes = await exportKeyToBytes(derivedKey);
    await this.setKey(toArrayBuffer(keyBytes));
  }

  /**
   * Set a raw key (for programmatic use)
   */
  setRawKey(key: Uint8Array): void {
    void this.setKey(toArrayBuffer(key));
  }

  /**
   * Start automatic key rotation
   */
  startKeyRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    this.rotationTimer = setInterval(async () => {
      await this.rotateKey();
    }, this.keyRotationInterval);
  }

  /**
   * Stop automatic key rotation
   */
  stopKeyRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Manually rotate the encryption key
   */
  async rotateKey(): Promise<void> {
    this.currentKeyIndex += 1;
    const newKey = await generateRandomKey();
    await this.setKey(toArrayBuffer(newKey));
    this.ratchetKey();
  }

  /**
   * Get the current key index
   */
  getCurrentKeyIndex(): number {
    return this.currentKeyIndex;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopKeyRotation();
  }
}

// ============================================
// E2EE CONFIGURATION
// ============================================

/**
 * Build E2EE options for room connection
 */
export function buildE2EEOptions(
  config: E2EEConfig,
  roomName: string
): { e2ee?: E2EEOptions; keyProvider?: TutorLinguaKeyProvider } {
  if (!config.enabled) {
    return {};
  }

  const keyProvider = new TutorLinguaKeyProvider(roomName, {
    keyRotationIntervalSeconds: config.keyRotationIntervalSeconds,
  });

  const e2eeOptions: E2EEOptions = {
    keyProvider,
    worker: new Worker(
      new URL("livekit-client/e2ee-worker", import.meta.url)
    ),
  };

  return { e2ee: e2eeOptions, keyProvider };
}

/**
 * Build RoomOptions with E2EE configuration
 */
export function buildE2EERoomOptions(
  baseOptions: RoomOptions,
  e2eeConfig: E2EEConfig,
  roomName: string
): { roomOptions: RoomOptions; keyProvider?: TutorLinguaKeyProvider } {
  const { e2ee, keyProvider } = buildE2EEOptions(e2eeConfig, roomName);

  return {
    roomOptions: {
      ...baseOptions,
      e2ee,
    },
    keyProvider,
  };
}

// ============================================
// E2EE HELPER HOOKS (for React components)
// ============================================

/**
 * Initialize E2EE with a shared passphrase
 * Call this after room connection is established
 */
export async function initializeE2EE(
  keyProvider: TutorLinguaKeyProvider,
  passphrase: string,
  options: { autoRotate?: boolean } = {}
): Promise<void> {
  await keyProvider.setKeyFromPassphrase(passphrase);

  if (options.autoRotate) {
    keyProvider.startKeyRotation();
  }
}

/**
 * Generate a secure random passphrase for E2EE sessions
 */
export function generateSecurePassphrase(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/[+/=]/g, "") // Remove non-URL-safe characters
    .slice(0, length);
}

// ============================================
// E2EE STATUS & MONITORING
// ============================================

/**
 * Check if E2EE is supported in the current browser
 */
export function isE2EESupported(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof Worker !== "undefined"
  );
}

/**
 * Get a user-friendly message for E2EE status
 */
export function getE2EEStatusMessage(status: E2EEStatus): string {
  if (!status.enabled) {
    return "Encryption disabled";
  }

  if (status.failureCount > 0) {
    return `Encryption error (${status.failureCount} failures)`;
  }

  if (status.isEncrypted) {
    return `Encrypted (Key #${status.keyIndex + 1})`;
  }

  return "Setting up encryption...";
}

// ============================================
// PRIVACY-SENSITIVE LESSON TYPES
// ============================================

/**
 * Lesson types that should default to E2EE
 */
export const PRIVACY_SENSITIVE_LESSON_TYPES = [
  "medical_english",
  "legal_english",
  "corporate_confidential",
  "exam_prep",
  "interview_prep",
] as const;

export type PrivacySensitiveLessonType =
  (typeof PRIVACY_SENSITIVE_LESSON_TYPES)[number];

/**
 * Check if a lesson type should default to E2EE
 */
export function shouldDefaultToE2EE(lessonType?: string): boolean {
  if (!lessonType) return false;
  return PRIVACY_SENSITIVE_LESSON_TYPES.includes(
    lessonType as PrivacySensitiveLessonType
  );
}

/**
 * Get E2EE recommendation text for a lesson type
 */
export function getE2EERecommendation(lessonType?: string): {
  recommended: boolean;
  reason: string;
} {
  if (shouldDefaultToE2EE(lessonType)) {
    return {
      recommended: true,
      reason: `End-to-end encryption is recommended for ${lessonType?.replace(/_/g, " ")} lessons to protect sensitive information.`,
    };
  }

  return {
    recommended: false,
    reason: "Standard encryption is sufficient for this lesson type.",
  };
}
