import type { SupabaseClient } from "@supabase/supabase-js";

export interface PaymentsAuditRecordInput {
	readonly tutorId: string;
	readonly studentId?: string | null;
	readonly bookingId?: string | null;
	readonly digitalProductPurchaseId?: string | null;
	readonly amountCents: number;
	readonly currency: string;
	readonly applicationFeeCents?: number | null;
	readonly netAmountCents?: number | null;
	readonly stripePaymentIntentId?: string | null;
	readonly stripeChargeId?: string | null;
	readonly destinationAccountId?: string | null;
	readonly paymentType?: "booking" | "digital_product";
}

export async function insertPaymentsAudit(
	client: SupabaseClient,
	input: PaymentsAuditRecordInput
): Promise<void> {
	const { error } = await client.from("payments_audit").insert({
		tutor_id: input.tutorId,
		student_id: input.studentId ?? null,
		booking_id: input.bookingId ?? null,
		digital_product_purchase_id: input.digitalProductPurchaseId ?? null,
		amount_cents: input.amountCents,
		currency: input.currency,
		application_fee_cents: input.applicationFeeCents ?? null,
		net_amount_cents: input.netAmountCents ?? null,
		stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
		stripe_charge_id: input.stripeChargeId ?? null,
		destination_account_id: input.destinationAccountId ?? null,
		payment_type: input.paymentType ?? "booking",
	});
	if (error) {
		throw error;
	}
}


