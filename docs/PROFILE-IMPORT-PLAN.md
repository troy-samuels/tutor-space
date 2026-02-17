# Profile Import Engine — Enterprise Execution Plan

**Goal:** A tutor pastes their Preply/iTalki/Verbling/Cambly URL → TutorLingua scrapes it, maps it to the page builder data model, and presents a pre-built site ready to publish. Zero typing, zero friction.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER FLOW                             │
│                                                          │
│  Paste URL ──▶ Resolve Platform ──▶ Scrape Profile      │
│                                      │                   │
│                                      ▼                   │
│                              Normalised Schema           │
│                                      │                   │
│                                      ▼                   │
│                              Map → Page Builder          │
│                                      │                   │
│                                      ▼                   │
│                              Review & Publish            │
└─────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ SYSTEM ARCHITECTURE                                                   │
│                                                                       │
│  Client (Next.js)          API Routes              Background Jobs    │
│  ┌─────────────┐          ┌──────────────┐        ┌──────────────┐   │
│  │ Import URL   │──POST──▶│ /api/import/ │──queue─▶│ Scraper      │   │
│  │ Component    │         │ scrape       │        │ Workers      │   │
│  └──────┬──────┘         └──────────────┘        └──────┬───────┘   │
│         │                                                │           │
│         │ poll status                                    │ write     │
│         ▼                                                ▼           │
│  ┌─────────────┐          ┌──────────────┐        ┌──────────────┐   │
│  │ Review &    │◀─data───│ /api/import/ │◀─read──│ profile_     │   │
│  │ Confirm UI  │         │ status       │        │ imports      │   │
│  └──────┬──────┘         └──────────────┘        │ (Supabase)   │   │
│         │                                         └──────────────┘   │
│         │ confirm                                                    │
│         ▼                                                            │
│  ┌─────────────┐          ┌──────────────┐                           │
│  │ Page Builder │◀─hydrate│ /api/import/ │                           │
│  │ (existing)   │         │ apply        │                           │
│  └─────────────┘          └──────────────┘                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Data Layer & Normalised Schema

### 1.1 — `profile_imports` Table (Supabase Migration)

```sql
CREATE TABLE profile_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Source
  platform TEXT NOT NULL,           -- 'preply' | 'italki' | 'verbling' | 'cambly' | 'wyzant' | 'superprof'
  platform_profile_id TEXT,         -- Their ID on the source platform
  source_url TEXT NOT NULL,         -- Original URL pasted
  
  -- Scrape state
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | scraping | scraped | mapped | applied | failed
  error_message TEXT,
  scrape_attempts INT DEFAULT 0,
  last_scraped_at TIMESTAMPTZ,
  
  -- Raw scraped data (preserved for audit/re-parse)
  raw_data JSONB DEFAULT '{}'::jsonb,
  
  -- Normalised mapped data (platform-agnostic)
  normalised_data JSONB DEFAULT '{}'::jsonb,
  
  -- What the user confirmed/edited before applying
  confirmed_data JSONB,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_imports_tutor ON profile_imports(tutor_id);
CREATE INDEX idx_profile_imports_status ON profile_imports(status);
CREATE INDEX idx_profile_imports_platform ON profile_imports(platform);

ALTER TABLE profile_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_imports_owner ON profile_imports
  FOR ALL USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());
```

### 1.2 — Normalised Profile Schema (TypeScript)

This is the universal intermediate format that ALL scrapers output. Maps 1:1 to the page builder.

```typescript
// lib/import/types.ts

export type NormalisedProfile = {
  // Identity
  displayName: string;
  headline: string | null;        // → profiles.tagline
  bio: string | null;             // → profiles.bio + tutor_sites.about_body
  avatarUrl: string | null;       // → download + re-upload to Supabase storage
  
  // Teaching
  languagesTaught: NormalisedLanguage[];
  subjects: string[];             // e.g. "Business English", "IELTS Prep"
  
  // Social proof
  rating: number | null;          // 0-5
  reviewCount: number | null;
  totalStudents: number | null;
  totalLessons: number | null;
  reviews: NormalisedReview[];    // → tutor_site_reviews
  
  // Services / pricing
  services: NormalisedService[];  // → services table
  
  // Media
  introVideoUrl: string | null;   // YouTube/Vimeo → profiles.intro_video_url
  galleryImages: string[];        // → download + re-upload
  
  // Credentials
  certifications: string[];       // Display in bio or about section
  education: string[];
  yearsExperience: number | null;
  
  // Availability
  timezone: string | null;
  country: string | null;
  city: string | null;
  
  // Links
  websiteUrl: string | null;
  socialLinks: { platform: string; url: string }[];
  
  // Source metadata
  platform: Platform;
  platformProfileId: string;
  sourceUrl: string;
  scrapedAt: string;              // ISO timestamp
};

export type NormalisedLanguage = {
  language: string;               // ISO 639-1 or display name
  nativeLevel: boolean;
  proficiencyLevel: string | null; // 'native' | 'C2' | 'C1' | 'B2' etc.
};

export type NormalisedReview = {
  authorName: string;
  text: string;
  rating: number | null;
  date: string | null;
};

export type NormalisedService = {
  name: string;                   // e.g. "Trial Lesson", "60min Conversation"
  description: string | null;
  durationMinutes: number;
  priceAmount: number;            // In USD cents
  currency: string;
  offerType: 'trial' | 'one_off' | 'lesson_block' | 'subscription';
};

export type Platform = 'preply' | 'italki' | 'verbling' | 'cambly' | 'wyzant' | 'superprof';
```

---

## Phase 2: Platform Scrapers

Each scraper takes a URL, returns `NormalisedProfile`. Strategy varies by platform.

### 2.1 — Platform URL Resolver

```typescript
// lib/import/resolve-platform.ts

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  preply: [
    /preply\.com\/[a-z]{2}\/tutor\/(\d+)/,
    /preply\.com\/[a-z]{2}\/tutor\/[^/]+/,
  ],
  italki: [
    /italki\.com\/[a-z]{2}\/teacher\/(\d+)/,
    /italki\.com\/teacher\/(\d+)/,
  ],
  verbling: [
    /verbling\.com\/teachers\/([a-zA-Z0-9_-]+)/,
  ],
  cambly: [
    /cambly\.com\/[a-z]{2}\/tutor\/([a-zA-Z0-9_-]+)/,
  ],
  wyzant: [
    /wyzant\.com\/Tutors\/([a-zA-Z0-9_-]+)/,
  ],
  superprof: [
    /superprof\.[a-z.]+\/[^/]+\/[^/]+\/([^/]+)/,
  ],
};

export function resolvePlatform(url: string): { platform: Platform; id: string } | null {
  const cleaned = url.trim().replace(/\/$/, '');
  
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return { platform: platform as Platform, id: match[1] || cleaned };
      }
    }
  }
  
  return null;
}
```

### 2.2 — Scraper: iTalki (API-based — highest fidelity)

iTalki has a semi-public JSON API. Richest data source.

```
GET https://api.italki.com/api/teacher/{id}
→ JSON with full profile, reviews, courses, languages, video URL
```

**Fields extracted:**
- `user_info.nickname` → displayName
- `teacher_info.about_me` → bio
- `teacher_info.intro_video` → introVideoUrl
- `course_info[]` → services (with price, duration, type)
- `teacher_statistics.rating` → rating
- `teacher_statistics.session_count` → totalLessons
- Reviews via separate endpoint: `GET /api/teacher/{id}/reviews`
- Languages from `teach_language` array

**Risk:** Rate limiting (1.5s delay between requests). No Cloudflare.

### 2.3 — Scraper: Preply (Browser-based)

Preply uses Cloudflare + heavy client-side rendering. Two strategies:

**Strategy A — JSON-LD (fast, partial):**
Profile pages include `<script type="application/ld+json">` with structured data (name, rating, description, image). Sufficient for 70% of fields.

**Strategy B — Browser automation (full):**
Use Clawdbot's browser or a headless Chromium worker to:
1. Navigate to profile URL
2. Wait for React hydration
3. Extract from DOM: bio, services, reviews, video, languages
4. Parse pricing from lesson cards

**Implementation:** Try JSON-LD first. If insufficient data, fall back to browser scrape. Queue for browser scraping via background job.

### 2.4 — Scraper: Verbling (SSR + __NEXT_DATA__)

Verbling uses Next.js. The `__NEXT_DATA__` script tag contains the full profile as JSON. Simple fetch + regex extraction.

### 2.5 — Scraper: Cambly

Cambly has minimal public profile data (name, bio, video). No pricing or reviews publicly visible. Limited but still useful for bio + video import.

### 2.6 — Scraper: Superprof / Wyzant

Lower priority. HTML scraping with specific selectors. Useful for European market (Superprof) and US market (Wyzant).

### 2.7 — Scraper Factory

```typescript
// lib/import/scrapers/index.ts

import type { NormalisedProfile, Platform } from '../types';

export async function scrapeProfile(
  platform: Platform,
  url: string,
  platformId: string
): Promise<NormalisedProfile> {
  switch (platform) {
    case 'italki':    return scrapeItalki(platformId);
    case 'preply':    return scrapePreply(url);
    case 'verbling':  return scrapeVerbling(url);
    case 'cambly':    return scrapeCambly(url);
    case 'wyzant':    return scrapeWyzant(url);
    case 'superprof': return scrapeSuperprof(url);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

---

## Phase 3: Mapping Engine (Normalised → Page Builder)

### 3.1 — Profile Mapper

Maps normalised data to every field the page builder consumes. This is the critical bridge.

```typescript
// lib/import/mapper.ts

import type { NormalisedProfile } from './types';

export type MappedPageBuilderData = {
  // profiles table
  profile: {
    full_name: string;
    tagline: string;
    bio: string;
    avatar_url: string | null;
    timezone: string | null;
    website_url: string | null;
    languages_taught: string;   // comma-separated
    intro_video_url: string | null;
  };
  
  // tutor_sites table
  site: {
    about_title: string;
    about_subtitle: string;
    about_body: string;
    hero_image_url: string | null;
    gallery_images: string[];
    theme_archetype: string;    // Auto-selected based on teaching style
    status: 'draft';
  };
  
  // tutor_site_services
  services: Array<{
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    currency: string;
    offer_type: string;
  }>;
  
  // tutor_site_reviews
  reviews: Array<{
    author_name: string;
    quote: string;
  }>;
  
  // tutor_site_resources (social links)
  resources: Array<{
    label: string;
    url: string;
    category: 'social' | 'portfolio';
  }>;
};

export function mapToPageBuilder(profile: NormalisedProfile): MappedPageBuilderData {
  return {
    profile: {
      full_name: profile.displayName,
      tagline: buildTagline(profile),
      bio: buildBio(profile),
      avatar_url: profile.avatarUrl,  // Will be re-uploaded
      timezone: profile.timezone,
      website_url: profile.websiteUrl,
      languages_taught: profile.languagesTaught
        .map(l => l.language)
        .join(', '),
      intro_video_url: profile.introVideoUrl,
    },
    
    site: {
      about_title: `About ${profile.displayName.split(' ')[0]}`,
      about_subtitle: buildSubtitle(profile),
      about_body: buildAboutBody(profile),
      hero_image_url: profile.avatarUrl,
      gallery_images: profile.galleryImages,
      theme_archetype: inferArchetype(profile),
      status: 'draft',
    },
    
    services: profile.services.map(s => ({
      name: s.name,
      description: s.description,
      duration_minutes: s.durationMinutes,
      price: s.priceAmount,
      currency: s.currency,
      offer_type: s.offerType,
    })),
    
    reviews: profile.reviews.slice(0, 10).map(r => ({
      author_name: r.authorName,
      quote: r.text,
    })),
    
    resources: profile.socialLinks.map(l => ({
      label: l.platform,
      url: l.url,
      category: 'social' as const,
    })),
  };
}
```

### 3.2 — Smart Defaults

```typescript
function inferArchetype(profile: NormalisedProfile): string {
  const bio = (profile.bio || '').toLowerCase();
  const subjects = profile.subjects.join(' ').toLowerCase();
  
  if (/ielts|toefl|dele|delf|exam|test|grammar|academic/i.test(subjects + bio))
    return 'academic';
  if (/business|corporate|professional|interview/i.test(subjects + bio))
    return 'professional';
  if (/kids|children|young|fun|games/i.test(subjects + bio))
    return 'playful';
  if (/conversation|travel|culture|immersion/i.test(subjects + bio))
    return 'immersion';
  
  return 'professional'; // Safe default
}

function buildTagline(profile: NormalisedProfile): string {
  if (profile.headline) return profile.headline;
  
  const parts: string[] = [];
  if (profile.yearsExperience) parts.push(`${profile.yearsExperience}+ years`);
  if (profile.totalStudents) parts.push(`${profile.totalStudents.toLocaleString()} students`);
  if (profile.rating) parts.push(`${profile.rating}★`);
  
  return parts.length ? parts.join(' · ') : `${profile.languagesTaught[0]?.language || 'Language'} Tutor`;
}

function buildSubtitle(profile: NormalisedProfile): string {
  const stats: string[] = [];
  if (profile.rating) stats.push(`${profile.rating}/5 rating`);
  if (profile.totalLessons) stats.push(`${profile.totalLessons.toLocaleString()} lessons taught`);
  if (profile.totalStudents) stats.push(`${profile.totalStudents.toLocaleString()} students`);
  return stats.join(' · ');
}

function buildAboutBody(profile: NormalisedProfile): string {
  let body = profile.bio || '';
  
  if (profile.certifications.length) {
    body += `\n\n**Certifications:** ${profile.certifications.join(', ')}`;
  }
  if (profile.education.length) {
    body += `\n\n**Education:** ${profile.education.join(', ')}`;
  }
  
  return body.trim();
}
```

### 3.3 — Asset Pipeline (Avatar + Gallery Re-upload)

External image URLs can't be used long-term (hotlink protection, CDN expiry). Every image gets re-uploaded to our Supabase storage.

```typescript
// lib/import/assets.ts

export async function reUploadAssets(
  tutorId: string,
  mapped: MappedPageBuilderData,
  supabase: SupabaseClient
): Promise<MappedPageBuilderData> {
  // Re-upload avatar
  if (mapped.profile.avatar_url && !mapped.profile.avatar_url.includes('supabase')) {
    const newUrl = await downloadAndUpload(
      mapped.profile.avatar_url,
      `avatars/${tutorId}-imported-${Date.now()}.jpg`,
      'avatars',
      supabase
    );
    mapped.profile.avatar_url = newUrl;
    mapped.site.hero_image_url = newUrl;
  }
  
  // Re-upload gallery
  const newGallery: string[] = [];
  for (const [i, url] of mapped.site.gallery_images.entries()) {
    if (!url.includes('supabase')) {
      const newUrl = await downloadAndUpload(
        url,
        `site-assets/${tutorId}/gallery-${i}-${Date.now()}.jpg`,
        'site-assets',
        supabase
      );
      newGallery.push(newUrl);
    } else {
      newGallery.push(url);
    }
  }
  mapped.site.gallery_images = newGallery;
  
  return mapped;
}

async function downloadAndUpload(
  sourceUrl: string,
  path: string,
  bucket: string,
  supabase: SupabaseClient
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Failed to download: ${sourceUrl}`);
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });
    
  if (error) throw error;
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
```

---

## Phase 4: API Layer

### 4.1 — POST `/api/import/scrape`

Accepts a URL, resolves platform, kicks off scrape, returns import ID for polling.

```typescript
// app/api/import/scrape/route.ts

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { url } = await req.json();
  const resolved = resolvePlatform(url);
  if (!resolved) return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  
  // Check for existing import from same platform
  const { data: existing } = await supabase
    .from('profile_imports')
    .select('id, status')
    .eq('tutor_id', user.id)
    .eq('platform', resolved.platform)
    .single();
    
  if (existing?.status === 'scraping') {
    return NextResponse.json({ importId: existing.id, status: 'scraping' });
  }
  
  // Create import record
  const { data: importRecord, error } = await supabase
    .from('profile_imports')
    .upsert({
      id: existing?.id || undefined,
      tutor_id: user.id,
      platform: resolved.platform,
      platform_profile_id: resolved.id,
      source_url: url,
      status: 'scraping',
      scrape_attempts: (existing?.scrape_attempts || 0) + 1,
    }, { onConflict: 'id' })
    .select('id')
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Kick off scrape (inline for v1, queue for v2)
  scrapeAndMap(importRecord.id, resolved.platform, url, resolved.id, user.id)
    .catch(console.error);
  
  return NextResponse.json({ importId: importRecord.id, status: 'scraping' });
}
```

### 4.2 — GET `/api/import/status`

Poll for scrape completion, returns normalised + mapped data when ready.

### 4.3 — POST `/api/import/apply`

Takes confirmed data, writes to `profiles`, `tutor_sites`, `services`, `tutor_site_reviews`, `tutor_site_resources`. Opens page builder in pre-filled state.

```typescript
// Core apply logic

async function applyImport(importId: string, tutorId: string, edits: Partial<MappedPageBuilderData>) {
  const supabase = await createAdminClient();
  
  const { data: importRecord } = await supabase
    .from('profile_imports')
    .select('normalised_data')
    .eq('id', importId)
    .single();
    
  let mapped = mapToPageBuilder(importRecord.normalised_data);
  
  // Apply user edits
  mapped = deepMerge(mapped, edits);
  
  // Re-upload external assets
  mapped = await reUploadAssets(tutorId, mapped, supabase);
  
  // Write to profiles
  await supabase.from('profiles').update({
    full_name: mapped.profile.full_name,
    tagline: mapped.profile.tagline,
    bio: mapped.profile.bio,
    avatar_url: mapped.profile.avatar_url,
    timezone: mapped.profile.timezone,
    website_url: mapped.profile.website_url,
    languages_taught: mapped.profile.languages_taught,
  }).eq('id', tutorId);
  
  // Upsert tutor_site
  const { data: site } = await supabase.from('tutor_sites').upsert({
    tutor_id: tutorId,
    about_title: mapped.site.about_title,
    about_subtitle: mapped.site.about_subtitle,
    about_body: mapped.site.about_body,
    hero_image_url: mapped.site.hero_image_url,
    gallery_images: mapped.site.gallery_images,
    status: 'draft',
  }, { onConflict: 'tutor_id' }).select('id').single();
  
  // Insert services
  for (const service of mapped.services) {
    await supabase.from('services').insert({
      tutor_id: tutorId,
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price: service.price,
      currency: service.currency,
      offer_type: service.offer_type,
      is_active: true,
    });
  }
  
  // Insert reviews
  for (const [i, review] of mapped.reviews.entries()) {
    await supabase.from('tutor_site_reviews').insert({
      tutor_site_id: site.id,
      author_name: review.author_name,
      quote: review.quote,
      sort_order: i,
    });
  }
  
  // Insert social links as resources
  for (const [i, resource] of mapped.resources.entries()) {
    await supabase.from('tutor_site_resources').insert({
      tutor_site_id: site.id,
      label: resource.label,
      url: resource.url,
      category: resource.category,
      sort_order: i,
    });
  }
  
  // Mark import as applied
  await supabase.from('profile_imports').update({
    status: 'applied',
    confirmed_data: mapped,
  }).eq('id', importId);
}
```

---

## Phase 5: User Interface

### 5.1 — Entry Point: URL Input (Frictionless)

**Where it appears:**
1. **Onboarding Step 1** — new field: "Import from another platform" (optional, above manual fields)
2. **Page Builder** — "Import Profile" button in header
3. **Settings** — "Import from Platform" card

**UX:**

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  ⚡ Import your existing profile                     │
│                                                      │
│  Paste your Preply, iTalki, or Verbling profile URL  │
│                                                      │
│  ┌───────────────────────────────────────────┬─────┐ │
│  │ https://italki.com/en/teacher/5606369     │ Go  │ │
│  └───────────────────────────────────────────┴─────┘ │
│                                                      │
│  Supported: iTalki · Preply · Verbling · Cambly      │
│                                                      │
│  ── or set up manually below ──                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Interaction:**
1. User pastes URL → platform auto-detected → platform logo appears
2. Tap "Go" → loading state with progress animation ("Importing from iTalki…")
3. 3-8 seconds later → review screen

### 5.2 — Review & Confirm Screen

Full-page review of everything scraped. User can edit any field before applying. Live preview on desktop.

```
┌──────────────────────────────────────────────────────┐
│ ← Back                    Import from iTalki         │
│──────────────────────────────────────────────────────│
│                                                      │
│  [Avatar]  Maria García                              │
│            Professional Spanish Teacher               │
│            ⭐ 4.9 · 1,200 lessons · 342 students     │
│                                                      │
│  ── Profile ──────────────────────────────────────── │
│  Name:     [Maria García              ] ✏️            │
│  Tagline:  [Professional Spanish Teach…] ✏️           │
│  Bio:      [I'm a certified Spanish…   ] ✏️           │
│                                                      │
│  ── Services (3 found) ──────────────────────────── │
│  ☑ Trial Lesson          30min    $8    trial        │
│  ☑ Conversation Practice 60min    $22   one_off      │
│  ☑ DELE Prep             60min    $28   one_off      │
│                                                      │
│  ── Reviews (8 found) ───────────────────────────── │
│  ☑ "Maria is an amazing teacher…" — Sarah K.        │
│  ☑ "Very patient and professio…"  — Tom R.          │
│  ☑ "Best Spanish teacher I've…"   — Li W.           │
│  [Show 5 more]                                       │
│                                                      │
│  ── Video ────────────────────────────────────────── │
│  ☑ Import intro video from YouTube                   │
│    [thumbnail preview]                               │
│                                                      │
│  ── Theme ────────────────────────────────────────── │
│  Auto-detected: 📚 The Scholar (exam prep focus)     │
│  [Change theme ▾]                                    │
│                                                      │
│──────────────────────────────────────────────────────│
│            [ Build My Page → ]                       │
│──────────────────────────────────────────────────────│
```

### 5.3 — Loading States

**Scraping (3-8s):**
```
┌────────────────────────────────────┐
│                                    │
│         [iTalki logo]              │
│                                    │
│    Importing your profile…         │
│    ████████░░░░░░░░  52%           │
│                                    │
│    ✓ Profile info                  │
│    ✓ Teaching languages            │
│    ● Services & pricing            │
│    ○ Reviews                       │
│    ○ Media                         │
│                                    │
└────────────────────────────────────┘
```

**Applying (1-3s):**
```
┌────────────────────────────────────┐
│                                    │
│    Building your page…             │
│    ████████████████░░  85%         │
│                                    │
│    ✓ Profile updated               │
│    ✓ 3 services created            │
│    ✓ 8 reviews imported            │
│    ● Uploading images              │
│                                    │
└────────────────────────────────────┘
```

### 5.4 — Post-Apply: Redirect to Page Builder

After apply completes → redirect to `/dashboard/page-builder` with a success toast:

> ✅ Profile imported from iTalki! Review your page and hit Publish when ready.

The page builder opens fully hydrated with all imported data. User just needs to:
1. Check theme choice looks right
2. Optionally tweak copy
3. Hit Publish

**Zero additional data entry required.**

---

## Phase 6: Execution Order

### Sprint 1 (Days 1-3): Foundation
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 1 | Create `profile_imports` migration | `supabase/migrations/` | 30m |
| 2 | Define normalised types | `lib/import/types.ts` | 1h |
| 3 | Build URL resolver | `lib/import/resolve-platform.ts` | 1h |
| 4 | Build iTalki scraper (API-based) | `lib/import/scrapers/italki.ts` | 3h |
| 5 | Build mapping engine | `lib/import/mapper.ts` | 3h |
| 6 | Build asset re-upload pipeline | `lib/import/assets.ts` | 2h |

### Sprint 2 (Days 4-6): API + First Scraper Live
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 7 | POST `/api/import/scrape` | `app/api/import/scrape/route.ts` | 2h |
| 8 | GET `/api/import/status` | `app/api/import/status/route.ts` | 1h |
| 9 | POST `/api/import/apply` | `app/api/import/apply/route.ts` | 3h |
| 10 | URL input component | `components/import/ImportUrlInput.tsx` | 2h |
| 11 | Loading + progress component | `components/import/ImportProgress.tsx` | 2h |
| 12 | Review & confirm page | `components/import/ImportReview.tsx` | 4h |

### Sprint 3 (Days 7-9): More Scrapers + Integration
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 13 | Preply scraper (JSON-LD + fallback) | `lib/import/scrapers/preply.ts` | 4h |
| 14 | Verbling scraper (__NEXT_DATA__) | `lib/import/scrapers/verbling.ts` | 2h |
| 15 | Wire into onboarding Step 1 | `components/onboarding/steps/StepProfileBasics.tsx` | 2h |
| 16 | Wire into page builder header | `components/page-builder/page-builder-wizard.tsx` | 1h |
| 17 | E2E tests | `e2e/import.spec.ts` | 3h |

### Sprint 4 (Days 10-12): Polish + Edge Cases
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 18 | Cambly scraper | `lib/import/scrapers/cambly.ts` | 2h |
| 19 | Error handling + retry logic | `lib/import/scraper-utils.ts` | 2h |
| 20 | Rate limiting (per-user, per-platform) | `lib/import/rate-limit.ts` | 1h |
| 21 | Import history UI (settings) | `app/(dashboard)/settings/imports/page.tsx` | 2h |
| 22 | Re-import / update flow | Update existing import | 2h |
| 23 | Analytics events | `lib/analytics/import-events.ts` | 1h |

---

## Phase 7: Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Cloudflare blocks scrape | Retry with exponential backoff (3 attempts), then show "We couldn't reach this profile. Try again in a few minutes." |
| Profile is private/hidden | Detect and show "This profile appears to be private. Make sure it's publicly visible." |
| Platform URL not recognised | "We don't recognise this URL. Supported platforms: iTalki, Preply, Verbling, Cambly" |
| Partial data (no reviews) | Import what's available, skip empty sections, note "No reviews found — you can add them manually" |
| Duplicate import | Detect existing import from same platform. Offer "Re-import" (overwrite) or "Keep existing" |
| Image download fails | Skip image, use placeholder, note "We couldn't download your profile photo — you can upload one manually" |
| User has existing page builder data | Merge strategy: only overwrite empty fields, show conflict resolution UI for non-empty fields |
| Service price = 0 or null | Import as "Contact for pricing" or skip |
| Non-Latin characters in name/bio | Full UTF-8 support, no truncation issues |
| Rate limit hit on source platform | Queue and retry with longer delays. Show "Queued — we'll email you when ready" |

---

## Phase 8: Security & Compliance

| Concern | Mitigation |
|---------|-----------|
| Scraping ToS | We scrape publicly available profile data that tutors themselves want to port. This is data portability, not competitive intelligence. No auth-gated data accessed. |
| Rate limiting our own API | 3 imports per user per hour. 1 import per URL per 24h (cached). |
| Data retention | Raw scraped data auto-deleted after 30 days. Only confirmed/applied data persists. |
| RLS | `profile_imports` table locked to owning tutor via RLS. No cross-user access. |
| Asset storage | Re-uploaded to our own Supabase storage. No hotlinking to source platforms. |
| GDPR | Tutor is importing their own data. They control what gets published. Delete import record on account deletion (CASCADE). |

---

## Phase 9: Analytics & Success Metrics

Track in PostHog/Plausible:

| Event | Properties |
|-------|-----------|
| `import_started` | platform, source_url_domain |
| `import_completed` | platform, duration_ms, fields_imported |
| `import_failed` | platform, error_type |
| `import_applied` | platform, services_count, reviews_count, theme_selected |
| `import_to_publish_time` | platform, minutes_from_import_to_publish |

**Success metric:** Time from signup to published page < 5 minutes (currently ~20-30 minutes with manual setup).

---

## Existing Data Leverage

We already have **859 scraped profiles** in `COMBINED_TUTOR_DB.json` (851 iTalki, 8 Preply). This can be used for:

1. **Pre-warming:** If a tutor signs up and we already have their profile scraped, show "We found your iTalki profile — import it?" immediately at signup
2. **Outreach personalisation:** When contacting tutors via Reddit/email, link directly to their TutorLingua page pre-built from their existing profile
3. **Demo:** Show prospective tutors "Here's what your page would look like" before they even sign up (public preview mode)

---

## Summary

**User experience in 4 steps:**
1. Sign up for TutorLingua
2. Paste your iTalki/Preply/Verbling URL
3. Review your pre-built page (everything filled in)
4. Hit Publish

**Total time: < 2 minutes from signup to live page.**
