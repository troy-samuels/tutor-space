# 04 - User Profiles

## Objective

Ship the tutor profile experience so every instructor can present a polished brand, manage their public page (including custom subdomain), and capture the business settings required for bookings, payments, and marketing funnels. This lays the groundwork for Professional plan onboarding and populates data consumed by Growth and Studio features.

## Prerequisites

- ✅ **03-basic-dashboard.md** — Dashboard shell with navigation and auth gating  
- ✅ **02-authentication.md** — Auth + entitlements, ensures only owners edit profiles  
- ✅ **01-database-schema.md** — `profiles`, `links`, `resources`, and related tables present  
- Assets: logo or flag icons (optional) for profile languages display

## Deliverables

- `/app/(dashboard)/settings/profile/page.tsx` for profile management  
- `ProfileForm` component powered by `react-hook-form` and `zod` validation  
- Avatar upload to Supabase Storage with instant preview  
- Public profile page at `/@username` with metadata and SEO tags  
- Optional “Tutor Bio Site” publish action that deploys a marketing-ready landing page in one click  
- Parent credibility module (testimonials, student progress, safety assurances) toggled from the profile form  
- Subdomain provisioning stub (document DNS + Vercel rewrites for future automation)  
- Onboarding checklist update when profile completed

## UX Narrative

1. Tutor signs in → visits **Settings → Profile** → sees guided form with progress meter.  
2. Form sections: Identity, Languages & Expertise, Teaching Style, Business Settings, Marketing Links.  
3. Live preview beside form shows how profile card will appear to students.  
4. On save, success toast appears, and onboarding checklist updates.  
5. Public “Tutor Bio Site” accessible via `/@username` (and future `https://username.tutorlingua.com`) with a parent-focused credibility tab.  
6. Growth Plan upsells highlight how completed profiles unlock lead funnels and ads targeting.

## Implementation Steps

### Step 1: Define Routes & Layout

- Create folder `/app/(dashboard)/settings/profile`.  
- Ensure `/app/(dashboard)/settings/layout.tsx` (if not yet existing) wraps settings subsections.  
- Add breadcrumb navigation back to Settings home.

```tsx
// app/(dashboard)/settings/layout.tsx
import { SettingsNav } from '@/components/settings/nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <SettingsNav />
      <div className="space-y-6">{children}</div>
    </div>
  )
}
```

### Step 2: Build Profile Form Schema

Use `zod` to validate profile fields. Include fields for Professional (core) and flags for Growth/Studio upsells.

```ts
// lib/validations/profile.ts
import * as z from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  tagline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  languages_taught: z.array(z.string()).min(1, 'Select at least one language'),
  timezone: z.string(),
  hourly_rate: z.number().int().min(0).optional(),
  currency: z.string().default('USD'),
  teaching_levels: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  youtube_url: z.string().url().optional().or(z.literal('')),
  twitter_handle: z.string().optional(),
  booking_enabled: z.boolean(),
  auto_accept_bookings: z.boolean(),
  buffer_time_minutes: z.number().int().min(0),
  avatar_url: z.string().url().optional(),
})
```

### Step 3: Profile Form Component

```tsx
// components/settings/profile-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema } from '@/lib/validations/profile'
import { z } from 'zod'
import { useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { toast } from 'sonner'

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileForm({ defaultValues }: { defaultValues: ProfileValues }) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  function onSubmit(values: ProfileValues) {
    startTransition(async () => {
      const { error } = await updateProfile(values)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Profile updated')
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ProfileFields form={form} isPending={isPending} />
        <ProfilePreview form={form} />
      </form>
    </Form>
  )
}
```

Split form into sections (Identity, Teaching Profile, Business Settings). Reference shadcn `FormField`, `Input`, `Textarea`, `Switch`, `Badge`, etc.

### Step 4: Avatar Upload

- Create Supabase Storage bucket `avatars` (public).  
- Implement `AvatarUploader` component using `supabase.storage.from('avatars')`.  
- On upload success, update form state with public URL.  
- Provide cropping helper (optional) or instruct cropping before upload.

```tsx
const supabase = createClientComponentClient<Database>()
const fileExt = file.name.split('.').pop()
const filePath = `${user.id}/${Date.now()}.${fileExt}`
await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
form.setValue('avatar_url', data.publicUrl)
```

### Step 5: Username Availability Check

- Add server action `checkUsernameAvailability` to query `profiles.username`.  
- Use `useEffect` with debounce to show availability message.  
- On first save, auto-generate from full name and ensure sanitized.

### Step 6: Parent Credibility & Social Proof

- Extend the form with a dedicated “Parent credibility” accordion:
  - **Testimonials**: select up to three reviews (once `reviews` table populated) or add quotes manually.  
  - **Student progress highlights**: automatically surface streaks from `lesson_notes` and CEFR improvements.  
  - **Trust signals**: certifications, background checks, safeguarding policies, payment protection messaging.  
- Surface quick contact buttons (WhatsApp, Instagram DM, email) fed from profile links or link-in-bio configuration.  
- Allow tutors to toggle a shareable `/@username/parents` landing section built from these fields.  
- Provide print/export button so tutors can hand parents a summary PDF.

### Step 7: Server Action to Persist Profile

```ts
// lib/actions/profile.ts
'use server'

import { profileSchema } from '@/lib/validations/profile'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(values: z.infer<typeof profileSchema>) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Invalid profile data' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...parsed.data,
      hourly_rate: parsed.data.hourly_rate
        ? Math.round(parsed.data.hourly_rate * 100)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings/profile')
  revalidatePath(`/@${parsed.data.username}`)
  return { success: true }
}
```

> Convert hourly rate to cents before storing (see schema).

### Step 8: Public Profile Page

- Create `/app/@[username]/page.tsx` dynamic route.  
- Use `generateMetadata` to set `<title>` and OpenGraph tags.  
- Fetch profile from Supabase; show 404 if missing.  
- Display languages (with flags), specialties, rates, testimonials (once built).  
- Include CTA button linking to booking flow `/book/{username}` (future).  
- Add `metadata: { revalidate: 60 }` for ISR once data more static.

```tsx
export async function generateStaticParams() {
  // Optionally pre-render top profiles later
  return []
}
```

### Step 9: Custom Subdomains (Documentation)

- Add instructions to set wild-card domain `*.tutorlingua.com` → Vercel project.  
- Update `VERCEL.json` rewrites (future) to map subdomain to `/@username`.  
- For now, log plan to store `profiles.username` and `profiles.booking_enabled`.  
- Document using Vercel’s wildcard subdomains and `middleware.ts` to parse.

### Step 10: Onboarding Checklist Integration

- Extend dashboard empty states to hide “Complete your profile” once required fields filled.  
- Add `profile_completion_score` derived in `profiles` or computed in front-end:  
  - Name + avatar (20%), tagline/bio (20%), languages (20%), rate + currency (20%), intro video link (20%).  
- Display progress bar at top of profile settings.

### Step 11: Growth/Studio Hooks

- Growth plan: AI copy suggestions for bio, parent credibility script templates, and review automation prompts.  
- Studio plan: surface multi-tutor team bios, shared testimonials, and upcoming group sessions preview.  
- Add highlight component promoting Growth plan benefits if user still on Professional.

### Step 11: Analytics Events

- Track `profile_view` (public page) & `profile_update` events (PostHog/Segment).  
- Include `plan`, `languages`, `timezone` as properties for segmentation.

### Step 12: Accessibility & Responsiveness

- Ensure form labels are associated with inputs using `FormField`.  
- Provide `aria-live` for username availability status.  
- Mobile layout: form collapses into single column with preview below.

## Testing Checklist

- [ ] Authenticated tutor can view and submit profile form.  
- [ ] Validation errors appear inline (name required, username pattern).  
- [ ] Avatar upload updates preview and persists after refresh.  
- [ ] Username uniqueness enforced (duplicated username fails).  
- [ ] Public profile accessible at `/@username` and displays correct data.  
- [ ] Booking disabled when `booking_enabled` false (CTA hidden).  
- [ ] Onboarding checklist recognizes completed profile.  
- [ ] Growth/Studio upgrade prompts hide when plan active.  
- [ ] Lighthouse accessibility score ≥ 90 on profile settings page.
- [ ] Parent credibility page renders testimonials, progress stats, and WhatsApp/DM buttons when enabled.  

## AI Tool Prompts

### Generate Profile Form
```
Using React, react-hook-form, and shadcn/ui, build a profile settings form with sections:
1. Basic info (name, avatar upload, tagline)
2. Teaching details (languages, levels, specialties)
3. Business settings (currency, hourly rate, booking toggle, buffer time)
Validate with zod and show a live preview column.
```

### Create Public Profile Page
```
Write a Next.js App Router page that fetches a tutor profile by username using Supabase.
Render hero area (photo, name, tagline), languages chips, CTA button, and marketing links.
Include generateMetadata for SEO, open graph image placeholder, and 404 handling.
```

### Username Availability Helper
```
Implement a debounced username availability checker that:
1. Calls a Next.js server action to query Supabase for existing usernames
2. Updates form state with success/error message
3. Prevents submission if not available
Use TypeScript and react-hook-form.
```

## Common Gotchas

- **Filename vs. username collisions**: sanitize usernames before using in storage paths to avoid reserved words.  
- **Supabase Storage defaults**: ensure bucket is set to public or generate signed URLs for restricted access.  
- **Timezone list**: use `@vvo/tzdb` or similar to populate reliable dropdown; avoid manual lists.  
- **Currency formatting**: store cents in DB, but display converted string in UI (reuse `formatCurrency` helper).  
- **Subdomain rewrites**: avoid accidentally creating rewrite loops—plan middleware carefully when implemented.

## Next Steps

1. Build **05-link-in-bio.md** leveraging profile marketing links.  
2. Implement **06-service-listings.md** so booking CTA routes to live services.  
3. Add marketing automation (Growth Plan) once profile data trustworthy.

## Success Criteria

✅ Tutors can fully configure their brand presence and business settings  
✅ Public profiles render with shareable URLs and future subdomain support  
✅ Profile completion feeds dashboard guidance and onboarding metrics  
✅ Growth/Studio upsells contextualized within profile experience  
✅ Data ready for integrations (booking, marketing, AI personalization)

**Estimated Time**: 4-5 hours
