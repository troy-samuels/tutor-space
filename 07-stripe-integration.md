# 07 - Stripe Integration

## Objective

Connect TutorLingua to Stripe so tutors can accept payments for services, session packages, subscriptions, and add-ons. This includes customer creation, checkout flows, webhooks, invoices, multi-currency handling, and entitlements (Professional/Growth/Studio).

## Prerequisites

- ✅ **06-service-listings.md** — Services with pricing and package metadata  
- ✅ **01-database-schema.md** — `services`, `session_package_purchases`, `subscriptions`, `invoices` tables  
- ✅ **02-authentication.md** — Auth/entitlements to gate plan upgrades  
- Stripe account (test mode) and API keys populated in `.env.local`  
- Webhook tunnel ready (Stripe CLI or ngrok) for local testing

## Deliverables

- Stripe server utilities (`lib/stripe.ts`) configured with API keys  
- Checkout endpoints for one-time services, session packages, and subscriptions  
- Optional payment link generation (Stripe Payment Links + PayPal checkout fallback)  
- Webhook handler updating Supabase (`checkout.session.completed`, `invoice.paid`, etc.)  
- Customer portal link for tutors to manage their own subscription  
- Billing settings UI in `/settings/billing`  
- Growth/Studio entitlements set based on subscription plan

## Implementation Steps

### Step 1: Install Stripe Packages

```bash
npm install stripe @stripe/stripe-js
```

Add type definitions if not already present:

```bash
npm install -D @types/stripe-event-types
```

### Step 2: Configure Environment Variables

Update `.env.local` (already scaffolded in **00-project-setup.md**):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> For growth features, add `STRIPE_PRO_PRICE_ID`, `STRIPE_STUDIO_PRICE_ID`, etc., or fetch dynamically via API.

### Step 3: Stripe Client Wrapper

```ts
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

For client-side usage (checkout redirect), create:

```ts
// lib/stripe-browser.ts
import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () =>
  loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
```

### Step 4: Supabase Stripe Mapping

Ensure `profiles` has `stripe_customer_id`. When user signs up or accesses billing for first time, create Stripe customer:

```ts
// lib/actions/stripe.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function ensureCustomer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (error) return { error: error.message }
  if (profile.stripe_customer_id) return { customerId: profile.stripe_customer_id }

  const customer = await stripe.customers.create({
    email: profile.email ?? user.email,
    name: profile.full_name ?? undefined,
    metadata: {
      supabase_user_id: profile.id,
    },
  })

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', profile.id)

  return { customerId: customer.id }
}
```

### Step 5: Create Checkout Session for One-Time Service

Route Handler at `/app/api/checkout/service/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { ensureCustomer } from '@/lib/actions/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { serviceId, packageId, successUrl, cancelUrl } = await req.json()
  const { customerId, error } = await ensureCustomer()
  if (error || !customerId) return NextResponse.json({ error }, { status: 401 })

  const supabase = await createClient()
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const lineItems = [
    {
      price_data: {
        currency: service.currency,
        product_data: {
          name: service.name,
          description: service.description ?? undefined,
        },
        unit_amount: service.price_cents,
      },
      quantity: 1,
    },
  ]

  if (packageId) {
    // fetch package template for add-on
    const { data: packageTemplate } = await supabase
      .from('session_package_templates')
      .select('*')
      .eq('id', packageId)
      .single()
    if (packageTemplate) {
      lineItems.push({
        price_data: {
          currency: packageTemplate.currency,
          product_data: {
            name: packageTemplate.name,
          },
          unit_amount: packageTemplate.price_cents ?? 0,
        },
        quantity: 1,
      })
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/booking/success`,
    cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/services/${service.slug}`,
    allow_promotion_codes: true,
    metadata: {
      service_id: service.id,
      tutor_id: service.tutor_id,
      package_id: packageId ?? '',
    },
  })

  return NextResponse.json({ url: session.url })
}
```

### Step 6: Subscriptions for Tutor Plans

Create route `/app/api/checkout/plan/route.ts` for upgrading from Professional → Growth/Studio:

```ts
const PRICE_MAPPING = {
  growth: process.env.STRIPE_GROWTH_PRICE_ID!,
  studio: process.env.STRIPE_STUDIO_PRICE_ID!,
}

export async function POST(req: Request) {
  const { plan } = await req.json()
  if (!['growth', 'studio'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  const { customerId, error } = await ensureCustomer()
  if (error || !customerId) return NextResponse.json({ error }, { status: 401 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICE_MAPPING[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?plan=${plan}&status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    metadata: { plan },
  })

  return NextResponse.json({ url: session.url })
}
```

### Step 7: Payment Links & PayPal Fallback

- **Stripe Payment Links**: for tutors who want simple “Pay now” buttons (outside booking flow), generate links via `stripe.paymentLinks.create` and store in `services.payment_link_url`. Surface in link-in-bio and parent credibility page.  
- **Invoice links**: for package renewals or manual invoices, use `stripe.invoices.create` with `collection_method: 'send_invoice'`.  
- **PayPal option**: some tutors may require PayPal for certain regions. Provide optional integration plan:  
  - Store PayPal environment keys in `.env.local` (`PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`).  
  - Create Next.js API route to generate PayPal orders via `https://api-m.sandbox.paypal.com/v2/checkout/orders`.  
  - On approval, capture order and mirror data in `invoices` table similar to Stripe.  
  - Clearly mark PayPal as optional add-on and ensure fees + currency handling documented.  
- Update billing UI to toggle PayPal on/off and capture PayPal email.  
- Analytics: track payment method per booking (`payment_method = 'stripe' | 'paypal' | 'cash'`).

### Step 8: Webhook Handler

Create route `/app/api/stripe/webhook/route.ts`:

```ts
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    return new Response(`Webhook Error: ${(error as Error).message}`, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session, supabase)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaid(invoice, supabase)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionChanged(subscription, supabase)
      break
    }
    default:
      break
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

Implement handlers:

```ts
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const serviceId = session.metadata?.service_id
  const tutorId = session.metadata?.tutor_id
  const packageId = session.metadata?.package_id
  const customerId = session.customer as string

  // Lookup Supabase user via customerId
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  if (packageId) {
    await supabase.from('session_package_purchases').insert({
      template_id: packageId || null,
      tutor_id: tutorId,
      student_id: profile.id, // adjust if student separate entity
      stripe_checkout_session_id: session.id,
      total_minutes: session.amount_total ? session.amount_total / 100 : null,
      remaining_minutes: session.amount_total ? session.amount_total / 100 : null, // update with actual package minutes
      status: 'active',
    })
  }

  await supabase.from('invoices').insert({
    tutor_id: tutorId,
    stripe_invoice_id: session.invoice as string,
    status: 'paid',
    total_due_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    auto_reminder_enabled: false,
  })
}

async function handleSubscriptionChanged(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  const customerId = subscription.customer as string
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  if (!profile) return

  const planName = subscription.metadata.plan ?? subscription.items.data[0]?.price?.nickname ?? 'growth'

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      status: subscription.status as any,
      plan_name: planName,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })

  await supabase
    .from('profiles')
    .update({ subscription_status: subscription.status === 'active' ? 'active' : 'past_due' })
    .eq('id', profile.id)
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: SupabaseClient) {
  await supabase
    .from('invoices')
    .update({
      status: invoice.status,
      total_due_cents: invoice.amount_paid,
      currency: invoice.currency,
      stripe_invoice_id: invoice.id,
    })
    .eq('stripe_invoice_id', invoice.id)
}
```

> Ensure webhook endpoint is added in Stripe Dashboard with signing secret.

### Step 9: Customer Portal

Allow tutors to manage plan and payment methods:

```ts
export async function createBillingPortalSession(returnUrl?: string) {
  const { customerId, error } = await ensureCustomer()
  if (error || !customerId) return { error }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  return { url: session.url }
}
```

Expose route handler `/app/api/billing-portal/route.ts` returning URL.

### Step 10: Billing Settings UI

`/app/(dashboard)/settings/billing/page.tsx`:

- Display current plan, renewal date, payment methods.  
- CTA button “Manage billing” → `createBillingPortalSession`.  
- Show upgrade/downgrade cards referencing Growth/Studio features.  
- Provide table of invoices (query Supabase `invoices` with download links from Stripe).

### Step 11: Handling Add-On Modules

- For Studio add-ons (group sessions, marketplace), create Stripe prices and mark `plan_name = 'studio'`.  
- Add ability to purchase add-ons as separate line items (metadata `add_on`).  
- Update entitlements table or `profiles.subscription_status` to include modules array.

### Step 12: Multi-Currency Support

- Use service `currency` when creating price data.  
- Display currency selection in service form (default from profile).  
- For packages, ensure `price_cents` stored per currency.  
- Stripe handles conversions if you create separate Prices per currency.

### Step 13: Testing Stripe Webhooks Locally

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use CLI to trigger events:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Step 14: Analytics & Events

- Track `payment_success`, `plan_upgrade`, `subscription_cancel` via PostHog/Segment.  
- Use Supabase `link_events` to attribute bookings to link-in-bio conversions (tie in later).

### Step 15: Security & Compliance

- Do not store raw card data. Use Stripe Elements/Checkout only.  
- Protect API routes with auth, ensure `service.tutor_id === user.id` to prevent cross-account access.  
- Rate limit checkout endpoints.  
- For invoices, provide VAT/TIN field in profile for tutors who need it.

## Testing Checklist

- [ ] Checkout session launches for 1:1 service and completes successfully.  
- [ ] Package purchase inserts row in `session_package_purchases`.  
- [ ] Webhook updates invoices, package balances, and subscription records.  
- [ ] Tutor can upgrade to Growth/Studio and entitlements update instantly.  
- [ ] Customer portal link works and returns to billing page.  
- [ ] Stripe Payment Links and PayPal checkout (if enabled) route to correct confirmation pages.  
- [ ] Error handling surfaces friendly messages for declined cards.  
- [ ] Multi-currency services create correct Stripe amounts.  
- [ ] Stripe logs show no unexpected 4xx/5xx responses.  
- [ ] Webhook endpoint verified and secure.

## AI Tool Prompts

### Checkout Session
```
Create a Next.js route handler that creates a Stripe Checkout Session for a service.
Inputs: serviceId, packageId, successUrl, cancelUrl.
Ensure the service belongs to the authenticated tutor.
```

### Webhook Handler
```
Write a Stripe webhook handler that processes checkout.session.completed and invoice.paid events.
Update Supabase tables (session_package_purchases, invoices, subscriptions) accordingly.
```

### Billing UI
```
Generate a billing settings page showing the current plan, renewal date, past invoices, and a button to open the Stripe customer portal.
Use shadcn/ui cards and tables.
```

## Common Gotchas

- **Webhook signature**: Always read raw request body; Next.js’s default body parsing may break verification.  
- **Subscription downgrades**: Set `cancel_at_period_end` to avoid immediate feature loss; update entitlements after period end.  
- **Stripe product duplication**: Avoid creating new products on every update; reuse existing product IDs stored in Supabase.  
- **Currency mismatch**: Ensure service currency matches Stripe price currency.  
- **Testing**: Use Stripe test cards (`4242...`) and simulate failure cases (`4000 0000 0000 9995`).

## Next Steps

1. Implement **08-booking-system.md** to enable scheduling after payment.  
2. Set up email receipts and reminders in **11-email-system.md**.  
3. Add analytics in **12-analytics-tracking.md** to monitor revenue.  
4. Expand billing UI to handle refunds or adjustments if needed.

## Success Criteria

✅ Tutors can accept payments for services and packages  
✅ Subscriptions unlock Growth/Studio features automatically  
✅ Webhooks keep Supabase data in sync with Stripe events  
✅ Billing settings provide transparency and self-service options  
✅ Optional Payment Links/PayPal fallback available where required  
✅ Foundation ready for scaling revenue reporting and analytics

**Estimated Time**: 4-6 hours
