# TutorLingua Design Documentation

> Comprehensive design reference for all pages and components in the TutorLingua platform.

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Layout Architecture](#layout-architecture)
3. [Public Pages](#public-pages)
4. [Authentication Pages](#authentication-pages)
5. [Tutor Dashboard Pages](#tutor-dashboard-pages)
6. [Student Portal Pages](#student-portal-pages)
7. [Admin Panel Pages](#admin-panel-pages)
8. [Booking Flow Pages](#booking-flow-pages)
9. [Component Library](#component-library)

---

## Design System Overview

### Color Palette

#### Light Mode (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FDF8F5` | Page backgrounds, off-white cream |
| `--foreground` | `#2D2A26` | Primary text, dark brown/charcoal |
| `--card` | `#ffffff` | Card surfaces |
| `--primary` | `#D36135` | CTAs, links, brand accent (burnt orange) |
| `--secondary` | `#F5EDE8` | Secondary backgrounds (warm cream) |
| `--accent` | `#3E5641` | Success states, highlights (forest green) |
| `--destructive` | `#A24936` | Error states, delete actions (deep rust) |
| `--border` | `rgba(45, 42, 38, 0.06)` | Ultra-subtle borders |
| `--input` | `rgba(45, 42, 38, 0.08)` | Input field borders |
| `--ring` | `#D36135` | Focus rings (matches primary) |

#### Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#1A1917` | Dark page backgrounds |
| `--foreground` | `#F5F2EF` | Light text on dark |
| `--primary` | `#E8784D` | Lighter orange for contrast |
| `--accent` | `#5A7A5E` | Lighter green for dark mode |
| `--destructive` | `#C4563F` | Lighter rust for visibility |

#### Chart Colors
- `--chart-1` through `--chart-5`: 5-color palette for data visualization

### Typography

#### Font Stack (14 fonts loaded)

**Primary Interface:**
- **Inter** (`--font-inter`) - Default sans-serif, system-like
- **Manrope** (`--font-manrope`) - Rounded, friendly sans-serif
- **DM Sans** (`--font-dm-sans`) - Luxury UI font

**Display & Headings:**
- **Space Grotesk** (`--font-space-grotesk`) - Bold display headings
- **DM Serif Display** (`--font-dm-serif-display`) - Editorial serif
- **Plus Jakarta Sans** (`--font-plus-jakarta`) - Swiss-style headings
- **Spline Sans** (`--font-spline-sans`) - Modern interface headings

**Body & Reading:**
- **Source Sans 3** (`--font-source-sans`) - Ivy League body text
- **Merriweather** (`--font-merriweather`) - Readable serif
- **Andika** (`--font-andika`) - Accessible creative body

**Creative:**
- **Amatic SC** (`--font-amatic-sc`) - Hand-drawn display

**CJK Support:**
- **Noto Sans JP** - Japanese
- **Noto Sans SC** - Simplified Chinese
- **Noto Sans KR** - Korean

#### Font Pairings (6 curated combinations)
| ID | Heading | Body | Style |
|----|---------|------|-------|
| `minimal` | Inter | Inter | Clean, modern |
| `literary` | Merriweather | Source Sans 3 | Classic, book-like |
| `heritage` | DM Serif Display | DM Sans | Traditional, premium |
| `expressive` | Space Grotesk | Manrope | Bold, creative |
| `interface` | Plus Jakarta Sans | Inter | UI-focused, modern |
| `creative` | Amatic SC | Andika | Playful, hand-drawn |

### Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.625rem` (10px) | Base border radius |
| Border radius scale | `lg` (8.5px), `xl` (10.5px), `2xl` (12.5px), `3xl` (18.75px) | Component variants |

### Design Principles

1. **Warm & Professional** - Earthy tones create approachable yet trustworthy feel
2. **Ultra-subtle Borders** - 6% opacity borders for delicate separation
3. **Generous Whitespace** - Breathing room for content-heavy pages
4. **Rounded Aesthetic** - Friendly corners throughout
5. **Accessibility** - CJK language support, keyboard navigation, focus indicators

---

## Layout Architecture

### Root Layout (`app/layout.tsx`)
- **Purpose**: Application shell with providers and global styles
- **Elements**:
  - HTML lang attribute (i18n)
  - Font CSS variables injection
  - Auth provider wrapper
  - Toast/notification container
  - Global CSS import

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- **Purpose**: Protected tutor workspace wrapper
- **Structure**:
  ```
  ┌─────────────────────────────────────────────────┐
  │ Impersonation Banner (admin only)               │
  ├──────────┬──────────────────────────────────────┤
  │          │ Header (sticky)                      │
  │ Sidebar  │ ┌────────────────────────────────┐   │
  │ (hidden  │ │                                │   │
  │ mobile)  │ │     Main Content Area          │   │
  │          │ │     (max-w-4xl default)        │   │
  │          │ │                                │   │
  │          │ └────────────────────────────────┘   │
  ├──────────┴──────────────────────────────────────┤
  │ Bottom Navigation (mobile only)                 │
  └─────────────────────────────────────────────────┘
  ```
- **Breakpoints**:
  - Mobile: Bottom nav, no sidebar
  - Desktop: Collapsible sidebar, sticky header

### Settings Layout (`app/(dashboard)/settings/layout.tsx`)
- **Purpose**: Settings sub-navigation wrapper
- **Structure**:
  ```
  ┌─────────────────────────────────────────────────┐
  │ Settings Header                                 │
  ├───────────────┬─────────────────────────────────┤
  │ Settings Nav  │                                 │
  │ • Profile     │     Settings Content            │
  │ • Billing     │                                 │
  │ • Calendar    │                                 │
  │ • Payments    │                                 │
  │ • Video       │                                 │
  └───────────────┴─────────────────────────────────┘
  ```

### Admin Layout (`app/admin/layout.tsx`)
- **Purpose**: Platform admin interface wrapper
- **Elements**: Admin header, sidebar navigation, auth gate

### Blog Layout (`app/(public)/blog/layout.tsx`)
- **Purpose**: Blog article wrapper with i18n variants
- **Variants**: `/blog`, `/es/blog`, `/fr/blog`

---

## Public Pages

### Landing Page (`/`)
**File**: `app/app/page.tsx`

**Purpose**: Marketing homepage for TutorLingua platform

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Navigation Bar                                  │
│ Logo | Features | Pricing | Login | Sign Up     │
├─────────────────────────────────────────────────┤
│                                                 │
│              Hero Section                       │
│   Headline + Subhead + CTA Buttons              │
│                                                 │
├─────────────────────────────────────────────────┤
│ Feature Grid (3-4 columns)                      │
│ Icon + Title + Description per card             │
├─────────────────────────────────────────────────┤
│ Social Proof / Testimonials                     │
├─────────────────────────────────────────────────┤
│ Pricing Section                                 │
│ Free | Pro | Studio tier cards                  │
├─────────────────────────────────────────────────┤
│ Footer                                          │
│ Links | Social | Legal                          │
└─────────────────────────────────────────────────┘
```

**Visual Elements**:
- Hero gradient background
- Feature icons from Lucide
- Pricing cards with highlighted "popular" tier
- CTA buttons in primary orange

---

### Tutor Public Site (`/[username]`)
**File**: `app/app/(public)/[username]/page.tsx`

**Purpose**: Individual tutor's public landing page (customizable via Page Builder)

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Hero Section                                    │
│ ┌─────────┐                                     │
│ │ Avatar  │  Tutor Name                         │
│ │         │  Tagline                            │
│ └─────────┘  [Book Now] CTA                     │
├─────────────────────────────────────────────────┤
│ About Section                                   │
│ Bio text (up to 5,000 chars)                    │
├─────────────────────────────────────────────────┤
│ Gallery (up to 5 images)                        │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                   │
│ │   │ │   │ │   │ │   │ │   │                   │
│ └───┘ └───┘ └───┘ └───┘ └───┘                   │
├─────────────────────────────────────────────────┤
│ Services Grid                                   │
│ Service cards with name, duration, price        │
├─────────────────────────────────────────────────┤
│ Reviews / Testimonials                          │
│ Carousel or grid of student reviews             │
├─────────────────────────────────────────────────┤
│ FAQ Accordion                                   │
│ Expandable Q&A items                            │
├─────────────────────────────────────────────────┤
│ Footer with booking CTA                         │
└─────────────────────────────────────────────────┘
```

**Theming System**:
- 4 cultural archetypes determine base styling:
  - **Professional**: Cool tones, briefcase icon, business-focused
  - **Immersion**: Warm tones, coffee icon, community-focused
  - **Academic**: Heritage fonts, serif headings, scholarly
  - **Polyglot**: Expressive colors, global/diverse feel
- Custom color overrides available
- Font pairing selection (heading + body)
- Border radius customization (lg → 3xl)

---

### Tutor Reviews Page (`/[username]/reviews`)
**File**: `app/app/(public)/[username]/reviews/page.tsx`

**Purpose**: Full reviews listing for a tutor

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "[Tutor Name]'s Reviews"                │
├─────────────────────────────────────────────────┤
│ Stats Summary                                   │
│ Average Rating | Total Reviews | Response Rate  │
├─────────────────────────────────────────────────┤
│ Review List (paginated)                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ ★★★★★  Student Name  Date                   │ │
│ │ "Review text..."                            │ │
│ └─────────────────────────────────────────────┘ │
│ [Load More]                                     │
└─────────────────────────────────────────────────┘
```

---

### Public Profile (`/profile/[username]`)
**File**: `app/app/(public)/profile/[username]/page.tsx`

**Purpose**: Simplified tutor profile view

**Elements**: Avatar, name, bio, languages taught, booking link

---

### Link-in-Bio (`/bio/[username]`)
**File**: `app/app/(public)/bio/[username]/page.tsx`

**Purpose**: Social media link-in-bio style landing

**Layout**: Centered vertical stack of links and CTAs

---

### Digital Products (`/products/[username]`)
**File**: `app/app/(public)/products/[username]/page.tsx`

**Purpose**: Tutor's digital products catalog

**Elements**: Product cards with name, price, description, purchase button

---

### Blog Pages (`/blog`, `/blog/[slug]`)
**Files**: `app/app/(public)/blog/page.tsx`, `app/app/(public)/blog/[slug]/page.tsx`

**Purpose**: Platform blog with i18n support

**Listing Layout**:
```
┌─────────────────────────────────────────────────┐
│ Blog Header + Search                            │
├─────────────────────────────────────────────────┤
│ Featured Post (hero card)                       │
├─────────────────────────────────────────────────┤
│ Post Grid (3 columns)                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ Image   │ │ Image   │ │ Image   │             │
│ │ Title   │ │ Title   │ │ Title   │             │
│ │ Excerpt │ │ Excerpt │ │ Excerpt │             │
│ └─────────┘ └─────────┘ └─────────┘             │
├─────────────────────────────────────────────────┤
│ Pagination                                      │
└─────────────────────────────────────────────────┘
```

**Article Layout**:
```
┌─────────────────────────────────────────────────┐
│ Article Header                                  │
│ Title | Author | Date | Reading Time            │
├─────────────────────────────────────────────────┤
│ Hero Image                                      │
├─────────────────────────────────────────────────┤
│ Article Content (prose styling)                 │
│ Headings, paragraphs, images, code blocks       │
├─────────────────────────────────────────────────┤
│ Author Bio Card                                 │
├─────────────────────────────────────────────────┤
│ Related Posts                                   │
└─────────────────────────────────────────────────┘
```

**Localized Variants**: `/es/blog`, `/fr/blog`

---

### Help Center (`/help`, `/help/[slug]`)
**Files**: `app/app/(public)/help/page.tsx`, `app/app/(public)/help/[slug]/page.tsx`

**Purpose**: Help documentation and FAQs

**Layout**: Category listing → Article detail with table of contents

---

### Legal Pages (`/privacy`, `/terms`)
**Files**: `app/app/(public)/privacy/page.tsx`, `app/app/(public)/terms/page.tsx`

**Purpose**: Legal documentation

**Layout**: Prose content with section headings

---

## Authentication Pages

### Tutor Login (`/login`)
**File**: `app/app/login/page.tsx`

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Logo                               │
│                                                 │
│     ┌─────────────────────────────────┐         │
│     │ Email Input                     │         │
│     ├─────────────────────────────────┤         │
│     │ Password Input                  │         │
│     ├─────────────────────────────────┤         │
│     │ [Sign In] Button                │         │
│     └─────────────────────────────────┘         │
│                                                 │
│     Forgot password? | Sign up link             │
│                                                 │
│     ─────── OR ───────                          │
│                                                 │
│     [Google] [Apple] OAuth buttons              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Visual Elements**:
- Centered card on gradient background
- Primary CTA button
- Subtle divider for OAuth options
- Error state styling for invalid credentials

---

### Tutor Signup (`/signup`)
**File**: `app/app/signup/page.tsx`

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Split Layout (desktop)                          │
├───────────────────────┬─────────────────────────┤
│                       │                         │
│  Marketing Panel      │    Signup Form          │
│  • Benefits list      │    • Full name          │
│  • Social proof       │    • Email              │
│  • Testimonial        │    • Password           │
│                       │    • [Create Account]   │
│                       │                         │
│                       │    OAuth buttons        │
│                       │                         │
└───────────────────────┴─────────────────────────┘
```

**Form Fields**:
- Full name
- Email
- Password (with strength indicator)
- Terms acceptance checkbox

---

### Password Reset (`/forgot-password`, `/reset-password`)
**Files**: `app/app/forgot-password/page.tsx`, `app/app/reset-password/page.tsx`

**Layout**: Centered card with email input / new password inputs

---

### Student Login (`/student/login`)
**File**: `app/app/student/login/page.tsx`

**Purpose**: Student portal authentication

**Layout**: Similar to tutor login but branded for students

---

### Student Signup (`/student/signup`)
**File**: `app/app/student/signup/page.tsx`

**Purpose**: Student account creation

---

### OAuth Error (`/auth/error`)
**File**: `app/app/auth/error/page.tsx`

**Purpose**: Display OAuth authentication errors

**Elements**: Error message, retry button, support link

---

## Tutor Dashboard Pages

### Main Dashboard (`/dashboard`)
**File**: `app/app/(dashboard)/dashboard/page.tsx`

**Purpose**: Tutor home with overview metrics and upcoming sessions

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Page Header: "Dashboard"                        │
├─────────────────────────────────────────────────┤
│ Metric Cards Row                                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │Revenue  │ │Lessons  │ │Students │ │Retention│ │
│ │$X,XXX   │ │XX       │ │XX       │ │XX%      │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────┤
│ Two Column Layout                               │
│ ┌─────────────────────┬───────────────────────┐ │
│ │ Upcoming Sessions   │ Recent Activity       │ │
│ │ • Session 1         │ • Booking received    │ │
│ │ • Session 2         │ • Payment processed   │ │
│ │ • Session 3         │ • Message from...     │ │
│ │ [View Calendar]     │                       │ │
│ └─────────────────────┴───────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Quick Actions                                   │
│ [Add Service] [View Students] [Edit Site]       │
└─────────────────────────────────────────────────┘
```

**Components Used**:
- `MetricCards` - Animated count-up stats
- `UpcomingSessions` - Next 5 lessons widget
- `RecentActivity` - Activity feed

**Loading State**: `loading.tsx` with skeleton cards

---

### Calendar (`/calendar`)
**File**: `app/app/(dashboard)/calendar/page.tsx`

**Purpose**: Lesson scheduling and time management

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: View Toggle (Month | Week | Day)        │
├─────────────────────────────────────────────────┤
│ Calendar View                                   │
│ ┌─────────────────────────────────┬───────────┐ │
│ │                                 │ Day Panel │ │
│ │      Calendar Grid              │ (slide-in)│ │
│ │      (month/week/day)           │           │ │
│ │                                 │ Selected  │ │
│ │                                 │ day       │ │
│ │                                 │ lessons   │ │
│ │                                 │           │ │
│ └─────────────────────────────────┴───────────┘ │
├─────────────────────────────────────────────────┤
│ Legend: Event Types                             │
│ 🟠 TutorLingua  🔵 Google  🟣 Outlook           │
└─────────────────────────────────────────────────┘
```

**Views**:
- **Month View**: Day cells with booking count indicators
- **Week View**: Hourly grid (8 AM - 8 PM default)
- **Day View**: Timeline with current time indicator

**Interactions**:
- Click lesson → Reschedule dialog
- Click empty slot → Quick block dialog
- Drag lesson → Reschedule with conflict detection

**Components**:
- `CalendarPageClient` - Orchestrator
- `DashboardBookingCalendar` - Month view
- `CalendarWeekView` - Week grid
- `CalendarDayView` - Day timeline
- `CalendarDayPanel` - Slide-in sidebar (Framer Motion)
- `QuickBlockDialog` - Time blocking modal

**Animations**:
- Panel slide-in from right (spring damping)
- Staggered lesson list items
- Header transitions on date change

---

### Bookings (`/bookings`)
**File**: `app/app/(dashboard)/bookings/page.tsx`

**Purpose**: Booking management and history

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header + Filter Tabs                            │
│ All | Upcoming | Completed | Cancelled          │
├─────────────────────────────────────────────────┤
│ Search + Date Range Filter                      │
├─────────────────────────────────────────────────┤
│ Bookings Table                                  │
│ ┌───────────────────────────────────────────────┐
│ │ Student | Service | Date | Status | Actions  │
│ ├───────────────────────────────────────────────┤
│ │ Name    | 1hr     | Dec 10| ✓      | •••     │
│ │ Name    | 30min   | Dec 11| ⏳     | •••     │
│ └───────────────────────────────────────────────┘
├─────────────────────────────────────────────────┤
│ Pagination                                      │
└─────────────────────────────────────────────────┘
```

**Status Badges**:
- `confirmed` - Green
- `pending` - Yellow
- `completed` - Gray
- `cancelled` - Red

**Actions Menu**: Reschedule, Cancel, View Details, Message Student

---

### New Booking (`/bookings/new`)
**File**: `app/app/(dashboard)/bookings/new/page.tsx`

**Purpose**: Manual booking creation by tutor

**Form Fields**: Student selector, service, date/time, notes

---

### Students CRM (`/students`)
**File**: `app/app/(dashboard)/students/page.tsx`

**Purpose**: Student roster management

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "Students" + [Add Student] Button       │
├─────────────────────────────────────────────────┤
│ Search + Label Filter                           │
├─────────────────────────────────────────────────┤
│ Student Cards/List                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ ┌────┐ Student Name          Actions        │ │
│ │ │Ava │ email@example.com     [Msg] [View]   │ │
│ │ └────┘ 12 lessons | Pro      [•••]          │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ ┌────┐ Student Name          Actions        │ │
│ │ │Ava │ email@example.com     [Msg] [View]   │ │
│ │ └────┘ 5 lessons | Free      [•••]          │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Quick Actions**: Message, View Detail, Mark Inactive

---

### Student Detail (`/students/[studentId]`)
**File**: `app/app/(dashboard)/students/[studentId]/page.tsx`

**Purpose**: Individual student management hub

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Student Header Card                             │
│ ┌────┐  Name  |  Status Badge  |  [Edit]       │
│ │Ava │  Email |  Member since  |               │
│ └────┘  Timezone                               │
├─────────────────────────────────────────────────┤
│ Tab Navigation                                  │
│ Lessons | Messages | Homework | Progress |      │
│ Payments | Details                              │
├─────────────────────────────────────────────────┤
│ Tab Content Area                                │
│                                                 │
│   (Content changes based on selected tab)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Tabs (6 total)**:

1. **Lessons Tab** (`StudentLessonsCalendar`)
   - Monthly calendar showing student's lessons
   - Color-coded status indicators
   - Click to view lesson details

2. **Messages Tab** (`StudentMessagesTab`)
   - Conversation thread with student
   - Message composer with audio support
   - Realtime updates via Supabase

3. **Homework Tab** (`HomeworkTab`)
   - Assignment list with due dates
   - Create/edit homework modal
   - Audio instruction recording
   - Submission review interface
   - Feedback editor

4. **Progress Tab** (`StudentProgressPanel`)
   - Learning goals with progress bars
   - Proficiency assessments (8 skill areas)
   - Stats: total lessons, minutes, streaks
   - Lesson notes history

5. **Payments Tab** (`StudentPaymentsTab`)
   - Payment history table
   - Session package status
   - Subscription details
   - Refund request workflow

6. **Details Tab** (`StudentDetailsTab`)
   - Bio, native language, level
   - Contact preferences
   - Labels (badge display)
   - Edit profile button

---

### Access Requests (`/students/access-requests`)
**File**: `app/app/(dashboard)/students/access-requests/page.tsx`

**Purpose**: Review pending student access requests

**Layout**: Card list with approve/deny buttons

---

### Import Students (`/students/import`)
**File**: `app/app/(dashboard)/students/import/page.tsx`

**Purpose**: Bulk import students via CSV

**Elements**: File upload, field mapping, validation preview

---

### Services (`/services`)
**File**: `app/app/(dashboard)/services/page.tsx`

**Purpose**: Lesson types and package management

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "Services" + [Add Service] Button       │
├─────────────────────────────────────────────────┤
│ Service Cards                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Service Name           [Active] ○           │ │
│ │ 60 min | $50           Offer Type Badge     │ │
│ │                        [Edit] [Delete]      │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Session Packages:                       │ │ │
│ │ │ • 5 sessions - $225 (10% off)           │ │ │
│ │ │ • 10 sessions - $425 (15% off)          │ │ │
│ │ │ [Add Package]                           │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Offer Types**:
- `subscription` - Recurring monthly
- `lesson_block` - Pre-paid sets
- `one_off` - Standard single bookings
- `trial` - Short intro sessions

**Service Form** (Modal, 3 steps):
1. Offer Basics: Name, description, type
2. Pricing & Length: Duration, price, currency
3. Policies & Publish: Max students, approval requirement

---

### Analytics (`/analytics`)
**File**: `app/app/(dashboard)/analytics/page.tsx`

**Purpose**: Business performance metrics

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "Analytics" + Time Period Selector      │
├─────────────────────────────────────────────────┤
│ Overview Cards                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │Revenue  │ │Lessons  │ │Students │ │Retention│ │
│ │$X,XXX ↑ │ │XX  ↑    │ │XX  →    │ │XX%  ↓   │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────┤
│ Charts Grid                                     │
│ ┌─────────────────────┬───────────────────────┐ │
│ │ Revenue Chart       │ Bookings Chart        │ │
│ │ (Line chart)        │ (Bar chart)           │ │
│ └─────────────────────┴───────────────────────┘ │
│ ┌─────────────────────┬───────────────────────┐ │
│ │ Student Metrics     │ Service Popularity    │ │
│ │ (Acquisition)       │ (Horizontal bars)     │ │
│ └─────────────────────┴───────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Components**:
- `OverviewCards` - Animated metric cards with trend arrows
- `RevenueChart` - Recharts line chart
- `BookingsChart` - Recharts bar chart
- `StudentMetrics` - New vs repeat breakdown
- `ServicePopularity` - Revenue per service

**Premium Analytics** (Studio tier):
- Financial health breakdown
- Plan distribution pie chart
- Utilization rates
- Traffic stats
- Recent activity feed

---

### Payment Analytics (`/analytics/payments`)
**File**: `app/app/(dashboard)/analytics/payments/page.tsx`

**Purpose**: Detailed payment analytics

**Elements**: Revenue breakdown, payment method stats, transaction history

---

### Messages (`/messages`)
**File**: `app/app/(dashboard)/messages/page.tsx`

**Purpose**: Messaging center for all student conversations

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "Messages"                              │
├───────────────────────┬─────────────────────────┤
│ Conversation List     │ Message Thread          │
│ ┌───────────────────┐ │ ┌─────────────────────┐ │
│ │ Student 1     •   │ │ │ Student Name        │ │
│ │ Last message...   │ │ │ ─────────────────── │ │
│ ├───────────────────┤ │ │ Message bubbles     │ │
│ │ Student 2         │ │ │                     │ │
│ │ Last message...   │ │ │                     │ │
│ └───────────────────┘ │ │                     │ │
│                       │ ├─────────────────────┤ │
│                       │ │ Composer + Audio    │ │
│                       │ └─────────────────────┘ │
└───────────────────────┴─────────────────────────┘
```

**Components**:
- `MessageComposer` - Text + audio message input
- `RealtimeMessagesContainer` - Supabase realtime updates

---

### Notifications (`/notifications`)
**File**: `app/app/(dashboard)/notifications/page.tsx`

**Purpose**: Activity notifications

**Layout**: List of notification items with read/unread state

**Notification Types**: Booking, payment, message, system

---

### Availability (`/availability`)
**File**: `app/app/(dashboard)/availability/page.tsx`

**Purpose**: Set working hours and availability

**Elements**: Weekly schedule grid, time slot editor

---

### Marketing Site (`/marketing/site`)
**File**: `app/app/(dashboard)/marketing/site/page.tsx`

**Purpose**: Page Builder wizard for tutor site

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: Status Badge | [Save Draft] [Publish]   │
├─────────────────────────────────────────────────┤
│ Progress Wheel (circular %)                     │
├───────────────────────┬─────────────────────────┤
│ Editor Sections       │ Live Preview            │
│ ┌───────────────────┐ │ ┌─────────────────────┐ │
│ │ 1. Profile        │ │ │                     │ │
│ │ Avatar, name, bio │ │ │  Preview of site    │ │
│ │ Gallery           │ │ │  with current       │ │
│ ├───────────────────┤ │ │  settings           │ │
│ │ 2. Content        │ │ │                     │ │
│ │ Services, FAQs    │ │ │  (sticky sidebar)   │ │
│ │ Reviews           │ │ │                     │ │
│ ├───────────────────┤ │ │                     │ │
│ │ 3. Style          │ │ │                     │ │
│ │ Archetype, fonts  │ │ │                     │ │
│ │ Colors, radius    │ │ │                     │ │
│ └───────────────────┘ │ └─────────────────────┘ │
└───────────────────────┴─────────────────────────┘
```

**Sections**:

1. **Profile** (`step-profile.tsx`)
   - Avatar upload (drag-drop)
   - Name and tagline inputs
   - About textarea (5,000 char limit)
   - Gallery uploader (max 5 images)

2. **Content** (`step-content-unified.tsx`)
   - Services checkbox selector
   - FAQ builder (add/edit/delete Q&A pairs)
   - Reviews display and ordering

3. **Style** (`step-style.tsx`)
   - Archetype selector (4 options)
   - Font pairing dropdown
   - Custom color picker (HSL)
   - Border radius slider

**State Management**: Context + Reducer pattern with auto-save

---

### Email Marketing (`/marketing/email`)
**File**: `app/app/(dashboard)/marketing/email/page.tsx`

**Purpose**: Email campaign management

**Elements**: Campaign list, compose email, template selector

---

### Link in Bio (`/marketing/links`)
**File**: `app/app/(dashboard)/marketing/links/page.tsx`

**Purpose**: Social link-in-bio page builder

**Elements**: Link list editor, preview

---

### Classroom (`/classroom/[bookingId]`)
**File**: `app/app/(dashboard)/classroom/[bookingId]/page.tsx`

**Purpose**: LiveKit video lesson room

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Lesson Header: Student Name | Timer | [End]     │
├─────────────────────────────────────────────────┤
│ Video Grid                                      │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │         Primary Video (speaker)             │ │
│ │                                             │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ┌───────┐ ┌───────┐                         │ │
│ │ │ Self  │ │Student│  Thumbnails             │ │
│ │ └───────┘ └───────┘                         │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Control Bar                                     │
│ [Mic] [Camera] [Screen] [Chat] [Record] [Leave] │
└─────────────────────────────────────────────────┘
```

**LiveKit Integration**:
- Custom CSS variables for brand consistency
- Blur backdrop on control bar
- Participant tile styling

---

### Settings Pages (`/settings/*`)

**Profile** (`/settings/profile`)
- Avatar upload
- Full name, display name
- Bio/tagline
- Languages taught
- Timezone selector

**Billing** (`/settings/billing`)
- Current plan display
- Upgrade/downgrade buttons
- Billing history
- Portal link button

**Calendar** (`/settings/calendar`)
- Google Calendar connect/disconnect
- Outlook Calendar connect/disconnect
- Sync status display

**Payments** (`/settings/payments`)
- Payment method selector (Stripe, PayPal, Venmo, etc.)
- Stripe Connect onboarding
- Account details per method

**Video** (`/settings/video`)
- Platform selector: Zoom, Meet, Teams, Calendly, Custom, None
- Platform-specific URL inputs
- Test connection button

---

### Onboarding (`/onboarding`)
**File**: `app/app/(dashboard)/onboarding/page.tsx`

**Purpose**: New tutor setup wizard

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Progress Bar (step X of 6)                      │
├─────────────────────────────────────────────────┤
│                                                 │
│              Step Content                       │
│                                                 │
│   1. Welcome                                    │
│   2. Profile basics                             │
│   3. Languages                                  │
│   4. Services                                   │
│   5. Availability                               │
│   6. Video setup                                │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Back] ──────────────────────────────── [Next]  │
└─────────────────────────────────────────────────┘
```

---

### Upgrade (`/upgrade`)
**File**: `app/app/(dashboard)/upgrade/page.tsx`

**Purpose**: Subscription upgrade flow

**Elements**: Plan comparison, checkout CTA

### Upgrade Success (`/upgrade/success`)
**Purpose**: Post-upgrade confirmation

---

## Student Portal Pages

### Student Dashboard (`/student/progress`)
**File**: `app/app/student/progress/page.tsx`

**Purpose**: Student's learning hub

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "My Learning Progress"                  │
├─────────────────────────────────────────────────┤
│ Stats Cards                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │Lessons  │ │Minutes  │ │Streak   │             │
│ │Completed│ │Learned  │ │Days     │             │
│ └─────────┘ └─────────┘ └─────────┘             │
├─────────────────────────────────────────────────┤
│ Upcoming Lessons                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Lesson with [Tutor] on [Date]    [Join]    │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Recent Homework                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Assignment name    Due: [Date]   [Submit]   │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Progress Goals                                  │
│ Goal 1 ████████░░░░ 75%                         │
│ Goal 2 ██████░░░░░░ 50%                         │
└─────────────────────────────────────────────────┘
```

---

### Student Messages (`/student/messages`)
**File**: `app/app/student/messages/page.tsx`

**Purpose**: Message tutors

**Layout**: Conversation list + thread view

---

### Student Calendar (`/student/calendar`)
**File**: `app/app/student/calendar/page.tsx`

**Purpose**: View scheduled lessons

---

### Student Billing (`/student/billing`)
**File**: `app/app/student/billing/page.tsx`

**Purpose**: Payment methods and history

---

### Student Subscriptions (`/student/subscriptions`)
**File**: `app/app/student/subscriptions/page.tsx`

**Purpose**: Manage lesson subscriptions

---

### Find Tutors (`/student/search`)
**File**: `app/app/student/search/page.tsx`

**Purpose**: Tutor discovery and search

**Elements**: Search bar, filter sidebar, tutor cards

---

### AI Practice (`/student/practice/[assignmentId]`)
**File**: `app/app/student/practice/[assignmentId]/page.tsx`

**Purpose**: Interactive AI conversation practice

**Elements**: Chat interface, audio recording, feedback display

---

### Request Access (`/student/request-access`)
**File**: `app/app/student/request-access/page.tsx`

**Purpose**: Request access to specific tutor

---

## Admin Panel Pages

### Admin Dashboard (`/admin/dashboard`)
**File**: `app/app/admin/dashboard/page.tsx`

**Purpose**: Platform overview for administrators

**Metrics**: Total tutors, students, revenue, active sessions

---

### Tutor Management (`/admin/tutors`)
**File**: `app/app/admin/tutors/page.tsx`

**Purpose**: Platform tutor oversight

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Header: "Tutors" + Search + Filters             │
├─────────────────────────────────────────────────┤
│ Tutor Table                                     │
│ Name | Email | Plan | Status | Revenue | Action │
│ ────────────────────────────────────────────────│
│ Name | email | Pro  | Active | $1,234 | [View]  │
│ Name | email | Free | Active | $0     | [View]  │
├─────────────────────────────────────────────────┤
│ Pagination                                      │
└─────────────────────────────────────────────────┘
```

---

### Tutor Detail (`/admin/tutors/[tutorId]`)
**File**: `app/app/admin/tutors/[tutorId]/page.tsx`

**Purpose**: Individual tutor administration

**Elements**:
- Profile overview
- Plan management (`TutorPlanManager`)
- Booking history
- Revenue stats
- Impersonation button

---

### Student Management (`/admin/students/*`)
**Purpose**: Platform student oversight

---

### Analytics Pages (`/admin/analytics/*`)
- `/admin/analytics` - Overview
- `/admin/analytics/engagement` - Engagement metrics
- `/admin/analytics/page-views` - Traffic analytics
- `/admin/analytics/revenue` - Revenue breakdown
- `/admin/analytics/subscriptions` - Subscription metrics

---

### Admin Email (`/admin/email`)
**Purpose**: Platform-wide email campaigns

---

### Data Export (`/admin/export`)
**Purpose**: Export platform data (tutors, students, revenue)

---

### System Health (`/admin/health`)
**Purpose**: Platform health monitoring

---

### Impersonate (`/admin/impersonate`)
**Purpose**: Login as user for support

---

### Content Moderation (`/admin/moderation`)
**Purpose**: Review flagged content

---

## Booking Flow Pages

### Booking Landing (`/book`)
**File**: `app/app/book/page.tsx`

**Purpose**: Booking discovery page

---

### Tutor Booking (`/book/[username]`)
**File**: `app/app/book/[username]/page.tsx`

**Purpose**: Complete booking flow for specific tutor

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Tutor Header                                    │
│ Avatar | Name | Rating                          │
├─────────────────────────────────────────────────┤
│ Step Indicator                                  │
│ ① Service → ② Time → ③ Details                  │
├───────────────────────┬─────────────────────────┤
│ Main Content          │ Sidebar                 │
│                       │                         │
│ Step 1: Services      │ Lesson Summary          │
│ ┌───────────────────┐ │ • Service name          │
│ │ Service 1 [○]     │ │ • Duration              │
│ │ Service 2 [○]     │ │ • Price                 │
│ │ Service 3 [○]     │ │ • Date/Time             │
│ └───────────────────┘ │                         │
│                       │ ─────────────────────   │
│ Step 2: Time Slots    │ FAQs                    │
│ ┌───────────────────┐ │                         │
│ │ Date tabs         │ │ Help link               │
│ │ ┌───┐ ┌───┐ ┌───┐ │ │                         │
│ │ │9am│ │10a│ │11a│ │ │                         │
│ │ └───┘ └───┘ └───┘ │ │                         │
│ └───────────────────┘ │                         │
│                       │                         │
│ Step 3: Your Info     │                         │
│ Name, email, notes    │                         │
│ Payment method        │                         │
│ [Confirm Booking]     │                         │
└───────────────────────┴─────────────────────────┘
```

**Payment Options**:
- Session package (if purchased)
- Lesson subscription (if active)
- Stripe checkout (if Connect enabled)
- Manual payment

---

### Booking Success (`/book/success`)
**File**: `app/app/book/success/page.tsx`

**Purpose**: Booking confirmation

**Elements**:
- Confirmation checkmark animation
- Booking details summary
- Add to calendar button
- View upcoming lessons link

---

### Booking Cancelled (`/book/cancelled`)
**File**: `app/app/book/cancelled/page.tsx`

**Purpose**: Cancelled booking notification

---

### Subscription Success (`/book/subscription-success`)
**File**: `app/app/book/subscription-success/page.tsx`

**Purpose**: Subscription purchase confirmation

---

## Component Library

### Base UI Components (`/components/ui/`)

| Component | Purpose | Variants |
|-----------|---------|----------|
| `button.tsx` | Interactive button | default, secondary, outline, ghost, link, destructive |
| `input.tsx` | Text input field | - |
| `textarea.tsx` | Multi-line input | - |
| `checkbox.tsx` | Selection checkbox | - |
| `switch.tsx` | Toggle switch | - |
| `label.tsx` | Form label | - |
| `select.tsx` | Dropdown selector | - |
| `card.tsx` | Content container | Header, Title, Description, Content, Footer |
| `dialog.tsx` | Modal dialog | sm, md, lg, xl, full |
| `sheet.tsx` | Side panel drawer | - |
| `popover.tsx` | Floating popover | - |
| `tabs.tsx` | Tab navigation | - |
| `scroll-area.tsx` | Scrollable container | - |
| `badge.tsx` | Status badge | default, secondary, outline, success, destructive |
| `table.tsx` | Data table | Header, Body, Row, Cell, Footer |
| `skeleton.tsx` | Loading placeholder | - |
| `progress.tsx` | Progress bar | - |
| `avatar.tsx` | User avatar | - |
| `alert-dialog.tsx` | Confirmation modal | - |
| `dropdown-menu.tsx` | Context menu | - |
| `tooltip.tsx` | Hover tooltip | - |
| `color-picker.tsx` | HSL color picker | - |
| `resizable.tsx` | Resizable panels | - |
| `collapsible.tsx` | Expandable section | - |

### Animation Patterns

**Framer Motion Usage**:
- Panel slide-ins (calendar day panel)
- Staggered list animations
- Section expand/collapse
- Loading state transitions

**CSS Transitions**:
- Hover states (150ms ease)
- Active indicators
- Color theme switching

### Loading States

11 `loading.tsx` files with skeleton patterns:
- Dashboard skeleton cards
- Calendar skeleton grid
- Table row skeletons
- Analytics skeleton charts

### Responsive Breakpoints

Following Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Mobile-First Patterns**:
- Bottom navigation on mobile
- Toggle panels instead of sidebars
- Full-width cards on small screens
- Stacked layouts → multi-column on larger screens

---

## File Reference

### Key Directories

```
app/
├── app/                    # Next.js app router
│   ├── (dashboard)/        # Protected tutor routes
│   ├── (public)/           # Public pages
│   ├── admin/              # Admin panel
│   ├── api/                # API routes (67 endpoints)
│   ├── book/               # Booking flow
│   └── student/            # Student portal
├── components/
│   ├── ui/                 # Base UI components (24)
│   ├── dashboard/          # Dashboard features
│   ├── booking/            # Booking components
│   ├── page-builder/       # Site builder
│   ├── students/           # Student CRM
│   ├── analytics/          # Analytics charts
│   ├── services/           # Service management
│   └── settings/           # Settings forms
├── lib/
│   ├── actions/            # Server actions
│   ├── validators/         # Zod schemas
│   └── types/              # TypeScript types
└── docs/                   # Documentation
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Pages | 98 |
| Layout Files | 8 |
| Loading States | 11 |
| API Routes | 67 |
| UI Components | 24 |
| Font Options | 14 |
| Theme Archetypes | 4 |
| Font Pairings | 6 |

---

*Generated for design team reference. Last updated: December 2024*
