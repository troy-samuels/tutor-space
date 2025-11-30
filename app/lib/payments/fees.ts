import type { ApplicationFeePolicy, FeeComputationResult } from "@/lib/types/payments";

export function computeApplicationFee(
	amountCents: number,
	policy: ApplicationFeePolicy
): FeeComputationResult {
	let fee = 0;
	if (policy.type === "flat") {
		fee = Math.max(0, policy.amountCents ?? 0);
	} else {
		const pct = Math.max(0, policy.percent ?? 0);
		fee = Math.round((amountCents * pct) / 100);
		if (policy.minFeeCents != null) {
			fee = Math.max(fee, policy.minFeeCents);
		}
	}
	const net = Math.max(0, amountCents - fee);
	return { applicationFeeCents: fee, netToTutorCents: net };
}


