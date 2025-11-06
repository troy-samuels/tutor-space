# 03 - Basic Dashboard

## Objective

Build the authenticated dashboard shell that every subsequent feature plugs into. This includes the global layout, navigation, responsive header, starter metrics, empty states, and entitlement-aware upgrade prompts so Professional, Growth, and Studio experiences have a consistent home.

## Prerequisites

- ✅ **00-project-setup.md** — Project scaffold, shadcn/ui, Tailwind, env vars  
- ✅ **01-database-schema.md** — Supabase schema + RLS  
- ✅ **02-authentication.md** — Auth middleware, providers, entitlement gating

## Deliverables

- `/app/(dashboard)/layout.tsx` wrapped in `ProtectedRoute`
- Desktop sidebar + mobile drawer navigation with plan-aware links
- Sticky top header with search, quick actions, and user menu
- Overview page featuring metric cards, upcoming sessions list, and empty states
- Growth/Studio upsell sections leveraging `useAuth` entitlements
- Reusable UI components (`DashboardShell`, `DashboardNav`, `MetricCard`, etc.)

## UX Narrative

1. **Tutor signs in** → lands on `/dashboard` with headline metrics, “Today’s Lessons,” resource shortcuts.  
2. **Navigation** clearly separates “Run the business” (Professional), “Grow” (Growth Plan), and “Scale” (Studio).  
3. **Empty states** show helpful next steps (create profile, add service) with CTA buttons.  
4. **Upgrade tiles** invite Professional users to unlock Growth/Studio capabilities without blocking navigation.  
5. **Mobile** experience keeps key insights one tap away using collapsible sections and bottom nav affordances.

## Implementation Steps

### Step 1: Define Route Grouping & Metadata

Create `/app/(dashboard)/layout.tsx` to guard authenticated pages and provide consistent chrome.

```tsx
// app/(dashboard)/layout.tsx
import type { Metadata } from 'next'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardShell } from '@/components/dashboard/shell'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Run your tutoring business from one place.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  )
}
```

### Step 2: Build Dashboard Container Components

Create a shell component to handle layout, including sidebar, header, and responsive behavior.

```tsx
// components/dashboard/shell.tsx
'use client'

import { useState } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      <Sheet open={open} onOpenChange={setOpen}>
        <DashboardSidebar className="hidden lg:flex" />
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <DashboardSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeader
            onOpenMobileNav={() => setOpen(true)}
            mobileNavTrigger={
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            }
          />
          <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </Sheet>
    </div>
  )
}
```

> Use shadcn `Sheet` for mobile nav to keep parity with other UI guides.

### Step 3: Implement Sidebar Navigation

Create a plan-aware navigation component with grouped links. Professional items should always render; Growth/Studio sections respect entitlements.

```tsx
// components/dashboard/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/components/providers/auth-provider'
import {
  BarChart3,
  Book,
  CalendarDays,
  GraduationCap,
  Layers,
  LineChart,
  Rocket,
  Users,
} from 'lucide-react'

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

const NAV_SECTIONS = [
  {
    label: 'Run the Business',
    items: [
      { href: '/dashboard', icon: BarChart3, label: 'Overview' },
      { href: '/bookings', icon: CalendarDays, label: 'Bookings' },
      { href: '/students', icon: Users, label: 'Students' },
      { href: '/resources', icon: Book, label: 'Resources' },
      { href: '/lesson-plans', icon: GraduationCap, label: 'Lesson Plans' },
    ],
  },
  {
    label: 'Grow (Premium)',
    plan: 'growth',
    items: [
      { href: '/growth/leads', icon: Rocket, label: 'Lead Hub' },
      { href: '/growth/ads', icon: Layers, label: 'Ad Center' },
      { href: '/growth/content', icon: LineChart, label: 'Content AI' },
    ],
  },
  {
    label: 'Studio Add-Ons',
    plan: 'studio',
    items: [
      { href: '/studio/group-sessions', icon: Users, label: 'Group Sessions' },
      { href: '/studio/marketplace', icon: Layers, label: 'Marketplace' },
      { href: '/studio/ceo-dashboard', icon: BarChart3, label: 'CEO Dashboard' },
    ],
  },
]

export function DashboardSidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { entitlements } = useAuthContext()

  return (
    <aside
      className={cn(
        'h-full w-72 flex-shrink-0 border-r bg-background/80 backdrop-blur',
        className
      )}
    >
      <div className="flex h-16 items-center px-6 text-xl font-semibold">
        TutorLingua
      </div>
      <nav className="space-y-6 px-3 pb-8 pt-4">
        {NAV_SECTIONS.map((section) => {
          if (section.plan === 'growth' && !entitlements.growth) {
            return <PlanUpgradeTeaser key={section.label} plan="growth" />
          }
          if (section.plan === 'studio' && !entitlements.studio) {
            return <PlanUpgradeTeaser key={section.label} plan="studio" />
          }

          return (
            <div key={section.label}>
              <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                {section.label}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function PlanUpgradeTeaser({ plan }: { plan: 'growth' | 'studio' }) {
  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-5">
      <p className="text-sm font-semibold capitalize">Unlock the {plan} plan</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Access {plan === 'growth' ? 'lead funnels, ads, and AI marketing' : 'group sessions, marketplace, and executive dashboards'}.
      </p>
      <Link
        href={`/upgrade?plan=${plan}`}
        className="mt-3 inline-flex text-sm font-semibold text-primary"
      >
        View plans →
      </Link>
    </div>
  )
}
```

### Step 4: Create Header with Search & User Menu

```tsx
// components/dashboard/header.tsx
'use client'

import { Search, Bell, Upload } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthContext } from '@/components/providers/auth-provider'
import { DashboardQuickLinks } from './quick-links'

type HeaderProps = {
  mobileNavTrigger?: React.ReactNode
  onOpenMobileNav?: () => void
}

export function DashboardHeader({
  mobileNavTrigger,
}: HeaderProps) {
  const { profile } = useAuthContext()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/70 px-4 backdrop-blur sm:px-6 lg:px-10">
      {mobileNavTrigger}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden w-full max-w-md items-center lg:flex">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students, bookings, resources..."
            className="pl-9"
          />
        </div>
        <DashboardQuickLinks />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon">
          <Upload className="h-4 w-4" />
          <span className="sr-only">Create content</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Link href="/settings/account" className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>
              {profile?.full_name?.slice(0, 2).toUpperCase() ?? 'TU'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm leading-tight lg:block">
            <p className="font-medium">{profile?.full_name ?? 'Tutor'}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
```

Add quick links component for common actions:

```tsx
// components/dashboard/quick-links.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function DashboardQuickLinks() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="secondary">
        <Link href="/bookings/new">Schedule session</Link>
      </Button>
      <Button asChild size="sm" className="hidden sm:inline-flex">
        <Link href="/lesson-plans/new">Create lesson plan</Link>
      </Button>
    </div>
  )
}
```

### Step 5: Scaffold Overview Page

Create `/app/(dashboard)/page.tsx` as the primary landing page. Start with mocked data; mark TODOs for wiring Supabase queries.

```tsx
// app/(dashboard)/page.tsx
import { Suspense } from 'react'
import { MetricCards } from '@/components/dashboard/metric-cards'
import { UpcomingSessions } from '@/components/dashboard/upcoming-sessions'
import { EmptyStates } from '@/components/dashboard/empty-states'
import { GrowthOpportunities } from '@/components/dashboard/growth-opportunities'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back! Here’s what’s happening.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track sessions, payments, and student progress in one place.
        </p>
      </header>

      <Suspense fallback={<MetricCards.Skeleton />}>
        {/* TODO: replace with server component fetching metrics via Supabase */}
        <MetricCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<UpcomingSessions.Skeleton />}>
          <UpcomingSessions className="lg:col-span-2" />
        </Suspense>
        <GrowthOpportunities />
      </div>

      <EmptyStates />
    </div>
  )
}
```

### Step 6: Create Metric Card Components

```tsx
// components/dashboard/metric-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Wallet, Users, Clock } from 'lucide-react'

const METRICS = [
  {
    label: 'Upcoming Sessions',
    value: '4',
    change: '+2 this week',
    icon: Clock,
  },
  {
    label: 'Monthly Revenue',
    value: '$2,450',
    change: '+12% vs. last month',
    icon: Wallet,
  },
  {
    label: 'Active Students',
    value: '18',
    change: '+3 new in 30 days',
    icon: Users,
  },
  {
    label: 'Lesson Completion Rate',
    value: '92%',
    change: '+5% vs. goal',
    icon: TrendingUp,
  },
]

export function MetricCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

MetricCards.Skeleton = function MetricCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}
```

### Step 7: Upcoming Sessions & Empty States

```tsx
// components/dashboard/upcoming-sessions.tsx

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Video, MapPin } from 'lucide-react'
import Link from 'next/link'

const MOCK_SESSIONS = [
  {
    id: '1',
    student: 'Juan Alvarez',
    service: 'Conversation Practice (B2)',
    scheduledAt: 'Today · 4:00 PM',
    location: 'Zoom',
  },
  {
    id: '2',
    student: 'Sakura Mori',
    service: 'Grammar Clinic (JLPT N3)',
    scheduledAt: 'Tomorrow · 9:30 AM',
    location: 'Google Meet',
  },
]

export function UpcomingSessions({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">
          Today & Tomorrow
        </CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href="/bookings">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK_SESSIONS.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No sessions scheduled</p>
            <p className="text-xs text-muted-foreground">
              Add your first availability slot to open bookings.
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/bookings/new">Add availability</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {MOCK_SESSIONS.map((session) => (
              <li
                key={session.id}
                className="rounded-lg border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{session.student}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.service}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Video className="h-4 w-4" />
                    <span className="sr-only">Join session</span>
                  </Button>
                </div>
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {session.scheduledAt}
                  <span className="mx-2">•</span>
                  <MapPin className="mr-1 h-3 w-3" />
                  {session.location}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

UpcomingSessions.Skeleton = function UpcomingSessionsSkeleton() {
  return (
    <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
  )
}
```

Empty state helper:

```tsx
// components/dashboard/empty-states.tsx

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const EMPTY_CARD_CONFIG = [
  {
    title: 'Complete your profile',
    description:
      'Add your bio, languages, and introduction video to help students get to know you.',
    actionLabel: 'Update profile',
    href: '/settings/profile',
  },
  {
    title: 'Add your first service',
    description:
      'Create a lesson offering so students can book and pay upfront.',
    actionLabel: 'Create service',
    href: '/services/new',
  },
  {
    title: 'Publish availability',
    description:
      'Let students pick time slots that work across time zones automatically.',
    actionLabel: 'Set availability',
    href: '/availability',
  },
]

export function EmptyStates({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-4 rounded-lg border border-dashed bg-muted/30 p-6 lg:grid-cols-3',
        className
      )}
    >
      {EMPTY_CARD_CONFIG.map((card) => (
        <Card key={card.title} className="border-none shadow-none">
          <CardContent className="p-0">
            <h3 className="text-sm font-semibold">{card.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href={card.href}>{card.actionLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

Growth opportunities card referencing premium features:

```tsx
// components/dashboard/growth-opportunities.tsx

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'

const GROWTH_CONTENT = [
  {
    title: 'Convert social followers',
    description:
      'Enable the lead capture form and nurture sequence in Growth Plan.',
    href: '/upgrade?plan=growth',
    pill: 'Growth plan',
  },
  {
    title: 'Launch your first group workshop',
    description: 'Studio plan includes multi-student bookings and waitlists.',
    href: '/upgrade?plan=studio',
    pill: 'Studio add-on',
  },
]

export function GrowthOpportunities() {
  const { entitlements } = useAuthContext()

  const items = GROWTH_CONTENT.filter((item) => {
    if (item.pill === 'Growth plan' && entitlements.growth) return false
    if (item.pill === 'Studio add-on' && entitlements.studio) return false
    return true
  })

  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Grow your business
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.title}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
            <Button asChild size="sm" variant="link" className="px-0">
              <Link href={item.href}>Learn more →</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

### Step 8: Wire Navigation Links in App Router

- Ensure `/app/bookings`, `/app/students`, etc., have minimal placeholder pages (`page.tsx` returning TODO).  
- Growth/Studio paths should render upgrade prompts using the `GrowthWall` helper from the auth guide until features exist.  
- Update `app/page.tsx` to redirect authenticated users to `/dashboard` (using server-side redirect).

### Step 9: Pull Real Data (TODO Hooks)

Document the queries you will later implement:

- Upcoming sessions: `bookings` joined with `students`, filter future dates, order ascending.  
- Metrics:  
  - Revenue: aggregate `invoices` status paid by month.  
  - Active students: distinct `students` with bookings last 30 days.  
  - Completion rate: ratio of `bookings.status = 'completed'` vs total.  
- Empty state prompts: check counts in `services`, `availability`, `profiles` completeness.

> Add comments like `// TODO: replace with server component fetching from Supabase` to remind future you.

### Step 10: Style & Responsiveness

- Use Tailwind `grid` utilities for cards; ensure 1-column mobile layout.  
- Add `backdrop-blur` and `bg-background/70` to header for subtle glass effect.  
- For mobile nav, ensure `Sheet` closes on link click via `onNavigate`.  
- Consider using CSS `sticky` top header and `min-h-screen` to avoid scroll jank.

### Step 11: Analytics & Events

- Emit PostHog/Segment events for key actions (`dashboard_view`, `empty_state_cta_click`, `upgrade_prompt_view`).  
- Store event helper in `lib/analytics.ts` for reuse; wire later.

### Step 12: Accessibility

- Provide `sr-only` labels for icons.  
- Ensure color contrast meets WCAG AA (use `bg-primary/10` not pure).  
- Keyboard trap check on mobile nav `Sheet`.

## Testing Checklist

- [ ] Authenticated user lands on `/dashboard` after login.  
- [ ] Sidebar highlights current route.  
- [ ] Mobile nav toggles and closes on navigation.  
- [ ] Metric cards render and collapse into one column on `<640px`.  
- [ ] Empty states visible when data arrays empty.  
- [ ] Upgrade teasers show/hide based on entitlements (toggle `plan_name`).  
- [ ] Placeholder links route to expected pages (no 404).  
- [ ] Lighthouse accessibility score ≥ 90 for `/dashboard`.

## AI Tool Prompts

### Scaffold Dashboard
```
Create a dashboard shell using Next.js App Router and shadcn/ui:
1. Protected layout with sidebar + top header
2. Mobile navigation sheet
3. Metric cards grid with skeleton loader
4. Upcoming sessions list with join buttons
Use TypeScript, Tailwind, and lucide-react icons.
```

### Fetch Metrics Server-Side
```
Write a Next.js Server Component that queries Supabase for:
- Upcoming bookings within 48 hours (with student/service names)
- Monthly revenue from invoices
- Active student count (last 30 days)
Return props to hydrate metric and table components.
```

### Responsive & Accessibility Audit
```
Review the dashboard layout for responsive and accessibility issues.
Check:
1. Focus states on nav links and buttons
2. Header spacing on devices < 768px
3. aria-labels for icon-only buttons
4. Color contrast against Tailwind theme tokens
Suggest improvements.
```

## Common Gotchas

- **Shallow Auth State**: Ensure `AuthProvider` wraps dashboard routes; without it `useAuthContext` will throw.  
- **Plan Routing Loops**: Middleware redirects to `/upgrade`; prevent infinite loops by excluding `/upgrade` path from protected route checks.  
- **Mobile Overflow**: Long tutor names or service titles can break layout—apply `truncate` utility classes.  
- **Skeleton Flash**: Use `<Suspense>` boundaries only for async data; avoid wrapping static components to prevent flicker.

## Next Steps

With the dashboard shell live:

1. Build `04-user-profiles.md` to populate profile CTAs.  
2. Wire actual Supabase queries once core tables exist and seed data added.  
3. Replace upgrade teasers with dynamic plan change flows in `20-settings-billing.md`.

## Success Criteria

✅ Authenticated users see dashboard chrome on every subpage  
✅ Navigation surfaces Professional core routes and plan-gated premium sections  
✅ Overview page presents metrics, schedule, and guided next steps  
✅ Mobile users get parity experience via sheet-based navigation  
✅ Dashboard skeleton ready for real Supabase data integrations

**Estimated Time**: 2-3 hours

