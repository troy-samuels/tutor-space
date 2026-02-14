/**
 * Centralised sharing utilities for TutorLingua viral mechanics.
 *
 * All share links, messages, and Web Share API calls go through here
 * so we maintain a consistent format and tracking.
 */

// ---------------------------------------------------------------------------
// URL Generators
// ---------------------------------------------------------------------------

function getOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
}

/** Generate a shareable result URL with OG metadata. */
export function generateResultUrl(sessionId: string): string {
  return `${getOrigin()}/practice/result/${sessionId}`;
}

/** Generate a challenge URL that pre-fills the opponent's score. */
export function generateChallengeUrl(challengeId: string): string {
  return `${getOrigin()}/practice/challenge/${challengeId}`;
}

/** Generate a tutor referral URL. */
export function generateTutorReferralUrl(username: string): string {
  return `${getOrigin()}/join/tutor-ref/${username}`;
}

/** Generate a student invite URL from a tutor. */
export function generateStudentInviteUrl(token: string): string {
  return `${getOrigin()}/join/${token}`;
}

/** Generate a tutor public profile URL. */
export function generateProfileUrl(username: string): string {
  return `${getOrigin()}/${username}`;
}

// ---------------------------------------------------------------------------
// Share Messages
// ---------------------------------------------------------------------------

export type ShareContext =
  | { type: "result"; score: number; language: string; level: string; sessionId: string }
  | { type: "challenge"; challengeId: string; challengerName: string; score: number; language: string }
  | { type: "streak"; streak: number }
  | { type: "tutor-referral"; username: string; tutorName: string }
  | { type: "student-invite"; token: string; tutorName: string };

/** Build a share message for a given context. */
export function buildShareMessage(ctx: ShareContext): { title: string; text: string; url: string } {
  switch (ctx.type) {
    case "result":
      return {
        title: `I scored ${ctx.score}% in ${ctx.language}!`,
        text: `I just scored ${ctx.score}% on a ${ctx.level} ${ctx.language} quiz on TutorLingua. Think you can beat me?`,
        url: generateResultUrl(ctx.sessionId),
      };
    case "challenge":
      return {
        title: `${ctx.challengerName} challenged you!`,
        text: `${ctx.challengerName} scored ${ctx.score}% in ${ctx.language}. Can you beat them?`,
        url: generateChallengeUrl(ctx.challengeId),
      };
    case "streak":
      return {
        title: `${ctx.streak}-day learning streak! 🔥`,
        text: `I'm on a ${ctx.streak}-day learning streak on TutorLingua!`,
        url: `${getOrigin()}/practice`,
      };
    case "tutor-referral":
      return {
        title: `Join TutorLingua`,
        text: `${ctx.tutorName} invited you to teach on TutorLingua — manage bookings, payments, and students in one place.`,
        url: generateTutorReferralUrl(ctx.username),
      };
    case "student-invite":
      return {
        title: `Book a lesson with ${ctx.tutorName}`,
        text: `${ctx.tutorName} has invited you to book lessons on TutorLingua.`,
        url: generateStudentInviteUrl(ctx.token),
      };
  }
}

// ---------------------------------------------------------------------------
// Web Share API / Clipboard
// ---------------------------------------------------------------------------

export type ShareResult = { success: boolean; method: "native" | "clipboard" | "none" };

/**
 * Share content using the best available method.
 * Tries Web Share API first, falls back to clipboard.
 */
export async function share(ctx: ShareContext): Promise<ShareResult> {
  const { title, text, url } = buildShareMessage(ctx);

  // Try native Web Share API (mobile-first)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: "native" };
    } catch {
      // User cancelled or API failed — fall through to clipboard
    }
  }

  // Fallback: copy URL to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, method: "clipboard" };
    } catch {
      // Clipboard failed
    }
  }

  return { success: false, method: "none" };
}

// ---------------------------------------------------------------------------
// Deep link helpers (for WhatsApp, email, etc.)
// ---------------------------------------------------------------------------

export function whatsappShareUrl(ctx: ShareContext): string {
  const { text, url } = buildShareMessage(ctx);
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function emailShareUrl(ctx: ShareContext): string {
  const { title, text, url } = buildShareMessage(ctx);
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
}
