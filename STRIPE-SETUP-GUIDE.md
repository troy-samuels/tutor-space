# Stripe Connect Setup Guide for Language Tutor Platform

## What This Guide Covers

This guide explains how to set up Stripe Connect so that:
1. **Tutors can receive payments** directly from students who book lessons
2. **You (the platform) take a 1% commission** on each booking
3. **Tutors can upgrade to paid plans** (your $29/month or $49 lifetime upsell)

---

## Good News: Your Code Is Already Built!

Your developer has already built all the code needed. What's missing is the **Stripe Dashboard configuration** - the settings you need to configure in Stripe's website to make everything work.

---

## Part 1: Understanding the Two Payment Flows

### Flow A: Tutors Paying You (Platform Subscription)
```
Tutor → Pays $29/month or $49 lifetime → Goes to YOUR Stripe account
```
This is a normal Stripe payment. The money goes directly to you.

### Flow B: Students Paying Tutors (Booking Payments)
```
Student → Pays for lesson → 99% goes to TUTOR's bank account
                          → 1% goes to YOU (platform fee)
```
This requires "Stripe Connect" - a special Stripe feature that lets you split payments between multiple people.

---

## Part 2: What You Need Before Starting

### Checklist
- [ ] A Stripe account (if you don't have one, go to [stripe.com](https://stripe.com) and sign up)
- [ ] Your business details verified in Stripe
- [ ] Access to your website's environment variables (or your developer can help)

---

## Part 3: Stripe Dashboard Setup (Step-by-Step)

### Step 1: Enable Stripe Connect

1. Log into your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Click **Settings** (gear icon) in the top right
3. Under "Connect", click **Settings**
4. If you see a prompt to "Get started with Connect", click it

### Step 2: Complete Your Platform Profile

This is **required** before tutors can connect their accounts.

1. In Connect Settings, find **Platform profile** or **Business details**
2. Fill in:
   - Your platform name (e.g., "TutorLingua" or your brand name)
   - Your business website URL
   - A description of your business (e.g., "Online marketplace connecting language tutors with students")
   - Your support email and phone number
3. Upload your logo (this appears when tutors sign up)
4. Save all changes

### Step 3: Configure Branding

This makes the tutor onboarding experience look professional.

1. Go to **Connect Settings** → **Branding**
2. Upload:
   - **Icon**: A square logo (at least 128x128 pixels)
   - **Brand color**: Your primary brand color (e.g., #4F46E5 for purple)
3. Set your **Business name** as tutors will see it
4. Save changes

### Step 4: Enable Countries

Choose which countries your tutors can be based in.

1. Go to **Connect Settings** → **Availability**
2. Enable the countries where your tutors operate
   - Common choices: United States, United Kingdom, Canada, Australia, European countries
3. Save changes

### Step 5: Configure Express Account Settings

"Express" accounts are the simplest type - Stripe handles all the complicated stuff.

1. Go to **Connect Settings** → **Express**
2. Make sure "Express accounts" is enabled
3. Under **Capabilities**, ensure these are checked:
   - Card payments
   - Transfers (payouts)
4. Save changes

---

## Part 4: Create Your Products & Prices in Stripe

These are for your **tutor subscription upsell** (not for student bookings).

### Step 1: Create the Monthly Plan ($29/month)

1. Go to **Products** in the left sidebar
2. Click **+ Add product**
3. Fill in:
   - **Name**: "All-Access Monthly" (or your preferred name)
   - **Description**: "Full access to all platform features"
4. Under **Pricing**:
   - Select **Recurring**
   - Price: **$29.00**
   - Billing period: **Monthly**
5. Click **Save product**
6. **Copy the Price ID** (starts with `price_`) - you'll need this!

### Step 2: Create the Yearly Plan (Optional)

1. On the same product, click **+ Add another price**
2. Fill in:
   - Price: **$199.00** (or whatever yearly price you want)
   - Billing period: **Yearly**
3. Click **Save**
4. **Copy this Price ID too**

### Step 3: Create the Lifetime Deal ($49)

1. Click **+ Add product** again
2. Fill in:
   - **Name**: "Founder Lifetime Access"
   - **Description**: "One-time payment for lifetime access"
3. Under **Pricing**:
   - Select **One time**
   - Price: **$49.00**
4. Click **Save product**
5. **Copy the Price ID**

---

## Part 5: Set Up Webhooks

Webhooks let Stripe tell your website when payments happen.

### Step 1: Create the Main Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://YOUR-DOMAIN.com/api/stripe/webhook`
   - Replace `YOUR-DOMAIN.com` with your actual website domain
4. Under **Select events to listen to**, click **+ Select events**
5. Search for and select these events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. **Copy the Signing Secret** (starts with `whsec_`) - you'll need this!

### Step 2: Create the Connect Webhook

This is for events on your tutors' connected accounts - **this is a separate webhook!**

1. Click **+ Add endpoint** again
2. Fill in:
   - **Endpoint URL**: `https://YOUR-DOMAIN.com/api/stripe/webhook` (same URL)
3. **IMPORTANT**: Under "Listen to", select **Events on Connected accounts**
4. Select these events:
   - `account.updated`
   - `account.application.deauthorized`
5. Click **Add endpoint**
6. **Copy this Signing Secret too** (it may be the same or different)

---

## Part 6: Configure Your Environment Variables

Give these values to your developer, or add them to your hosting platform (Vercel, etc.):

```
# Stripe Keys (find in Developers → API keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook Secret (from Step 5)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Step 4)
STRIPE_ALL_ACCESS_PRICE_ID=price_...
STRIPE_ALL_YEAR_ACCESS_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...

# Connect Return URLs
STRIPE_CONNECT_RETURN_URL=https://YOUR-DOMAIN.com/settings/payments
STRIPE_CONNECT_REFRESH_URL=https://YOUR-DOMAIN.com/settings/payments
```

**Important**: Replace `sk_live_` and `pk_live_` keys with your actual keys. Use `sk_test_` and `pk_test_` keys for testing first!

---

## Part 7: Test Mode vs Live Mode

### Always Test First!

Stripe has two modes:
- **Test Mode**: Fake money, no real charges (toggle at top of dashboard)
- **Live Mode**: Real money, real charges

**Steps:**
1. Do all the above steps in **Test Mode** first
2. Use test card number: `4242 4242 4242 4242` (any future date, any CVC)
3. Once everything works, repeat the steps in **Live Mode**

---

## Part 8: What Happens When a Tutor Connects

Here's the journey a tutor takes:

1. **Tutor goes to Settings → Payments** in your app
2. **Clicks "Connect with Stripe"**
3. **Redirected to Stripe's onboarding form** where they:
   - Enter their personal details (name, DOB, address)
   - Enter their bank account for payouts
   - Verify their identity (sometimes a photo ID is required)
4. **Redirected back to your app** when complete
5. **Their status shows as "Connected"** and they can accept payments

The whole process takes 5-10 minutes for the tutor.

---

## Part 9: What Happens When a Student Books

1. Student selects a lesson time and clicks "Book"
2. Redirected to Stripe Checkout page
3. Enters card details and pays
4. Money is collected by Stripe
5. Your webhook receives `checkout.session.completed`
6. Booking is marked as confirmed
7. Money is automatically transferred to tutor's bank (minus your 1% platform fee)

**Payout timing**: By default, Stripe pays tutors 2 business days after the payment.

---

## Part 10: Your Platform Fee (1%)

You have a **1% platform fee** on student bookings. This means:

**Example**: If a student pays $50 for a lesson:
- **$0.50** goes to you (the platform)
- **$49.50** goes to the tutor
- Stripe also takes their processing fee (~2.9% + $0.30) from the tutor's portion

**Where the money appears**: Your 1% fees will show up in your main Stripe account under **Payments** → **All transactions** with the label "Application fee".

---

## Part 11: Common Issues & Solutions

### "Tutors can't connect their Stripe account"
- Check that you've completed the Platform Profile (Part 3, Step 2)
- Make sure their country is enabled (Part 3, Step 4)

### "Webhooks aren't working"
- Verify the webhook URL is correct and your site is deployed
- Check the signing secret matches what's in your environment variables
- Look at **Developers → Webhooks → [your endpoint]** to see failed events

### "Payments aren't going to tutors"
- Check the tutor's Connect status in your app (should show "charges_enabled: true")
- The tutor may need to complete more verification in their Stripe Express dashboard

### "Test mode working but live mode isn't"
- You need to repeat ALL the setup steps in Live mode
- Make sure you're using `sk_live_` and `pk_live_` keys in production

---

## Part 12: Going Live Checklist

Before accepting real payments:

- [ ] Complete Platform Profile in Live mode
- [ ] Create products/prices in Live mode
- [ ] Set up webhooks in Live mode
- [ ] Update environment variables with Live keys
- [ ] Test with a real (small) payment
- [ ] Have at least one tutor complete Connect onboarding

---

## Quick Reference: Key Stripe Dashboard Locations

| What | Where |
|------|-------|
| API Keys | Developers → API keys |
| Webhooks | Developers → Webhooks |
| Connect Settings | Settings → Connect |
| Products & Prices | Products |
| View Connected Accounts | Connect → Accounts |
| View Payments | Payments |

---

## Need Help?

- **Stripe Documentation**: [docs.stripe.com/connect](https://docs.stripe.com/connect)
- **Stripe Support**: support.stripe.com (they're very helpful!)
- **Test the Demo**: [Stripe's Express demo](https://docs.stripe.com/connect/express-accounts) has a working example

---

## Summary

Your code is ready. You just need to:

1. **Enable Connect** in Stripe Dashboard
2. **Complete your Platform Profile**
3. **Create your subscription products** ($29/month, $49 lifetime)
4. **Set up two webhooks** (one for your events, one for Connect events)
5. **Add the environment variables** to your hosting
6. **Test in Test mode**, then switch to Live

Once done, tutors can connect their Stripe accounts and start receiving payments!
