import type {
	RouteStudentPaymentDecision,
	RouteStudentPaymentInput,
} from "@/lib/types/payments";

export function routeStudentPayment(input: RouteStudentPaymentInput): RouteStudentPaymentDecision {
	const { tutorStripe } = input;

	if (tutorStripe.accountId && tutorStripe.chargesEnabled) {
		return { route: "connect_destination", reason: "connect_ready" };
	}

	return { route: "no_payment_method", reason: "no_payment_method_available" };
}

