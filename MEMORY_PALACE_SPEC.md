# 🏰 Memory Palace — Build Spec

*The 10x learning experience. A tutor's 30-second note becomes a cinematic, interactive world.*

---

## The Concept

The student doesn't open a homework page. They enter a **Memory Palace** — a short, beautiful, interactive episode born from their lesson. Every scene, character, and interaction uses the exact vocabulary and grammar their tutor taught. It feels like stepping into a game, not studying.

---

## The Experience (Exact UX Flow)

### Phase 1: The Threshold (0-3 seconds)

Student taps the link. Screen fades to deep dark blue.

A softly glowing keyhole materialises in the centre. Below it:
*"Forging a memory for Sarah..."*

Faint ambient sound — a sustained musical note, like a singing bowl.

**Tech:** Full-screen dark overlay, Framer Motion `AnimatePresence`, keyhole SVG with CSS glow animation, Web Audio API for ambient tone.

---

### Phase 2: The Unveiling (3-6 seconds)

The keyhole expands. Light fills the screen. Parts like a curtain.

Reveals: a stunning AI-generated illustrated scene. If the lesson was about ordering food → a sun-drenched Spanish café. Past tense → a rain-streaked evening street with someone telling a story.

The scene has depth:
- **Background layer:** Buildings, sky, far elements (slow parallax)
- **Midground layer:** Tables, characters, main elements (medium parallax)
- **Foreground layer:** Close objects, steam, plants (fast parallax)

Ambient animations: steam rising, a cat stretching, rain drops, leaves drifting. The world breathes.

**Tech:** 3 layered PNG/WebP images with CSS `transform: translate3d()` on device tilt/gyroscope (`DeviceOrientationEvent`) or mouse position. CSS keyframe animations on individual elements. No canvas needed — pure CSS layering.

---

### Phase 3: The Emissary (6-15 seconds)

A character in the scene — the Emissary — turns toward the student. A stylised speech bubble appears with the mission:

*"Ah, you're here! The barista is in a particular mood today. I need your help ordering a hot coffee with milk to take away. Think you can handle it?"*

Key vocabulary highlighted with a soft glow: **café con leche**, **caliente**, **para llevar**.

The target character (barista) pulses with a subtle aura — tap to interact.

**Tech:** Character sprite with CSS animation (turns toward camera). Speech bubble component with Framer Motion entrance. Highlighted vocab with `text-shadow` glow. Target character with pulsing `box-shadow` animation.

---

### Phase 4: The Dialogue (Core Interaction Loop)

Student taps the glowing barista. View zooms slightly toward them.

**Interaction Type A — Voice:**
Microphone icon appears: *"Tap and say: I would like a hot coffee with milk"*

Student speaks. Web Speech API transcribes.
- **Success:** Barista smiles (sprite swap), responds: *"Of course, one moment."* Checkmark animates. Satisfying sound.
- **Partial:** Barista looks confused. Gentle hint: *"Almost! Try: un café con leche, caliente."* Mic prompts again.
- **Fallback:** If Web Speech API isn't available, show text input or tap-to-select options.

**Interaction Type B — Visual Choice:**
Barista asks: *"¿Para aquí o para llevar?"*
Two illustrated objects appear: a ceramic mug and a takeaway cup. Student taps the correct one.
- **Correct:** Barista nods, slides the cup across counter. Fluid animation. Crisp sound effect.
- **Wrong:** Gentle correction, try again.

**Interaction Type C — Word Building:**
Scrambled word tiles the student drags into order to form a sentence.
Tiles are beautifully styled, snap into place with haptic-like animation.

Each episode has 4-6 interactions mixing these types.

**Tech:** Web Speech API (`SpeechRecognition`), Framer Motion for element transitions, sprite state management (idle/happy/confused/speaking), reorder with drag-and-drop (`@dnd-kit/core` or Framer `Reorder`).

---

### Phase 5: The Climax & Reward (after final interaction)

Mission complete. The Emissary returns:

*"Incredible! The barista was so impressed. He told me a secret: the word for freedom is **libertad**. Remember it."*

A bonus vocab word — a gift for completing the episode.

Small tutor icon in the corner. Tap it → plays the original 30-second voice note. The student hears their tutor's voice, connecting the magic to the real person. The tutor sounds like a genius.

**Tech:** Audio playback of original recording (stored as WebM/MP3 from Whisper processing). Tutor avatar component.

---

### Phase 6: The Memory Card

The scene zooms out and transforms into a beautiful tarot-style card:

```
┌─────────────────────┐
│                     │
│   [Scene artwork]   │
│                     │
│   Episode 4:        │
│   The Café          │
│                     │
│   ⭐ 5/6 correct    │
│   🔤 4 new words    │
│   🎙️ 2 spoken       │
│                     │
│   14 Feb 2026       │
└─────────────────────┘
```

This card flies into a timeline: **"Sarah's Journey"**

To the right: a locked card slot with "?" — *"Your next memory awaits."*

Soft CTA: *"Your tutor will unlock the next episode after your next lesson."*

**Tech:** Scene-to-card transition with Framer Motion `layoutId`. Timeline component with horizontal scroll. Card flip animation.

---

## Scene Templates (Reusable)

Each template is a set of layered illustrations + interaction hotspots:

| Template | Lesson Topics | Setting |
|----------|--------------|---------|
| The Café | Food, ordering, greetings, present tense | Sun-drenched Spanish café |
| The Market | Food vocab, numbers, bargaining, quantities | Busy outdoor market |
| The Apartment | Daily routines, past tense, furniture vocab | Cosy flat interior |
| The Station | Travel, directions, future tense, tickets | Train station |
| The Doctor | Body parts, symptoms, formal requests | Clinic waiting room |
| The Party | Introductions, past tense stories, emotions | Rooftop evening gathering |
| The Office | Formal language, email vocab, scheduling | Modern office space |
| The Beach | Weather, activities, present continuous | Coastal scene |
| The Library | Books, knowledge, conditional tense | Atmospheric library |
| The Night Street | Storytelling, past tense, descriptions | Rain-lit evening street |

Each template has:
- 3 parallax layers (background, midground, foreground)
- 1 Emissary character
- 2-3 interactive characters/objects
- Ambient animation definitions
- Interaction hotspot positions

**Scene selection:** LLM picks the best template based on lesson topic, or defaults to The Café for first episode.

---

## AI Generation Pipeline

**Input:** Tutor's 30-second text/voice note

**Step 1: Whisper transcription** (if voice) → raw text

**Step 2: LLM extraction** (one API call, GPT-4o-mini)

```json
{
  "studentName": "Sarah",
  "language": "Spanish",
  "level": "B1",
  "sceneTemplate": "cafe",
  "mission": "Order a hot coffee with milk to take away",
  "emissaryIntro": "The barista is in a particular mood today. I need your help ordering a hot coffee with milk to take away.",
  "vocabulary": [
    { "word": "café con leche", "translation": "coffee with milk", "audio": true },
    { "word": "caliente", "translation": "hot", "audio": true },
    { "word": "para llevar", "translation": "to take away", "audio": true }
  ],
  "bonusWord": { "word": "libertad", "translation": "freedom" },
  "interactions": [
    {
      "type": "voice",
      "prompt": "Say: I would like a hot coffee with milk",
      "targetPhrase": "Quiero un café con leche, por favor",
      "acceptableVariants": ["Me gustaría un café con leche", "Un café con leche por favor"],
      "character": "barista",
      "successResponse": "¡Por supuesto! Un momento.",
      "hintOnFail": "Try: Quiero un café con leche"
    },
    {
      "type": "visualChoice",
      "prompt": "¿Para aquí o para llevar?",
      "options": [
        { "label": "para aquí", "image": "ceramic-mug", "correct": false },
        { "label": "para llevar", "image": "takeaway-cup", "correct": true }
      ],
      "character": "barista",
      "successResponse": "The barista nods and puts the lid on your cup."
    },
    {
      "type": "wordBuild",
      "prompt": "Build the sentence:",
      "targetSentence": "Quiero un café con leche caliente para llevar",
      "scrambledWords": ["llevar", "café", "un", "caliente", "para", "Quiero", "leche", "con"],
      "character": "emissary"
    },
    {
      "type": "voice",
      "prompt": "The barista asks how your day was. Tell them using past tense.",
      "targetPhrase": "Fue un buen día",
      "acceptableVariants": ["Mi día fue bueno", "El día estuvo bien"],
      "character": "barista",
      "successResponse": "¡Me alegro! Here's your coffee.",
      "hintOnFail": "Try: Fue un buen día"
    }
  ]
}
```

---

## Component Architecture

```
components/memory-palace/
├── MemoryPalace.tsx          — Main orchestrator (state machine)
├── ThresholdScreen.tsx       — Keyhole loading animation
├── SceneRenderer.tsx         — Parallax scene with layers + ambient animation
├── Emissary.tsx              — Guide character with speech bubbles
├── InteractionOverlay.tsx    — Renders current interaction type
├── VoiceInteraction.tsx      — Mic button + Web Speech API + feedback
├── VisualChoiceInteraction.tsx — Tap-to-select illustrated options
├── WordBuildInteraction.tsx  — Drag-to-reorder sentence builder
├── CharacterSprite.tsx       — Animated character with states (idle/happy/confused)
├── SpeechBubble.tsx          — Styled dialogue bubble with animations
├── MemoryCard.tsx            — End-of-episode tarot card + stats
├── JourneyTimeline.tsx       — Collection of completed episode cards
├── VocabHighlight.tsx        — Glowing vocabulary word component
├── AmbientSound.tsx          — Web Audio API ambient tones
├── ParallaxLayer.tsx         — Single depth layer with tilt/mouse response
└── scenes/
    ├── cafe/
    │   ├── background.webp
    │   ├── midground.webp
    │   ├── foreground.webp
    │   ├── characters.json    — sprite positions + animation defs
    │   └── hotspots.json      — interactive area positions
    ├── market/
    ├── apartment/
    └── ... (10 scene templates)
```

---

## Routes

```
/r/[id]              — Entry point, loads Memory Palace for this recap
/r/[id]/journey      — Student's card collection / timeline
/recap               — Tutor input page (unchanged)
/api/recap/generate  — POST: generate episode from tutor input
/api/recap/[id]      — GET: fetch episode data
```

---

## Build Priority (Tonight)

### Must-have (the "holy shit" moment):
1. ThresholdScreen (keyhole animation + personalisation)
2. SceneRenderer with one complete scene template (The Café)
3. Emissary with mission briefing
4. At least 2 interaction types (voice + visual choice)
5. MemoryCard with score + journey tease
6. Tutor input page → LLM generation → episode playback

### Nice-to-have:
7. WordBuild interaction (drag to reorder)
8. Ambient sound
9. Parallax tilt (gyroscope)
10. Second scene template (The Market)
11. Journey timeline page

---

## Dependencies

```
framer-motion         — Already installed (animations)
@dnd-kit/core         — For word building drag-and-drop
@dnd-kit/sortable     — Sortable word tiles
howler                — Web Audio playback (ambient sounds, SFX)
```

Everything else is browser-native: Web Speech API, CSS animations, device orientation.
