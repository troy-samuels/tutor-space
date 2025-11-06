# Language Tutor Platform - Build Guide

## Project Overview

A comprehensive platform for independent language tutors that combines professional profile pages, booking/payments, student management, and AI-powered learning tools. This replaces 8-12 separate tools with one integrated solution.

**Target Market**: Independent language tutors earning $500-5,000/month
**Pricing**: $29-59/month subscription (0% commission on bookings)
**Timeline**: 6-8 weeks for MVP with experienced developer using AI coding tools

## Product Vision & Tiering

**Vision**: Become the indispensable operating system for independent language tutors by unifying their administrative, marketing, and teaching workflows into one purpose-built platform.

**Core Concept**: TutorLingua replaces the stitched-together stack of generic tools (Calendly, PayPal, Google Drive, Zoom) with a vertical SaaS that feels made-to-measure for language tutors. Business operations, student acquisition, and classroom experiences live inside a single, elegant ecosystem.

### Target Audience
- Solo or small-team language tutors who manage their own students
- Teachers operating across multiple time zones and currencies
- Tutors who want to professionalize their brand and scale beyond 1:1 hour trading
- Social-first educators who need better lead capture and conversion tooling

### Subscription Tiers
- **Professional Plan (Core MVP)**  
  Time zone–aware bookings with session packages, upfront Stripe payments in multiple currencies, automated invoicing/reminders, and a lightweight CRM with CEFR-aligned progress tracking. Includes marketing basics (link-in-bio landing page, review requests, lead magnet) plus the digital classroom foundation (resource library, lesson plan builder, integrated video/whiteboard, and interactive exercises such as sentence sorting or categorization bins).
- **Growth Plan (Premium Upsell)**  
  Adds the Growth & Ads Power-Up: a no-code Meta ads cockpit, Lead Hub inbox aggregating social leads, and an AI content/SEO planner. Extends the classroom with an AI Teaching Assistant Chrome extension (live transcription, error detection, content clipper) and deeper analytics (AI conversation partner, automated progress insights, immersive content generation).
- **Studio Plan (Add-On Modules)**  
  Designed for studios scaling beyond solo tutoring: group session/workshop tooling, a shared resource marketplace, and a CEO dashboard with churn forecasting and revenue intelligence.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe (subscriptions + one-time payments)
- **Video**: Zoom API (meeting link generation)
- **Scheduling**: Cal.com integration or custom build
- **Email**: Resend (React email templates)
- **AI**: OpenAI GPT-4, Azure AI Speech (Phase 2)
- **Marketing & Ads**: Meta Ads API, Google Ads API connectors (Growth Plan)
- **Browser Extensions**: Chrome Extension (Manifest V3) for AI Teaching Assistant
- **Hosting**: Vercel (frontend), Supabase (backend)

## Build Sequence

Each phase ladder aligns with the tiered product vision: Phase 1-3 deliver the Professional Plan MVP, Phase 4 unlocks Growth Plan capabilities, and Phase 5+ cover Studio-level add-ons and long-tail enhancements.

### Phase 1: Foundation (Week 1-2)
1. **00-project-setup.md** - Initialize Next.js + Supabase project
2. **01-database-schema.md** - Design multi-tenant database structure
3. **02-authentication.md** - Email & OAuth authentication
4. **03-basic-dashboard.md** - Main dashboard layout

### Phase 2: Core Business Features (Week 3-4)
5. **04-user-profiles.md** - Tutor profile pages with custom subdomains
6. **05-link-in-bio.md** - Customizable link-in-bio functionality
7. **06-service-listings.md** - Create/manage service offerings and sell session packages
8. **07-stripe-integration.md** - Payment processing with upfront deposits, multi-currency support, and invoicing hooks
9. **08-booking-system.md** - Time zone aware scheduling, buffer rules, and package redemption tracking
10. **09-student-crm.md** - Student dashboard with CEFR tracking, notes, and automated reminder feeds

### Phase 3: Essential Tools (Week 5-6)
11. **10-zoom-integration.md** - Auto-generate meeting links and support embedded video/whiteboard experiences
12. **11-email-system.md** - Transactional emails, payment receipts, automated reminders, and review requests
13. **12-analytics-tracking.md** - Link clicks, conversion funnels, and lead magnet attribution
14. **13-lesson-notes.md** - Session notes, resource library, lesson plan builder, and interactive classroom tools

### Phase 4: AI Features (Week 6-7)
15. **14-ai-conversation-partner.md** - GPT-4 text-based conversation and 24/7 practice partner
16. **15-lesson-plan-generator.md** - AI-powered lesson planning and immersive content engine hooks
17. **16-vocabulary-system.md** - Word tracking, quizzes, and AI-generated practice
18. **17-progress-tracking.md** - AI weakness detector and longitudinal insights

### Phase 5: Polish & Launch (Week 7-8)
19. **18-landing-page.md** - Marketing site and signup flow
20. **19-onboarding.md** - User onboarding experience
21. **20-settings-billing.md** - Account settings and subscription management
22. **21-testing-deployment.md** - Testing checklist and deployment

### Phase 6: Growth & Studio Add-Ons (Optional / Premium)
23. **22-growth-ad-center.md** - Meta ads cockpit, targeting presets, and campaign reporting
24. **23-lead-hub.md** - Aggregated lead inbox from social forms and landing pages
25. **24-ai-content-marketing.md** - AI content calendar, SEO topic generator, and social asset creation
26. **25-ai-teaching-assistant.md** - Chrome extension for live transcription, error logging, and content clipping
27. **26-group-sessions.md** - Group class functionality with tiered pricing
28. **27-resource-marketplace.md** - Shared marketplace for lesson plans and curricula
29. **28-ceo-dashboard.md** - Revenue forecasting, churn prediction, and premium analytics

## Key Principles

1. **Start Simple**: Build core value proposition first (profile + booking + payments)
2. **Use AI Tools Effectively**: Leverage Cursor/Claude Code for boilerplate and standard patterns
3. **Manual Review**: Always review security-critical code and business logic
4. **Test as You Go**: Write tests for critical paths
5. **Ship Fast**: Get to beta users ASAP for feedback

## Development Best Practices

- Use TypeScript for better AI suggestions
- Implement Row Level Security (RLS) policies in Supabase for multi-tenancy
- Follow Next.js App Router conventions
- Use shadcn/ui components for consistent UI
- Implement proper error handling and loading states
- Add monitoring from day 1 (Sentry, PostHog)
- Review the shared [SECURITY.md](SECURITY.md) playbook before building new integrations

## File Structure

Each .md file contains:
- **Objective**: What we're building and why
- **Requirements**: Dependencies and prerequisites
- **Database Schema**: Tables and relationships needed
- **Implementation Steps**: Detailed build instructions
- **Testing Checklist**: How to verify it works
- **AI Tool Prompts**: Example prompts for Cursor/Claude Code
- **Common Gotchas**: Known issues and solutions

## Getting Started

1. Read through **00-project-setup.md** to initialize your project
2. Follow files sequentially - each builds on the previous
3. Use the AI tool prompts provided as starting points
4. Adapt to your specific needs as you learn from users
5. Don't try to build everything - focus on MVP first

## Success Metrics for MVP

- [ ] 20+ beta tutors actively using the platform
- [ ] Tutors can set up profile + services in <15 minutes
- [ ] Students can book, redeem packages, and pay successfully in their currency
- [ ] Automated reminders/reviews fire without manual intervention
- [ ] Platform is stable enough for daily use
- [ ] Ready to accept first paying customers
- [ ] Resource library, lesson planner, and interactive exercises support live teaching
- [ ] Basic AI features demonstrably save tutor time

## Need Help?

- Each file includes troubleshooting sections
- Check Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Stripe docs: https://stripe.com/docs
- OpenAI API docs: https://platform.openai.com/docs

## Timeline Expectations

**Realistic for experienced developer with AI tools:**
- Weeks 1-2: Foundation complete, can create accounts and profiles
- Weeks 3-4: Core features done, basic booking/payment flow works
- Weeks 5-6: AI features functional, all essential tools working
- Weeks 7-8: Polished enough for beta users

**Red Flags:**
- Spending >3 days on project setup → seek help
- Not shipping testable features weekly → scope too large
- Building features users haven't asked for → refocus on MVP

Let's build! Start with **00-project-setup.md**.
