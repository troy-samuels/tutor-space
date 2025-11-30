import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const priceId = process.env.STRIPE_ALL_ACCESS_PRICE_ID;
    if (!priceId) {
      console.error("[Stripe] Missing STRIPE_ALL_ACCESS_PRICE_ID env var");
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = supabaseAdmin
      ? await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, stripe_customer_id")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null, error: null };

    if (profileError) {
      console.error("[Stripe] Failed to load profile", profileError);
      return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
    }

    const customer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? profile?.email ?? "",
      name: (profile?.full_name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined),
      metadata: {
        profileId: user.id,
      },
    });

    // Keep profile in sync with the Stripe customer ID for webhook handling
    if (supabaseAdmin && profile?.stripe_customer_id !== customer.id) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);

      if (updateError) {
        console.error("[Stripe] Failed to sync stripe_customer_id to profile", updateError);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    const successUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=success`;
    const cancelUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      allow_promotion_codes: false,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        plan: "growth",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Subscription checkout error", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
