# TutorLingua

A comprehensive business management platform for independent language tutors. TutorLingua replaces 10+ scattered tools with one integrated solution for booking, payments, student management, and marketing.

## Overview

**TutorLingua** helps independent language tutors:
- Stay visible on marketplaces (Preply, iTalki, Verbling) while bringing students into your own system
- Book students directly through branded channels you control
- Keep 100% of direct booking revenue (0% platform fees)
- Sync calendars (Google/Outlook) to avoid conflicts across platforms
- Manage their entire business from one dashboard

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Payments**: Stripe + Stripe Connect (marketplace payouts)
- **Email**: Resend (React email templates)
- **Calendar**: Google Calendar & Outlook OAuth integration
- **Testing**: Playwright (E2E), Node test runner (unit)

## Features

### Core Platform
- **Booking System** - Timezone-aware scheduling with conflict detection
- **Stripe Connect** - Direct payouts to tutors, 0% platform commission
- **Student CRM** - Manage students, notes, lesson history, access control
- **Session Packages** - Pre-paid lesson bundles with redemption tracking
- **Calendar Sync** - Two-way sync with Google Calendar & Outlook
- **Messaging** - Direct tutor-student communication

### Marketing Tools
- **Tutor Sites** - Custom website builder with themes and layouts
- **Link-in-Bio** - Customizable landing pages with click tracking
- **Digital Products** - Sell downloadable resources (PDFs, ebooks)
- **Email Campaigns** - Bulk email with unsubscribe management

### Public Pages
- `/[username]` - Custom tutor website
- `/bio/[username]` - Link-in-bio page
- `/profile/[username]` - Public tutor profile
- `/book/[username]` - Booking page
- `/products/[username]` - Digital product catalog

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/language-tutor-platform.git
cd language-tutor-platform/app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

See `app/claude.md` for complete environment variable documentation.

**Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Development

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests
npm run test:e2e     # Playwright E2E tests
npm run type-check   # TypeScript check
```

## Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected tutor dashboard
│   ├── (public)/           # Public-facing pages
│   ├── api/                # API routes
│   ├── book/               # Public booking flow
│   └── student-auth/       # Student portal
├── components/             # React components
├── lib/
│   ├── actions/            # Server actions
│   ├── supabase/           # Database clients
│   ├── validators/         # Zod schemas
│   └── utils/              # Utilities
└── supabase/migrations/    # Database migrations
```

## Documentation

- **Platform Documentation**: See `app/claude.md` for comprehensive feature documentation
- **Security Practices**: See `SECURITY.md` for security guidelines

## Pricing & Positioning

- Complement to marketplaces: calendar sync and direct booking tools to keep student relationships while still using Preply/iTalki/Verbling for discovery
- Single all-access plan: **$29/month** or **$199/year** for everything that exists today (no tiers)

## License

Proprietary - All rights reserved
