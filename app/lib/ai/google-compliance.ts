/**
 * Google Calendar Data Compliance Module
 *
 * This module enforces data isolation between Google Calendar data
 * and AI/LLM services to comply with Google's API verification requirements.
 *
 * POLICY: Google Calendar data (from calendar_events and calendar_connections tables)
 * is NEVER sent to OpenAI, Deepgram, Microsoft Azure Speech, or any third-party AI service.
 *
 * @see https://developers.google.com/terms/api-services-user-data-policy
 */

/**
 * Core policy definition for Google Calendar data usage
 */
export const GOOGLE_DATA_POLICY = {
  // Explicitly define that Google data is restricted to availability only
  PERMITTED_USES: ['availability_calculation', 'calendar_view_rendering'] as const,
  FORBIDDEN_USES: ['ai_training', 'llm_context', 'transcription_metadata'] as const,
  RESTRICTED_TABLES: ['calendar_events', 'calendar_connections'] as const,
} as const;

/**
 * Fields that are forbidden from being sent to AI services
 */
const FORBIDDEN_AI_FIELDS = [
  // Internal database fields
  'google_event_id',
  'outlook_event_id',
  'provider_event_id',
  'calendar_id',
  'provider_account_id',
  'external_calendar_title',
  'external_calendar_description',
  'access_token_encrypted',
  'refresh_token_encrypted',
  // Standard Google Calendar API fields
  'htmlLink',           // URL to view event in Google Calendar
  'hangoutLink',        // Google Meet link from calendar event
  'iCalUID',            // iCalendar unique identifier
  'recurringEventId',   // Parent recurring event ID
  'creator',            // Event creator object
  'organizer',          // Event organizer object
] as const;

const GOOGLE_CALENDAR_MARKER = Symbol.for('tutorlingua.google_calendar_data');
const GOOGLE_CALENDAR_PROVIDERS = new Set(['google', 'outlook']);
const GOOGLE_CALENDAR_SOURCES = new Set(['Google Calendar', 'Outlook Calendar']);

/**
 * Tag data as Google Calendar-derived to enforce downstream isolation checks.
 */
export function markGoogleCalendarData<T extends object>(value: T): T {
  if (value && typeof value === 'object') {
    Object.defineProperty(value, GOOGLE_CALENDAR_MARKER, {
      value: true,
      enumerable: false,
    });
  }
  return value;
}

function hasGoogleCalendarMarker(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return (value as { [key: symbol]: unknown })[GOOGLE_CALENDAR_MARKER] === true;
}

function looksLikeCalendarEvent(value: Record<string, unknown>): boolean {
  const provider = typeof value.provider === 'string' ? value.provider : null;
  const type = typeof value.type === 'string' ? value.type : null;
  const source = typeof value.source === 'string' ? value.source : null;
  const id = typeof value.id === 'string' ? value.id : null;

  const providerMatch = Boolean(provider && GOOGLE_CALENDAR_PROVIDERS.has(provider))
    || Boolean(type && GOOGLE_CALENDAR_PROVIDERS.has(type));
  const sourceMatch = Boolean(source && GOOGLE_CALENDAR_SOURCES.has(source));

  const hasDateRange =
    ('start_at' in value && 'end_at' in value)
    || ('start' in value && 'end' in value);
  const hasEventId =
    typeof value.provider_event_id === 'string'
    || typeof value.google_event_id === 'string'
    || typeof value.outlook_event_id === 'string'
    || Boolean(id && (id.startsWith('google-') || id.startsWith('outlook-')));
  const hasSummary =
    typeof value.summary === 'string'
    || typeof value.title === 'string'
    || typeof value.subject === 'string';

  return hasDateRange && hasSummary && (providerMatch || sourceMatch || hasEventId);
}

/**
 * Type guard to check if a table name is a Google-restricted table
 */
export function isGoogleRestrictedTable(tableName: string): boolean {
  return GOOGLE_DATA_POLICY.RESTRICTED_TABLES.includes(
    tableName as (typeof GOOGLE_DATA_POLICY.RESTRICTED_TABLES)[number]
  );
}

/**
 * Helper function to recursively check values for forbidden fields.
 * Handles unlimited nesting depth and array elements.
 */
function checkValueRecursively(
  value: unknown,
  context: string,
  path: string = ''
): void {
  if (value === null || value === undefined) return;

  if (hasGoogleCalendarMarker(value)) {
    throw new Error(
      `[GoogleCompliance] Google Calendar marker detected in AI context: ${context}. ` +
        `Google Calendar data must not be sent to AI services. ` +
        `See lib/ai/google-compliance.ts for policy details.`
    );
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      checkValueRecursively(item, context, `${path}[${index}]`);
    });
    return;
  }

  if (typeof value !== 'object') return;

  const obj = value as Record<string, unknown>;
  if (looksLikeCalendarEvent(obj)) {
    const location = path || 'root';
    throw new Error(
      `[GoogleCompliance] Calendar event data detected at "${location}" in AI context: ${context}. ` +
        `Google Calendar data must not be sent to AI services. ` +
        `See lib/ai/google-compliance.ts for policy details.`
    );
  }

  for (const [key, childValue] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (
      FORBIDDEN_AI_FIELDS.includes(key as (typeof FORBIDDEN_AI_FIELDS)[number]) &&
      childValue !== undefined &&
      childValue !== null
    ) {
      throw new Error(
        `[GoogleCompliance] Forbidden field "${currentPath}" detected in AI context: ${context}. ` +
          `Google Calendar data must not be sent to AI services. ` +
          `See lib/ai/google-compliance.ts for policy details.`
      );
    }

    checkValueRecursively(childValue, context, currentPath);
  }
}

/**
 * Runtime guard to validate that data being sent to AI does not contain
 * Google Calendar fields. Throws an error if forbidden fields are detected.
 *
 * Features:
 * - Unlimited recursive depth checking
 * - Array element checking
 * - Checks 15+ forbidden Google Calendar fields
 *
 * @param data - The data object to validate
 * @param context - A description of where this check is being performed (for error messages)
 * @throws Error if any forbidden Google Calendar fields are detected
 *
 * @example
 * ```typescript
 * // Before sending data to OpenAI
 * assertNoGoogleCalendarData(bookingData, 'activity-suggester.generateAISuggestions');
 * ```
 */
export function assertNoGoogleCalendarData(
  data: unknown,
  context: string
): void {
  checkValueRecursively(data, context);
}

function findRestrictedSources(sources: string[]): string[] {
  return sources.filter((source) => {
    const normalized = source.toLowerCase();
    return GOOGLE_DATA_POLICY.RESTRICTED_TABLES.some((table) =>
      normalized === table || normalized.startsWith(`${table}.`) || normalized.includes(`${table}.`)
    );
  });
}

export function assertNoGoogleCalendarSources(
  sources: string[],
  context: string
): void {
  const restricted = findRestrictedSources(sources);
  if (restricted.length === 0) return;

  throw new Error(
    `[GoogleCompliance] Restricted source(s) [${restricted.join(', ')}] detected in AI context: ${context}. ` +
      `Google Calendar data must not be sent to AI services. ` +
      `See lib/ai/google-compliance.ts for policy details.`
  );
}

export function assertGoogleDataIsolation(params: {
  provider: 'openai' | 'deepgram' | 'azure_speech';
  context: string;
  data?: unknown;
  sources: string[];
}): void {
  const sources = params.sources;
  if (!sources.length) {
    throw new Error(
      `[GoogleCompliance] Missing data source list for AI context: ${params.context}. ` +
        `Provide explicit sources to maintain an auditable data boundary.`
    );
  }
  const auditContext = `${params.context} provider=${params.provider}${
    sources.length ? ` sources=${sources.join(',')}` : ''
  }`;

  try {
    if (sources.length) {
      assertNoGoogleCalendarSources(sources, params.context);
    }
    if (params.data !== undefined) {
      assertNoGoogleCalendarData(params.data, params.context);
    }
    logComplianceCheck(auditContext, true);
  } catch (error) {
    logComplianceCheck(auditContext, false);
    throw error;
  }
}

/**
 * Type for fields that are stripped by sanitizeForAI
 */
type GoogleCalendarFields =
  | 'google_event_id'
  | 'outlook_event_id'
  | 'provider_event_id'
  | 'calendar_id'
  | 'provider_account_id';

/**
 * Sanitize data before sending to AI services.
 * Strips any fields that might contain external calendar references.
 *
 * @param data - The data object to sanitize
 * @param context - A description of where this sanitization is being performed
 * @returns The sanitized data object without Google Calendar fields
 *
 * @example
 * ```typescript
 * const safeData = sanitizeForAI(bookingData, 'briefing-generator');
 * // safeData will not contain google_event_id, provider_event_id, etc.
 * ```
 */
export function sanitizeForAI<T extends Record<string, unknown>>(
  data: T,
  context: string
): Omit<T, GoogleCalendarFields> {
  // First, assert that the data doesn't already contain forbidden fields
  // This serves as a double-check and audit trail
  assertNoGoogleCalendarData(data, context);

  // Destructure and remove any calendar-related fields (defensive)
  const {
    google_event_id,
    outlook_event_id,
    provider_event_id,
    calendar_id,
    provider_account_id,
    access_token_encrypted,
    refresh_token_encrypted,
    ...sanitized
  } = data;

  return sanitized as Omit<T, GoogleCalendarFields>;
}

/**
 * Compliance documentation for Google verification review.
 * This object provides a structured summary of data handling practices.
 */
export const COMPLIANCE_DOCUMENTATION = {
  version: '1.1.0',
  lastUpdated: '2026-02-21',
  policyName: 'TutorLingua Google Calendar Data Isolation Policy',

  dataFlowSummary: `
External calendar data (Google Calendar, Outlook) is stored in the
'calendar_events' table and is used ONLY for:
1. Calculating availability windows (conflict detection)
2. Rendering calendar UI views for tutors

This data is NEVER sent to:
- OpenAI (lesson analysis, activity suggestions, briefings)
- Deepgram (transcription services)
- Microsoft Azure Speech (pronunciation assessment)
- Any other third-party AI/ML service

The isolation is enforced at multiple levels:
1. Database schema: calendar_events is separate from bookings
2. Runtime guards: assertNoGoogleCalendarData() throws if Google data detected
3. Code organization: AI modules never import calendar modules
  `.trim(),

  isolatedTables: {
    calendar_events: {
      description: 'Stores cached external calendar events for availability checking only',
      fields: ['provider', 'provider_event_id', 'start_at', 'end_at', 'summary'],
      aiAccess: false,
    },
    calendar_connections: {
      description: 'Stores encrypted OAuth tokens for calendar sync',
      fields: ['access_token_encrypted', 'refresh_token_encrypted', 'provider_account_id'],
      aiAccess: false,
    },
  },

  aiServiceTables: {
    bookings: {
      description: 'Internal lesson bookings created through TutorLingua',
      aiAccess: true,
      note: 'Contains NO external calendar data',
    },
    lesson_recordings: {
      description: 'Deepgram transcripts of lesson audio recordings',
      aiAccess: true,
      note: 'Audio transcripts only, no calendar metadata',
    },
    students: {
      description: 'Student profiles and learning preferences',
      aiAccess: true,
      note: 'Contains NO calendar data',
    },
    student_language_profiles: {
      description: 'Language learning progress and L1 interference patterns',
      aiAccess: true,
      note: 'Contains NO calendar data',
    },
  },

  aiServices: {
    openai: {
      uses: ['Lesson analysis', 'Activity suggestions', 'Briefing generation', 'Grammar correction'],
      receivesGoogleData: false,
    },
    deepgram: {
      uses: ['Speech-to-text transcription of lesson recordings'],
      receivesGoogleData: false,
    },
    azure_speech: {
      uses: ['Pronunciation assessment and speech recognition'],
      receivesGoogleData: false,
    },
  },

  enforcementMechanisms: [
    'assertGoogleDataIsolation() - Required guard for all AI provider calls',
    'assertNoGoogleCalendarData() - Runtime guard that throws on policy violation',
    'sanitizeForAI() - Strips calendar fields before AI processing',
    'markGoogleCalendarData() - Tags external calendar event objects at ingestion',
    'Database schema separation - calendar_events vs bookings tables',
    '@google-compliance JSDoc tags in AI modules',
  ],
} as const;

/**
 * Log a compliance check for audit purposes (non-blocking)
 */
export function logComplianceCheck(context: string, passed: boolean): void {
  if (process.env.NODE_ENV === 'development' || process.env.COMPLIANCE_LOGGING === 'true') {
    console.log(`[GoogleCompliance] Check ${passed ? 'PASSED' : 'FAILED'}: ${context}`);
  }
}
