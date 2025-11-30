import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { IssueRefundButton } from "@/components/admin/IssueRefundButton";

type RefundRow = {
  id: string;
  tutor_id: string;
  student_id: string | null;
  booking_id: string | null;
  amount_cents: number;
  currency: string;
  reason: string | null;
  created_at: string;
  bookings: {
    stripe_payment_intent_id: string | null;
    payment_amount: number | null;
    currency: string | null;
    students: { full_name: string | null; email: string | null } | null;
    services: { name: string | null } | null;
  } | null;
};

export default async function AdminRefundsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Refund Requests</h1>
        <p className="text-sm text-muted-foreground mt-2">Admin client unavailable.</p>
      </div>
    );
  }

  const { data } = await adminClient
    .from("refund_requests")
    .select(
      `
      id,
      tutor_id,
      student_id,
      booking_id,
      amount_cents,
      currency,
      reason,
      created_at,
      bookings:bookings!refund_requests_booking_id_fkey(
        stripe_payment_intent_id,
        payment_amount,
        currency,
        students(full_name, email),
        services(name)
      )
    `
    )
    .eq("status", "requested")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data as RefundRow[] | null) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Refund Requests</h1>
        <p className="text-sm text-muted-foreground">Approve and issue refunds</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">No pending requests.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const amount = r.amount_cents;
                const currency = r.currency ?? r.bookings?.currency ?? "USD";
                const studentName = r.bookings?.students?.full_name ?? "Student";
                const studentEmail = r.bookings?.students?.email ?? "";
                const serviceName = r.bookings?.services?.name ?? "Lesson";
                const pi = r.bookings?.stripe_payment_intent_id ?? null;

                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{studentName}</span>
                        <span className="text-xs text-muted-foreground">{studentEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{serviceName}</td>
                    <td className="px-4 py-2">
                      {currency} {(amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 max-w-[320px] truncate">{r.reason ?? "-"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <IssueRefundButton
                          refundRequestId={r.id}
                          tutorId={r.tutor_id}
                          studentId={r.student_id}
                          bookingId={r.booking_id}
                          amountCents={amount}
                          currency={currency}
                          paymentIntentId={pi}
                          adminUserId={user?.id ?? "unknown"}
                        />
                        {!pi && <span className="text-xs text-muted-foreground">Missing payment intent</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


