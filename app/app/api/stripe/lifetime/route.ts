import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import { computeFounderPrice, getFounderPlanName, getFounderOfferLimit } from "@/lib/pricing/founder";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Founder lifetime is limited to the first N tutors
    const limit = getFounderOfferLimit();

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const { count: founderCount, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("plan", "founder_lifetime");

    if (countError) {
      console.error("[Stripe] Failed to count founder seats", countError);
      return NextResponse.json({ error: "Unable to verify offer availability" }, { status: 500 });
    }

    const claimed = founderCount ?? 0;
    const hasFounderAccess = existingProfile?.plan === "founder_lifetime";
    if (!hasFounderAccess && claimed >= limit) {
      return NextResponse.json(
        { error: "Founder lifetime offer is sold out. Join the waitlist to be notified of the next release." },
        { status: 403 }
      );
    }

    const price = computeFounderPrice(request.headers.get("accept-language"));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    const successUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=success`;
    const cancelUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=cancel`;

    const customer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      metadata: {
        profileId: user.id,
      },
    });

    const priceId = process.env.STRIPE_LIFETIME_PRICE_ID;
    const usePriceId = price.currency.toLowerCase() === "gbp" && !!priceId;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      allow_promotion_codes: false,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: usePriceId
        ? [
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: price.currency.toLowerCase(),
                product_data: {
                  name: "TutorLingua lifetime access",
                  description: "2 months free, then lifetime access for a one-time payment.",
                },
                unit_amount: price.amountCents,
              },
              quantity: 1,
            },
          ],
      metadata: {
        userId: user.id,
        plan: getFounderPlanName(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Lifetime checkout error", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
