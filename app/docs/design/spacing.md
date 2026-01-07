# Spacing Guidelines

> Reference for consistent spacing throughout the TutorLingua platform.

---

## Base Unit

TutorLingua uses Tailwind's default 4px base unit for all spacing calculations.

```
1 unit = 4px = 0.25rem
```

---

## Spacing Scale Reference

| Tailwind Class | Value | Pixels | Common Usage |
|----------------|-------|--------|--------------|
| `p-0` / `m-0` | 0 | 0px | Reset spacing |
| `p-0.5` / `m-0.5` | 0.125rem | 2px | Micro spacing |
| `p-1` / `m-1` | 0.25rem | 4px | Icon padding |
| `p-1.5` / `m-1.5` | 0.375rem | 6px | Badge padding |
| `p-2` / `m-2` | 0.5rem | 8px | Button padding (y-axis) |
| `p-3` / `m-3` | 0.75rem | 12px | Input padding (x-axis) |
| `p-4` / `m-4` | 1rem | 16px | Button padding (x-axis), card inner margins |
| `p-5` / `m-5` | 1.25rem | 20px | Section padding (small) |
| `p-6` / `m-6` | 1.5rem | 24px | Card padding, section margins |
| `p-8` / `m-8` | 2rem | 32px | Large section padding |
| `p-10` / `m-10` | 2.5rem | 40px | Page section gaps |
| `p-12` / `m-12` | 3rem | 48px | Hero section padding |

---

## Component Spacing Patterns

### Buttons

```tsx
// Default button
<Button className="px-4 py-2">Save</Button>  // 16px x 8px

// Small button
<Button size="sm" className="px-3 py-1.5">Edit</Button>  // 12px x 6px

// Large button
<Button size="lg" className="px-6 py-3">Get Started</Button>  // 24px x 12px

// Icon button
<Button size="icon" className="p-2">
  <Icon className="h-4 w-4" />
</Button>  // 8px all around
```

### Form Inputs

```tsx
// Standard input
<Input className="px-3 py-2" />  // 12px x 8px padding

// With label
<div className="space-y-1.5">
  <Label>Email</Label>
  <Input />
</div>

// Form field groups
<div className="space-y-4">
  <FormField />
  <FormField />
  <FormField />
</div>
```

### Cards

```tsx
// Standard card
<Card className="p-6">  // 24px padding
  <CardContent className="space-y-4">
    {/* Content with 16px vertical gaps */}
  </CardContent>
</Card>

// Compact card
<Card className="p-4">  // 16px padding
  <CardContent className="space-y-2">
    {/* Content with 8px vertical gaps */}
  </CardContent>
</Card>

// Card with header/footer
<Card>
  <CardHeader className="pb-4">Title</CardHeader>
  <CardContent className="pt-0">Content</CardContent>
  <CardFooter className="pt-4">Actions</CardFooter>
</Card>
```

---

## Gap & Stack Patterns

### Vertical Stacking (space-y)

| Pattern | Gap | Usage |
|---------|-----|-------|
| `space-y-1` | 4px | Tight lists, label/input pairs |
| `space-y-1.5` | 6px | Form labels above inputs |
| `space-y-2` | 8px | Compact card content |
| `space-y-3` | 12px | Form field descriptions |
| `space-y-4` | 16px | Standard card content, form fields |
| `space-y-6` | 24px | Page sections |
| `space-y-8` | 32px | Major section breaks |

### Horizontal Spacing (space-x / gap)

| Pattern | Gap | Usage |
|---------|-----|-------|
| `space-x-1` / `gap-1` | 4px | Icon + text tight |
| `space-x-2` / `gap-2` | 8px | Button groups, badge clusters |
| `space-x-3` / `gap-3` | 12px | Form actions, nav items |
| `space-x-4` / `gap-4` | 16px | Card grids, toolbar items |
| `space-x-6` / `gap-6` | 24px | Wide card grids |

---

## Container Widths

| Class | Max Width | Usage |
|-------|-----------|-------|
| `max-w-sm` | 384px | Modals, popovers |
| `max-w-md` | 448px | Auth forms, dialogs |
| `max-w-lg` | 512px | Settings panels |
| `max-w-xl` | 576px | Content forms |
| `max-w-2xl` | 672px | Article content |
| `max-w-4xl` | 896px | **Default dashboard pages** |
| `max-w-6xl` | 1152px | Calendar, analytics (wide layouts) |
| `max-w-7xl` | 1280px | Landing pages |

### Dashboard Width Guidelines

```tsx
// Standard dashboard page
<div className="max-w-4xl mx-auto px-4 py-6">
  {/* 896px max width with 16px side padding */}
</div>

// Wide dashboard page (calendar, analytics)
<div className="max-w-6xl mx-auto px-4 py-6">
  {/* 1152px max width */}
</div>

// Full-width (classroom, page builder)
<div className="w-full px-4 py-6">
  {/* No max width constraint */}
</div>
```

---

## Page-Level Spacing

### Dashboard Pages

```tsx
// Page wrapper
<div className="space-y-6">
  {/* Page header */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-semibold">Page Title</h1>
    <Button>Action</Button>
  </div>

  {/* Page content */}
  <div className="space-y-4">
    {/* Content sections */}
  </div>
</div>
```

### Metric Cards Row

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>
```

### Two-Column Layout

```tsx
<div className="grid gap-6 lg:grid-cols-2">
  <Card>Left content</Card>
  <Card>Right content</Card>
</div>
```

---

## Touch Target Sizes

For accessibility, interactive elements must meet minimum touch target sizes:

| Element | Minimum Size | Implementation |
|---------|--------------|----------------|
| Buttons | 44px height | `h-11` or `py-3 px-4` |
| Icon buttons | 44x44px | `h-11 w-11` or `p-2.5` with 24px icon |
| Checkboxes | 24px | Built into component |
| Switches | 44px wide | Built into component |
| Range sliders | 24px thumb | CSS in globals.css |

---

## Responsive Spacing

### Mobile-First Padding

```tsx
// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* 16px -> 24px -> 32px */}
</div>

// Responsive gaps
<div className="gap-4 sm:gap-6 lg:gap-8">
  {/* Grid/flex gaps scale up */}
</div>
```

### Common Responsive Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <Title />
  <Actions />
</div>

// Grid columns by breakpoint
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card />
  <Card />
  <Card />
</div>
```

---

## Border Radius Scale

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Small badges, tags |
| `rounded-md` | 8px | Inputs, buttons |
| `rounded-lg` | 10px | Cards, dialogs (**default**) |
| `rounded-xl` | 14px | Hero cards, large containers |
| `rounded-2xl` | 16px | Marketing sections |
| `rounded-3xl` | 24px | Landing page elements |
| `rounded-full` | 9999px | Avatars, pills |

### Custom Radius Variable

```css
:root {
  --radius: 0.625rem;  /* 10px - base radius */
  --radius-card: 1rem; /* 16px - card radius */
}
```

---

## Do's and Don'ts

### Do

- Use `space-y-*` for vertical stacking instead of margin on children
- Use `gap-*` for grid and flex layouts instead of margins
- Maintain consistent spacing within component variants
- Use responsive spacing for mobile-to-desktop adaptation

### Don't

- Mix `space-y` with manual margins in the same container
- Use arbitrary pixel values (prefer Tailwind scale)
- Forget mobile spacing when designing for desktop
- Use different spacing patterns for similar components

---

## Quick Reference Cheatsheet

```
Form label → input:      space-y-1.5  (6px)
Form field → field:      space-y-4   (16px)
Card padding:            p-6         (24px)
Button padding:          px-4 py-2   (16px x 8px)
Input padding:           px-3 py-2   (12px x 8px)
Page section gaps:       space-y-6   (24px)
Grid gaps:               gap-4       (16px)
Dashboard max-width:     max-w-4xl   (896px)
Wide page max-width:     max-w-6xl   (1152px)
```

---

*Last updated: December 2024*
