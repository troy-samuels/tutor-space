import type {
	RouteStudentPaymentDecision,
	RouteStudentPaymentInput,
} from "@/lib/types/payments";

export function routeStudentPayment(input: RouteStudentPaymentInput): RouteStudentPaymentDecision {
	const { tutorStripe, hasPaymentLink } = input;

	if (tutorStripe.accountId && tutorStripe.chargesEnabled) {
		return { route: "connect_destination", reason: "connect_ready" };
	}

	if (hasPaymentLink) {
		return { route: "payment_link", reason: "use_payment_link" };
	}

	return { route: "platform_fallback", reason: "connect_not_ready_fallback" };
}


