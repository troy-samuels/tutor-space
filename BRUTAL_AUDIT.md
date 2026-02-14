# TutorLingua — Brutal Honest Audit
## Codebase Reality × Market Truth × Path to €30K/mo

*Malcolm — 13 Feb 2026. No lies.*

---

## PART 1: WHAT'S ACTUALLY BUILT (Codebase Audit)

### The Numbers
- **480,861 lines of code** across 336 TypeScript files
- **133 database migrations** → 102 public tables
- **98 API routes** covering auth, booking, payments, AI, admin, analytics
- **7-step onboarding** (profile → pro info → languages/services → availability → calendar sync → video → payments)
- **3 pricing tiers**: Pro ($29/mo), Studio ($79/mo), Lifetime (~$99 one-time)

### What's Real and Working
| Feature | Status | Depth |
|---------|--------|-------|
| Auth (Supabase) | ✅ Working | Email + password, OAuth |
| Tutor onboarding (7 steps) | ✅ Working | Full wizard |
| Booking system | ✅ Working | Calendar, slot generation, timezone support |
| Stripe payments | ✅ Working | Checkout, subscriptions, Connect (tutor payouts), webhooks |
| Student CRM | ✅ Working | Notes, timeline events, engagement scores |
| Tutor site / bio page | ✅ Working | Public profiles with SEO |
| Commission calculator | ✅ Working | Standalone HTML page |
| LiveKit video classroom | ✅ Working | Pre-join, video stage, connection monitoring |
| Lesson recordings + transcription | ✅ Working | Deepgram integration |
| AI Practice (conversation) | ✅ Working | OpenAI chat, text + audio, session management |
| AI Drills | ✅ Working | Match, gap-fill, scramble, writing, conversation, pronunciation |
| Spaced repetition (SM-2) | ✅ Working | Full scheduler with mastery levels |
| Lesson analysis pipeline | ✅ Working | Speaker diarization, L1 interference, grammar error tracking |
| Copilot briefings | ✅ Working | Pre-lesson briefings from student history |
| Homework assignments | ✅ Working | Assignment + submission system |
| Admin panel | ✅ Working | User management, moderation, analytics, impersonation |
| i18n | ✅ Working | EN, ES, FR, DE, PT, IT, NL, JA, ZH, KO |
| Email system | ✅ Working | Campaigns, events, suppressions, digests |
| Digital products marketplace | ✅ Working | Product listings, checkout, downloads |
| Calendar sync | ✅ Working | Google/Outlook OAuth, busy windows |
| Link tracking | ✅ Working | Short links with click analytics |
| Student practice subscriptions | ✅ Working | Free tier (600 turns) + $5 block add-ons |

### What's ACTUALLY Being Used (Live Data)
| Table | Live Rows | Verdict |
|-------|-----------|---------|
| profiles (tutors) | **43** | Mostly test accounts |
| students | **12** | Almost certainly all test |
| bookings | **5** | Not real usage |
| services | **127** | Test data from onboarding |
| page_views | **122** | Minimal traffic |
| practice_sessions | **3** | Nobody using AI practice |
| lesson_recordings | **2** | Two test recordings |
| tutor_sites | **2** | Two test sites |
| homework_assignments | **3** | Test data |
| payments | **0** | Zero revenue |

**Bottom line: This is a complete product with zero real users and zero revenue.**

### The Onboarding Problem (Critical)
The current flow requires **7 steps** before a tutor gets any value:
1. Profile basics (name, username, timezone, photo)
2. Professional info (tagline, bio, website)
3. Languages & services (define packages + pricing)
4. Availability (set weekly windows)
5. Calendar sync (Google/Outlook OAuth)
6. Video conferencing (add meeting link)
7. Get paid (Stripe Connect onboarding)

**This is 20-30 minutes of setup before a tutor sees anything.** And what they see after is... an empty dashboard. No students. No bookings. No value.

Compare this to what tutors actually do today:
- Sign up on Preply → students find you within days
- Share a Calendly link → bookings immediately
- Use Stripe directly → payments in minutes

TutorLingua's onboarding is building a shop in a desert. Beautiful shop. No foot traffic.

---

## PART 2: THE MARKET (Honest Assessment)

### Who TutorLingua Is Competing Against

**Category 1: Marketplaces (where students find tutors)**
| Platform | Students | Tutors | Commission | Moat |
|----------|----------|--------|------------|------|
| Preply | Millions | 40K+ | 18-33% | Demand side. Students come to THEM. |
| iTalki | Millions | 30K+ | 15% | Same demand moat |
| Cambly | Millions | 10K+ | Fixed rate | Enterprise contracts |
| Verbling | Hundreds of K | 5K+ | 15% | Niche but loyal |

**TutorLingua does NOT compete here.** It has no student discovery. Zero demand-side.

**Category 2: Tutor Business Tools (scheduling + payments)**
| Tool | Price | Users | What it does |
|------|-------|-------|-------------|
| Calendly | Free-$16/mo | Millions | Scheduling |
| Stripe | 2.9% | Millions | Payments |
| Notion | Free-$10/mo | Millions | Notes/CRM |
| TutorCruncher | Pay-as-you-go | Agencies | Full admin suite |
| Teachworks | ~$20/mo | Agencies | Scheduling + invoicing |

**The "Calendly + Stripe" combo is free/near-free and works.** Tutors who've left marketplaces already use this. TutorLingua at $29/mo is MORE expensive than the DIY stack.

**Category 3: AI Language Learning (where the money is)**
| App | Users | Revenue | What it does |
|-----|-------|---------|-------------|
| Duolingo | 100M+ MAU | $531M/yr | Gamified self-study |
| Speak | 15M+ downloads | ~$100M+ | AI conversation tutor |
| Praktika | 20M+ learners | Growing fast | AI avatar tutors |
| ELSA | 50M+ downloads | ~$50M+ | Pronunciation AI |
| LingQ | 5M+ | ~$10M+ | Content-based learning |

**This is where the big money is — student-facing AI.** Speak raised $78M. Praktika raised $50M+. They're replacing tutors with AI, not helping tutors.

**Category 4: What doesn't exist (the gap)**

Nobody has built: **An AI-native platform where human tutors and AI work together, where the AI makes the human tutor dramatically more effective, and where students get 24/7 AI practice between human lessons.**

This is TutorLingua's actual thesis. But the current product doesn't LEAD with this.

### The Brutal Truth About the Market

1. **Tutors are not a good customer.** The median online language tutor earns $15-25/hr. Many teach 15-20 hours/week. That's $1,200-2,000/month. Asking them to pay $29-79/month is 2-6% of their income for a tool that doesn't bring them students.

2. **The marketplace commission pain is real but not sufficient.** Yes, Preply takes 18-33%. But tutors endure it because Preply brings them students. TutorLingua says "keep 100% of nothing" because there's no student discovery.

3. **AI is eating the bottom of the market.** Speak, Praktika, Duolingo — they're taking the casual learners. The tutors who survive will be the ones who offer something AI can't: genuine human connection, accountability, nuanced cultural context, exam prep expertise.

4. **Students don't care about tutor tools.** Students care about: Can I find a good tutor? Can I book easily? Can I learn effectively? They'll never choose a platform because it has a nice CRM for the tutor.

---

## PART 3: WHAT "AI NATIVE" ACTUALLY MEANS

TutorLingua has built impressive AI features. But they're all **tutor-side tooling** or **gated behind paid tiers**. Here's what AI-native should actually look like:

### Current (Tool-Assisted)
```
Tutor signs up → sets up profile → adds services → waits for students → maybe uses AI tools
```

### AI-Native (AI-First)
```
Student arrives → AI assesses level in 2 minutes → AI recommends a tutor → 
AI teaches between lessons → AI generates personalised homework → 
AI tracks progress → Human tutor reviews AI insights before each session
```

The difference: **In an AI-native model, the AI is doing 80% of the teaching. The human tutor is the premium layer — the coach, the motivator, the cultural guide.**

### What TutorLingua Already Has That Could Be AI-Native
- ✅ AI Practice (conversation companion) — already built
- ✅ AI Drills (gap-fill, matching, scramble) — already built
- ✅ Spaced repetition — already built
- ✅ Lesson analysis + grammar error tracking — already built
- ✅ L1 interference detection — already built
- ✅ Copilot briefings — already built
- ✅ Pronunciation assessment — already built

**The tech is there. The packaging is wrong.**

---

## PART 4: THE USER JOURNEY THAT WOULD WORK

### Current Journey (Broken)
1. Tutor finds TutorLingua (how?)
2. Tutor sees landing page ("Built for tutors")
3. Tutor signs up for Pro ($29/mo) or Studio ($79/mo)
4. Tutor completes 7-step onboarding (20-30 min)
5. Tutor has empty dashboard
6. Tutor shares booking link
7. Students... don't come (no discovery)
8. Tutor churns within 30 days

**Failure point: Step 7. No students = no value = no retention.**

### Proposed Journey (AI-Native, Student-Led)

#### For Students (The Revenue Engine):
1. Student visits tutorlingua.com → "Learn [language] with AI + a real tutor"
2. Student takes 2-minute AI level assessment (free, no signup)
3. AI generates personalised study plan
4. Student starts free AI practice (5 sessions)
5. Student hits limit → "Upgrade to unlimited AI practice + a real human tutor"
6. Student subscribes ($19.99/mo for AI-only, $49.99/mo for AI + human tutor)
7. Platform matches student with tutor (or student picks)
8. AI teaches daily, human tutor coaches weekly
9. Progress dashboard shows improvement over time

#### For Tutors (The Supply Side):
1. Tutor sees "Get students who are already learning" message
2. Tutor signs up FREE (no payment required)
3. Tutor completes light onboarding (3 steps: name, languages, availability)
4. Platform matches tutor with pre-assessed students
5. Before each lesson: AI briefing shows student's progress, struggles, recommendations
6. During lesson: AI assists (live transcription, error detection)
7. After lesson: AI generates homework automatically
8. Tutor gets paid per lesson (platform takes 10-15%, NOT the tutor paying a subscription)

### Why This Works:
- **Students get instant value** (AI assessment + practice) before paying anything
- **Tutors get students** (the #1 thing they want) for free
- **Revenue comes from students** (larger market, more willing to pay, recurring)
- **AI does the heavy lifting** between lessons (this is the moat — no competitor has this)
- **The take rate model** is proven (Uber, Airbnb, Preply all do this)

---

## PART 5: THE PATH TO €30,000/MONTH

### Option A: Student Subscriptions (Recommended)

| Tier | Price | What they get |
|------|-------|---------------|
| Free | €0 | Level assessment + 5 AI practice sessions |
| AI Learner | €14.99/mo | Unlimited AI practice + drills + spaced repetition |
| AI + Tutor | €49.99/mo | Everything above + 4 human lessons/month |
| AI + Tutor Pro | €99.99/mo | Everything above + 8 lessons + priority matching |

**Math to €30K:**
- 600 students at €14.99/mo = €9,000 (AI only, high margin)
- 300 students at €49.99/mo = €15,000 (tutor gets ~€25/lesson from this)
- 60 students at €99.99/mo = €6,000
- **Total: €30,000/mo**

Tutors earn per lesson. Platform handles billing, matching, and AI. Tutors pay nothing.

### Option B: B2B (Language Schools)

| Tier | Price | What they get |
|------|-------|---------------|
| School Basic | €199/mo | 10 tutor seats, AI tools, booking |
| School Pro | €499/mo | 30 tutor seats, white-label, analytics |
| Enterprise | €999/mo | Unlimited seats, API access, custom AI |

**Math to €30K:**
- 15 schools at €199 = €3,000
- 30 schools at €499 = €15,000  
- 12 schools at €999 = €12,000
- **Total: €30,000/mo**

### Option C: Current Model (Tutor SaaS) — THE HONEST ASSESSMENT

| Tier | Price | Customers needed |
|------|-------|-----------------|
| Pro | €29/mo | 1,034 paying tutors |
| Studio | €79/mo | 380 paying tutors |

**Why this probably won't work:**
- No student discovery = no compelling reason to stay
- Tutors are price-sensitive and have free alternatives
- CAC for individual tutors is high ($30-50 per signup, 5-10% convert to paid)
- Churn will be brutal without student-side value
- You'd need ~10,000 signups to get 1,000 paying tutors

---

## PART 6: WHAT TO DO THIS WEEK

### If you choose Option A (Student-Led, recommended):

**Day 1-2: Flip the landing page**
- New headline: "Learn [language] with AI + a real human tutor"
- Student-facing, not tutor-facing
- Free AI level assessment as the hero CTA
- Remove tutor pricing from homepage entirely

**Day 3-4: Build the student entry funnel**
- 2-minute AI level assessment (use existing OpenAI integration)
- Show personalised study plan after assessment
- 5 free AI practice sessions (already built — just remove the tutor-gate)
- Email capture for "continue your progress"

**Day 5-7: Restructure pricing**
- Student subscriptions: Free → €14.99/mo → €49.99/mo
- Tutor signup: FREE, always
- Take rate on human lessons: 10-15% (lower than Preply's 18-33%)

**Week 2: Distribution**
- Profile Analyser tool drives tutor signup (supply)
- AI level assessment shared on student communities (demand)
- Reddit/Facebook: "Free AI language practice" posts (student-facing)

### If you choose Option B (B2B):
- Build a sales page targeting language school owners
- Create a demo account with pre-loaded data
- LinkedIn outreach to language school directors
- Offer 3-month free pilot to first 10 schools

### What NOT to do:
- Don't keep trying to sell $29/mo subscriptions to individual tutors
- Don't build more tutor-side features (the product is already over-built for the tutor side)
- Don't spend time on Reddit as a tutor-acquisition channel (too slow, too low volume)
- Don't build a marketplace/directory (chicken-and-egg problem you can't solve at this stage)

---

## SUMMARY

**The codebase is impressive.** 480K lines, real features, real AI. This isn't vapourware. The video classroom, AI practice, lesson analysis, spaced repetition, drill generation — it all works. You've built a platform that's genuinely more advanced than any competitor in the tutor tooling space.

**The problem isn't the product. It's the go-to-market.** You're selling to tutors who can't afford it and don't need it because they have no students on your platform. The AI features — your genuine differentiator — are locked behind paid tiers that nobody reaches because there's no free value on day one.

**The fix is to flip the funnel.** Lead with students. Give them free AI practice. Convert them to paid AI subscriptions. Match them with tutors. Tutors come for free because you bring them pre-assessed, paying students. Revenue comes from students, not tutors.

The tech is built. The thesis is right. The packaging needs to change.
