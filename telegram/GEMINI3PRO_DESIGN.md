# Gemini 3 Pro — Glass-Haptic Design System

**Source:** Gemini 3 Pro Preview (AI Studio, Thinking: High)
**Date:** 2026-02-17

## Design Direction: "Glass-Haptic"

**Goal:** A "Hyper-Native" aesthetic. Must feel like a premium iOS system app mixed with a high-end game.
**Vibe:** Dark Glass, Neumorphic Depth, Electric Accents.

### Core Principles

1. **Background:** Deep Zinc (Not Black). Pure black causes "smearing" on OLEDs during scroll.
   - Value: `bg-zinc-950` (#09090b)

2. **Cards/Surface:** Translucent layers with noise and borders.
   - Base: `bg-zinc-900/50` + `backdrop-blur-xl`
   - Border: `border-white/10` (1px)

3. **Typography:** System fonts (SF Pro/Inter).
   - Headings: Tight tracking (`-tracking-tight`), heavy weights (`font-bold`)
   - Numbers: Monospaced digits (`tabular-nums`) for changing values

4. **Primary Action Color:** Electric Blue or Violet (High Trust + High Energy)
   - Gradient: `from-blue-500 to-violet-600`

5. **Touch Targets:** Minimum 48px height. No exceptions.

### Key Design Patterns

- **Floating Glass Dock:** Navigation floated above content with `backdrop-blur-xl`, `border-white/10`, `rounded-2xl`
- **Glow Effects:** `bg-blue-500/20 blur-md` behind active elements
- **Inset Shadows:** `shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]` for depth
- **Active Scale:** `active:scale-[0.98]` on all touchable elements
- **Gradient Text:** `text-transparent bg-clip-text bg-gradient-to-r` for hero numbers
- **Stats Grid:** 2-col grid with subtle coloured blur blobs in corners

### Performance Notes
- `will-change-transform` (implied in Framer Motion)
- strict `overflow-hidden` on body for 60fps iOS scrolling
- `touch-manipulation` on interactive elements

---

Note: This output was generic TMA design (Gemini didn't receive the full codebase).
Need to re-run with actual game components for specific redesigns.
