# AI Practice Companion - Revenue Share & Stripe Setup Guide

This document explains the revenue share structure for the AI Practice Companion feature and the steps required to configure Stripe correctly.

---

## Overview

The **AI Practice Companion** is a subscription-based feature that allows students to practice conversational language skills with an AI tutor between human lessons. Revenue from student subscriptions is split between the platform and the tutor via Stripe Connect.

### Revenue Share Summary

| Recipient | Percentage | On $8 Base |
|-----------|------------|------------|
| Platform  | 38.5%      | $3.08      |
| Tutor     | 61.5%      | $4.92      |

---

## Pricing Structure

Pricing constants are defined in `/lib/practice/constants.ts`:

```typescript
// Base subscription
AI_PRACTICE_BASE_PRICE_CENTS = 800;      // $8/month

// Add-on blocks (metered)
AI_PRACTICE_BLOCK_PRICE_CENTS = 500;     // $5 per block

// Base tier allowances
BASE_AUDIO_MINUTES = 100;                 // 6,000 seconds
BASE_TEXT_TURNS = 300;

// Block allowances (added per block purchased)
BLOCK_AUDIO_MINUTES = 60;                 // 3,600 seconds
BLOCK_TEXT_TURNS = 200;
```

### How It Works

1. **Base Tier ($8/month)**: Student gets 100 audio minutes + 300 text conversation turns
2. **Block Add-ons ($5/block)**: When usage exceeds the base allowance, blocks are auto-purchased
3. **Metered Billing**: Blocks are charged via Stripe metered billing at the end of the billing cycle

---

## Revenue Split Calculation

The platform fee is calculated in `/app/api/practice/subscribe/route.ts`:

```typescript
const PLATFORM_FIXED_FEE_CENTS = 300;        // $3.00 target
const PLATFORM_VARIABLE_FEE_PERCENT = 1;     // +1% variable

// Effective application fee percentage
const APPLICATION_FEE_PERCENT =
  (PLATFORM_FIXED_FEE_CENTS / AI_PRACTICE_BASE_PRICE_CENTS) * 100
  + PLATFORM_VARIABLE_FEE_PERCENT;
// Result: 38.5%
```

### Example Revenue Breakdown

**Monthly subscription with 2 add-on blocks:**

| Item | Student Pays | Platform (38.5%) | Tutor (61.5%) |
|------|--------------|------------------|---------------|
| Base subscription | $8.00 | $3.08 | $4.92 |
| Block 1 | $5.00 | $1.93 | $3.07 |
| Block 2 | $5.00 | $1.93 | $3.07 |
| **Total** | **$18.00** | **$6.94** | **$11.06** |

---

## Stripe Products & Prices

Two Stripe products are required for AI Practice subscriptions. These are **auto-created** by the code on first subscription if they don't exist.

### 1. AI Practice Companion - Base

| Property | Value |
|----------|-------|
| Product Name | `AI Practice Companion - Base` |
| metadata.type | `ai_practice_base` |
| Price | $8.00 (800 cents) |
| Billing | Recurring monthly (fixed) |

### 2. AI Practice Block

| Property | Value |
|----------|-------|
| Product Name | `AI Practice Block` |
| metadata.type | `ai_practice_block` |
| Price | $5.00 (500 cents) per block |
| Billing | Recurring monthly (metered) |
| Usage Type | `metered` |
| Aggregate Usage | `sum` |

---

## Stripe Connect Integration

AI Practice subscriptions use Stripe Connect destination charges to route payments to tutors.

### Checkout Session Configuration

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: customerId,
  line_items: [
    { price: basePrice.id, quantity: 1 },
    { price: blockPrice.id },  // Metered - no quantity
  ],
  subscription_data: {
    on_behalf_of: tutor.stripe_account_id,
    application_fee_percent: 38.5,
    transfer_data: {
      destination: tutor.stripe_account_id,
    },
    metadata: {
      studentId,
      tutorId,
      type: "ai_practice",
    },
  },
  // ...
});
```

### Requirements

- Tutor must have completed Stripe Connect onboarding
- `stripe_account_id` must be set on tutor's profile
- `stripe_charges_enabled` must be `true`

---

## Webhook Events

The webhook handler at `/api/stripe/webhook/route.ts` processes these events:

### checkout.session.completed

When a student completes the AI Practice checkout:
1. Subscription is activated
2. Student record updated with subscription details

### customer.subscription.created / updated

When the subscription is created:
1. Extract the metered subscription item ID for block billing
2. Store in `students.ai_practice_block_subscription_item_id`
3. Create initial usage period in `practice_usage_periods`

### Subscription Metadata

The subscription contains metadata for tracking:

```typescript
metadata: {
  studentId: string,
  tutorId: string,
  type: "ai_practice",
  platform_fixed_fee_cents: "300",
  platform_variable_fee_percent: "1",
  base_audio_minutes: "100",
  base_text_turns: "300",
  block_audio_minutes: "60",
  block_text_turns: "200",
}
```

---

## Usage Tracking & Metered Billing

### Database Tables

**practice_usage_periods**
- Tracks usage per billing cycle per student
- Fields: `audio_seconds_used`, `text_turns_used`, `blocks_consumed`
- Synced with Stripe subscription period dates

**practice_block_ledger**
- Audit trail for block purchases
- Fields: `blocks_consumed`, `trigger_type`, `usage_at_trigger`, `stripe_usage_record_id`

### Usage Flow

1. Student sends message in AI Practice chat
2. System increments `text_turns_used` in `practice_usage_periods`
3. Check if usage exceeds allowance:
   ```
   allowance = BASE_TEXT_TURNS + (blocks_consumed * BLOCK_TEXT_TURNS)
   ```
4. If exceeded, auto-purchase a block:
   - Increment `blocks_consumed`
   - Record in `practice_block_ledger`
   - Report to Stripe via metered billing API

### Reporting Usage to Stripe

```typescript
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,  // ai_practice_block_subscription_item_id
  {
    quantity: 1,  // Number of blocks
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  }
);
```

---

## Stripe Dashboard Setup

### Step 1: Enable Stripe Connect

1. Go to Stripe Dashboard > Connect
2. Enable Express accounts
3. Configure branding and business settings

### Step 2: Configure Webhook Endpoint

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `account.updated`
   - `account.application.deauthorized`
4. Copy the signing secret

### Step 3: Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for checkout redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 4: Verify Products (Optional)

Products are auto-created, but you can verify in Stripe Dashboard > Products:
- Look for "AI Practice Companion - Base" with metadata `type: ai_practice_base`
- Look for "AI Practice Block" with metadata `type: ai_practice_block`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/lib/practice/constants.ts` | Pricing and allowance constants |
| `/app/api/practice/subscribe/route.ts` | Checkout session creation with platform fees |
| `/app/api/practice/chat/route.ts` | Usage tracking and block billing |
| `/app/api/practice/usage/route.ts` | Usage status endpoint |
| `/app/api/stripe/webhook/route.ts` | Subscription webhook handlers |
| `/supabase/migrations/20251210100000_practice_usage_billing.sql` | Database schema |

---

## Student Fields (Database)

The `students` table has these AI Practice-related columns:

| Column | Type | Purpose |
|--------|------|---------|
| `ai_practice_enabled` | boolean | Feature enabled flag |
| `ai_practice_subscription_id` | text | Stripe subscription ID |
| `ai_practice_customer_id` | text | Stripe customer ID |
| `ai_practice_block_subscription_item_id` | text | Metered item ID for usage reporting |
| `ai_practice_current_period_end` | timestamptz | Current billing period end |
| `ai_audio_enabled` | boolean | Audio input enabled |
| `ai_audio_seconds_limit` | integer | Audio seconds limit override |

---

## Troubleshooting

### Subscription Not Activating

1. Check webhook logs in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check `processed_stripe_events` table for duplicate processing

### Blocks Not Being Charged

1. Verify `ai_practice_block_subscription_item_id` is stored on student
2. Check `practice_block_ledger` for recorded purchases
3. Verify metered usage records in Stripe Dashboard > Subscriptions

### Tutor Not Receiving Payouts

1. Verify tutor has `stripe_charges_enabled = true`
2. Check Connect account status in Stripe Dashboard
3. Verify `stripe_account_id` is set on tutor profile

---

## Revenue Flow Diagram

```
Student subscribes to AI Practice ($8/month + usage)
                    |
                    v
        Stripe Checkout Session
        (on_behalf_of: tutor)
                    |
                    v
    +---------------+---------------+
    |                               |
    v                               v
Platform receives           Tutor receives
38.5% application fee      61.5% via Connect
($3.08 on $8 base)         ($4.92 on $8 base)
```

---

*Last updated: December 2024*
