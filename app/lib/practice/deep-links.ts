const DEFAULT_APP_URL = "https://tutorlingua.com";

/**
 * Returns the canonical app origin used for shareable deep links.
 *
 * @returns Absolute app origin without trailing slash.
 */
function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl = configured && configured.length > 0 ? configured : DEFAULT_APP_URL;
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Builds the assigned-practice deep link sent by tutors.
 *
 * @param params - Assignment and tutor metadata.
 * @returns Public practice start URL.
 */
export function generatePracticeDeepLink(params: {
  assignmentId: string;
  tutorUsername: string;
  studentName?: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const url = new URL(
    `/practice/start/${encodeURIComponent(params.assignmentId)}`,
    `${baseUrl}/`
  );

  if (params.tutorUsername.trim().length > 0) {
    url.searchParams.set("ref", params.tutorUsername.trim());
  }

  if (params.studentName && params.studentName.trim().length > 0) {
    url.searchParams.set("student", params.studentName.trim());
  }

  return url.toString();
}

/**
 * Builds a public result URL for sharing a completed practice session.
 *
 * @param params - Result metadata.
 * @returns Public practice result URL.
 */
export function generateShareableResultLink(params: {
  sessionId: string;
  language: string;
  score: number;
  level: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const url = new URL(`/practice/result/${encodeURIComponent(params.sessionId)}`, `${baseUrl}/`);
  return url.toString();
}

/**
 * Builds a challenge link that carries the challenger baseline score.
 *
 * @param params - Challenger metadata.
 * @returns Public practice challenge URL.
 */
export function generateChallengeLink(params: {
  challengerId: string;
  language: string;
  level: string;
  score: number;
}): string {
  const baseUrl = getAppBaseUrl();
  const url = new URL(
    `/practice/challenge/${encodeURIComponent(params.challengerId)}`,
    `${baseUrl}/`
  );

  url.searchParams.set("lang", params.language);
  url.searchParams.set("level", params.level);
  return url.toString();
}

/**
 * Builds the tutor referral URL used in the marketing referral programme.
 *
 * @param params - Referring tutor metadata.
 * @returns Public referral signup URL.
 */
export function generateTutorReferralLink(params: {
  tutorId: string;
  tutorUsername: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const url = new URL(`/join/tutor-ref/${encodeURIComponent(params.tutorUsername)}`, `${baseUrl}/`);
  return url.toString();
}
