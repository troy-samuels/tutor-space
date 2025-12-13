Designing for **Language Tutors** is different than general design because the "Product" is **communication and culture**.

The design needs to balance **Approachability** (I am safe to talk to) with **Authority** (I know the grammar/language).

Here is the **Revised System Prompt**, specifically curated for the **Language Tutor** niche. It replaces generic "Personas" with "Teaching Archetypes" and optimizes the layout to showcase languages and cultural context (e.g., flags, distinct vibes) without looking "overbearing."

***

# System Prompt: TutorLingua Page Builder (Language Niche Edition)

**Role:** Lead Product Designer.
**Context:** You are building the profile page builder for a premium language learning platform.
**Constraint:** The Target Audience is **Language Tutors Only**.
**Goal:** Implement a "Banner Hero" layout that balances personality (cultural vibe) with professionalism (teaching credentials).

---

## 1. THE "CULTURAL BANNER" LAYOUT

The previous "floating" layout failed because it lacked context. Language learning is immersive. We will use the **Banner + Overlay** pattern to allow tutors to set a "vibe" (e.g., a photo of a Parisian Café, a clean desk, or an abstract map) while keeping the text legible.

### Visual Structure (The Stack)

```
┌─────────────────────────────────────────────┐
│  [ Banner: h-40 w-full object-cover ]       │ <─ Sets the "Cultural Context"
│  [ Overlay: Gradient black/40 -> transp ]   │ <─ Ensures text readability
└──────────────────────┬──────────────────────┘
            ┌──────────┴──────────┐
            │  Avatar: w-28 h-28  │             <─ The "Face" of the language
            │  Ring: 4px (Solid)  │
            │  Overlap: -mt-14    │
            └──────────┬──────────┘
                       │
          [Name: text-2xl font-bold]            <─ Reduced from 4xl (No shouting)
                       │
       [Languages: 🇫🇷 French • 🇬🇧 English]    <─ NEW: Distinct Language Row
                       │
        [Specialty: "IELTS & Exam Prep"]        <─ The Subtitle
                       │
          [Status Pill: "Native Speaker"]       <─ The Trust Indicator
```

---

## 2. THE 4 TEACHING ARCHETYPES (Curated Presets)

Language tutors usually fall into 4 specific categories. We will restrict the design choices to these 4 "Themes" to ensure they look premium.

### Archetype A: "The Professional" (Business & Career)
*For tutors teaching Business English, Legal Spanish, Interview Prep.*
*   **Vibe:** Corporate, Clean, High-Status.
*   **Palette:** **"Midnight Navy"** (Slate-900 & White).
*   **Font:** **Inter** (Standard, legible, safe).
*   **Banner Suggestion:** Abstract Architecture, Clean Office, Geometric Blue.
*   **Border Radius:** `rounded-lg` (Sharper corners = Serious).
*   **Key visual:** Minimalist.

### Archetype B: "The Immersion Guide" (Conversation & Travel)
*For tutors teaching "Speak like a Local," Travel survival, Casual conversation.*
*   **Vibe:** Warm, Organic, Friendly.
*   **Palette:** **"Terracotta Warmth"** (Stone-50 background, Burnt Orange accents).
*   **Font:** **Manrope** (Rounded sans-serif, very friendly).
*   **Banner Suggestion:** Street scenes, Coffee shops, Nature.
*   **Border Radius:** `rounded-3xl` (Soft corners = Approachable).
*   **Key visual:** Photo-heavy.

### Archetype C: "The Academic" (Grammar & Exams)
*For tutors teaching IELTS, DELE, TOPIK, Literature, Linguistics.*
*   **Vibe:** Institutional, Trustworthy, Prestigious.
*   **Palette:** **"Ivy League"** (Cream background, Forest Green or Maroon text).
*   **Font:** **Merriweather** (Serif headings) + **Inter** (Sans body).
*   **Banner Suggestion:** Books, Libraries, University textures.
*   **Border Radius:** `rounded-xl`.
*   **Key visual:** Structured.

### Archetype D: "The Modern Polyglot" (Gen Z / Influencer)
*For tutors using pop culture, slang, and modern methods.*
*   **Vibe:** Trendy, Digital, High-Energy.
*   **Palette:** **"Electric Lavender"** (White bg, Vivid Purple/Blurple accents).
*   **Font:** **Space Grotesk** or **DM Sans** (Trendy, bold).
*   **Banner Suggestion:** Gradients, Abstract 3D, Neon.
*   **Border Radius:** `rounded-2xl`.
*   **Key visual:** High contrast.

---

## 3. EXACT SPECIFICATIONS (To fix the "Overbearing" look)

Use these exact values to ensure the text hierarchy respects the content.

### The Banner Container
*   **Height:** `h-36` (Mobile) / `h-44` (Desktop).
*   **Corners:** Top corners match the archetype radius (`rounded-t-[value]`). Bottom is flat.
*   **Overlay:** `bg-gradient-to-t from-black/20 to-transparent` (Subtle darkening at the bottom of the banner to let the white avatar ring pop).

### The Avatar (Crucial for Trust)
*   **Size:** `w-28 h-28` (112px). Large enough to see facial expressions (lip reading is part of language learning), but not huge.
*   **Anchor:** Negative margin ` -mt-14` (pulls exactly 50% of the avatar over the banner).
*   **Ring:** `ring-4` (4px). **Must match the page background color** (e.g., White or Stone-50), *not* the banner color. This creates the "cutout" look.

### Typography Hierarchy (The Fix)
*   **Name:** `text-2xl` (24px) or `text-3xl` (30px) max. **Never 4xl.**
    *   *Why?* Long names (e.g., "Massimiliano") break layouts at 4xl.
*   **Language Row (NEW):** `text-sm font-semibold mt-2`.
    *   *Style:* Flex row with small flag emojis or icons.
*   **Specialty/Tagline:** `text-sm text-{secondary} font-medium mt-1`.
*   **Bio Text:** `text-sm leading-relaxed text-{secondary} max-w-lg mx-auto mt-4`.

---

## 4. CODE IMPLEMENTATION (React/Tailwind)

This code block implements the "Immersion Guide" archetype (Archetype B) as an example.

```jsx
// Example: "The Immersion Guide" Theme
// Variables: rounded-3xl, font-manrope, bg-stone-50

<div className="w-full max-w-md mx-auto bg-stone-50 rounded-3xl shadow-xl overflow-hidden border border-stone-100">

  {/* 1. CULTURAL BANNER */}
  <div className="relative h-40 w-full">
    <img 
      src="/images/paris-street.jpg" 
      alt="French Atmosphere" 
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-black/10"></div>
  </div>

  {/* 2. PROFILE CONTENT */}
  <div className="px-6 pb-8 text-center relative">
    
    {/* Avatar Anchor */}
    <div className="relative -mt-14 inline-block">
      <div className="h-28 w-28 rounded-full ring-4 ring-stone-50 shadow-md bg-white p-0.5">
        <img 
          src="/images/tutor-face.jpg" 
          alt="Tutor" 
          className="w-full h-full rounded-full object-cover"
        />
      </div>
      {/* "Online" Indicator */}
      <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-stone-50 bg-green-500"></span>
    </div>

    {/* Identity Stack */}
    <div className="mt-3">
      <h1 className="font-manrope text-2xl font-bold text-stone-800 tracking-tight">
        Troy Samuels
      </h1>
      
      {/* NEW: Language Row with divider */}
      <div className="flex items-center justify-center gap-2 mt-1.5 text-sm font-semibold text-stone-700">
        <span>🇬🇧 English (Native)</span>
        <span className="text-stone-300">•</span>
        <span>🇪🇸 Spanish (C1)</span>
      </div>

      <p className="font-manrope text-sm font-medium text-stone-500 mt-1">
        Conversational Practice & Accent Reduction
      </p>
    </div>

    {/* Trust & Stats Row */}
    <div className="mt-5 flex justify-center gap-3">
      <div className="px-4 py-2 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <span className="block text-xs text-stone-400 font-semibold uppercase tracking-wider">Students</span>
        <span className="block text-sm font-bold text-stone-800">120+</span>
      </div>
      <div className="px-4 py-2 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <span className="block text-xs text-stone-400 font-semibold uppercase tracking-wider">Rating</span>
        <span className="block text-sm font-bold text-stone-800">5.0 ★</span>
      </div>
    </div>

    {/* Bio Teaser */}
    <p className="mt-5 text-sm leading-6 text-stone-600">
      Hi! I specialize in helping intermediates break through the "fear barrier" of speaking. We will talk about food, travel, and culture.
    </p>

    {/* CTA */}
    <div className="mt-6">
      <button className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition-transform hover:scale-[1.02]">
        Book Trial Lesson ($15)
      </button>
    </div>

  </div>
</div>
```

---

## 5. SUMMARY OF IMPROVEMENTS FOR LANGUAGE TUTORS

1.  **Banner Anchor:** Solves the "Floating" issue. It allows the tutor to visually say "This is French class" (Eiffel tower banner) or "This is Academic English" (Bookshelf banner).
2.  **Specific Typography:** Reduced the Name size to `text-2xl`. Added a dedicated **Language Row** (Flag + Proficiency) because that is the *first* thing a student looks for.
3.  **Color Psychology:**
    *   *Orange/Stone* = "We are going to chat."
    *   *Navy/White* = "We are going to work."
    *   *Cream/Green* = "We are going to study."
4.  **Information Density:** Added a "Stats Row" (Students/Rating) in the hero. Students judge tutors by social proof immediately; this layout provides it upfront without clutter.