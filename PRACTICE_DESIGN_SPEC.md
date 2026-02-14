# Practice App — Design Specification
## Mobile-First AI Language Practice Experience

### Design System (from existing TutorLingua)

**Dark mode primary** (language learners practice evenings/nights):
- Background: `#1A1917` (`bg-[#1A1917]`)
- Cards: `#2D2A26` (`bg-[#2D2A26]`)
- Text primary: `#F5F2EF` (`text-[#F5F2EF]`)
- Text muted: `#9A9590` (`text-[#9A9590]`)
- Accent orange: `#E8784D` (`text-[#E8784D]`, `bg-[#E8784D]`)
- Accent green: `#5A7A5E` (`text-[#5A7A5E]`, `bg-[#5A7A5E]`)
- Error/correction: `#E8784D` with `bg-[#E8784D]/10` background
- Success: `#5A7A5E` with `bg-[#5A7A5E]/10` background
- Border: `border-white/[0.08]`
- Font: Manrope (`font-sans`)
- Border radius: `rounded-2xl` cards, `rounded-full` buttons/pills
- Shadows: `shadow-[0_8px_30px_rgba(0,0,0,0.3)]`

### Global Container
```
<div className="min-h-[100dvh] bg-[#1A1917] text-[#F5F2EF] font-sans
     flex flex-col max-w-[430px] mx-auto relative overflow-hidden">
```
Max-width 430px, centred, to feel like a phone app even on desktop.
Use `100dvh` not `100vh` for proper mobile viewport.

---

### Screen 1: SPLASH

**Layout:**
- Full viewport height, flex column, content centred
- Top 40%: Visual area with subtle gradient orb (radial gradient, orange→transparent)
- Centre: Headline + subtitle
- Language pills row (horizontal scroll)
- CTA button
- Trust badge at bottom

**Elements:**
```
Background orb:
  <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] 
       rounded-full bg-[#E8784D]/[0.06] blur-[120px]" />

Headline:
  <h1 className="text-[32px] font-bold leading-tight tracking-tight text-center">
    Practice any language.<br/>
    <span className="text-[#E8784D]">Powered by AI.</span>
  </h1>

Subtitle:
  <p className="text-[#9A9590] text-base text-center mt-3 px-8">
    Get instant feedback on grammar, vocabulary, and fluency. Free.
  </p>

Language pills (horizontal scroll):
  <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
    {languages.map(lang => (
      <span className="shrink-0 px-4 py-2 rounded-full bg-[#2D2A26] border border-white/[0.08]
           text-sm text-[#F5F2EF]">
        {lang.flag} {lang.name}
      </span>
    ))}
  </div>

CTA:
  <button className="w-[calc(100%-48px)] mx-6 py-4 rounded-full bg-[#E8784D] 
       text-[#1A1917] font-semibold text-lg
       active:scale-[0.98] transition-transform">
    Start practising
  </button>

Trust:
  <p className="text-[#9A9590] text-xs text-center mt-4">
    No signup required · 100% free · Results in 2 minutes
  </p>
```

**Framer Motion:**
- Headline: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}`
- Pills: stagger children by 0.05s
- CTA: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}`

---

### Screen 2: LANGUAGE PICKER

**Layout:**
- Minimal header: "What do you want to practise?"
- 2×3 grid of language cards
- Each card: flag (large), language name, native name

**Elements:**
```
Header:
  <h2 className="text-xl font-semibold text-center pt-16 pb-8">
    What do you want to practise?
  </h2>

Grid:
  <div className="grid grid-cols-2 gap-3 px-6">
    {languages.map(lang => (
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-[#2D2A26] 
             border border-white/[0.08] active:border-[#E8784D]/50
             transition-colors"
      >
        <span className="text-4xl">{lang.flag}</span>
        <span className="text-sm font-medium">{lang.name}</span>
        <span className="text-xs text-[#9A9590]">{lang.nativeName}</span>
      </motion.button>
    ))}
  </div>
```

**Languages:**
- 🇪🇸 Spanish / Español
- 🇫🇷 French / Français
- 🇩🇪 German / Deutsch
- 🇧🇷 Portuguese / Português
- 🇯🇵 Japanese / 日本語
- 🇬🇧 English / English

**Selected state:**
- Border changes to `border-[#E8784D]`
- Background gains `bg-[#E8784D]/10`
- Scale pop: `whileTap={{ scale: 0.95 }}` then auto-advance after 300ms

---

### Screen 3: LEVEL ASSESSMENT

**Layout:**
- Top: progress dots (5 dots, filled = complete)
- Scrollable chat area (flex-1)
- Bottom: text input with send button, pinned to bottom

**Elements:**
```
Progress dots:
  <div className="flex justify-center gap-2 pt-6 pb-4">
    {[1,2,3,4,5].map(i => (
      <div className={cn(
        "w-2 h-2 rounded-full transition-colors duration-300",
        i <= current ? "bg-[#E8784D]" : "bg-[#2D2A26]"
      )} />
    ))}
  </div>

Context label:
  <p className="text-xs text-[#9A9590] text-center mb-4">
    Finding your level · Question {current} of 5
  </p>

AI message bubble:
  <div className="flex gap-3 px-4 mb-3">
    <div className="w-8 h-8 rounded-full bg-[#E8784D]/20 flex items-center justify-center shrink-0">
      <Sparkles className="w-4 h-4 text-[#E8784D]" />
    </div>
    <div className="bg-[#2D2A26] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  </div>

Student message bubble:
  <div className="flex justify-end px-4 mb-3">
    <div className="bg-[#E8784D] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
      <p className="text-sm text-[#1A1917] leading-relaxed">{message}</p>
    </div>
  </div>

Input area (sticky bottom):
  <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#1A1917] via-[#1A1917] to-transparent">
    <div className="flex gap-2">
      <input className="flex-1 px-4 py-3.5 rounded-full bg-[#2D2A26] border border-white/[0.08]
           text-sm placeholder:text-[#9A9590] focus:border-[#E8784D]/50 focus:outline-none
           transition-colors" 
           placeholder="Type your answer..." />
      <button className="w-12 h-12 rounded-full bg-[#E8784D] flex items-center justify-center
           active:scale-95 transition-transform">
        <ArrowUp className="w-5 h-5 text-[#1A1917]" />
      </button>
    </div>
  </div>
```

**Framer Motion:**
- New messages: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- AI typing indicator: 3 dots pulsing (use `animate={{ opacity: [0.3, 1, 0.3] }}`)

---

### Screen 4: PRACTICE CHAT (Core Screen)

Same chat layout as assessment but with additions:

**Header bar:**
```
<div className="flex items-center justify-between px-4 pt-4 pb-2">
  <div>
    <p className="text-xs text-[#9A9590]">Practising Spanish</p>
    <p className="text-sm font-medium">Conversation · B1</p>
  </div>
  <button className="px-3 py-1.5 rounded-full text-xs text-[#9A9590] border border-white/[0.08]">
    End session
  </button>
</div>
```

**Error correction inline (KEY DIFFERENTIATOR):**
Within student message bubbles, errors are highlighted:
```
<div className="bg-[#E8784D] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
  <p className="text-sm text-[#1A1917]">
    Ayer yo <span className="bg-[#1A1917]/20 px-1 rounded underline decoration-wavy 
    decoration-[#1A1917]/60">soy</span> al mercado
  </p>
</div>
<!-- Correction chip appears below -->
<div className="flex justify-end px-4 -mt-1 mb-3">
  <div className="bg-[#E8784D]/15 border border-[#E8784D]/20 rounded-lg px-3 py-1.5 max-w-[80%]">
    <p className="text-xs text-[#E8784D]">
      soy → <span className="font-semibold">fui</span> · past tense of "ir"
    </p>
  </div>
</div>
```

**Session progress (subtle top bar):**
```
<div className="h-0.5 bg-[#2D2A26] mx-4 rounded-full overflow-hidden">
  <motion.div className="h-full bg-[#E8784D] rounded-full" 
    style={{ width: `${(messageCount/16) * 100}%` }} />
</div>
```

---

### Screen 5: RESULTS / SCORE CARD

**Layout:**
- Top area: animated score ring (hero element)
- Level badge pill
- Three metric bars
- Error list
- CTAs at bottom

**Elements:**
```
Score ring (centred, dramatic):
  <div className="relative w-40 h-40 mx-auto mt-12">
    <svg viewBox="0 0 160 160" className="transform -rotate-90">
      <!-- Background circle -->
      <circle cx="80" cy="80" r="70" fill="none" stroke="#2D2A26" strokeWidth="8" />
      <!-- Score arc (animated) -->
      <motion.circle cx="80" cy="80" r="70" fill="none" 
        stroke={score >= 70 ? "#5A7A5E" : score >= 40 ? "#E8784D" : "#C4563F"}
        strokeWidth="8" strokeLinecap="round"
        strokeDasharray={440} 
        initial={{ strokeDashoffset: 440 }}
        animate={{ strokeDashoffset: 440 - (440 * score / 100) }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <motion.span className="text-4xl font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        {score}
      </motion.span>
      <span className="text-xs text-[#9A9590]">out of 100</span>
    </div>
  </div>

Level badge:
  <div className="flex justify-center mt-4">
    <span className="px-4 py-1.5 rounded-full bg-[#5A7A5E]/20 text-[#5A7A5E] text-sm font-medium">
      B1 · Intermediate
    </span>
  </div>

Metric bars:
  <div className="px-6 mt-8 space-y-4">
    {metrics.map(m => (
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-sm">{m.label}</span>
          <span className="text-sm text-[#9A9590]">{m.score}/10</span>
        </div>
        <div className="h-2 rounded-full bg-[#2D2A26] overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#E8784D]"
            initial={{ width: 0 }}
            animate={{ width: `${m.score * 10}%` }}
            transition={{ duration: 1, delay: 0.3 }} />
        </div>
      </div>
    ))}
  </div>

Top errors:
  <div className="px-6 mt-8">
    <h3 className="text-sm font-medium text-[#9A9590] mb-3">Your top errors</h3>
    <div className="space-y-2">
      {errors.map((e, i) => (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#2D2A26]">
          <span className="w-6 h-6 rounded-full bg-[#E8784D]/20 text-[#E8784D] text-xs 
               flex items-center justify-center shrink-0 font-medium">{i+1}</span>
          <div>
            <p className="text-sm"><span className="line-through text-[#9A9590]">{e.wrong}</span> 
              → <span className="text-[#E8784D] font-medium">{e.correct}</span></p>
            <p className="text-xs text-[#9A9590] mt-0.5">{e.explanation}</p>
          </div>
        </div>
      ))}
    </div>
  </div>

CTAs (sticky bottom):
  <div className="sticky bottom-0 px-6 pb-6 pt-4 mt-8 
       bg-gradient-to-t from-[#1A1917] via-[#1A1917] to-transparent">
    <button className="w-full py-4 rounded-full bg-[#E8784D] text-[#1A1917] font-semibold text-base
         active:scale-[0.98] transition-transform">
      Keep practising
    </button>
    <button className="w-full py-3 mt-2 rounded-full border border-white/[0.08] text-sm text-[#F5F2EF]
         active:scale-[0.98] transition-transform">
      Share my score
    </button>
  </div>
```

---

### Transitions Between Screens

All screen transitions: slide left (forward), slide right (back)
```
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};
const pageTransition = { duration: 0.3, ease: "easeInOut" };
```

Use `<AnimatePresence mode="wait">` wrapping the screen state.
