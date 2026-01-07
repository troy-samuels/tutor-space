# Animation Guidelines

> Reference for consistent animation and motion throughout the TutorLingua platform.

---

## Animation Philosophy

TutorLingua uses motion to:
1. **Guide attention** - Direct users to important changes
2. **Provide feedback** - Confirm actions have been received
3. **Create continuity** - Smooth transitions between states
4. **Add delight** - Subtle polish without distraction

### Core Principles

- **Purposeful**: Every animation should serve a function
- **Subtle**: Motion should enhance, not overwhelm
- **Accessible**: Respect `prefers-reduced-motion`
- **Performant**: Use CSS transforms and opacity (GPU-accelerated)

---

## Duration Scale

| Duration | Value | Usage |
|----------|-------|-------|
| **Micro** | 150ms | Hover states, focus rings, button press |
| **Standard** | 300ms | Fade in/out, slide transitions |
| **Elaborate** | 500ms | Page transitions, modal open/close |
| **Stagger** | 100ms | Delay between list items |

### CSS Implementation

```css
/* Micro transition */
.transition-micro {
  transition-duration: 150ms;
}

/* Standard transition */
.transition-standard {
  transition-duration: 300ms;
}

/* Elaborate transition */
.transition-elaborate {
  transition-duration: 500ms;
}
```

---

## Easing Functions

| Name | Value | Usage |
|------|-------|-------|
| **Ease Out** | `[0.25, 0.1, 0.25, 1]` | Most transitions (default) |
| **Ease In Out** | `ease-in-out` | Symmetrical animations |
| **Spring** | Framer Motion spring | Panel slides, bouncy elements |

The default easing `[0.25, 0.1, 0.25, 1]` provides a natural, slightly decelerated feel.

---

## Motion Components

### FadeIn Component

Fade in content when it enters the viewport.

```tsx
import { FadeIn } from "@/components/motion/fade-in";

// Basic fade up
<FadeIn>
  <Card>Content fades in from below</Card>
</FadeIn>

// Fade from left with delay
<FadeIn direction="left" delay={0.2}>
  <Card>Slides in from left after 200ms</Card>
</FadeIn>

// Longer duration
<FadeIn duration={0.8}>
  <Card>Slower fade animation</Card>
</FadeIn>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `"up" \| "down" \| "left" \| "right" \| "none"` | `"up"` | Direction to fade from |
| `delay` | `number` | `0` | Delay in seconds |
| `duration` | `number` | `0.5` | Duration in seconds |
| `distance` | `number` | `24` | Pixels to travel |
| `once` | `boolean` | `true` | Animate only once |
| `amount` | `number` | `0.3` | Viewport visibility threshold |

---

### StaggerContainer & StaggerItem

Animate lists with staggered delays.

```tsx
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";

<StaggerContainer staggerDelay={0.1}>
  {items.map((item) => (
    <StaggerItem key={item.id}>
      <Card>{item.title}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>

// Custom stagger timing
<StaggerContainer staggerDelay={0.15} delayChildren={0.3}>
  <StaggerItem direction="left">First item</StaggerItem>
  <StaggerItem direction="left">Second item</StaggerItem>
</StaggerContainer>
```

**StaggerContainer Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `staggerDelay` | `number` | `0.1` | Delay between children (seconds) |
| `delayChildren` | `number` | `0` | Initial delay before first child |
| `once` | `boolean` | `true` | Animate only once |
| `amount` | `number` | `0.2` | Viewport visibility threshold |

**StaggerItem Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `"up" \| "down" \| "left" \| "right" \| "none"` | `"up"` | Direction to fade from |
| `distance` | `number` | `24` | Pixels to travel |
| `duration` | `number` | `0.5` | Duration in seconds |

---

## CSS Animations

### Shimmer Animation

Loading shimmer effect for skeleton states and promotional banners.

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-shimmer {
  animation: shimmer 8s ease-in-out infinite;
}
```

```tsx
// Usage
<div className="animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted" />
```

---

### Shake Animation

Error feedback for form validation.

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
```

```tsx
// Usage - apply when form has errors
<form className={hasError ? "animate-shake" : ""}>
  <Input />
</form>
```

---

## Tailwind Transition Classes

### Common Patterns

```tsx
// Button hover
<Button className="transition-colors duration-150 hover:bg-primary/90">
  Click me
</Button>

// Card hover lift
<Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
  Hover for lift
</Card>

// Opacity fade
<div className="transition-opacity duration-300 opacity-0 data-[visible=true]:opacity-100">
  Fade in
</div>

// Scale on active
<button className="transition-transform duration-150 active:scale-95">
  Press me
</button>
```

### Transition Property Classes

| Class | Properties Transitioned |
|-------|------------------------|
| `transition-none` | None |
| `transition-all` | All properties |
| `transition-colors` | Color, background-color, border-color |
| `transition-opacity` | Opacity |
| `transition-shadow` | Box shadow |
| `transition-transform` | Transform |

---

## When to Animate

### Always Animate

| Element | Animation | Duration |
|---------|-----------|----------|
| Hover states | Color/background change | 150ms |
| Focus rings | Ring appearance | 150ms |
| Button press | Scale down | 150ms |
| Modal open | Fade + scale | 300ms |
| Dropdown open | Fade + slide | 200ms |
| Page content | Staggered fade in | 500ms |
| Toast notifications | Slide in | 300ms |

### Consider Animating

| Element | When | Animation |
|---------|------|-----------|
| Loading states | Content loading | Shimmer/skeleton |
| Form errors | Validation fails | Shake |
| Success feedback | Action completes | Check mark + fade |
| List reordering | Drag and drop | Position transition |

### Don't Animate

| Element | Reason |
|---------|--------|
| Real-time data updates | Too frequent, distracting |
| Critical error messages | Need immediate attention |
| Navigation (links) | Adds latency |
| Already visible content | Unnecessary motion |

---

## Accessibility: prefers-reduced-motion

All motion components check `prefers-reduced-motion` and disable animations accordingly.

```tsx
// FadeIn and StaggerContainer automatically handle this
const shouldReduceMotion = useReducedMotion();

// In CSS
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer,
  .animate-shake {
    animation: none;
  }
}
```

### Manual Implementation

```tsx
import { useReducedMotion } from "framer-motion";

function MyComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
      }}
    >
      Content
    </motion.div>
  );
}
```

---

## Performance Best Practices

### GPU-Accelerated Properties

Always animate these properties for best performance:
- `transform` (translate, scale, rotate)
- `opacity`

Avoid animating:
- `width` / `height`
- `top` / `left` (use transform instead)
- `box-shadow` (except with will-change)
- `border-radius`

### Example

```tsx
// Good: GPU-accelerated
<div className="transition-transform hover:-translate-y-1">
  Smooth animation
</div>

// Bad: Triggers layout recalculation
<div className="transition-all hover:mt-[-4px]">
  Janky animation
</div>
```

---

## Animation Examples by Context

### Page Load

```tsx
// Dashboard page content
<StaggerContainer className="space-y-6" staggerDelay={0.1}>
  <StaggerItem>
    <MetricCards />
  </StaggerItem>
  <StaggerItem>
    <RecentActivity />
  </StaggerItem>
  <StaggerItem>
    <UpcomingLessons />
  </StaggerItem>
</StaggerContainer>
```

### Modal Open

```tsx
<Dialog>
  <DialogContent className="animate-in fade-in-0 zoom-in-95 duration-300">
    Modal content
  </DialogContent>
</Dialog>
```

### Slide Panel

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      Panel content
    </motion.div>
  )}
</AnimatePresence>
```

### List Item Add/Remove

```tsx
<AnimatePresence>
  {items.map((item) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Quick Reference

```
Hover transitions:       150ms ease
Button press:           150ms scale(0.95)
Modal open:             300ms fade + scale
Page transitions:       500ms staggered fade
Stagger delay:          100ms between items
Easing:                 [0.25, 0.1, 0.25, 1]
Loading shimmer:        8s infinite
Error shake:            500ms
```

### Framer Motion Defaults

```tsx
// Default transition
transition={{
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1],
}}

// Spring transition
transition={{
  type: "spring",
  damping: 25,
  stiffness: 300,
}}
```

---

*Last updated: December 2024*
