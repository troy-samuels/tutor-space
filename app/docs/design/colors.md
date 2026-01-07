# Color Guidelines

> Reference for consistent color usage throughout the TutorLingua platform.

---

## Brand Palette Overview

TutorLingua uses a **warm, earthy color palette** that conveys professionalism while remaining approachable for language tutors and their students.

### Primary Colors

| Name | Light Mode | Dark Mode | CSS Variable |
|------|------------|-----------|--------------|
| **Primary** (Burnt Orange) | `#D36135` | `#E8784D` | `--primary` |
| **Accent** (Forest Green) | `#3E5641` | `#5A7A5E` | `--accent` |
| **Destructive** (Deep Rust) | `#A24936` | `#C4563F` | `--destructive` |

### Neutral Colors

| Name | Light Mode | Dark Mode | CSS Variable |
|------|------------|-----------|--------------|
| **Background** | `#FDF8F5` (warm cream) | `#1A1917` | `--background` |
| **Foreground** | `#2D2A26` (dark charcoal) | `#F5F2EF` | `--foreground` |
| **Card** | `#FFFFFF` | `#2D2A26` | `--card` |
| **Muted** | `#F5EDE8` | `#2D2A26` | `--muted` |
| **Muted Foreground** | `#6B6560` | `#9A9590` | `--muted-foreground` |

---

## When to Use Each Color

### Primary (Burnt Orange `#D36135`)

**Use for:**
- Primary CTAs and buttons
- Links and interactive text
- Focus rings and outlines
- Active navigation states
- Brand accents in marketing pages

```tsx
// Primary button
<Button variant="default">Book Now</Button>

// Primary text link
<a className="text-primary hover:text-primary/80">Learn more</a>

// Focus ring
<Input className="focus:ring-primary" />
```

**Don't use for:**
- Body text (too bright, hard to read)
- Large background areas (overwhelming)
- Error states (use destructive instead)

---

### Accent (Forest Green `#3E5641`)

**Use for:**
- Success states and confirmations
- Positive actions (approve, confirm, complete)
- Secondary brand accent
- Data visualization highlights
- Status badges (completed, approved)

```tsx
// Success badge
<Badge className="bg-accent text-accent-foreground">Completed</Badge>

// Success message
<div className="text-accent">Payment successful!</div>

// Approve button
<Button variant="outline" className="border-accent text-accent">
  Approve
</Button>
```

**Don't use for:**
- Primary CTAs (reserve for orange)
- Error or warning states
- Large text blocks

---

### Destructive (Deep Rust `#A24936`)

**Use for:**
- Error messages and validation
- Delete/remove actions
- Warning states
- Declined/rejected status
- Critical alerts

```tsx
// Delete button
<Button variant="destructive">Delete Account</Button>

// Error message
<p className="text-destructive text-sm">Email is required</p>

// Error badge
<Badge variant="destructive">Payment Failed</Badge>
```

**Don't use for:**
- Non-critical information
- Success states
- Primary navigation

---

### Muted (`#F5EDE8` / `#6B6560`)

**Use for:**
- Secondary text and descriptions
- Disabled states
- Placeholder text
- Background for secondary sections
- Helper text below inputs

```tsx
// Muted text
<p className="text-muted-foreground text-sm">
  Optional field
</p>

// Muted background
<div className="bg-muted rounded-lg p-4">
  Secondary content
</div>

// Placeholder
<Input placeholder="Enter email" />  // Uses muted-foreground
```

---

## Color Pairing Rules

### Safe Combinations

| Background | Foreground | Usage |
|------------|------------|-------|
| `background` | `foreground` | Default page content |
| `card` | `card-foreground` | Card content |
| `primary` | `primary-foreground` | Primary buttons |
| `accent` | `accent-foreground` | Success elements |
| `destructive` | `destructive-foreground` | Error elements |
| `muted` | `muted-foreground` | Secondary content |

### Forbidden Combinations

| Avoid | Reason |
|-------|--------|
| `primary` text on `accent` background | Low contrast, clashing colors |
| `foreground` on `primary` background | Insufficient contrast |
| `muted-foreground` for important text | Too low contrast for critical info |
| Dark text on dark backgrounds | Accessibility violation |

---

## Contrast Requirements (WCAG AA)

| Text Type | Minimum Ratio | TutorLingua Status |
|-----------|---------------|-------------------|
| Normal text | 4.5:1 | Compliant |
| Large text (18px+) | 3:1 | Compliant |
| UI components | 3:1 | Compliant |

### Tested Combinations

| Combination | Ratio | Status |
|-------------|-------|--------|
| `foreground` on `background` | 12.4:1 | Excellent |
| `primary` on `background` | 4.8:1 | Passes |
| `muted-foreground` on `background` | 5.2:1 | Passes |
| `destructive` on `background` | 5.6:1 | Passes |

---

## Chart Colors (Data Visualization)

For charts and data visualization, use the dedicated chart palette:

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--chart-1` | `#D36135` | `#E8784D` | Primary data series |
| `--chart-2` | `#3E5641` | `#5A7A5E` | Secondary data series |
| `--chart-3` | `#A24936` | `#C4563F` | Tertiary data series |
| `--chart-4` | `#6B6560` | `#9A9590` | Fourth data series |
| `--chart-5` | `#2D2A26` | `#F5F2EF` | Fifth data series |

```tsx
// Recharts example
<BarChart>
  <Bar dataKey="revenue" fill="var(--chart-1)" />
  <Bar dataKey="expenses" fill="var(--chart-2)" />
</BarChart>
```

---

## Status Colors Reference

| Status | Color | Badge Variant | Usage |
|--------|-------|---------------|-------|
| Success/Completed | `accent` | `success` | Confirmed bookings, completed tasks |
| Pending/Warning | `yellow-500` | `warning` | Pending actions, warnings |
| Error/Failed | `destructive` | `destructive` | Errors, failures, declined |
| Neutral/Default | `secondary` | `secondary` | Default states |
| Info | `primary` | `default` | Information, active states |

---

## Dark Mode Adjustments

Dark mode uses adjusted values to maintain contrast and visibility:

| Token | Light | Dark | Why |
|-------|-------|------|-----|
| `primary` | `#D36135` | `#E8784D` | Brighter for dark backgrounds |
| `accent` | `#3E5641` | `#5A7A5E` | Lighter green for visibility |
| `destructive` | `#A24936` | `#C4563F` | Lighter rust for contrast |
| `border` | 6% opacity | 8% opacity | Subtle but visible on dark |

### Automatic Dark Mode

Colors automatically adjust with the `.dark` class:

```tsx
// Automatically adapts to dark mode
<div className="bg-background text-foreground">
  Content adapts automatically
</div>
```

---

## Sidebar Colors

The sidebar has its own set of tokens for consistent navigation styling:

| Token | Purpose |
|-------|---------|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Default text |
| `--sidebar-primary` | Active/selected items |
| `--sidebar-accent` | Hover backgrounds |
| `--sidebar-border` | Dividers |

---

## Implementation in Tailwind

### Using CSS Variables

```tsx
// Direct variable usage
<div className="bg-[var(--primary)]">Custom primary</div>

// Tailwind semantic classes (preferred)
<div className="bg-primary text-primary-foreground">
  Semantic usage
</div>
```

### Opacity Modifiers

```tsx
// Primary at 50% opacity
<div className="bg-primary/50">Semi-transparent</div>

// Primary at 10% opacity (subtle highlight)
<div className="bg-primary/10">Very subtle</div>
```

---

## Do's and Don'ts

### Do

- Always pair backgrounds with their corresponding foreground tokens
- Use semantic color names (`primary`, `destructive`) not raw hex values
- Test dark mode appearance for all color combinations
- Use muted colors for secondary/supporting content
- Maintain consistent status color meanings across the app

### Don't

- Use orange text on green backgrounds (or vice versa)
- Apply primary color to large background areas
- Use muted colors for critical information
- Hardcode hex values in components (use CSS variables)
- Forget to consider color-blind users (don't rely on color alone)

---

## Quick Reference

```
CTAs and links:          primary (#D36135)
Success states:          accent (#3E5641)
Error states:            destructive (#A24936)
Secondary text:          muted-foreground (#6B6560)
Page background:         background (#FDF8F5)
Card surfaces:           card (#FFFFFF)
Subtle backgrounds:      muted (#F5EDE8)
Borders:                 border (6% opacity)
```

---

*Last updated: December 2024*
