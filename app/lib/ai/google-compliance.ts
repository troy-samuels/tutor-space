/**
 * Google Calendar Data Compliance Module
 *
 * This module enforces data isolation between Google Calendar data
 * and AI/LLM services to comply with Google's API verification requirements.
 *
 * POLICY: Google Calendar data (from calendar_events and calendar_connections tables)
 * is NEVER sent to OpenAI, Deepgram, or any third-party AI service.
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
  'google_event_id',
  'outlook_event_id',
  'provider_event_id',
  'calendar_id',
  'provider_account_id',
  'external_calendar_title',
  'external_calendar_description',
  'access_token_encrypted',
  'refresh_token_encrypted',
] as const;

/**
 * Type guard to check if a table name is a Google-restricted table
 */
export function isGoogleRestrictedTable(tableName: string): boolean {
  return GOOGLE_DATA_POLICY.RESTRICTED_TABLES.includes(
    tableName as (typeof GOOGLE_DATA_POLICY.RESTRICTED_TABLES)[number]
  );
}

/**
 * Runtime guard to validate that data being sent to AI does not contain
 * Google Calendar fields. Throws an error if forbidden fields are detected.
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
export function assertNoGoogleCalendarData<T extends Record<string, unknown>>(
  data: T,
  context: string
): void {
  for (const field of FORBIDDEN_AI_FIELDS) {
    if (field in data && data[field] !== undefined && data[field] !== null) {
      throw new Error(
        `[GoogleCompliance] Forbidden field "${field}" detected in AI context: ${context}. ` +
          `Google Calendar data must not be sent to AI services. ` +
          `See lib/ai/google-compliance.ts for policy details.`
      );
    }
  }

  // Also check nested objects (one level deep)
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const field of FORBIDDEN_AI_FIELDS) {
        if (field in value && (value as Record<string, unknown>)[field] !== undefined) {
          throw new Error(
            `[GoogleCompliance] Forbidden field "${key}.${field}" detected in AI context: ${context}. ` +
              `Google Calendar data must not be sent to AI services.`
          );
        }
      }
    }
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
  version: '1.0.0',
  lastUpdated: '2026-01-12',
  policyName: 'TutorLingua Google Calendar Data Isolation Policy',

  dataFlowSummary: `
External calendar data (Google Calendar, Outlook) is stored in the
'calendar_events' table and is used ONLY for:
1. Calculating availability windows (conflict detection)
2. Rendering calendar UI views for tutors

This data is NEVER sent to:
- OpenAI (lesson analysis, activity suggestions, briefings)
- Deepgram (transcription services)
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
  },

  enforcementMechanisms: [
    'assertNoGoogleCalendarData() - Runtime guard that throws on policy violation',
    'sanitizeForAI() - Strips calendar fields before AI processing',
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
