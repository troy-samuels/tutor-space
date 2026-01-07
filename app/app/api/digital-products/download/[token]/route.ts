import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { handleDownload, DOWNLOAD_RATE_LIMIT_CONFIG } from "@/lib/actions/marketplace";

/**
 * GET /api/digital-products/download/[token]
 *
 * Secure file download endpoint with:
 * - Rate limiting: 3 downloads per token per hour
 * - Optimistic locking to prevent race conditions
 * - Audit trail for every download attempt
 * - IP tracking for fraud detection
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	// Rate limit: 3 download attempts per token per hour
	// (Previously was 10/5min, now stricter for abuse prevention)
	const rateLimitResult = await rateLimit(request, {
		limit: DOWNLOAD_RATE_LIMIT_CONFIG.maxDownloads,
		window: DOWNLOAD_RATE_LIMIT_CONFIG.windowMs,
	});

	if (!rateLimitResult.success) {
		return NextResponse.json(
			{ error: "Download limit exceeded. Please try again in 1 hour." },
			{ status: 429 }
		);
	}

	const { token } = await params;

	// Get client IP
	const clientIp =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown";

	// Handle download using marketplace action
	const result = await handleDownload(token, clientIp);

	if (result.error) {
		// Map errors to appropriate HTTP status codes
		const statusCode = getStatusCode(result.error);
		return NextResponse.json({ error: result.error }, { status: statusCode });
	}

	if (!result.data?.redirectUrl) {
		return NextResponse.json({ error: "Unable to generate download link." }, { status: 500 });
	}

	return NextResponse.redirect(result.data.redirectUrl, { status: 302 });
}

/**
 * Map error messages to HTTP status codes.
 */
function getStatusCode(error: string): number {
	if (error.includes("not found")) return 404;
	if (error.includes("Payment pending")) return 403;
	if (error.includes("limit reached") || error.includes("concurrent")) return 403;
	if (error.includes("unavailable")) return 404;
	return 500;
}
