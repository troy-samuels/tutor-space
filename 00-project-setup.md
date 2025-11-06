# 00 - Project Setup

## Objective

Initialize a production-ready Next.js 14+ project with Supabase, TypeScript, Tailwind CSS, and essential tooling. This forms the foundation for all subsequent development.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended for Cursor)
- Cursor AI or Claude Code installed
- Supabase account (free tier is fine)
- Vercel account (optional, for deployment)
- Stripe account (test mode)

## Tech Stack Rationale

- **Next.js 14+**: Industry standard, excellent AI tool support, App Router for modern patterns
- **Supabase**: PostgreSQL + Auth + Storage + Realtime in one package, excellent for multi-tenant apps
- **TypeScript**: Better AI suggestions, catches errors early
- **Tailwind + shadcn/ui**: Rapid UI development with beautiful defaults
- **Vercel**: Zero-config deployment, edge functions, perfect Next.js integration
- **Growth Integrations**: Resend for transactional emails, Meta Ads/Google Ads APIs for the Growth Plan, Segment/PostHog ready for analytics
- **Browser Extensions**: Chrome Manifest V3 + Supabase Edge Functions groundwork for the AI Teaching Assistant

## Implementation Steps

### Step 1: Create Next.js Project

```bash
# Create new Next.js app with TypeScript, Tailwind, App Router
npx create-next-app@latest tutor-platform \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd tutor-platform
```

**AI Tool Prompt for Cursor/Claude:**
```
I'm creating a Next.js 14 app for a language tutor platform. Please verify my setup and suggest any missing configurations for:
- TypeScript strict mode
- Tailwind CSS custom configuration
- ESLint rules for production
- File structure best practices
```

### Step 2: Install Core Dependencies

```bash
# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# UI Components
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Stripe
npm install stripe @stripe/stripe-js

# Date handling
npm install date-fns date-fns-tz

# Utilities
npm install uuid
npm install -D @types/uuid
```

> ⚡️ **Upcoming Premium Features**  
> When you reach the digital classroom and growth features, you'll likely add:
> - Collaboration/whiteboard tooling (`yjs`, `liveblocks`, `@tldraw/tldraw` or similar)
> - Drag-and-drop + rich text editors (`@dnd-kit/core`, `@tiptap/react`)
> - Analytics/visualization (`@tanstack/react-query`, `recharts`, `posthog-js`)
> - Marketing integrations (`meta-marketing-api`, `google-ads-api`)
> - Speech/AI clients (`openai`, `@azure/cognitiveservices-speech-sdk`)
> Capture these in project notes so additions stay intentional when expanding beyond the Professional Plan.

### Step 3: Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install commonly needed components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add select
```

### Step 4: Setup Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Wait for database to provision (2-3 minutes)
4. Go to Settings → API
5. Copy these values:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret!)

### Step 5: Configure Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Calendar Sync OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:3000/api/calendar/oauth/google
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_OAUTH_REDIRECT_URL=http://localhost:3000/api/calendar/oauth/outlook
CALENDAR_TOKEN_ENCRYPTION_KEY=change-me-to-32-characters

# Email
RESEND_API_KEY=

# AI
OPENAI_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# Ads & Marketing (Growth Plan)
META_ADS_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
META_APP_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` (for git, without secrets):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URL=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_OAUTH_REDIRECT_URL=
CALENDAR_TOKEN_ENCRYPTION_KEY=

# Email
RESEND_API_KEY=

# AI
OPENAI_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# Ads & Marketing (Growth Plan)
META_ADS_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
META_APP_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Setup Supabase Client Utilities

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle error from middleware/server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error from middleware/server component
          }
        },
      },
    }
  )
}
```

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### Step 7: Configure Middleware

Create `middleware.ts` in root:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 8: Setup Tailwind Configuration

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### Step 9: Setup TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 10: Create Project Structure

```bash
mkdir -p app/(auth)
mkdir -p app/(dashboard)
mkdir -p app/(public)
mkdir -p app/api
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/forms
mkdir -p lib/actions
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p lib/types
mkdir -p lib/constants
```

### Step 11: Setup Utilities

Create `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Stripe amounts are in cents
}
```

### Step 12: Update .gitignore

Add to `.gitignore`:

```
# Environment
.env
.env.local
.env*.local

# Supabase
.supabase/

# Testing
coverage/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### Step 13: Test Setup

```bash
# Start dev server
npm run dev
```

Visit http://localhost:3000 - you should see the Next.js welcome page.

### Step 14: Initial Git Commit

```bash
git init
git add .
git commit -m "Initial project setup with Next.js, Supabase, TypeScript, Tailwind"
```

## Future-Proofing for Growth & Studio Features

- Reserve a folder structure for upcoming work (`apps/chrome-extension`, `packages/marketing`) so the Growth Plan additions slot in cleanly.
- Capture required OAuth credentials early (Google, Facebook, Meta Ads) and store setup docs alongside `.env.example`.
- Enable Supabase Realtime and Edge Functions — they'll power live transcription, lead ingestion webhooks, and collaborative whiteboard experiences.
- Adopt an event tracking plan (PostHog/Segment) now so the CEO dashboard and Growth analytics can piggyback on consistent event names.
- Note which third-party APIs require paid tiers (Meta Ads, Azure Speech) to plan budgeting before launch.

## Testing Checklist

- [ ] Project runs without errors (`npm run dev`)
- [ ] TypeScript compilation works (`npm run build`)
- [ ] Environment variables load correctly
- [ ] Supabase client can be imported
- [ ] shadcn/ui components render
- [ ] Tailwind styles apply
- [ ] No console errors in browser

## AI Tool Prompts for Cursor/Claude

### Verify Setup
```
Review my project setup and configuration files. Check for:
1. Missing dependencies
2. Security issues in environment handling
3. TypeScript configuration optimizations
4. Missing best practices
5. Potential conflicts between packages
```

### Generate Type Definitions
```
Create TypeScript type definitions for our platform with:
- User (tutor) profile type
- Student type
- Service/lesson type
- Booking type
- Subscription type
Include proper relationships and optional fields
```

### Create Utility Functions
```
Create utility functions for:
1. Formatting dates for timezone handling
2. Currency formatting with multiple currencies
3. URL slug generation from names
4. Email validation
5. Phone number formatting
```

## Common Gotchas

### Issue: Supabase Client Errors
**Problem**: "Invalid API key" or connection refused
**Solution**: 
- Verify `.env.local` has correct values
- Check Supabase project is running (not paused)
- Restart dev server after env changes

### Issue: Tailwind Styles Not Applying
**Problem**: Classes don't work
**Solution**:
- Verify `globals.css` imports Tailwind directives
- Check component file is in `content` array of `tailwind.config.ts`
- Clear `.next` folder and rebuild

### Issue: TypeScript Errors on Supabase
**Problem**: Type errors with Supabase client
**Solution**:
- Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts`
- Import and use generated types

### Issue: Middleware Not Running
**Problem**: Auth not persisting across pages
**Solution**:
- Verify middleware.ts is in root directory
- Check matcher pattern includes your routes
- Console log in middleware to verify execution

## Next Steps

Once setup is complete and all tests pass:
1. Proceed to **01-database-schema.md** to design your database
2. Keep this terminal running (`npm run dev`)
3. Open a second terminal for git commits and commands
4. Use Cursor/Claude Code to accelerate development

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Success Criteria

✅ Project runs without errors
✅ Can import Supabase client
✅ TypeScript strict mode enabled
✅ Tailwind and shadcn/ui working
✅ Environment variables configured
✅ Future Growth/AI env placeholders captured
✅ Git repository initialized
✅ Ready to build features

**Estimated Time**: 1-2 hours for initial setup
