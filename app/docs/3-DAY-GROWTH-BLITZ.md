# 3-Day Tutor Acquisition Blitz: 1,000 Sign-ups

## Executive Summary
- **Target**: 1,000 tutor sign-ups in 72 hours (~333/day)
- **Market Size**: ~150,000+ tutors on Preply, iTalki, Verbling
- **User Constraints**: No existing email list, very aggressive pricing OK
- **User-Selected Priorities**: Urgency UI, Referral System, Social Proof Toasts

---

## IMPLEMENTATION PLAN

### Build Order (Based on User Selection)
1. **Urgency UI** - Countdown timer, live signup counter, founder banner
2. **Referral System** - Two-sided rewards, tracking, dashboard
3. **Social Proof Toasts** - Real-time signup notifications

---

## FEATURE 1: URGENCY UI COMPONENTS

### 1.1 Countdown Timer Component
**New File**: `app/components/landing/CountdownTimer.tsx`

Client component with:
- Target date prop (configurable end date for founder pricing)
- Days, hours, minutes, seconds display
- Animated flip/fade transitions using CSS
- Urgent red styling when <24 hours remaining
- Mobile responsive (stacked layout on small screens)

### 1.2 Live Signup Counter
**New File**: `app/components/landing/LiveSignupCounter.tsx`

Server component with client-side refresh:
- Fetches count from profiles table
- Display: "847 of 1,000 founder spots claimed"
- Animated number transition (existing `useCountUp` hook at `lib/hooks/useCountUp.ts`)
- Optional progress bar visual
- Refresh every 30 seconds

**New API Route**: `app/app/api/stats/signups/route.ts`
- Returns: `{ count: number, target: 1000 }`
- Caches for 30 seconds to reduce DB load

### 1.3 Founder Pricing Banner
**New File**: `app/components/landing/FounderBanner.tsx`

Sticky banner at top of page:
- Text: "🚀 Founder Pricing: $19/month forever (normally $39) - X spots left"
- Inline countdown timer
- CTA button to signup
- Dismissable via X button (stores in localStorage)
- Animated gradient background for attention

### 1.4 Landing Page Integration
**Modify**: `app/components/landing/Hero.tsx`

Add below CTA buttons:
- CountdownTimer component with "Founder pricing ends in:"
- LiveSignupCounter with spots remaining

**Modify**: `app/app/page.tsx`

Add FounderBanner before Navigation component

---

## FEATURE 2: REFERRAL SYSTEM

### 2.1 Database Schema
**New Migration**: `supabase/migrations/20251210_referral_system.sql`

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  -- pending | signed_up | converted | rewarded
  reward_type VARCHAR(20),
  -- free_month | extended_trial | credit
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  reward_claimed_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals"
  ON referrals FOR SELECT USING (referrer_id = auth.uid());
```

### 2.2 Server Actions
**New File**: `app/lib/actions/referrals.ts`

```typescript
// Actions to implement:
generateReferralCode(userId: string) // Creates unique 8-char code
trackReferralClick(code: string) // Increments click_count
convertReferral(code: string, newUserId: string) // Links referee
claimReferralReward(referralId: string) // Marks reward claimed
getReferralStats(userId: string) // Returns aggregate stats
listUserReferrals(userId: string) // Returns all referrals with status
```

### 2.3 Signup Flow Integration
**Modify**: `app/app/signup/page.tsx`

- Check URL for `?ref=CODE` parameter on page load
- Store referral code in cookie (7-day expiry)
- On successful signup, call `convertReferral()`
- Apply extended trial (21 days vs 14 days) to referee

### 2.4 Referral Dashboard
**New File**: `app/app/(dashboard)/referrals/page.tsx`

Dashboard page showing:
- Unique referral link with copy button
- Stats cards: Clicks, Signups, Conversions, Rewards Earned
- Table of referrals with status badges
- Share buttons: Twitter, LinkedIn, WhatsApp, Email

**New Component**: `app/components/dashboard/ReferralDashboard.tsx`

### 2.5 Navigation Update
**Modify**: `app/components/dashboard/shell.tsx`

Add "Referrals" item to sidebar navigation with Gift icon

---

## FEATURE 3: SOCIAL PROOF TOASTS

### 3.1 Toast Component
**New File**: `app/components/landing/SocialProofToast.tsx`

Client component:
- Fetches recent signups from API
- Shows toast: "Maria from Spain just joined! 🎉"
- Slides in from bottom-right corner
- Auto-dismisses after 4 seconds
- Random delay between toasts (10-20 seconds)
- Max 3 toasts per page session (sessionStorage)
- Non-intrusive, doesn't block content

### 3.2 Recent Signups API
**New API Route**: `app/app/api/stats/recent-signups/route.ts`

Returns:
```typescript
Array<{ first_name: string, country: string, created_at: string }>
```
- Only signups from last 24 hours
- Randomized order
- Limit 10 results
- 5-minute cache

### 3.3 Provider Integration
**New File**: `app/components/providers/social-proof-provider.tsx`

Context provider that:
- Wraps public pages only (landing, signup)
- Manages toast queue and timing
- Respects user's reduced motion preferences

**Modify**: `app/app/layout.tsx`

Conditionally wrap public routes with SocialProofProvider

---

## FILES SUMMARY

### New Files to Create

| File | Purpose |
|------|---------|
| `components/landing/CountdownTimer.tsx` | Urgency countdown display |
| `components/landing/LiveSignupCounter.tsx` | Live tutor count |
| `components/landing/FounderBanner.tsx` | Sticky top banner |
| `components/landing/SocialProofToast.tsx` | Signup notifications |
| `components/providers/social-proof-provider.tsx` | Toast management |
| `components/dashboard/ReferralDashboard.tsx` | Referral stats UI |
| `app/(dashboard)/referrals/page.tsx` | Referral dashboard page |
| `app/api/stats/signups/route.ts` | Signup count endpoint |
| `app/api/stats/recent-signups/route.ts` | Recent signups endpoint |
| `lib/actions/referrals.ts` | Referral server actions |
| `supabase/migrations/20251210_referral_system.sql` | Database schema |

### Files to Modify

| File | Changes |
|------|---------|
| `components/landing/Hero.tsx` | Add countdown + counter below CTAs |
| `app/page.tsx` | Add FounderBanner at top |
| `app/signup/page.tsx` | Handle `?ref=` param, apply rewards |
| `lib/actions/trial.ts` | Support extended trial for referrals |
| `app/layout.tsx` | Add SocialProofProvider |
| `components/dashboard/shell.tsx` | Add Referrals nav item |

---

## PRICING STRATEGY

### Founder Pricing Offer (72 hours only)
| Tier | Regular | Founder | Savings |
|------|---------|---------|---------|
| Pro Monthly | $39/mo | $19/mo forever | 51% off |
| Pro Lifetime | $299 | $199 | $100 off |
| Studio Lifetime | $499 | $399 | $100 off |

**Limit**: 1,000 founder spots total

### Referral Rewards
- **Referee**: 21-day trial (vs 14-day standard)
- **Referrer**: 1 month free when referee converts to paid

---

## IMPLEMENTATION SCHEDULE

### Day 1 (Hours 1-24)
1. CountdownTimer component
2. LiveSignupCounter component
3. FounderBanner component
4. Signup count API route
5. Update Hero.tsx with urgency
6. Update page.tsx with banner

### Day 2 (Hours 24-48)
7. Referrals database migration
8. Referral server actions
9. Referral Dashboard page
10. Handle ref code in signup
11. SocialProofToast component

### Day 3 (Hours 48-72)
12. Recent signups API
13. Social Proof Provider
14. Test full referral flow
15. Polish animations
16. Deploy

---

## VIRAL LOOP

```
[URGENCY] "Only 153 spots left!" → Creates FOMO
    ↓
[SIGNUP] User claims founder pricing → Converts
    ↓
[REFERRAL] "Get 1 month free" → Shares link
    ↓
[SOCIAL PROOF] "Maria just joined" → Validates
    ↓
[REPEAT] New user becomes referrer → Amplifies
```

---

## MARKETING CHANNELS (Post-Build)

### High Priority
- **Reddit**: r/languagelearning (2.1M), r/TEFL, r/OnlineESLTeaching
- **Facebook**: Preply Tutors groups, iTalki Teachers groups
- **Instagram**: DM tutors who post about marketplaces

### Content Strategy
- "How I stopped paying 33% commission" story posts
- Screenshots of savings calculations
- Before/after income comparisons

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Total Signups | 1,000 |
| Referral Signups | 200+ (20%) |
| Paid Conversions | 100+ (10%) |
| Avg Referrals/User | 2+ |

---

## THE CORE VALUE PROPOSITION

**Tutors are bleeding money.** A tutor earning $2,000/month loses $660/month to Preply (33% commission). That's $7,920/year in pure pain.

TutorLingua's $39/month = $468/year vs $7,920 lost = **$7,452 annual savings**.

This isn't a nice-to-have. This is financial liberation.

---

## MESSAGING FRAMEWORK

### Primary Headlines
1. "Keep 100% of your repeat students' payments"
2. "Stop paying 33% to marketplaces"
3. "Your students. Your business. Your money."
4. "Escape the commission trap"

### Secondary Messages
1. "1,000 tutors already switched"
2. "Save $7,000+/year on average"
3. "10-minute setup. Own your business forever"
4. "Use Preply for discovery. Use us for repeat business"

### CTAs
- "Claim Founder Pricing" (scarcity)
- "Start Free Trial" (low commitment)
- "Join 1,000 Tutors" (social proof)
