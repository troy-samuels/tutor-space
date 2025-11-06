# 05 - Link-in-Bio

## Objective

Give tutors a professional, customizable link-in-bio page that replaces Linktree/Campsite. This page highlights services, lead magnets, social proof, and call-to-actions while capturing link analytics. It’s a cornerstone of the Professional Plan’s marketing toolkit and feeds Growth Plan funnels.

## Prerequisites

- ✅ **04-user-profiles.md** — Tutor profile data and marketing links ready  
- ✅ **01-database-schema.md** — `links` table with visibility, sort order, analytics columns  
- ✅ **03-basic-dashboard.md** — Dashboard shell for management UI  
- ✅ **02-authentication.md** — Auth/entitlements to gate features  
- Optional: brand color palette / logos

## Deliverables

- `/app/(dashboard)/marketing/links/page.tsx` for CRUD management  
- `LinkForm` + `LinkList` components with drag-and-drop sorting (using `@dnd-kit`)  
- Analytics chart (click counts over time) leveraging `links.click_count` and `link_events` (to be added later)  
- Public page at `/bio/[username]` (or within profile page) showing curated links with theme selection  
- Quick-contact CTAs for WhatsApp, Instagram DM, Messenger, and email  
- Growth prompts encouraging lead magnet + review widgets

## UX Narrative

1. Tutor navigates to **Marketing → Link-in-bio** in dashboard.  
2. Sees preview of public link page beside management panel.  
3. Can add CTA buttons, headings, lead magnet, social links.  
4. Drag-and-drop to reorder links; toggle visibility.  
5. Analytics tab shows clicks per link and total visits.  
6. Public page optimized for mobile (fits Instagram/TikTok profile link).  
7. Growth Plan users can embed lead capture form & review carousel.

## Implementation Steps

### Step 1: Define Routes & Navigation

- Add marketing section links to sidebar: `/marketing/links`, `/marketing/reviews`, `/marketing/landing` (future).  
- Create `/app/(dashboard)/marketing/links/page.tsx`.  
- Ensure ProtectedRoute covers marketing section and Growth gating occurs when features unavailable.

### Step 2: Link Schema Review

From `01-database-schema.md`:

```sql
CREATE TABLE links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  button_style TEXT DEFAULT 'default',
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

> You may add `link_type TEXT` (e.g., `service`, `external`, `lead_magnet`) later to support analytics segmentation.

### Step 3: Link Fetching Server Component

```tsx
// app/(dashboard)/marketing/links/page.tsx
import { createClient } from '@/lib/supabase/server'
import { LinkManager } from '@/components/marketing/link-manager'

export default async function LinksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('tutor_id', user.id)
    .order('sort_order', { ascending: true })

  return <LinkManager initialLinks={links ?? []} />
}
```

> Use server component to fetch data, pass to a client component for interactivity.

### Step 4: Link Manager Component

```tsx
// components/marketing/link-manager.tsx
'use client'

import { useState, useTransition } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { updateLinksOrder, createLink, updateLink, deleteLink } from '@/lib/actions/links'
import { LinkFormDialog } from './link-form-dialog'
import { SortableLinkItem } from './sortable-link-item'
import { toast } from 'sonner'

export function LinkManager({ initialLinks }: { initialLinks: LinkRecord[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [isPending, startTransition] = useTransition()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((link) => link.id === active.id)
    const newIndex = links.findIndex((link) => link.id === over.id)

    const reordered = arrayMove(links, oldIndex, newIndex).map((link, index) => ({
      ...link,
      sort_order: index,
    }))
    setLinks(reordered)

    startTransition(async () => {
      const { error } = await updateLinksOrder(
        reordered.map(({ id, sort_order }) => ({ id, sort_order }))
      )
      if (error) {
        toast.error('Failed to reorder links')
      } else {
        toast.success('Links reordered')
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Link in bio</h1>
            <p className="text-sm text-muted-foreground">
              Curate the offers and resources you want prospects to see first.
            </p>
          </div>
          <LinkFormDialog
            onSubmit={async (values) => {
              const { data, error } = await createLink(values)
              if (error || !data) {
                toast.error(error ?? 'Could not create link')
                return
              }
              setLinks((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
              toast.success('Link added')
            }}
          />
        </header>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {links.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onUpdate={async (values) => {
                    const { data, error } = await updateLink(link.id, values)
                    if (error || !data) {
                      toast.error(error ?? 'Failed to update link')
                      return
                    }
                    setLinks((prev) =>
                      prev.map((item) => (item.id === link.id ? data : item)).sort((a, b) => a.sort_order - b.sort_order)
                    )
                    toast.success('Link updated')
                  }}
                  onDelete={async () => {
                    const { error } = await deleteLink(link.id)
                    if (error) {
                      toast.error(error)
                      return
                    }
                    setLinks((prev) => prev.filter((item) => item.id !== link.id))
                    toast.success('Link removed')
                  }}
                />
              ))}
              {links.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Add your first link to start sharing!
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section>
        <LinkPreview links={links} />
        <AnalyticsPanel />
      </section>
    </div>
  )
}
```

### Step 5: Link Form & Sortable Item

- `LinkFormDialog` uses shadcn `Dialog` + `Form` components.  
- Fields: Title, Description, URL, Button Style (select), Icon (with icon picker), Visibility toggle.  
- Add `link_type` and `cta_action` if planning to support booking buttons.  
- `SortableLinkItem` uses `@dnd-kit/sortable` for drag handle (icon from `GripVertical`).

```tsx
// components/marketing/sortable-link-item.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ExternalLink, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export function SortableLinkItem({
  link,
  onUpdate,
  onDelete,
}: {
  link: LinkRecord
  onUpdate: (values: Partial<LinkRecord>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start justify-between rounded-lg border bg-card px-4 py-3 ${isDragging ? 'opacity-70 ring-2 ring-primary' : ''}`}
    >
      <button
        className="mr-3 mt-1 text-muted-foreground hover:text-primary focus:text-primary"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">Drag handle</span>
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium">{link.title}</p>
        <p className="text-xs text-muted-foreground">{link.description}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{link.url}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Switch
          checked={link.is_visible}
          onCheckedChange={(value) => onUpdate({ is_visible: value })}
          aria-label={link.is_visible ? 'Hide link' : 'Show link'}
        />
        {!link.is_visible && (
          <span className="flex items-center text-xs text-muted-foreground">
            <EyeOff className="mr-1 h-3 w-3" /> Hidden
          </span>
        )}
        <div className="flex gap-2">
          <LinkFormDialog
            mode="edit"
            initialValues={link}
            onSubmit={async (values) => onUpdate(values)}
          />
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Step 6: Link Preview Component

- Simulate public link-in-bio page inside a phone mock frame.  
- Provide theme options (default, minimal, colorful).  
- Use `Button` variants to reflect `button_style`.  
- Show lead magnet card if `link_type === 'lead_magnet'`.

```tsx
// components/marketing/link-preview.tsx
export function LinkPreview({ links }: { links: LinkRecord[] }) {
  return (
    <div className="rounded-2xl border bg-white shadow-xl">
      <div className="rounded-t-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
        <h2 className="text-lg font-semibold">Your live page</h2>
        <p className="text-xs opacity-80">Preview updates as you edit.</p>
      </div>
      <div className="space-y-4 p-6">
        {links
          .filter((link) => link.is_visible)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((link) => (
            <a
              key={link.id}
              className="block rounded-full border px-4 py-3 text-center text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {link.title}
            </a>
          ))}
      </div>
    </div>
  )
}
```

> Iterate later with actual theming system and icons.

### Step 7: Contact Channel Shortcuts

- Add preset link templates for WhatsApp, Instagram DM, Messenger, SMS, and email.  
- Draw phone number and social handles from profile settings when available so tutors can drop them in with one click.  
- Generate WhatsApp links using `https://wa.me/<number>?text=<encoded welcome message>` that references the tutor’s booking URL.  
- Instagram DM: `https://www.instagram.com/direct/t/<username>`; Messenger: `https://m.me/<page>`; SMS: `sms:<number>?&body=<text>`.  
- Let tutors customize the default message copy—Growth Plan can offer AI-generated scripts for IG/TikTok outreach.  
- Display these links with platform-specific icons and badge them as “Instant contact” in the public page and parent credibility view.  
- Provide analytics segmentation (e.g., “WhatsApp clicks”) by setting `link_type = 'contact_whatsapp'` etc.

### Step 8: Analytics Panel

- Display total clicks (sum of `click_count`), most popular link, last updated.  
- For Growth Plan, show CTA to enable UTM tracking and deeper analytics.  
- Add chart placeholder using `recharts` or `visx` once `link_events` table added.  
- Provide `Copy URL` button to copy public link to clipboard.

### Step 9: Server Actions

Implement CRUD actions for links:

```ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const linkSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  url: z.string().url('Enter a valid URL'),
  button_style: z.enum(['default', 'primary', 'secondary', 'outline']).default('default'),
  icon: z.string().optional(),
  is_visible: z.boolean().default(true),
  sort_order: z.number().optional(),
})

export async function createLink(values: z.infer<typeof linkSchema>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = linkSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  const { data, error } = await supabase
    .from('links')
    .insert({
      ...parsed.data,
      tutor_id: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing/links')
  revalidatePath(`/bio/${user.id}`) // adjust with username look-up
  return { data }
}

export async function updateLink(id: string, values: Partial<LinkRecord>) {
  /* similar pattern, ensure id belongs to user */
}

export async function updateLinksOrder(items: { id: string; sort_order: number }[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.rpc('reorder_links', {
    link_ids: items.map((item) => item.id),
    sort_orders: items.map((item) => item.sort_order),
  })
  return { error: error?.message }
}
```

> You can either use the RPC helper or update each row individually inside a transaction. Document whichever approach you choose.

### Step 10: Public Link-in-Bio Page

- Route: `/bio/[username]/page.tsx` or integrate into `/@username`.  
- Fetch profile + links via Supabase.  
- Render hero (avatar, bio snippet), optional lead magnet block, social icons.  
- Provide theme switching query param (e.g., `?theme=minimal`).  
- Ensure SEO metadata (title, description, canonical).

```tsx
export default async function LinkInBioPage({ params }: { params: { username: string } }) {
  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, tagline, avatar_url, bio, languages_taught')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('tutor_id', profile.id)
    .eq('is_visible', true)
    .order('sort_order')

  return <PublicLinkPage profile={profile} links={links ?? []} />
}
```

### Step 11: Tracking Link Clicks

- Add API route `/api/link-click` that increments `links.click_count` and logs event row.  
- On client, link buttons call `fetch('/api/link-click', { method: 'POST', body: { linkId } })` before redirect.  
- Use `<Link target="_blank">` for external links; ensure event doesn't block navigation (use `navigator.sendBeacon` or `fetch` with `keepalive`).

> Later, move tracking into Edge Function for reliability.

### Step 12: Growth Plan Enhancements

- Enable lead magnet block (download PDF) requiring email capture → store in `leads` table.  
- Growth Plan users get analytics segmentation by traffic source (UTMs).  
- Provide toggle to embed verified reviews (from `reviews` table).  
- Upsell Professional users with CTA card: “Upgrade to Growth to capture leads automatically.”

### Step 13: Studio Add-On Hooks

- Studio plan might allow multi-tutor bio pages or team sections. Add future placeholder in preview indicating “Add team member bios with Studio plan.”

### Step 14: Accessibility & Mobile

- Buttons must be large enough for mobile (min 44px height).  
- Provide focus styles for drag handles.  
- Ensure color contrast across theme options.  
- Add `aria-live` announcements for reorder success.

## Testing Checklist

- [ ] Tutor can create, edit, hide, delete links.  
- [ ] Drag-and-drop reorders links and persists after refresh.  
- [ ] Validation prevents invalid URLs; http(s) required.  
- [ ] Public link page loads for profile with visible links.  
- [ ] Click tracking increments counter and analytics updates.  
- [ ] Lead magnet/upgrade callouts respect plan entitlements.  
- [ ] WhatsApp/DM quick-contact buttons populate with correct profile data and open appropriate targets.  
- [ ] Mobile preview matches actual public page layout.  
- [ ] SEO metadata present (title, description, canonical).  
- [ ] Lighthouse mobile score ≥ 90 on public link page.

## AI Tool Prompts

### Build Link Manager UI
```
Create a Next.js client component using shadcn/ui and @dnd-kit that:
1. Lists links with drag handles
2. Supports visibility toggle and edit/delete actions
3. Includes a dialog form for adding new links
Use TypeScript and React Hook Form.
```

### Link Click API
```
Write a Next.js Route Handler at /api/link-click that:
- Accepts POST requests with JSON { linkId }
- Increments links.click_count
- Inserts a row into link_events (link_id, source, user_agent)
Return JSON { success: true } or { error }.
```

### Public Link Page Theming
```
Generate a React component for a link-in-bio page that:
1. Displays tutor avatar, name, tagline, social icons
2. Renders a list of buttons with variant styles (default, gradient, outline)
3. Supports a theme prop to switch color palettes
Ensure accessibility (aria labels, keyboard focus).
```

## Common Gotchas

- **Untrusted URLs**: Always validate and sanitize before opening; consider adding `rel="noopener noreferrer"` for external links.  
- **Drag performance**: Wrap heavy components in `React.memo` or use virtualization if many links.  
- **click_count vs. link_events**: Without debouncing, rapid clicks can spike counts. Consider storing unique visitor data with IP hashing or session cookie.  
- **Preview vs. live**: Ensure preview uses same theming tokens as public page to avoid mismatched look.  
- **Supabase Row Level Security**: Confirm policies allow tutors to manage their own links only.

## Next Steps

1. Build **06-service-listings.md** to connect CTA buttons to actual booking flows.  
2. Implement review requests (**11-email-system.md**) so reviews can be surfaced here.  
3. Sync link analytics with Growth plan dashboards.

## Success Criteria

✅ Tutors can manage a visually appealing link-in-bio without leaving the platform  
✅ Public page is production-ready with analytics and lead capture hooks  
✅ Growth/Studio upgrade paths clearly communicated within the marketing hub  
✅ Link data feeds analytics and future marketing automation  
✅ Mobile-first experience ready for social media profile links

**Estimated Time**: 3-4 hours
