# Passes.com Feature Adaptation Plan for TutorLingua

Research and implementation plan for adapting passes.com monetization features to TutorLingua.

---

## Research Summary

### Passes.com Revenue Model
- **90/10 split** (creators keep 90%, platform takes 10% + $0.30/txn)
- **Multiple revenue streams**: Subscriptions, paid DMs, tips, 1:1 calls, live streams, digital products
- **Superfan focus**: CRM tools to identify and nurture high-value supporters
- **Content protection**: Screenshot blocking for exclusive content
- **~$9.5M ARR** with ~1,000 creators (~$6,666 avg/creator)

### TutorLingua Current State
| Feature | Status | Revenue Split |
|---------|--------|---------------|
| Lesson bookings | Live | 99% tutor / 1% platform |
| Session packages | Live | 99% tutor / 1% platform |
| Lesson subscriptions | Live | 99% tutor / 1% platform |
| Digital products | Live | 85-90% tutor / 10-15% platform |
| AI Practice | Live | 25% tutor / 75% platform |
| Messaging | Free (text + audio) | N/A |
| LiveKit video | Studio tier | N/A (subscription gated) |
| Tips | None | - |
| Group sessions | None (infra ready) | - |
| Paid messaging | None | - |
| Referral program | None | - |

---

## Proposed Features (Ranked by Friction & Impact)

### Tier 1: Lowest Friction, Highest Impact

#### 1. Post-Lesson Tips (RECOMMENDED FIRST)
Add "Thank Your Tutor" after lessons end.

| Aspect | Implementation |
|--------|----------------|
| Trigger | Post-lesson redirect, email follow-up |
| Amounts | $5, $10, $20, Custom |
| Payment | Stripe Connect (existing infra) |
| Split | 100% to tutor (goodwill) or 90/10 |
| UX | One-click, pre-filled card on file |

**Why frictionless**: Emotional moment, no commitment, leverages existing Stripe.

**Files to modify**:
- `app/(dashboard)/classroom/[bookingId]/page.tsx` - Post-session redirect
- `app/api/stripe/tip/route.ts` - New endpoint
- `components/tips/TipModal.tsx` - New component
- Database: `tips` table

#### 2. Flash Sales & Urgency Messaging (RECOMMENDED FIRST)
Add scarcity/urgency to existing packages & subscriptions.

| Feature | Implementation |
|---------|----------------|
| Limited spots | "Only 3 spots left" badge |
| Time-limited | Countdown timer on discounts |
| Price anchoring | Show original vs. sale price |
| Expiring packages | "Use within 30 days" reminder |

**Why frictionless**: Marketing layer on existing checkout, no new payment flows.

**Files to modify**:
- `components/booking/` - Add urgency badges
- `session_package_templates` table - Add `max_purchases`, `sale_ends_at`
- `lesson_subscription_templates` table - Add `spots_remaining`

---

### Tier 2: Medium Friction, High Impact

#### 3. Paid Async Corrections (Passes-style Paid DMs)
Students pay per correction/feedback request.

| Aspect | Implementation |
|--------|----------------|
| Pricing | Tutor sets: $3-15 per correction |
| Content | Voice note, text, or file upload |
| Response | Tutor records audio/video feedback |
| Payment | Pre-pay credits or per-request |

**Why valuable**: Revenue between lessons, async = tutor flexibility.

**Files to modify**:
- `lib/actions/messaging.ts` - Add payment layer
- `profiles` table - Add `correction_price`
- New: `correction_requests` table
- `app/api/stripe/correction-checkout/route.ts`

#### 4. Superfan CRM Dashboard
Identify highest-value students for upselling.

| Metric | Definition |
|--------|------------|
| Lifetime value | Total $ spent with tutor |
| Engagement score | Lessons + messages + homework |
| Upsell readiness | No subscription but 5+ lessons |
| Churn risk | No booking in 30+ days |

**Why valuable**: Actionable insights, tutor just follows suggestions.

**Files to modify**:
- `app/(dashboard)/students/page.tsx` - Add insights panel
- `lib/actions/analytics.ts` - New queries
- `components/crm/SuperfanInsights.tsx` - New component

---

### Tier 3: Higher Friction, High Impact

#### 5. Group Live Sessions
Tutors host 1:many conversation clubs with tips.

| Aspect | Implementation |
|--------|----------------|
| Capacity | 2-10 students per session |
| Pricing | Per-student fee (lower than 1:1) |
| Tips | In-session tip jar |
| Recording | Optional for replay access |

**Why valuable**: Scale tutor time, lower barrier for students.

**Infrastructure status**: LiveKit already supports multi-participant

**Files to modify**:
- New: `group_sessions` table
- New: `group_session_participants` table
- `app/api/livekit/token/route.ts` - Support group room type
- `app/(dashboard)/group-sessions/` - New route
- `components/classroom/GroupClassroom.tsx` - New component

#### 6. Student Referral Program
Students earn credits for referring friends.

| Aspect | Implementation |
|--------|----------------|
| Reward | $10-20 credit per referral |
| Trigger | Referred student completes first lesson |
| Tracking | Unique referral codes/links |
| Limit | Optional cap per student |

**Why valuable**: Viral growth, zero tutor effort.

**Files to modify**:
- `students` table - Add `referral_code`, `referred_by`
- New: `referral_rewards` table
- `app/student/referrals/page.tsx` - New page
- Booking flow - Apply referral credit

---

## Technical Infrastructure Notes

### Existing Strengths (Leverage These)
- **Stripe Connect**: Destination charges, 1% platform fee already working
- **Messaging**: Text + audio with Supabase Realtime, just needs payment layer
- **LiveKit**: Multi-participant ready, just needs group session booking flow
- **Student Portal**: 14+ actions, comprehensive foundation

### Gaps to Fill
| Gap | Solution |
|-----|----------|
| No tip payments | New `/api/stripe/tip` endpoint |
| No urgency UI | Add badges/timers to checkout components |
| No paid messaging | Add `correction_requests` table + checkout |
| No group bookings | New `group_sessions` schema + UI |
| No referral tracking | Add referral fields to `students` table |

---

## Confirmed Implementation Plan

### Confirmed Scope
- **Tips**: 100% to tutor (loyalty play)
- **Referrals**: Student referrals → Tutor gets platform discounts (novel twist!)
- **Priority**: Tips first, then referral system
- **Group Sessions**: Skip for now
- **Paid Corrections**: Defer to later phase

---

## Phase 1: Post-Lesson Tips

### Overview
Add frictionless tipping after lessons end. 100% goes to tutor.

### Database Migration
```sql
-- tips table
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  tutor_id UUID REFERENCES profiles(id) NOT NULL,
  student_id UUID REFERENCES students(id) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed
  message TEXT, -- optional thank you note
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoint
**File**: `app/api/stripe/tip/route.ts`

```
POST /api/stripe/tip
Body: { bookingId, amountCents, currency, message? }
Response: { clientSecret } (for Stripe Payment Intent)
```

Flow:
1. Validate booking exists and student is participant
2. Get tutor's Stripe Connect account
3. Create PaymentIntent with `transfer_data.destination` = tutor account
4. Return clientSecret for frontend to confirm payment
5. Webhook updates tip status on success

### UI Components

**File**: `components/tips/TipModal.tsx`
- Suggested amounts: $5, $10, $20, Custom
- Optional message field
- Stripe Elements for card input (or use saved card)
- Success/thank you confirmation

**File**: `components/tips/PostLessonTipPrompt.tsx`
- Shows after lesson ends (in classroom exit flow)
- "Did you enjoy your lesson? Thank [Tutor Name]!"
- Dismiss or tip options

### Integration Points

1. **Classroom Exit** (`app/(dashboard)/classroom/[bookingId]/page.tsx`)
   - After disconnect, show TipPrompt before redirect

2. **Post-Lesson Email** (Resend template)
   - Add "Tip Your Tutor" CTA to lesson completion email

3. **Student Dashboard** (`app/student/lessons/page.tsx`)
   - Show tip button on past completed lessons

4. **Tutor Dashboard** (`app/(dashboard)/analytics/page.tsx`)
   - Add tips to revenue analytics

### Files to Create/Modify
| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_create_tips.sql` | Create |
| `app/api/stripe/tip/route.ts` | Create |
| `lib/actions/tips.ts` | Create |
| `components/tips/TipModal.tsx` | Create |
| `components/tips/PostLessonTipPrompt.tsx` | Create |
| `app/(dashboard)/classroom/[bookingId]/page.tsx` | Modify |
| `app/student/lessons/page.tsx` | Modify |
| `lib/email/templates/lesson-completed.tsx` | Modify |

---

## Phase 2: Student Referral → Tutor Discount System

### Overview
When students refer new students to their tutor, the tutor earns platform subscription discounts. This creates a viral loop:

```
Student A (existing) → Refers Student B → Student B books with Tutor X
                                                    ↓
                                          Tutor X gets discount credit
```

### How Tutors Earn Discounts
| Referral Milestone | Tutor Reward |
|--------------------|--------------|
| 1st referred student completes lesson | $5 credit |
| 3 referred students | $15 credit |
| 5 referred students | $30 credit + "Community Builder" badge |
| 10 referred students | 1 month free Pro |

### Database Migration
```sql
-- Add referral tracking to students
ALTER TABLE students ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE students ADD COLUMN referred_by UUID REFERENCES students(id);
ALTER TABLE students ADD COLUMN referral_source TEXT; -- 'link', 'code', 'email'

-- Tutor referral credits
CREATE TABLE tutor_referral_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES profiles(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'student_referral', 'milestone_bonus'
  referring_student_id UUID REFERENCES students(id),
  referred_student_id UUID REFERENCES students(id),
  applied_to_invoice TEXT, -- Stripe invoice ID when redeemed
  status TEXT NOT NULL DEFAULT 'available', -- available, applied, expired
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track referral milestones
CREATE TABLE tutor_referral_stats (
  tutor_id UUID PRIMARY KEY REFERENCES profiles(id),
  total_referrals INTEGER DEFAULT 0,
  total_credits_earned_cents INTEGER DEFAULT 0,
  total_credits_used_cents INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Student Referral Flow

**Generate Referral Link** (`app/student/refer/page.tsx`)
1. Student logs in to portal
2. Sees unique referral link: `tutorlingua.com/ref/[code]`
3. Can share via copy link, email, or social
4. Tracks how many friends signed up

**Referral Landing** (`app/ref/[code]/page.tsx`)
1. Captures referral code in cookie/session
2. Redirects to tutor's booking page
3. Code persists through signup flow

**Credit Tutor on First Lesson**
1. When referred student completes first paid lesson
2. System credits referring student's tutor
3. Tutor notified: "Your student [Name] referred a new student! You earned $5 credit."

### Tutor Credit Redemption

**In Billing Page** (`app/(dashboard)/billing/page.tsx`)
- Show available credits balance
- Auto-apply to next subscription invoice
- Or: Manual apply at checkout

**Stripe Integration**
- Create Stripe Customer Balance (credits)
- Or: Apply as coupon/discount at invoice time

### UI Components

**Student Portal** (`app/student/refer/page.tsx`)
- Referral link with copy button
- Share buttons (email, Twitter, WhatsApp)
- "Referred Friends" list with status
- "Help [Tutor Name] grow their practice!"

**Tutor Dashboard** (`app/(dashboard)/referrals/page.tsx`)
- Total referrals count
- Credits earned/available/used
- Milestone progress bar
- List of students who referred others

### Files to Create/Modify
| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_create_referrals.sql` | Create |
| `app/ref/[code]/page.tsx` | Create |
| `app/student/refer/page.tsx` | Create |
| `app/(dashboard)/referrals/page.tsx` | Create |
| `lib/actions/referrals.ts` | Create |
| `components/referrals/ReferralLink.tsx` | Create |
| `components/referrals/TutorCreditsCard.tsx` | Create |
| `app/(dashboard)/billing/page.tsx` | Modify |
| `app/api/stripe/webhook/route.ts` | Modify (apply credits) |
| `lib/email/templates/referral-credit.tsx` | Create |

---

## Implementation Checklist

### Phase 1: Tips
- [ ] Create `tips` table migration
- [ ] Build `/api/stripe/tip` endpoint
- [ ] Create `TipModal` component with Stripe Elements
- [ ] Create `PostLessonTipPrompt` component
- [ ] Integrate tip prompt into classroom exit flow
- [ ] Add tip CTA to lesson completion email
- [ ] Add tips to tutor revenue analytics
- [ ] Add tip history to student billing page

### Phase 2: Referrals
- [ ] Create referral tables migration
- [ ] Generate unique referral codes for students
- [ ] Build `/ref/[code]` landing page
- [ ] Build student referral dashboard
- [ ] Build tutor credits dashboard
- [ ] Implement credit-on-first-lesson logic
- [ ] Integrate credits with Stripe billing
- [ ] Add milestone notifications
- [ ] Create referral email templates

---

## Future Phases (Deferred)

### Phase 3: Paid Async Corrections
- Tutors set correction price ($3-15)
- Students purchase correction credits
- Submit voice/text for feedback
- Tutor responds with corrections

### Phase 4: Flash Sales & Urgency
- Time-limited package discounts
- "X spots left" scarcity messaging
- Countdown timers on offers

### Phase 5: Group Sessions
- 1:many conversation clubs
- Per-student pricing
- In-session tip jar

---

## Sources

- [Passes Review - Whop](https://whop.com/blog/passes-review/)
- [How Passes Works - Canvas Business Model](https://canvasbusinessmodel.com/blogs/how-it-works/passes-how-it-works)
- [Passes Introduction - Vidpros](https://vidpros.com/passes-com-an-introduction-about-this-creator-economy-site/)
