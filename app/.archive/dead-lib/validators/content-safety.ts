/**
 * Content Safety Validator
 *
 * Provides spam detection, keyword stuffing detection, and SEO validation
 * for tutor site content to prevent abuse and ensure quality.
 */

// ============================================================================
// Types
// ============================================================================

export interface SiteContentInput {
	headline?: string | null;
	tagline?: string | null;
	about?: string | null;
	aboutTitle?: string | null;
	aboutSubtitle?: string | null;
	aboutBody?: string | null;
}

export interface ValidationResult {
	valid: boolean;
	issues: string[];
	spamScore: number;
}

export interface SEOValidationResult {
	valid: boolean;
	issues: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Patterns commonly associated with spam content.
 * These are case-insensitive.
 */
const SPAM_PATTERNS = [
	// Scam/spam keywords
	/\b(casino|viagra|crypto\s*trading|make\s*money\s*fast)\b/i,
	/\b(investment\s*opportunity|guaranteed\s*returns?)\b/i,
	/\b(get\s*rich\s*quick|earn\s*\$?\d+\s*per\s*(day|hour|week))\b/i,
	/\b(click\s*here\s*to\s*win|free\s*gift|limited\s*time\s*offer)\b/i,
	/\b(act\s*now|don't\s*miss\s*out|urgent)\b/i,
	// Phone number spam (10+ consecutive digits)
	/\d{10,}/,
	// Suspiciously long URLs (100+ chars)
	/https?:\/\/[^\s]{100,}/i,
	// Excessive punctuation (spam indicator)
	/[!?]{4,}/,
	// All caps sections (5+ words)
	/(?:\b[A-Z]{3,}\b\s*){5,}/,
];

/**
 * Domains that are allowed (internal links).
 */
const ALLOWED_DOMAINS = [
	"tutorlingua.co",
	"tutorlingua.com",
	"localhost",
];

/**
 * SEO field length requirements.
 */
const SEO_LIMITS = {
	headline: { min: 10, max: 70 },
	tagline: { min: 20, max: 160 },
	about: { min: 100, max: 5000 },
	serviceName: { min: 3, max: 60 },
} as const;

/**
 * Maximum keyword density before flagging as keyword stuffing.
 * 15% = if any single word appears in more than 15% of total words.
 */
const KEYWORD_STUFFING_THRESHOLD = 0.15;

/**
 * Maximum external links allowed per site.
 */
const MAX_EXTERNAL_LINKS = 10;

// ============================================================================
// Spam Detection
// ============================================================================

/**
 * Check if text matches any spam patterns.
 */
function matchesSpamPatterns(text: string): boolean {
	for (const pattern of SPAM_PATTERNS) {
		if (pattern.test(text)) {
			return true;
		}
	}
	return false;
}

/**
 * Detect keyword stuffing in text.
 * Returns true if any word appears more than threshold % of total words.
 */
function hasKeywordStuffing(text: string): boolean {
	const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
	if (words.length < 20) return false; // Not enough words to judge

	const wordCounts = new Map<string, number>();
	for (const word of words) {
		wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
	}

	const maxCount = Math.max(...wordCounts.values());
	const maxRatio = maxCount / words.length;

	return maxRatio > KEYWORD_STUFFING_THRESHOLD;
}

/**
 * Count external links in text.
 */
function countExternalLinks(text: string): number {
	const urlPattern = /https?:\/\/([^\s/]+)/gi;
	let match;
	let externalCount = 0;

	while ((match = urlPattern.exec(text)) !== null) {
		const domain = match[1].toLowerCase();
		const isInternal = ALLOWED_DOMAINS.some((allowed) =>
			domain.includes(allowed)
		);
		if (!isInternal) {
			externalCount++;
		}
	}

	return externalCount;
}

/**
 * Calculate a spam score from 0 to 1.
 * Higher score = more likely spam.
 */
function calculateSpamScore(text: string): number {
	let score = 0;

	// Spam pattern matches
	if (matchesSpamPatterns(text)) {
		score += 0.4;
	}

	// Keyword stuffing
	if (hasKeywordStuffing(text)) {
		score += 0.25;
	}

	// Excessive external links
	const externalLinks = countExternalLinks(text);
	if (externalLinks > 5) {
		score += 0.15;
	}
	if (externalLinks > MAX_EXTERNAL_LINKS) {
		score += 0.2;
	}

	return Math.min(score, 1);
}

// ============================================================================
// Main Validation Functions
// ============================================================================

/**
 * Validate site content for spam and quality issues.
 *
 * @param site - Site content to validate
 * @returns Validation result with issues and spam score
 *
 * @example
 * const result = validateSiteContent({
 *   headline: "Learn Spanish with Maria",
 *   tagline: "Experienced tutor helping you achieve fluency",
 *   aboutBody: "I have 10 years of experience..."
 * });
 * if (!result.valid) {
 *   console.log("Issues:", result.issues);
 * }
 */
export function validateSiteContent(site: SiteContentInput): ValidationResult {
	const issues: string[] = [];

	// Combine all text fields
	const allText = [
		site.headline,
		site.tagline,
		site.about,
		site.aboutTitle,
		site.aboutSubtitle,
		site.aboutBody,
	]
		.filter(Boolean)
		.join(" ");

	if (!allText.trim()) {
		return { valid: true, issues: [], spamScore: 0 };
	}

	// 1. Spam keyword detection
	if (matchesSpamPatterns(allText)) {
		issues.push("Content contains suspicious patterns that may indicate spam");
	}

	// 2. Keyword stuffing detection
	if (hasKeywordStuffing(allText)) {
		issues.push("Content may contain keyword stuffing (excessive repetition)");
	}

	// 3. External link limits
	const externalLinks = countExternalLinks(allText);
	if (externalLinks > MAX_EXTERNAL_LINKS) {
		issues.push(
			`Too many external links (${externalLinks} found, maximum ${MAX_EXTERNAL_LINKS})`
		);
	}

	const spamScore = calculateSpamScore(allText);

	return {
		valid: issues.length === 0,
		issues,
		spamScore,
	};
}

/**
 * Validate SEO metadata fields for proper lengths.
 *
 * @param site - Site content to validate
 * @returns SEO validation result
 *
 * @example
 * const result = validateSEOMetadata({
 *   headline: "Learn Spanish",  // Too short
 *   tagline: "Hi",              // Too short
 *   aboutBody: "Short bio"      // Too short
 * });
 */
export function validateSEOMetadata(site: SiteContentInput): SEOValidationResult {
	const issues: string[] = [];

	// Headline validation (used as page title)
	const headline = site.headline || site.aboutTitle || "";
	if (headline && headline.length < SEO_LIMITS.headline.min) {
		issues.push(
			`Headline is too short (minimum ${SEO_LIMITS.headline.min} characters)`
		);
	}
	if (headline && headline.length > SEO_LIMITS.headline.max) {
		issues.push(
			`Headline is too long (maximum ${SEO_LIMITS.headline.max} characters)`
		);
	}

	// Tagline validation (used as meta description)
	const tagline = site.tagline || site.aboutSubtitle || "";
	if (tagline && tagline.length < SEO_LIMITS.tagline.min) {
		issues.push(
			`Tagline is too short (minimum ${SEO_LIMITS.tagline.min} characters)`
		);
	}
	if (tagline && tagline.length > SEO_LIMITS.tagline.max) {
		issues.push(
			`Tagline is too long (maximum ${SEO_LIMITS.tagline.max} characters)`
		);
	}

	// About body validation
	const about = site.about || site.aboutBody || "";
	if (about && about.length < SEO_LIMITS.about.min) {
		issues.push(
			`About section is too short (minimum ${SEO_LIMITS.about.min} characters)`
		);
	}
	if (about && about.length > SEO_LIMITS.about.max) {
		issues.push(
			`About section is too long (maximum ${SEO_LIMITS.about.max} characters)`
		);
	}

	return {
		valid: issues.length === 0,
		issues,
	};
}

/**
 * Check if site should be flagged for moderation review.
 *
 * @param spamScore - Spam score from validateSiteContent
 * @param externalLinkCount - Number of external links
 * @param isFirstPublish - Whether this is the tutor's first site publish
 * @param tutorAgeInDays - How old the tutor account is
 * @returns Whether the site should be flagged for review
 */
export function shouldFlagForReview(
	spamScore: number,
	externalLinkCount: number,
	isFirstPublish: boolean,
	tutorAgeInDays: number
): boolean {
	// Flag if spam score is concerning
	if (spamScore > 0.5) {
		return true;
	}

	// Flag if too many external links
	if (externalLinkCount > 5) {
		return true;
	}

	// Flag first-time publishers with new accounts
	if (isFirstPublish && tutorAgeInDays < 30) {
		return true;
	}

	return false;
}

/**
 * Validate a service name for proper length.
 *
 * @param name - Service name to validate
 * @returns Whether the name is valid and any issues
 */
export function validateServiceName(name: string): {
	valid: boolean;
	issue?: string;
} {
	if (!name || name.length < SEO_LIMITS.serviceName.min) {
		return {
			valid: false,
			issue: `Service name must be at least ${SEO_LIMITS.serviceName.min} characters`,
		};
	}
	if (name.length > SEO_LIMITS.serviceName.max) {
		return {
			valid: false,
			issue: `Service name must be at most ${SEO_LIMITS.serviceName.max} characters`,
		};
	}
	return { valid: true };
}
