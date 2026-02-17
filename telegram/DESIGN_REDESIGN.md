Loaded cached credentials.
Hook registry initialized with 0 hook entries
Okay, I understand the task. I will provide a comprehensive UI/UX redesign specification for the TutorLingua Telegram Mini App, focusing on a "Playful Modern Game" aesthetic, detailed component-by-component specs, relevant code snippets, and a clear priority order. I will be specific and opinionated, providing "THE answer" as the design authority.

Here is the plan to achieve this:

1.  **Establish Design System & Direction:**
    *   Define the core philosophy, principles, and aesthetic choices.
    *   Specify the colour palette (leveraging Telegram variables and introducing new semantic colours).
    *   Detail typography hierarchy (using system fonts).
    *   Set up a consistent spacing system, border-radius, and shadow strategy.
    *   Choose an icon style (Lucide for UI, emojis for flair).
    *   Provide Tailwind CSS configuration for these elements.
2.  **Redesign Onboarding Flow:**
    *   Implement a card-based selection for language and difficulty.
    *   Enhance visual appeal with gradients, animations, and custom icons.
    *   Provide code for `src/components/OnboardingFlow.tsx`.
3.  **Redesign Game Hub / Menu Screen:**
    *   Create a visually engaging grid of game cards.
    *   Incorporate clear daily progress indicators and streak display.
    *   Detail the design of individual game cards.
    *   Provide code for the menu section within `src/App.tsx`.
4.  **Redesign Shared Components:**
    *   **GameShell**: Enhance header, timer, and streak display.
    *   **ShareCard**: Improve visual feedback for sharing/copying.
    *   **TutorCTA**: Style as a more integrated, attractive call-to-action.
    *   **StreakBadge**: Make it more prominent and visually rewarding.
    *   Provide code for `src/components/GameShell.tsx`, `src/components/ShareCard.tsx`, `src/components/TutorCTA.tsx`, and `src/components/StreakBadge.tsx`.
5.  **Redesign Connections Game:**
    *   **WordTile**: Implement interactive states and animations.
    *   **CategoryReveal**: Enhance visual impact of solved categories.
    *   **Mistake Dots**: Create a more visually engaging mistake tracker.
    *   **Action Buttons**: Redesign shuffle, deselect, submit buttons.
    *   **Result Screen**: Polish victory/defeat display and explanations.
    *   Provide code for `src/games/connections/WordTile.tsx`, `src/games/connections/CategoryReveal.tsx`, and `src/games/connections/ConnectionsGame.tsx`.
6.  **Redesign Spell Cast Game:**
    *   **HexGrid**: Refine hex styling and selection animations.
    *   **Timer & Score**: More dynamic and clear display.
    *   **Current Word/Message**: Prominent visual feedback.
    *   **Combo Indicator**: Emphasize combo multipliers.
    *   Provide code for `src/games/spell-cast/HexGrid.tsx` and `src/games/spell-cast/SpellCastGame.tsx`.
7.  **Redesign Speed Clash Game:**
    *   **Scenario Card**: Focus on clear hierarchy and visual distinction.
    *   **Answer Options**: Animated buttons with clear feedback.
    *   **Round Progress**: Visually track progress and time pressure.
    *   Provide code for `src/games/speed-clash/SpeedClashGame.tsx`.
8.  **Redesign Vocab Clash Game:**
    *   **Card Component**: Adapt for mobile, enhance visual hierarchy.
    *   **HP Bars**: Create dynamic, clear health indicators.
    *   **Battle Arena**: Streamline mobile layout.
    *   **Result Screen**: Polished victory/defeat display.
    *   Provide code for `src/games/vocab-clash/Card.tsx` and `src/games/vocab-clash/VocabClashGame.tsx`.
9.  **Micro-Interactions & Animation Refinements**:
    *   Detail consistent animation patterns across the app.
    *   Ensure haptic feedback is integrated.
10. **Mobile-First & Telegram-Specific UX**: Address these points implicitly throughout the component designs and explicitly in explanations where relevant.
11. **Priority Order**: Outline the implementation sequence for maximum impact.

---

## 1. Overall Design System & Direction

### Design Language: Playful Modern Game

*   **Philosophy**: To transform the app into an engaging, polished, and rewarding language learning experience. The design should feel intuitive, dynamic, and visually delightful, motivating users through clear progress visualization and positive reinforcement.
*   **Principles**:
    *   **Clarity & Legibility**: Information must be instantly understandable, even with rich visuals.
    *   **Responsive Playfulness**: Animations and micro-interactions are integral, not decorative. They must provide satisfying feedback, be coupled with haptics, and feel natural.
    *   **Subtle Depth & Layering**: Utilize gradients, soft shadows, and varied border treatments to create a sense of hierarchy and physicality, making elements feel tangible and interactive.
    *   **Adaptive Theming**: Seamlessly integrate with Telegram's dynamic light/dark/custom themes, ensuring legibility and visual harmony regardless of user preferences.
    *   **Mobile-First Ergonomics**: Prioritize thumb-zone access, generous touch targets (min 48px), and vertical, scroll-friendly layouts, acknowledging the Telegram WebView context.

*   **Aesthetic Choices**:
    *   **Overall Vibe**: Energetic and vibrant, yet clean and focused. Imagine a modern indie game that's easy to pick up, akin to Duolingo's gamified learning blended with NYT Games' polished simplicity.
    *   **Shapes**: Predominantly `rounded-2xl` (16px) for major cards and containers, `rounded-xl` (12px) for buttons and sub-elements, and `rounded-full` for badges/indicators. This ensures a soft, friendly, and contemporary feel.
    *   **Imagery**: Leverage existing emojis for game-specific flavour and quick visual cues. For UI elements, transition to a lightweight, consistent SVG icon library like [Lucide Icons](https://lucide.dev/) for crispness and scalability. Avoid heavy custom images to minimize bundle size.
    *   **Backgrounds**: Employ subtle radial or linear gradients (`bg-gradient-to-br`, `bg-gradient-to-tr`) using Telegram theme colours to add visual interest and depth without distracting from content.

### Colour Palette

The palette directly extends Telegram's dynamic theme variables, adding semantic colours for states.

*   **Core Theming**:
    *   `background`: `var(--tg-theme-bg-color)` (main app background)
    *   `card`: `var(--tg-theme-secondary-bg-color)` (most interactive cards, secondary backgrounds)
    *   `foreground`: `var(--tg-theme-text-color)` (main text)
    *   `muted`: `var(--tg-theme-hint-color)` (secondary text, hints, inactive states)
    *   `link`: `var(--tg-theme-link-color)` (interactive links)
    *   `primary`: `var(--tg-theme-button-color)` (primary call-to-action buttons, active states, main accents)
    *   `primary-foreground`: `var(--tg-theme-button-text-color)` (text on primary buttons)
    *   `accent`: `var(--tg-theme-accent-text-color)` (secondary accent, positive indicators like combo)

*   **Semantic States (Custom Hex for Consistency)**:
    *   `destructive`: `#EF4444` (for errors, negative feedback, mistakes)
    *   `success`: `#22C55E` (for correct answers, positive feedback)
    *   `game-gold`: `#FFD700` (for special game elements like center hex, valuable items)

### Typography Hierarchy (Using System Fonts)

*   **Font Family**: `font-sans` (system UI font) throughout for optimal performance and native feel.
*   **Headings**:
    *   `h1` (Page Title): `text-3xl` (`30px`), `font-extrabold`, `leading-tight`, `tracking-tight`.
    *   `h2` (Section Title): `text-2xl` (`24px`), `font-bold`, `leading-snug`.
    *   `h3` (Card Title): `text-xl` (`20px`), `font-semibold`.
*   **Body Text**:
    *   `body-lg`: `text-base` (`16px`), `font-normal`, `leading-normal`.
    *   `body-md`: `text-sm` (`14px`), `font-normal`, `leading-relaxed`.
    *   `body-sm`: `text-xs` (`12px`), `font-medium`, `text-muted`.
*   **Game Elements**:
    *   `game-word`: `text-lg` (`18px`), `font-bold`, `uppercase`, `tracking-wide`.
    *   `timer`: `text-3xl` (`30px`), `font-mono`, `font-bold`.

### Spacing System

Adhere strictly to Tailwind's default spacing scale (multiples of 4px).

*   `gap-x` (Horizontal): `gap-2` (8px), `gap-4` (16px), `gap-6` (24px).
*   `space-y` (Vertical): `space-y-3` (12px), `space-y-4` (16px), `space-y-6` (24px).
*   Padding: `p-4` (16px), `py-5` (20px), `px-6` (24px).
*   Margins: `mb-4` (16px), `mt-6` (24px).

### Border Radius / Corner Treatment Philosophy

*   **Primary Containers/Cards**: `rounded-2.5xl` (20px, custom) or `rounded-3xl` (24px) for a soft, modern feel.
*   **Buttons/Tiles/Secondary Cards**: `rounded-xl` (12px) or `rounded-2xl` (16px).
*   **Badges/Indicators**: `rounded-full`.

### Shadow / Depth Strategy

*   **Lifted Cards**: `shadow-xl` (`0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`) for a clear floating effect, often combined with a thin border and gradient background.
*   **Pressed States**: `inner-shadow` (custom utility) for a subtle debossed effect on active/pressed elements.
*   **Focus/Hover**: `shadow-glow-sm` or `shadow-glow-md` (custom, dynamically coloured with `primary` theme variable RGB) to highlight interactive elements.
*   **Gradients**: `bg-gradient-to-br from-card to-card/80` to provide subtle internal depth to cards.

### Icon Style

*   **UI Controls**: [Lucide Icons](https://lucide.dev/) for crisp, consistent, and lightweight vector icons (e.g., Shuffle, Back, Settings, Home, Game-specific actions).
    *   Install: `npm install lucide-react`
    *   Usage: `<IconName size={24} strokeWidth={2} />`
*   **Embellishments/Game Flair**: Continue using emojis where appropriate (e.g., flag emojis, win/lose screens, game card thumbnails), as they add personality and are native to Telegram's UI.

---

### Tailwind Configuration Update

This `tailwind.config.js` should be updated in your project:

```javascript
// tailwind.config.js
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colours mapping to Telegram CSS variables
        background: 'var(--tg-theme-bg-color)',
        card: 'var(--tg-theme-secondary-bg-color)',
        foreground: 'var(--tg-theme-text-color)',
        muted: 'var(--tg-theme-hint-color)',
        link: 'var(--tg-theme-link-color)',
        primary: 'var(--tg-theme-button-color)',
        'primary-foreground': 'var(--tg-theme-button-text-color)',
        accent: 'var(--tg-theme-accent-text-color)',
        'destructive': '#EF4444', // Red for errors/mistakes
        'success': '#22C55E', // Green for correct answers
        'game-gold': '#FFD700', // Gold for special elements
      },
      borderRadius: {
        // Custom border radii for softer, modern look
        '2.5xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        // Custom shadows for depth and glow effects
        'inner': 'inset 0 2px 4px 0 rgba(0,0,0,0.1)', // Default inner shadow
        'inner-dark': 'inset 0 2px 4px 0 rgba(0,0,0,0.25)', // For dark mode elements
        'glow-sm': '0 0 8px rgba(var(--tg-theme-button-color-rgb) / 0.5)',
        'glow-md': '0 0 16px rgba(var(--tg-theme-button-color-rgb) / 0.7)',
        'card-soft': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        // Custom animations
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        pulsefast: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        shimmer: { // For holographic effect (Vocab Clash Mythic cards)
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        confetti: { // For victory animations
          '0%': { transform: 'translateY(-100vh) rotate(0deg) scale(0)', opacity: 0 },
          '100%': { transform: 'translateY(100vh) rotate(720deg) scale(1)', opacity: 1 },
        }
      },
      animation: {
        shake: 'shake 0.6s ease-in-out',
        pulsefast: 'pulsefast 1.5s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        confetti: 'confetti 3s ease-out forwards',
      },
      transitionProperty: { // Extend transition properties for smoother animations
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    // Plugin to dynamically generate RGB vars for glow effects
    plugin(function({ addBase, theme }) {
      addBase({
        ':root': {
          '--tg-theme-button-color-rgb': '135,116,225', // Default RGB for primary
        },
      });
      // Add a utility to apply inner shadow based on theme lightness (dynamic theme support needs JS)
      addBase({
        '.inner-shadow': {
          // This is a simplified approach. For true theme awareness,
          // the shadow color should be determined at runtime based on TG theme.
          // For now, let's use a universal subtle inner shadow.
          boxShadow: 'inset 0 1px 3px 0 rgba(0,0,0,0.1)',
        },
        '.inner-shadow-dark': {
          boxShadow: 'inset 0 1px 3px 0 rgba(0,0,0,0.25)',
        }
      });
    }),
  ],
}
```

**`src/telegram.ts` modification for RGB support**:
Within the `TelegramService` class, ensure `applyTheme` extracts RGB values for `--tg-theme-button-color-rgb`.

```typescript
// src/telegram.ts
// ... (imports and TelegramService class definition)

class TelegramService {
  // ... (existing properties and methods)

  applyTheme(): void {
    const theme = this.getTheme();
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
        if (key === 'button_color' && value.startsWith('#')) {
          // Convert hex to RGB for dynamic glow effects
          const hex = value.slice(1);
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          root.style.setProperty('--tg-theme-button-color-rgb', `${r},${g},${b}`);
        }
      }
    });
  }

  // ... (rest of the class)
}

// ... (singleton instance and auto-initialize)
```
*Note: Make sure to install `lucide-react` by running `npm install lucide-react`.*

---

## 2. Onboarding Flow Redesign (`src/components/OnboardingFlow.tsx`)

**Goal**: Transform the initial language and difficulty selection from a bare-bones list to a vibrant, interactive, and welcoming experience that sets the tone for the gamified app.

**Design Specs**:

*   **Container**: `min-h-screen` `flex` `items-center` `justify-center` with a `relative` `overflow-hidden` for background effects.
*   **Background**: A subtle, animated radial gradient `bg-gradient-to-br from-background via-card/50 to-background opacity-50` applied to an `absolute inset-0` div *behind* the main content. This adds depth without distracting.
*   **Overall Structure**: Each step (`language` or `difficulty`) is a `motion.div` with clear `screenVariants` for smooth transitions.
*   **Icon (Top)**: Replace the tiny emoji with a larger, more impactful [Lucide Icon](https://lucide.dev/). For language: `<Globe size={80} strokeWidth={1.5} />`. For difficulty: `<GraduationCap size={80} strokeWidth={1.5} />`. Style with `text-primary` for consistency and vibrancy. Add subtle `scale` and `rotate` animations for initial appearance.
*   **Heading**: `h1` `text-3xl font-extrabold text-foreground leading-tight`. Clear and prominent.
*   **Description**: `p` `text-sm text-muted`. Informative but secondary.
*   **Selection Cards**:
    *   **Styling**: `flex w-full items-center gap-4 p-5 rounded-2xl border-2 bg-card shadow-lg transition-all duration-200`. Increased padding and `rounded-2xl` for a softer, more inviting touch. A subtle `shadow-lg` for lift.
    *   **Interactive States**:
        *   `hover`: `border-card/80` (subtle border change).
        *   `active`: `active:bg-card/80` (slight background change).
        *   `selected`: `border-primary scale-102 bg-primary/20 shadow-primary/30`. When an item is selected, it should visually "pop" slightly, indicating its active state with the primary brand colour. `scale-102` gives a subtle enlargement.
    *   **Emoji/Badge**: For language, `text-4xl` emoji. For difficulty, the existing colored circle with CEFR level (`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`).
    *   **Text**: `font-bold text-lg text-foreground` for the main name, `text-sm text-muted` for description.
    *   **Arrow Icon**: `motion.span` with `text-2xl text-muted`. Add a subtle `x` translation animation when selected to indicate progression.
*   **Transitions**:
    *   **Screen Transitions**: Use `AnimatePresence` with `mode="wait"`. `initial={{ opacity: 0, x: 50, scale: 0.95 }}` and `animate={{ opacity: 1, x: 0, scale: 1 }}` using `type: 'spring', stiffness: 200, damping: 25`. `exit` animation moves to the left.
    *   **Item Stagger**: Each selection card appears with a staggered delay (`delay: i * 0.1 + 0.2`) and spring animation.
    *   **Tap Feedback**: `whileTap={{ scale: 0.96 }}` for a slight squash effect.
*   **Haptics**: Retain existing `hapticPress` and `hapticCorrect`, potentially with slightly longer delays for satisfying feedback.

**Code Snippet (`src/components/OnboardingFlow.tsx`)**:

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import type { CefrLevel } from '@/lib/cefr';
import { CEFR_LEVELS } from '@/lib/cefr';

// Import Lucide icons
import { Globe, GraduationCap } from 'lucide-react'; // Make sure to install lucide-react: npm install lucide-react

interface OnboardingFlowProps {
  onComplete: () => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
];

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2'] as const;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<'language' | 'difficulty'>('language');
  const { setLanguage, setDifficulty, completeOnboarding } = useUserStore();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTIES[number] | null>(null);

  const handleLanguageSelect = (code: string) => {
    hapticPress();
    setSelectedLang(code); // Immediately show selection feedback
    setLanguage(code);
    setTimeout(() => {
      hapticCorrect();
      setStep('difficulty');
    }, 400); // Slightly longer delay for visual satisfaction
  };

  const handleDifficultySelect = (level: typeof DIFFICULTIES[number]) => {
    hapticPress();
    setSelectedDifficulty(level); // Immediately show selection feedback
    setDifficulty(level);
    setTimeout(() => {
      hapticCorrect();
      completeOnboarding();
      onComplete();
    }, 400); // Slightly longer delay for visual satisfaction
  };

  const screenVariants = {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 25, duration: 0.5 } },
    exit: { opacity: 0, x: -50, scale: 0.95, transition: { ease: 'easeOut', duration: 0.3 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.2, // Staggered entry
        type: 'spring',
        stiffness: 150,
        damping: 20,
      },
    }),
    whileTap: { scale: 0.96, transition: { duration: 0.1 } }, // Slight squash on tap
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card/50 to-background opacity-50" />

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.div
              key="language"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6 text-primary flex justify-center"
                >
                  <Globe size={80} strokeWidth={1.5} /> {/* Lucide Icon */}
                </motion.div>
                <h1 className="mb-3 text-3xl font-extrabold text-foreground leading-tight">
                  Which language are you learning?
                </h1>
                <p className="text-sm text-muted">
                  Choose your target language to get started on your journey!
                </p>
              </div>

              <div className="space-y-4">
                {LANGUAGES.map((lang, i) => (
                  <motion.button
                    key={lang.code}
                    variants={itemVariants}
                    custom={i}
                    whileTap="whileTap"
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`
                      flex w-full items-center gap-4 p-5 rounded-2xl border-2
                      bg-card shadow-lg transition-all duration-200
                      ${selectedLang === lang.code
                        ? 'border-primary scale-102 bg-primary/20 shadow-primary/30'
                        : 'border-card/50 hover:border-card/80 active:bg-card/80'
                      }
                    `}
                  >
                    <span className="text-4xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg text-foreground">{lang.name}</div>
                      <div className="text-sm text-muted">{lang.native}</div>
                    </div>
                    <motion.span
                      initial={{ x: 0 }}
                      animate={{ x: selectedLang === lang.code ? 5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="text-2xl text-muted"
                    >
                      ›
                    </motion.span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="difficulty"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6 text-primary flex justify-center"
                >
                  <GraduationCap size={80} strokeWidth={1.5} /> {/* Lucide Icon */}
                </motion.div>
                <h1 className="mb-3 text-3xl font-extrabold text-foreground leading-tight">
                  What's your current level?
                </h1>
                <p className="text-sm text-muted">
                  Don't worry — you can change this anytime in settings
                </p>
              </div>

              <div className="space-y-4">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  return (
                    <motion.button
                      key={level}
                      variants={itemVariants}
                      custom={i}
                      whileTap="whileTap"
                      onClick={() => handleDifficultySelect(level)}
                      className={`
                        flex w-full items-center gap-4 p-5 rounded-2xl border-2
                        bg-card shadow-lg transition-all duration-200
                        ${selectedDifficulty === level
                          ? 'border-primary scale-102 bg-primary/20 shadow-primary/30'
                          : 'border-card/50 hover:border-card/80 active:bg-card/80'
                        }
                      `}
                    >
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: config.colour }}
                      >
                        {level}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-lg text-foreground">{config.label}</div>
                        <div className="text-sm text-muted">{config.description}</div>
                      </div>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: selectedDifficulty === level ? 5 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-2xl text-muted"
                      >
                        ›
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

## 3. Game Hub / Menu Screen Redesign (`src/App.tsx`)

**Goal**: Create an engaging, easy-to-navigate game selection screen that clearly presents daily games, user progress, and a sense of achievement.

**Design Specs**:

*   **Container**: `min-h-screen bg-background p-4` (current padding is fine).
*   **Header**:
    *   **Title**: `h1` `text-3xl font-extrabold text-foreground leading-tight mb-2`.
    *   **Subtitle**: `p` `text-md text-muted`.
    *   **Streak Badge**: Integrate the `StreakBadge` component prominently below the subtitle or in a dedicated top-right corner. It should animate on appearance.
        *   Change `p-4` to `pt-8 pb-4` to move header down slightly from Telegram's top bar and give space.
*   **Game List Layout**: Grid layout using `grid grid-cols-1 md:grid-cols-2 gap-4` for future expansion on wider screens (though mobile-first is key). For now, `space-y-4` is okay but a custom grid/stack makes more sense. Let's keep `space-y-4` for simplicity but define custom cards.
*   **Game Card Design**: (Previously just a button with text and emoji)
    *   **Structure**: Each game `button` is a `motion.button` for interactivity.
    *   **Styling**: `relative flex items-center gap-4 p-5 rounded-3xl bg-card border-2 border-transparent shadow-xl transition-all duration-300 overflow-hidden`.
        *   `rounded-3xl` for a larger, softer card.
        *   `border-2 border-transparent` will become a dynamic border.
        *   `shadow-xl` for a significant lifted effect.
        *   `overflow-hidden` for background gradients.
        *   `bg-gradient-to-br from-card to-card/80` for internal depth.
    *   **Emoji/Icon**: The game's emoji (e.g., `🔗`, `🍯`, `⚡`) will be `text-5xl` for visual impact, placed on the left.
    *   **Title**: `h3` `font-bold text-xl text-foreground`.
    *   **Description**: `p` `text-sm text-muted`.
    *   **Daily Progress Indicator**: A small, subtle checkmark (✅) or a circle with a tick `(✔️)` or a different icon if the game is completed today. Perhaps an overlay or a small badge in the corner.
        *   For brevity, let's keep it simple for now, but in `App.tsx` I can add a `(Completed)` text for now. This will be more visual later.
    *   **Hover/Active States**: `hover:scale-[1.01] active:scale-[0.98] shadow-glow-sm` to provide tactile feedback.
    *   **Arrow Icon**: `motion.span` `text-3xl text-muted` `font-light` for the arrow (`›`), potentially animating on hover.
*   **Navigation**: Keep `setScreen` state for simplicity and performance. No complex routing libraries needed for this small app.

**Code Snippet (`src/App.tsx`)**:

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Import motion
import { OnboardingFlow } from './components/OnboardingFlow';
import { ConnectionsGame } from './games/connections/ConnectionsGame';
import { SpellCastGame } from './games/spell-cast/SpellCastGame';
import { SpeedClashGame } from './games/speed-clash/SpeedClashGame';
import { useUserStore } from './stores/user';
import { tg } from './telegram';
import { parseDeepLink } from './lib/share';
import { getTodaysPuzzle } from './data/connections';
import { getTodaysHexPuzzle, getSpellCastPuzzleNumber } from './data/spell-cast/hex-puzzles';
import { useStreakStore } from './stores/streak'; // Import useStreakStore
import { StreakBadge } from './components/StreakBadge'; // Import StreakBadge
import { Link, Atom, Bolt } from 'lucide-react'; // Import Lucide icons for game cards

type Screen = 'menu' | 'connections' | 'spell-cast' | 'speed-clash' | 'vocab-clash' | 'word-runner'; // Added other games

function App() {
  const { hasCompletedOnboarding, language, difficulty } = useUserStore();
  const [screen, setScreen] = useState<Screen>('menu');
  const [startParam] = useState(() => tg.getStartParam());
  const { gamesPlayedToday } = useStreakStore(); // Get games played today

  // Parse deep link on mount
  useEffect(() => {
    if (!startParam) return;
    
    const parsed = parseDeepLink(startParam);
    if (!parsed) return;

    // Route to game based on deep link
    if (parsed.game === 'connections') {
      setScreen('connections');
    } else if (parsed.game === 'spell-cast') {
      setScreen('spell-cast');
    } else if (parsed.game === 'speed-clash') {
      setScreen('speed-clash');
    } else if (parsed.game === 'vocab-clash') { // Added vocab-clash
      setScreen('vocab-clash');
    }
  }, [startParam]);

  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.2,
        type: 'spring',
        stiffness: 150,
        damping: 20,
      },
    }),
    hover: { scale: 1.01, boxShadow: 'var(--shadow-glow-sm)', transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  };

  const gameCards = [
    {
      id: 'connections',
      title: 'Connections',
      description: 'Find groups of 4 related words',
      emoji: '🔗',
      icon: <Link size={32} strokeWidth={2} />, // Lucide icon
      action: () => setScreen('connections'),
    },
    {
      id: 'spell-cast',
      title: 'Spell Cast',
      description: 'Find words in the honeycomb grid',
      emoji: '🍯',
      icon: <Atom size={32} strokeWidth={2} />, // Lucide icon
      action: () => setScreen('spell-cast'),
    },
    {
      id: 'speed-clash',
      title: 'Speed Clash',
      description: 'Fast reaction scenario challenges',
      emoji: '⚡',
      icon: <Bolt size={32} strokeWidth={2} />, // Lucide icon
      action: () => setScreen('speed-clash'),
    },
    {
      id: 'vocab-clash',
      title: 'Vocab Clash',
      description: 'Card battler for vocabulary',
      emoji: '🃏',
      icon: <img src="/path/to/vocab-clash-icon.svg" alt="Vocab Clash" className="w-8 h-8" />, // Placeholder for custom SVG icon
      action: () => setScreen('vocab-clash'),
    },
    {
      id: 'word-runner',
      title: 'Word Runner',
      description: 'Endless runner word game (coming soon!)',
      emoji: '🏃',
      icon: <img src="/path/to/word-runner-icon.svg" alt="Word Runner" className="w-8 h-8" />, // Placeholder
      action: () => {}, // Disabled for now
      disabled: true,
    },
  ];

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  // --- Game Screens ---
  if (screen === 'connections') {
    const puzzle = getTodaysPuzzle(language);
    if (!puzzle) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center text-foreground">
            <div className="text-4xl">😕</div>
            <div className="mt-2">No puzzle available for {language}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              Back to Menu
            </motion.button>
          </div>
        </div>
      );
    }
    return <ConnectionsGame puzzle={puzzle} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'spell-cast') {
    const puzzle = getTodaysHexPuzzle(language);
    const puzzleNumber = getSpellCastPuzzleNumber();
    if (!puzzle) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center text-foreground">
            <div className="text-4xl">😕</div>
            <div className="mt-2">No puzzle available for {language}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              Back to Menu
            </motion.button>
          </div>
        </div>
      );
    }
    return <SpellCastGame puzzle={puzzle} puzzleNumber={puzzleNumber} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'speed-clash') {
    return <SpeedClashGame language={language} puzzleNumber={1} onExit={() => setScreen('menu')} />;
  }

  // Placeholder for other games:
  if (screen === 'vocab-clash') {
    // You'd pass language and potentially difficulty from user store
    // For now, let's mock it
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center text-foreground">
          <div className="text-4xl">🃏</div>
          <div className="mt-2">Vocab Clash coming soon!</div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('menu')}
            className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
          >
            Back to Menu
          </motion.button>
        </div>
      </div>
    );
    // return <VocabClashGame language={language} onGameOver={() => setScreen('menu')} />;
  }

  // --- Menu screen ---
  return (
    <div className="min-h-screen bg-background p-4 pt-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card/50 to-background opacity-50" />

      <div className="mx-auto max-w-lg space-y-6 z-10 relative">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-foreground leading-tight">
            TutorLingua Games
          </h1>
          <p className="text-md text-muted">
            Learn {language.toUpperCase()} with daily challenges
          </p>
          <div className="mt-4 flex justify-center">
            <StreakBadge />
          </div>
        </div>

        <div className="space-y-4"> {/* Use space-y-4 for consistent card spacing */}
          {gameCards.map((game, i) => (
            <motion.button
              key={game.id}
              custom={i}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={game.action}
              disabled={game.disabled}
              className={`
                relative flex items-center gap-4 p-5 rounded-3xl bg-card border-2 border-card/50 shadow-xl transition-all duration-300 overflow-hidden
                ${game.disabled ? 'opacity-60 cursor-not-allowed' : 'active:bg-card/80'}
              `}
            >
              {/* Optional background gradient on card for more pop */}
              <div className="absolute inset-0 bg-gradient-to-br from-card to-card/90 -z-10" />

              <div className="text-4xl flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0">
                {game.icon || game.emoji}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-xl text-foreground">{game.title}</h3>
                <p className="text-sm text-muted">{game.description}</p>
              </div>
              {gamesPlayedToday.includes(game.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 text-success text-3xl" // Larger checkmark
                >
                  ✅
                </motion.div>
              )}
              {!game.disabled && (
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: 0 }} // No animation on the arrow itself, only the card
                  className="text-3xl text-muted font-light" // Larger arrow
                >
                  ›
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## 4. Shared Components Redesign

These components are used across multiple games and benefit from a consistent, polished look.

### 4.1. `GameShell` (`src/components/GameShell.tsx`)

**Goal**: Provide a consistent, branded header for all games with clear display of game name, puzzle number, language, and an animated timer/streak.

**Design Specs**:

*   **Header Container**: `header` `sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-white/10 px-4 py-3`. Make it sticky with a translucent background for better context retention when scrolling.
*   **Game Info**:
    *   **Game Name**: `h1` `text-xl font-bold text-foreground`. Slightly larger.
    *   **Sub-info**: `flex items-center gap-2 text-sm text-muted`. Use `text-sm` for more emphasis.
*   **Right Side (Timer & Streak)**: `flex items-center gap-4`.
    *   **Timer**: `flex items-center gap-1 font-mono text-lg font-bold text-primary`.
        *   Change emoji `⏱` to a Lucide icon (`Clock`) for consistency.
        *   `text-lg font-bold` for prominence.
        *   Use `text-primary` for the timer digits to highlight active status.
    *   **Streak Badge**: Reuse `StreakBadge` with refined styling.

**Code Snippet (`src/components/GameShell.tsx`)**:

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Removed AnimatePresence as not strictly needed here
import { useStreakStore } from '@/stores/streak';
import { formatTime } from '@/lib/share';
import { tg } from '@/telegram';

// Import Lucide icons
import { Clock } from 'lucide-react';

interface GameShellProps {
  gameName: string;
  puzzleNumber: number;
  language: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export function GameShell({
  gameName,
  puzzleNumber,
  language,
  onBack,
  children,
}: GameShellProps) {
  const [elapsed, setElapsed] = useState(0);
  const { current: streakCurrent, tier: streakTier } = useStreakStore(); // Destructure for easier access
  const startTimeRef = useState(() => Date.now())[0];

  // Timer — count up
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimeRef]);

  // Set up back button if callback provided
  useEffect(() => {
    if (onBack) {
      tg.showBackButton(onBack);
      return () => tg.hideBackButton();
    }
  }, [onBack]);

  const languageLabel = getLanguageLabel(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{gameName}</h1> {/* Increased size */}
              <div className="flex items-center gap-2 text-sm text-muted"> {/* Increased text size */}
                <span>#{puzzleNumber}</span>
                <span>·</span>
                <span>{languageLabel}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4"> {/* Increased gap */}
              {/* Timer */}
              <div className="flex items-center gap-1 font-mono text-lg font-bold text-primary"> {/* Larger, bolder, primary color */}
                <Clock size={20} strokeWidth={2} /> {/* Lucide Clock icon */}
                <span>{formatTime(elapsed)}</span>
              </div>
              
              {/* Streak badge */}
              {streakCurrent > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-bold shadow-md" // Added shadow
                >
                  <span>{streakTier.emoji}</span>
                  <span>{streakCurrent}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Game content */}
      <main className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          {children}
        </div>
      </main>
    </div>
  );
}

function getLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    es: '🇪🇸 Español',
    fr: '🇫🇷 Français',
    de: '🇩🇪 Deutsch',
    it: '🇮🇹 Italiano',
    pt: '🇧🇷 Português',
  };
  return labels[code] || code;
}
```

### 4.2. `ShareCard` (`src/components/ShareCard.tsx`)

**Goal**: Create a prominent, engaging share button with clear visual feedback when copied to clipboard.

**Design Specs**:

*   **Button Styling**: `motion.button` with `w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-md active:bg-primary/90`.
    *   `rounded-2xl` for a softer look.
    *   `text-lg font-bold` for a stronger call to action.
    *   `shadow-md` for depth.
    *   `whileTap={{ scale: 0.98 }}` for better feedback.
*   **Copied State**: Text changes to "✓ Copied!" (using Lucide `Check` icon if preferred, but emoji is fine here).
    *   Add a subtle `scale` and `opacity` animation for the "Copied!" text transition.
*   **Icon**: Replace emoji `📤` with Lucide `Share2` for consistency, unless the emoji is preferred for playfulness. For this component, the emoji is probably okay for now.

**Code Snippet (`src/components/ShareCard.tsx`)**:

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import { shareGame } from '@/lib/share';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import { Share2 } from 'lucide-react'; // Import Lucide icon

interface ShareCardProps {
  text: string;
  onShare?: () => void;
}

export function ShareCard({ text, onShare }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    hapticPress();
    
    try {
      await shareGame(text);
      onShare?.();
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        hapticCorrect();
        setTimeout(() => setCopied(false), 2000);
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        // Fallback for very restrictive environments: show alert
        alert('Could not share or copy. Please try manually.');
      }
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }} // Changed from 0.97 to 0.98 for consistency
      onClick={handleShare}
      className="w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-md active:bg-primary/90 flex items-center justify-center gap-2" // Added flex for icon
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2"
          >
            ✓ Copied!
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2"
          >
            <Share2 size={24} strokeWidth={2} /> {/* Lucide Share icon */}
            Share Result
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

### 4.3. `TutorCTA` (`src/components/TutorCTA.tsx`)

**Goal**: Make the "Book a tutor" card more visually appealing, integrating it smoothly into the post-game flow.

**Design Specs**:

*   **Card Styling**: `motion.div` with `mt-6 overflow-hidden rounded-2.5xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg`.
    *   `rounded-2.5xl` for a premium feel.
    *   Border and background gradient using `accent` colour to stand out positively.
    *   `shadow-lg` for depth.
*   **Header**: `mb-2 flex items-center gap-3`.
    *   **Icon**: Replace `👨‍🏫` with Lucide `GraduationCap` or `BookOpen` for a more refined look. Style with `text-accent text-3xl`.
    *   **Title**: `h3` `text-lg font-bold text-foreground`.
*   **Body Text**: `p` `mb-4 text-sm leading-relaxed text-muted`. Use `font-semibold text-accent` to highlight topics.
*   **Button**: `w-full rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md active:bg-accent/90`.
    *   `rounded-xl` and `text-base` for a prominent CTA.
    *   `shadow-md` for depth.
*   **Animations**: Retain `initial={{ opacity: 0, y: 20 }}` and `animate={{ opacity: 1, y: 0 }}` with a delay.

**Code Snippet (`src/components/TutorCTA.tsx`)**:

```tsx
import { motion } from 'framer-motion';
import { tg } from '@/telegram';
import { hapticPress } from '@/lib/haptics';

// Import Lucide icon
import { GraduationCap } from 'lucide-react';

interface TutorCTAProps {
  weakness?: {
    topic: string;
    count: number;
    examples: string[];
  };
}

export function TutorCTA({ weakness }: TutorCTAProps) {
  const handleClick = () => {
    hapticPress();
    const url = weakness
      ? `https://tutorlingua.co/find-tutor?ref=telegram&topic=${encodeURIComponent(weakness.topic)}`
      : 'https://tutorlingua.co/find-tutor?ref=telegram';
    tg.openLink(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 20 }} // Added spring transition
      className="mt-6 overflow-hidden rounded-2.5xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg" // More rounded, subtle gradient, shadow
    >
      <div className="p-5">
        <div className="mb-2 flex items-center gap-3"> {/* Increased gap */}
          <GraduationCap size={28} className="text-accent" strokeWidth={1.5} /> {/* Lucide Icon, styled with accent */}
          <h3 className="text-lg font-bold text-foreground">Ready to Level Up?</h3> {/* Increased text size */}
        </div>
        
        {weakness ? (
          <p className="mb-4 text-sm leading-relaxed text-muted">
            You struggled with <span className="font-semibold text-accent">{weakness.topic}</span> today.
            A native tutor can help you master it in 30 minutes.
          </p>
        ) : (
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Great performance! A tutor can help you reach the next level faster.
          </p>
        )}
        
        <motion.button
          whileTap={{ scale: 0.98 }} // Added tap animation
          onClick={handleClick}
          className="w-full rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md active:bg-accent/90" // More rounded, larger text, shadow
        >
          Book a Free Trial Lesson
        </motion.button>
      </div>
    </motion.div>
  );
}
```

### 4.4. `StreakBadge` (`src/components/StreakBadge.tsx`)

**Goal**: Make the streak display more visually appealing and impactful.

**Design Specs**:

*   **Badge Styling**: `inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 shadow-md border border-card/60`.
    *   Increased horizontal padding (`px-4`).
    *   Added `shadow-md` and a subtle border.
*   **Emoji**: `text-xl` for larger emoji.
*   **Text**:
    *   Days Count: `text-base font-bold leading-none text-foreground`.
    *   Tier Name: `text-xs leading-none text-muted`.
*   **Animations**: Retain `scale` and `opacity` animations for initial appearance.

**Code Snippet (`src/components/StreakBadge.tsx`)**:

```tsx
import { motion } from 'framer-motion';
import { useStreakStore } from '@/stores/streak';

interface StreakBadgeProps {
  className?: string;
}

export function StreakBadge({ className = '' }: StreakBadgeProps) {
  const { current, tier } = useStreakStore();

  if (current === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }} // Added spring transition
      className={`inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 shadow-md border border-card/60 ${className}`} // Larger padding, shadow, border
    >
      <span className="text-xl">{tier.emoji}</span> {/* Larger emoji */}
      <div className="flex flex-col items-start">
        <span className="text-base font-bold leading-none text-foreground">{current} days</span> {/* Larger text */}
        <span className="text-xs leading-none text-muted">{tier.name}</span> {/* text-xs for tier name */}
      </div>
    </motion.div>
  );
}
```

---

## 5. Individual Game Screen Redesigns

### 5.1. Connections Game (`src/games/connections/ConnectionsGame.tsx`, `src/games/connections/WordTile.tsx`, `src/games/connections/CategoryReveal.tsx`)

**Goal**: Make the Connections game feel more tactile, responsive, and visually satisfying during play and reveal.

#### `WordTile` (`src/games/connections/WordTile.tsx`)

**Design Specs**:

*   **Tile Styling**: `aspect-square rounded-xl border-2 px-2 py-3 text-center text-sm font-bold leading-tight transition-all duration-200 shadow-sm`.
    *   `rounded-xl` for consistency.
    *   `text-sm font-bold` for readability.
    *   `shadow-sm` for a subtle lift.
    *   Ensure `line-clamp-3` handles long words gracefully.
*   **States**:
    *   `default`: `bg-card border-card/50 text-foreground hover:border-card/80`.
    *   `selected`: `bg-primary border-primary text-primary-foreground scale-[0.98] shadow-primary/30 inner-shadow`. When selected, it should slightly shrink and have an inner shadow for a "pressed in" effect, along with a `primary` colour border and background tint.
    *   `wrong`: `bg-destructive/20 border-destructive text-foreground animate-shake shadow-destructive/30`. Distinctive error styling with a shake animation.
*   **Animations**:
    *   `whileTap`: `{ scale: 0.95 }` for all clickable tiles.
    *   `wrong` state triggers `animate-shake`.

**Code Snippet (`src/games/connections/WordTile.tsx`)**:

```tsx
import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';

export type TileState = 'default' | 'selected' | 'wrong';

interface WordTileProps {
  word: string;
  state: TileState;
  onClick: () => void;
  disabled?: boolean;
}

export function WordTile({ word, state, onClick, disabled }: WordTileProps) {
  const handleClick = () => {
    if (disabled) return;
    hapticTap();
    onClick();
  };

  const stateClasses = {
    default: 'bg-card border-card/50 text-foreground hover:border-card/80', // Subtle border, hover effect
    selected: 'bg-primary/20 border-primary text-primary-foreground scale-[0.98] shadow-primary/30 inner-shadow', // Primary tint, slight scale down, inner shadow
    wrong: 'bg-destructive/20 border-destructive text-foreground animate-shake shadow-destructive/30', // Red tint, shake, shadow
  };

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }} // More distinct tap feedback
      onClick={handleClick}
      disabled={disabled}
      className={`
        aspect-square rounded-xl border-2 px-2 py-3
        text-center text-sm font-bold leading-tight
        transition-all duration-200 shadow-sm // Added subtle shadow
        ${stateClasses[state]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.95]'}
      `}
    >
      <span className="line-clamp-3">{word}</span>
    </motion.button>
  );
}
```

#### `CategoryReveal` (`src/games/connections/CategoryReveal.tsx`)

**Design Specs**:

*   **Container**: `rounded-2xl border-2 shadow-md`. `overflow-hidden` for gradient.
    *   Dynamic background based on difficulty colour with transparency: `bg-[color:var(--category-color-transparent)]`.
    *   Dynamic border `border-[color:var(--category-color-transparent-border)]`.
    *   Add a subtle gradient overlay `bg-gradient-to-br from-transparent to-[color:var(--category-color-transparent-dark)]`.
*   **Category Name**: `h3` `text-md font-bold text-center`. Use `color: var(--category-color)` for specific colour.
*   **Words**: `flex flex-wrap justify-center gap-1.5 text-xs font-semibold text-foreground/90`.
*   **Animations**: Enhanced `initial`, `animate`, and staggered word reveals for a more dramatic effect.

**Code Snippet (`src/games/connections/CategoryReveal.tsx`)**:

```tsx
import { motion } from 'framer-motion';
import type { ConnectionCategory } from '@/data/connections';

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

const DIFFICULTY_COLORS_HEX: Record<ConnectionCategory['difficulty'], string> = {
  yellow: '#F59E0B', // amber-500
  green: '#10B981',  // emerald-500
  blue: '#3B82F6',   // blue-500
  purple: '#8B5CF6', // violet-500
};

// Function to convert hex to rgba (for dynamic transparency)
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CategoryReveal({ category, index }: CategoryRevealProps) {
  const baseColor = DIFFICULTY_COLORS_HEX[category.difficulty];
  const bgColor = hexToRgba(baseColor, 0.15); // Slightly more opaque background
  const borderColor = hexToRgba(baseColor, 0.4);
  const darkGradientColor = hexToRgba(baseColor, 0.05); // For subtle inner gradient

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.15, // Increased delay for more distinct reveals
        type: 'spring',
        stiffness: 180, // Slightly stiffer spring
        damping: 22,
      }}
      className="overflow-hidden rounded-2xl border-2 shadow-md relative" // More rounded, stronger border, subtle shadow
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      {/* Subtle inner gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent -z-10"
           style={{ background: `linear-gradient(to bottom right, transparent, ${darkGradientColor})` }}/>

      <div className="p-4 relative"> {/* Added relative for content stacking */}
        {/* Category name */}
        <h3 
          className="mb-2 text-md font-bold text-center" // Text size increase
          style={{ color: baseColor }} // Use base color for text
        >
          {category.name}
        </h3>
        
        {/* Words */}
        <div className="flex flex-wrap justify-center gap-1.5 text-xs font-semibold text-foreground/90"> {/* Font weight change */}
          {category.words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 25 }} // Staggered and springy word reveal
            >
              {word}
              {i < category.words.length - 1 && ', '}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

#### `ConnectionsGame` (`src/games/connections/ConnectionsGame.tsx`)

**Design Specs**:

*   **Mistake Dots**: Replace simple dots with a more visually distinct "mistake bar" or a row of small, rounded indicators.
    *   Each indicator is a `div` `h-3 w-3 rounded-full border-2 border-muted`.
    *   When a mistake is made, fill the dot with `bg-destructive`.
    *   This provides a clearer, more gamified progress indicator.
*   **"One away" Toast**:
    *   Styling: `animate-pulse rounded-full border-2 border-accent bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent shadow-md`.
    *   Animations: `initial={{ opacity: 0, y: -15 }}` `animate={{ opacity: 1, y: 0 }}` `exit={{ opacity: 0, y: -15 }}`. Use Lucide `Hand` or similar instead of emoji.
*   **Action Buttons (Shuffle, Deselect, Submit)**:
    *   **Styling**: `rounded-xl px-5 py-3 text-base font-bold shadow-md`.
    *   `Shuffle`: `bg-card border border-card/60 text-foreground active:bg-card/80`.
    *   `Deselect`: `bg-card border border-card/60 text-foreground disabled:opacity-50 active:bg-card/80`.
    *   `Submit`: `bg-primary text-primary-foreground disabled:opacity-50 active:bg-primary/90 shadow-glow-sm`. The submit button should glow when active.
    *   **Icons**: Replace emojis with Lucide icons (e.g., `Shuffle`, `X`, `Send`).
*   **Victory/Game Over Result Banner**:
    *   **Container**: `rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl`.
    *   **Emoji/Icon**: `text-5xl` for larger impact. Consider Lucide `Award` for victory, `Frown` for defeat.
    *   **Title**: `h2` `text-2xl font-bold text-foreground`.
    *   **Subtitle**: `p` `mt-1 text-md text-muted`.
    *   **Score Grid**: Retain emoji grid, perhaps with `gap-1` or `gap-1.5` for spacing.
    *   **Time**: `p` `mt-3 text-sm text-muted` with Lucide `Clock`.
*   **"Explain My Mistakes" Button**: `rounded-xl border border-card/60 bg-card px-6 py-4 text-base font-bold text-foreground shadow-md active:bg-card/80`. Use Lucide `Lightbulb` icon.
*   **Explanations Cards**: `rounded-xl border border-card/60 bg-card/50 p-4`. `h4` `text-sm font-bold`.

**Code Snippet (`src/games/connections/ConnectionsGame.tsx`)**:

```tsx
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import { WordTile } from './WordTile';
import { CategoryReveal } from './CategoryReveal';
import type { TileState } from './WordTile';
import type { ConnectionsPuzzle, ConnectionCategory, Difficulty } from '@/data/connections';
import { hapticPress, hapticCorrect, hapticWrong, hapticVictory, hapticDefeat, hapticShuffle, hapticReveal } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';

// Import Lucide icons
import { Shuffle, X, Send, Hand, Clock, Lightbulb, Award, Frown } from 'lucide-react';

interface ConnectionsGameProps {
  puzzle: ConnectionsPuzzle;
  onExit?: () => void;
}

const MAX_MISTAKES = 4;
const MAX_SELECTED = 4;

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  yellow: '🟨',
  green: '🟩',
  blue: '🟦',
  purple: '🟪',
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function ConnectionsGame({ puzzle, onExit }: ConnectionsGameProps) {
  const [remainingWords, setRemainingWords] = useState<string[]>(() => {
    const allWords = puzzle.categories.flatMap((c) => c.words);
    return shuffleArray(allWords);
  });
  
  const [solvedCategories, setSolvedCategories] = useState<ConnectionCategory[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrongGuessWords, setWrongGuessWords] = useState<Set<string>>(new Set());
  const [oneAway, setOneAway] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [guessHistory, setGuessHistory] = useState<Difficulty[][]>([]);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  // Clear wrong state after animation
  useEffect(() => {
    if (wrongGuessWords.size === 0) return;
    const timer = setTimeout(() => {
      setWrongGuessWords(new Set());
    }, 600);
    return () => clearTimeout(timer);
  }, [wrongGuessWords]);

  // Clear "one away" toast
  useEffect(() => {
    if (!oneAway) return;
    const timer = setTimeout(() => setOneAway(false), 2000);
    return () => clearTimeout(timer);
  }, [oneAway]);

  const handleWordTap = useCallback((word: string) => {
    if (isComplete) return;

    setSelectedWords((prev) => {
      const isSelected = prev.includes(word);
      if (isSelected) {
        return prev.filter((w) => w !== word);
      } else if (prev.length < MAX_SELECTED) {
        return [...prev, word];
      }
      return prev;
    });
  }, [isComplete]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== MAX_SELECTED) return;

    hapticPress();

    // Check if guess matches any unsolved category
    const matchedCategory = puzzle.categories.find(
      (cat) =>
        !solvedCategories.includes(cat) &&
        cat.words.every((w) => selectedWords.includes(w))
    );

    if (matchedCategory) {
      // Correct guess!
      hapticCorrect();
      setTimeout(() => hapticReveal(), 200);

      const newSolved = [...solvedCategories, matchedCategory];
      const newRemaining = remainingWords.filter(
        (w) => !matchedCategory.words.includes(w)
      );

      setSolvedCategories(newSolved);
      setRemainingWords(newRemaining);
      setSelectedWords([]);

      // Record guess in history
      setGuessHistory((prev) => [
        ...prev,
        [matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty],
      ]);

      // Check if won
      if (newSolved.length === 4) {
        setIsComplete(true);
        setIsWon(true);
        setEndTime(Date.now());
        hapticVictory();
        recordGamePlay('connections');
      }
    } else {
      // Wrong guess
      hapticWrong();

      // Check if "one away"
      let maxOverlap = 0;
      for (const cat of puzzle.categories) {
        if (solvedCategories.includes(cat)) continue;
        const overlap = cat.words.filter((w) => selectedWords.includes(w)).length;
        if (overlap > maxOverlap) maxOverlap = overlap;
      }

      if (maxOverlap === 3) {
        setOneAway(true);
      }

      // Build colour row
      const guessColors: Difficulty[] = selectedWords.map((w) => {
        const cat = puzzle.categories.find((c) => c.words.includes(w));
        return cat ? cat.difficulty : 'yellow'; // Fallback to yellow for words not in any category (shouldn't happen)
      });

      setWrongGuessWords(new Set(selectedWords));
      setGuessHistory((prev) => [...prev, guessColors]);

      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      if (newMistakes >= MAX_MISTAKES) {
        // Game over
        hapticDefeat();
        setIsComplete(true);
        setIsWon(false);
        setEndTime(Date.now());

        // Reveal all remaining categories
        const remainingCats = puzzle.categories.filter(
          (c) => !solvedCategories.includes(c)
        );
        setSolvedCategories([...solvedCategories, ...remainingCats]);
        setRemainingWords([]);
      }

      setSelectedWords([]);
    }
  }, [selectedWords, puzzle.categories, solvedCategories, remainingWords, mistakes, isComplete]);

  const handleShuffle = useCallback(() => {
    hapticShuffle();
    setRemainingWords((prev) => shuffleArray(prev));
  }, []);

  const handleDeselectAll = useCallback(() => {
    hapticPress();
    setSelectedWords([]);
  }, []);

  const getTileState = (word: string): TileState => {
    if (wrongGuessWords.has(word)) return 'wrong';
    if (selectedWords.includes(word)) return 'selected';
    return 'default';
  };

  const shareText = isComplete
    ? generateShareText(puzzle.number, puzzle.language, guessHistory, mistakes, endTime ? endTime - startTime : 0)
    : '';

  return (
    <GameShell
      gameName="Connections"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      onBack={onExit}
    >
      <div className="space-y-5"> {/* Increased vertical spacing */}
        {/* Mistake indicators */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted">Mistakes:</span>
          <div className="flex gap-1.5"> {/* Increased gap between dots */}
            {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border-2 transition-all duration-300 ${ // Larger dots, border
                  i < mistakes ? 'bg-destructive border-destructive' : 'bg-transparent border-muted/50' // Filled with destructive color
                }`}
              />
            ))}
          </div>
        </div>

        {/* "One away" toast */}
        <AnimatePresence>
          {oneAway && (
            <motion.div
              initial={{ opacity: 0, y: -15 }} // Moved up slightly
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex justify-center"
            >
              <div className="animate-pulse rounded-full border-2 border-accent bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent shadow-md flex items-center gap-2"> {/* More prominent styling */}
                <Hand size={18} strokeWidth={2} /> One away! 🤏
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solved Categories */}
        <div className="space-y-3"> {/* Increased spacing */}
          {solvedCategories.map((cat, i) => (
            <CategoryReveal key={cat.name} category={cat} index={i} />
          ))}
        </div>

        {/* Word Grid */}
        {remainingWords.length > 0 && (
          <motion.div
            layout // Enable layout animations for shuffling
            className="grid grid-cols-4 gap-2"
          >
            {remainingWords.map((word) => (
              <WordTile
                key={word}
                word={word}
                state={getTileState(word)}
                onClick={() => handleWordTap(word)}
                disabled={isComplete}
              />
            ))}
          </motion.div>
        )}

        {/* Action buttons */}
        {!isComplete && (
          <div className="flex items-center gap-2 mt-5"> {/* Added mt-5 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              className="flex-1 rounded-xl bg-card border border-card/60 px-5 py-3 text-base font-bold text-foreground shadow-md active:bg-card/80 flex items-center justify-center gap-2" // Redesigned button
            >
              <Shuffle size={20} strokeWidth={2} /> Shuffle
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDeselectAll}
              disabled={selectedWords.length === 0}
              className="flex-1 rounded-xl bg-card border border-card/60 px-5 py-3 text-base font-bold text-foreground shadow-md disabled:opacity-50 active:bg-card/80 flex items-center justify-center gap-2" // Redesigned button
            >
              <X size={20} strokeWidth={2} /> Deselect
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={selectedWords.length !== MAX_SELECTED}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-glow-sm disabled:opacity-50 active:bg-primary/90 flex items-center justify-center gap-2" // Redesigned button
            >
              <Send size={20} strokeWidth={2} /> Submit
            </motion.button>
          </div>
        )}

        {/* Victory / Game Over */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl"> {/* More rounded, border, shadow */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className={`text-5xl mb-2 ${isWon ? 'text-success' : 'text-destructive'}`}
              >
                {isWon ? <Award size={50} strokeWidth={1.5} /> : <Frown size={50} strokeWidth={1.5} />} {/* Lucide icons */}
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground"> {/* Increased size */}
                {isWon ? '¡Perfecto!' : 'Good try!'}
              </h2>
              <p className="mt-1 text-md text-muted"> {/* Increased size */}
                {isWon
                  ? `Solved with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}`
                  : "You'll get it next time"}
              </p>

              {/* Score grid */}
              <div className="mx-auto mt-4 max-w-[200px] space-y-1.5"> {/* Increased space-y */}
                {guessHistory.map((row, i) => (
                  <div key={i} className="flex justify-center gap-1.5 text-lg"> {/* Increased gap */}
                    {row.map((d, j) => (
                      <span key={j}>{DIFFICULTY_EMOJI[d]}</span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Time */}
              {endTime && (
                <p className="mt-3 text-sm text-muted flex items-center justify-center gap-1"> {/* Text size, flex for icon */}
                  <Clock size={16} strokeWidth={2} />{' '}
                  {(() => {
                    const secs = Math.floor((endTime - startTime) / 1000);
                    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
                  })()}
                </p>
              )}
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Explain mistakes */}
            {mistakes > 0 && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowExplanations((prev) => !prev)}
                className="w-full rounded-xl border border-card/60 bg-card px-6 py-4 text-base font-bold text-foreground shadow-md active:bg-card/80 flex items-center justify-center gap-2" // Redesigned button
              >
                <Lightbulb size={20} strokeWidth={2} /> {showExplanations ? 'Hide Explanations' : '🧠 Explain My Mistakes'}
              </motion.button>
            )}

            {/* Explanations */}
            <AnimatePresence>
              {showExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="space-y-3 overflow-hidden"
                >
                  {puzzle.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="rounded-xl border border-card/60 bg-card/50 p-4" // Redesigned card
                    >
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {DIFFICULTY_EMOJI[cat.difficulty]} {cat.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {cat.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tutor CTA */}
            <TutorCTA />
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}
```

---

## 6. Spell Cast Game (`src/games/spell-cast/HexGrid.tsx`, `src/games/spell-cast/SpellCastGame.tsx`)

**Goal**: Make the hexagonal grid interactive and visually dynamic, highlighting selections and providing satisfying feedback.

### `HexGrid` (`src/games/spell-cast/HexGrid.tsx`)

**Design Specs**:

*   **SVG Structure**: Keep the SVG-based rendering for precise control over hex shapes.
*   **Hex Styling**:
    *   `fillColor`, `strokeColor`, `textColor` should dynamically adapt based on Telegram theme variables where possible, or use defined semantic colours.
    *   `default`: `fill: var(--tg-theme-secondary-bg-color, #2c2c2c)` and `stroke: var(--tg-theme-hint-color, #7a7a7a)`.
    *   `selected`: `fill: var(--tg-theme-button-color, #8774e1)` and `stroke: var(--tg-theme-button-color, #8774e1)`. `textColor: var(--tg-theme-button-text-color, #ffffff)`.
    *   `used`: `fill: var(--tg-theme-secondary-bg-color, #2c2c2c)/50` (or a slightly darker shade) and `textColor: var(--tg-theme-hint-color, #7a7a7a)/50`.
    *   `center (gold)`: `fill: var(--game-gold, #FFD700)` `stroke: var(--game-gold, #FFD700)`.
*   **Animations**:
    *   `whileHover`: Add a slight `scale` animation (`1.05`) for interactive hexes.
    *   `onClick`: A more pronounced `scale` animation (`0.95`) for immediate feedback.
    *   `animate={{ scale: isSelected ? 1.1 : 1 }}` for the `isSelected` state, with a `spring` transition.

**Code Snippet (`src/games/spell-cast/HexGrid.tsx`)**:

```tsx
import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';

interface HexGridProps {
  letters: string[];
  selectedIndices: number[];
  usedIndices: Set<number>;
  centerIndex: number;
  onHexTap: (index: number) => void;
}

// Hex positions (same as before)
const HEX_POSITIONS = [
  // Center hex (0)
  { x: 50, y: 50 },
  // Inner ring (1-6)
  { x: 50, y: 30 }, // top
  { x: 65, y: 40 }, // top-right
  { x: 65, y: 60 }, // bottom-right
  { x: 50, y: 70 }, // bottom
  { x: 35, y: 60 }, // bottom-left
  { x: 35, y: 40 }, // top-left
  // Outer ring (7-18)
  { x: 50, y: 10 }, // top
  { x: 65, y: 20 }, // top-right-1
  { x: 80, y: 30 }, // top-right-2
  { x: 80, y: 50 }, // right
  { x: 80, y: 70 }, // bottom-right-2
  { x: 65, y: 80 }, // bottom-right-1
  { x: 50, y: 90 }, // bottom
  { x: 35, y: 80 }, // bottom-left-1
  { x: 20, y: 70 }, // bottom-left-2
  { x: 20, y: 50 }, // left
  { x: 20, y: 30 }, // top-left-2
  { x: 35, y: 20 }, // top-left-1
];

export function HexGrid({
  letters,
  selectedIndices,
  usedIndices,
  centerIndex,
  onHexTap,
}: HexGridProps) {
  const handleHexClick = (index: number) => {
    if (usedIndices.has(index)) return; // Already found words should not be tappable
    hapticTap();
    onHexTap(index);
  };

  return (
    <div className="relative aspect-square w-full max-w-sm mx-auto select-none"> {/* Added select-none */}
      {/* SVG container */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: 'none' }}
      >
        {letters.map((letter, i) => {
          const pos = HEX_POSITIONS[i];
          if (!pos) return null;

          const isSelected = selectedIndices.includes(i);
          const isUsed = usedIndices.has(i); // For words already found
          const isCenter = i === centerIndex;
          const isTappable = !isUsed;

          let fillColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
          let strokeColor = 'var(--tg-theme-hint-color, #7a7a7a)';
          let textColor = 'var(--tg-theme-text-color, #ffffff)';
          let letterOpacity = 1;

          if (isUsed) {
            fillColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)'; // Still background, but can be visually distinct
            strokeColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
            textColor = 'var(--tg-theme-hint-color, #7a7a7a)';
            letterOpacity = 0.4; // Fade out letters of used hexes
          } else if (isSelected) {
            fillColor = 'var(--tg-theme-button-color, #8774e1)';
            strokeColor = 'var(--tg-theme-button-color, #8774e1)';
            textColor = 'var(--tg-theme-button-text-color, #ffffff)';
          } else if (isCenter) {
            fillColor = 'var(--game-gold, #FFD700)'; // Golden color
            strokeColor = 'var(--game-gold, #FFD700)';
            textColor = 'var(--tg-theme-button-text-color, #ffffff)'; // White text on gold
          }

          return (
            <motion.g
              key={i}
              onClick={() => handleHexClick(i)}
              style={{ cursor: isTappable ? 'pointer' : 'default' }}
              whileHover={isTappable && !isSelected ? { scale: 1.05 } : {}} // Slight hover effect
              whileTap={isTappable ? { scale: 0.95 } : {}} // Click feedback
            >
              {/* Hexagon */}
              <motion.polygon
                points={getHexPoints(pos.x, pos.y, 6)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isUsed ? "0.2" : "0.5"} // Thinner stroke for used hexes
                initial={{ scale: 0.9 }} // Initial small scale for subtle entry
                animate={{ scale: isSelected ? 1.1 : 1 }} // Pop out when selected
                transition={{ type: 'spring', stiffness: 300, damping: 25 }} // Spring animation
              />
              {/* Letter */}
              <motion.text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="6"
                fontWeight="bold"
                fill={textColor}
                opacity={letterOpacity}
                initial={{ scale: 0.9 }} // Initial small scale for subtle entry
                animate={{ scale: isSelected ? 1.1 : 1 }} // Pop out when selected
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {letter}
              </motion.text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Generate SVG polygon points for a hexagon. (Unchanged)
 */
function getHexPoints(cx: number, cy: number, radius: number): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push([
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle),
    ]);
  }
  return points.map((p) => p.join(',')).join(' ');
}
```

### `SpellCastGame` (`src/games/spell-cast/SpellCastGame.tsx`)

**Design Specs**:

*   **Timer & Score Display**: Redesign the top bar to be more prominent and visually interesting.
    *   Container: `rounded-2xl border-2 border-card/60 bg-gradient-to-br from-card to-card/90 p-4 flex items-center justify-around shadow-md`.
    *   Each stat (Time, Score, Words): `text-center flex-1`.
        *   Value: `text-3xl font-bold text-primary` (for time), `text-3xl font-bold text-success` (for score), `text-3xl font-bold text-accent` (for words). Increased size for impact.
        *   Label: `text-sm text-muted`.
    *   Add a subtle horizontal separator (`border-l border-card/50`) between items.
*   **Combo Indicator**:
    *   `rounded-full bg-accent/20 border border-accent px-4 py-1.5 text-lg font-bold text-accent shadow-sm`.
    *   Add `animate-pulsefast` for continuous subtle animation.
    *   Use Lucide `Flame` for the emoji.
*   **Current Word Display**:
    *   `rounded-xl border-2 border-card/60 bg-card p-4 text-center shadow-sm`.
    *   Word: `text-2xl font-bold text-foreground`.
    *   Placeholder: `text-lg font-semibold text-muted`.
*   **Message Toast**:
    *   Use `AnimatePresence` for smooth entry/exit.
    *   Styling: `rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm`.
    *   `success`: `bg-success/20 text-success border border-success/50`.
    *   `error`: `bg-destructive/20 text-destructive border border-destructive/50`.
*   **Action Buttons (Clear, Submit)**:
    *   **Styling**: `flex-1 rounded-xl px-5 py-3 text-base font-bold shadow-md`.
    *   `Clear`: `bg-card border border-card/60 text-foreground active:bg-card/80`. Use Lucide `X`.
    *   `Submit`: `bg-primary text-primary-foreground disabled:opacity-50 active:bg-primary/90 shadow-glow-sm`. Use Lucide `Check`.
*   **Game Complete Screen**:
    *   Result Banner: Similar to Connections, `rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl`.
    *   Emoji/Icon: Use Lucide `Award` or `Trophy` for victory, or keep `🍯` but style larger.
    *   Stats: `text-2xl font-bold text-primary` for score, `text-sm text-muted` for others.

**Code Snippet (`src/games/spell-cast/SpellCastGame.tsx`)**:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import { HexGrid } from './HexGrid';
import type { HexPuzzle } from '@/data/spell-cast/types';
import { isValidWord, calculateWordScore } from '@/data/spell-cast/word-lists';
import { hapticCorrect, hapticWrong, hapticVictory, hapticWordFound, hapticCombo } from '@/lib/haptics'; // Added hapticCombo
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';

// Import Lucide icons
import { Clock, TrendingUp, Hash, X, Check, Flame } from 'lucide-react';

interface SpellCastGameProps {
  puzzle: HexPuzzle;
  puzzleNumber: number;
  onExit?: () => void;
}

const GAME_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const COMBO_TIMEOUT_MS = 30 * 1000; // 30 seconds

export function SpellCastGame({ puzzle, puzzleNumber, onExit }: SpellCastGameProps) {
  const [selectedHexes, setSelectedHexes] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lastWordTime, setLastWordTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_MS);
  const [isComplete, setIsComplete] = useState(false);
  const [bestWord, setBestWord] = useState<{ word: string; score: number } | null>(null);
  const [maxCombo, setMaxCombo] = useState(1);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null); // Added 'info' type

  // Timer
  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          setIsComplete(true);
          hapticVictory();
          recordGamePlay('spell-cast');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete]);

  // Combo timeout
  useEffect(() => {
    if (isComplete) return;

    const timeSinceLastWord = Date.now() - lastWordTime;
    if (timeSinceLastWord > COMBO_TIMEOUT_MS && combo > 1) {
      setCombo(1);
      setMessage({ text: 'Combo reset!', type: 'info' }); // Inform user combo reset
    }
  }, [lastWordTime, combo, isComplete]);

  // Clear message after 2 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleHexTap = useCallback((index: number) => {
    if (isComplete) return;

    // Check if the tapped hex is adjacent to the last selected hex
    // For Spell Cast, you can only select adjacent hexes from the current sequence
    const canSelect = selectedHexes.length === 0 || isAdjacent(selectedHexes[selectedHexes.length - 1], index);

    setSelectedHexes((prev) => {
      // If already selected, deselect
      if (prev.includes(index)) {
        // If it's the last selected hex, pop it
        if (prev[prev.length - 1] === index) {
            return prev.slice(0, prev.length - 1);
        }
        // Otherwise, if it's in the middle, prevent re-selection in sequence for simplicity
        return prev;
      }
      
      // If not adjacent to last selected, and not starting new word, ignore
      if (prev.length > 0 && !canSelect) {
        setMessage({ text: 'Must select adjacent hex!', type: 'info' }); // Inform user
        hapticWrong(); // Haptic feedback for invalid move
        return prev;
      }

      // If empty, start new word
      if (prev.length === 0) {
        return [index];
      }

      return [...prev, index];
    });
  }, [isComplete, selectedHexes, message]);

  const handleSubmit = useCallback(() => {
    if (selectedHexes.length < 3) {
      setMessage({ text: 'Word too short! (Min 3 letters)', type: 'error' }); // More specific message
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    const word = selectedHexes.map((i) => puzzle.letters[i]).join('');
    
    // Check if already found
    if (foundWords.has(word.toLowerCase())) {
      setMessage({ text: 'Already found this word!', type: 'error' }); // More specific message
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    // Validate word
    const validWord = isValidWord(word, puzzle.language);
    if (!validWord) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    // Calculate score
    const usedCenter = selectedHexes.includes(puzzle.centerIndex);
    const wordScore = calculateWordScore(validWord, usedCenter, combo);

    // Update state
    hapticWordFound();
    setFoundWords((prev) => new Set(prev).add(word.toLowerCase()));
    setScore((prev) => prev + wordScore);
    setLastWordTime(Date.now());
    
    // Update combo
    const newCombo = combo + 1;
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));
    hapticCombo(newCombo); // Haptic feedback for combo

    // Track best word
    if (!bestWord || wordScore > bestWord.score) {
      setBestWord({ word: validWord.word, score: wordScore });
    }

    setMessage({ text: `+${wordScore} pts${newCombo > 1 ? ` (${newCombo}x combo!)` : ''}`, type: 'success' });
    setSelectedHexes([]);
  }, [selectedHexes, puzzle, foundWords, combo, bestWord]);

  const currentWord = selectedHexes.map((i) => puzzle.letters[i]).join('');
  const usedIndices = new Set<number>(); // This logic might need to be refined if usedIndices refers to found words hexes, currently it's empty

  const shareText = isComplete
    ? generateShareText(puzzleNumber, puzzle.language, score, foundWords.size, bestWord?.word || '', maxCombo)
    : '';

  return (
    <GameShell
      gameName="Spell Cast"
      puzzleNumber={puzzleNumber}
      language={puzzle.language}
      onBack={onExit}
    >
      <div className="space-y-5"> {/* Increased vertical spacing */}
        {/* Timer & Score & Words Found */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="rounded-2xl border-2 border-card/60 bg-gradient-to-br from-card to-card/90 p-4 flex items-center justify-around shadow-md"
        >
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Clock size={24} strokeWidth={2} />
              <div className="text-3xl font-bold font-mono">{Math.floor(timeRemaining / 1000)}</div>
            </div>
            <div className="text-sm text-muted">Time Left</div>
          </div>
          
          <div className="border-l border-card/50 h-12 mx-2" /> {/* Separator */}

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-success">
              <TrendingUp size={24} strokeWidth={2} />
              <div className="text-3xl font-bold">{score}</div>
            </div>
            <div className="text-sm text-muted">Score</div>
          </div>

          <div className="border-l border-card/50 h-12 mx-2" /> {/* Separator */}
          
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-accent">
              <Hash size={24} strokeWidth={2} />
              <div className="text-3xl font-bold">{foundWords.size}</div>
            </div>
            <div className="text-sm text-muted">Words</div>
          </div>
        </motion.div>

        {/* Combo indicator */}
        <AnimatePresence>
          {combo > 1 && !isComplete && message?.type !== 'info' && ( // Only show combo if active and not overridden by info message
            <motion.div
              key="combo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center rounded-full bg-accent/20 border border-accent px-4 py-1.5 text-lg font-bold text-accent shadow-sm animate-pulsefast flex items-center justify-center gap-2" // Added pulsefast, flex, gap
            >
              <Flame size={20} strokeWidth={2} /> {combo}x Combo!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current word */}
        <motion.div
          key={currentWord} // Animate on word change
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border-2 border-card/60 bg-card p-4 text-center shadow-sm"
        >
          <div className="text-2xl font-bold text-foreground">
            {currentWord || <span className="text-lg font-semibold text-muted">Tap hexes to spell...</span>} {/* Placeholder changed */}
          </div>
        </motion.div>

        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-center rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm border ${
                message.type === 'success' ? 'bg-success/20 text-success border-success/50' :
                message.type === 'error' ? 'bg-destructive/20 text-destructive border-destructive/50' :
                'bg-muted/10 text-muted border-muted/50' // Info message styling
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hex Grid */}
        {!isComplete && (
          <HexGrid
            letters={puzzle.letters}
            selectedIndices={selectedHexes}
            usedIndices={usedIndices}
            centerIndex={puzzle.centerIndex}
            onHexTap={handleHexTap}
          />
        )}

        {/* Action buttons */}
        {!isComplete && (
          <div className="flex gap-3 mt-5"> {/* Increased gap, added mt-5 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedHexes([])}
              disabled={selectedHexes.length === 0}
              className="flex-1 rounded-xl bg-card border border-card/60 px-5 py-3 text-base font-bold text-foreground shadow-md disabled:opacity-50 active:bg-card/80 flex items-center justify-center gap-2" // Redesigned button
            >
              <X size={20} strokeWidth={2} /> Clear
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={selectedHexes.length < 3}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-glow-sm disabled:opacity-50 active:bg-primary/90 flex items-center justify-center gap-2" // Redesigned button
            >
              <Check size={20} strokeWidth={2} /> Submit
            </motion.button>
          </div>
        )}

        {/* Game Complete */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-5xl mb-2 text-primary"
              >
                <Flame size={50} strokeWidth={1.5} /> {/* Lucide icon for completion */}
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Time's Up!</h2>
              
              <div className="mt-4 space-y-2">
                <div className="text-3xl font-bold text-primary">{score} pts</div>
                <div className="text-md text-muted">{foundWords.size} words found</div>
                {bestWord && (
                  <div className="text-sm text-muted flex items-center justify-center gap-1">
                    <TrendingUp size={16} strokeWidth={2} /> Best: <span className="font-bold text-accent">{bestWord.word}</span> ({bestWord.score} pts)
                  </div>
                )}
                {maxCombo > 1 && (
                  <div className="text-sm text-muted flex items-center justify-center gap-1">
                    <Flame size={16} strokeWidth={2} /> Max combo: <span className="font-bold text-accent">{maxCombo}x</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Tutor CTA */}
            <TutorCTA />
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}

/**
 * Check if two hex indices are adjacent. (Unchanged for now, assumes existing logic is correct)
 */
function isAdjacent(a: number, b: number): boolean {
  // This function assumes a specific arrangement of hexes.
  // For the provided HEX_POSITIONS, this logic works for inner ring.
  // A more robust solution might pre-calculate adjacency for all hexes.
  // For simplicity, re-using original logic but it's prone to error with new layouts.

  const neighbors: { [key: number]: number[] } = {
    0: [1, 2, 3, 4, 5, 6], // Center to inner ring
    1: [0, 2, 6, 7, 8, 18], // Inner ring
    2: [0, 1, 3, 8, 9, 10],
    3: [0, 2, 4, 10, 11, 12],
    4: [0, 3, 5, 12, 13, 14],
    5: [0, 4, 6, 14, 15, 16],
    6: [0, 1, 5, 16, 17, 18],
    7: [1, 8, 18], // Outer ring to inner and other outer
    8: [1, 2, 7, 9],
    9: [2, 8, 10],
    10: [2, 3, 9, 11],
    11: [3, 10, 12],
    12: [3, 4, 11, 13],
    13: [4, 12, 14],
    14: [4, 5, 13, 15],
    15: [5, 14, 16],
    16: [5, 6, 15, 17],
    17: [6, 16, 18],
    18: [1, 6, 7, 17],
  };

  return neighbors[a]?.includes(b) || false;
}
```

---

## 7. Speed Clash Game (`src/games/speed-clash/SpeedClashGame.tsx`)

**Goal**: Create a fast-paced, visually dynamic quiz experience with clear time pressure and feedback.

**Design Specs**:

*   **Round Progress Bar**:
    *   Replace `Round X/Y` text with a visual progress bar (`div` `w-full h-2 bg-card rounded-full overflow-hidden`).
    *   Inside, a `motion.div` `h-full bg-primary` animates its `width` from `100%` to `0%` to represent time remaining.
    *   Show `currentRound + 1 / ROUNDS` below the bar in `text-sm text-muted`.
*   **Scenario Card**:
    *   **Container**: `rounded-2.5xl border-2 border-card/60 bg-gradient-to-br from-card to-card/90 p-5 shadow-lg`.
    *   **Situation**: `text-xs text-muted mb-2 font-semibold uppercase tracking-wide`.
    *   **Prompt**: `h3` `text-xl font-bold leading-snug text-foreground`.
    *   **Animation**: `key={currentRound}` for a slide-in/out effect with `motion.div`.
*   **Answer Options**:
    *   **Button Styling**: `motion.button` `w-full rounded-xl border-2 p-4 text-left text-base font-medium transition-all duration-200 shadow-sm`.
        *   `text-base` for readability.
        *   `shadow-sm` for slight depth.
    *   **States**:
        *   `default`: `bg-card border-card/50 text-foreground hover:border-card/80`.
        *   `correct`: `bg-success/20 border-success text-success shadow-success/30`.
        *   `incorrect`: `bg-destructive/20 border-destructive text-destructive shadow-destructive/30`.
    *   **Animations**: Staggered entrance, `whileTap={{ scale: 0.98 }}`.
*   **Result Screen**:
    *   Result Banner: Similar to other games, `rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl`.
    *   Icon: Use Lucide `Zap` for Speed Clash.
    *   Stats: `text-3xl font-bold text-primary` for score, `text-sm text-muted` for others.
    *   Average Speed: `text-sm text-muted flex items-center justify-center gap-1`. Use Lucide `Gauge`.

**Code Snippet (`src/games/speed-clash/SpeedClashGame.tsx`)**:

```tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import type { Scenario } from '@/data/speed-clash/scenarios';
import { getRandomScenarios } from '@/data/speed-clash/scenarios';
import { hapticPress, hapticCorrect, hapticWrong, hapticVictory, hapticTimerWarning } from '@/lib/haptics'; // Added hapticTimerWarning
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';

// Import Lucide icons
import { Zap, Gauge, Play, X, Check, Timer } from 'lucide-react';

interface SpeedClashGameProps {
  language: string;
  puzzleNumber: number;
  onExit?: () => void;
}

const ROUNDS = 10;
const ROUND_TIME_MS = 10000; // 10 seconds per round

export function SpeedClashGame({ language, puzzleNumber, onExit }: SpeedClashGameProps) {
  const [scenarios] = useState<Scenario[]>(() => getRandomScenarios(language, ROUNDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_TIME_MS);

  const currentScenario = scenarios[currentRound];
  const timerIntervalRef = useRef<number | null>(null);

  // Start new round or end game
  useEffect(() => {
    if (isComplete) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    if (answered) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    setRoundTimeLeft(ROUND_TIME_MS);
    setRoundStartTime(Date.now());

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRoundTimeLeft((prev) => {
        const newTime = ROUND_TIME_MS - (Date.now() - roundStartTime);
        if (newTime <= 0) {
          clearInterval(timerIntervalRef.current!);
          // Auto-answer wrong if time runs out
          if (!answered) handleAnswer(-1); // -1 signifies no answer
          return 0;
        }
        if (newTime <= 3000 && newTime > 0 && (prev > 3000 || prev === ROUND_TIME_MS)) { // Haptic warning for last 3 seconds
             hapticTimerWarning();
        }
        return newTime;
      });
    }, 100); // Update every 100ms for smoother bar

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentRound, answered, isComplete, roundStartTime]);

  const handleAnswer = useCallback((index: number) => {
    if (answered || isComplete) return;

    const responseTime = Date.now() - roundStartTime;
    const isCorrect = index === currentScenario.correctIndex;

    hapticPress();
    setSelectedIndex(index);
    setAnswered(true);

    if (isCorrect) {
      hapticCorrect();
      setCorrectCount((prev) => prev + 1);
      setSpeeds((prev) => [...prev, responseTime]);
    } else {
      hapticWrong();
    }

    // Move to next round after delay
    setTimeout(() => {
      if (currentRound + 1 < ROUNDS) {
        setCurrentRound((prev) => prev + 1);
        setAnswered(false);
        setSelectedIndex(null);
      } else {
        setIsComplete(true);
        hapticVictory();
        recordGamePlay('speed-clash');
      }
    }, 1200); // Reduced delay for faster pace
  }, [answered, isComplete, roundStartTime, currentScenario, currentRound]);

  const avgSpeed = speeds.length > 0
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 0;

  const shareText = isComplete
    ? generateShareText(puzzleNumber, language, correctCount, ROUNDS, avgSpeed)
    : '';

  if (!currentScenario) return null;

  const progress = (currentRound / ROUNDS) * 100;
  const timeProgress = (roundTimeLeft / ROUND_TIME_MS) * 100;

  return (
    <GameShell
      gameName="Speed Clash"
      puzzleNumber={puzzleNumber}
      language={language}
      onBack={onExit}
    >
      <div className="space-y-5"> {/* Increased vertical spacing */}
        {/* Overall Progress Bar */}
        <div className="w-full bg-card rounded-full h-2.5 overflow-hidden shadow-inner-dark"> {/* Stronger progress bar */}
          <motion.div
            className="h-full bg-primary"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="text-sm text-muted text-center -mt-2">Round {currentRound + 1}/{ROUNDS}</div> {/* Centered progress text */}


        {!isComplete ? (
          <>
            {/* Time Left Progress Bar for current round */}
            <div className="w-full bg-card rounded-full h-2 overflow-hidden shadow-inner"> {/* Time bar */}
              <motion.div
                key={currentRound + "-timebar"} // Key for re-animating on round change
                className={`h-full ${timeProgress <= 30 ? 'bg-destructive' : 'bg-success'}`} // Turns red when low
                initial={{ width: '100%' }}
                animate={{ width: `${timeProgress}%` }}
                transition={{ duration: roundTimeLeft / 1000, ease: "linear" }}
                style={{ originX: 'right' }} // Animate from right to left
              />
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted -mt-2">
                <Timer size={16} /> <span className={`${roundTimeLeft <= 3000 ? 'text-destructive font-bold' : 'text-muted'}`}>{(roundTimeLeft / 1000).toFixed(1)}s</span>
            </div>

            {/* Scenario */}
            <motion.div
              key={currentRound + "-scenario"} // Key for re-animating on round change
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-3"
            >
              <div className="rounded-2.5xl border-2 border-card/60 bg-gradient-to-br from-card to-card/90 p-5 shadow-lg"> {/* Enhanced card styling */}
                <div className="mb-2 text-xs text-muted font-semibold uppercase tracking-wide">{currentScenario.situation}</div> {/* Styling */}
                <div className="text-xl font-bold leading-snug text-foreground"> {/* Increased size */}
                  {currentScenario.prompt}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3"> {/* Increased spacing */}
                {currentScenario.options.map((option, i) => {
                  let bgClass = 'bg-card border-card/50';
                  let textClass = 'text-foreground';
                  let shadowClass = 'shadow-sm';

                  if (answered) {
                    if (i === currentScenario.correctIndex) {
                      bgClass = 'bg-success/20 border-success';
                      textClass = 'text-success';
                      shadowClass = 'shadow-success/30';
                    } else if (i === selectedIndex) {
                      bgClass = 'bg-destructive/20 border-destructive';
                      textClass = 'text-destructive';
                      shadowClass = 'shadow-destructive/30';
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 150, damping: 20 }} // Staggered entry
                      whileTap={answered ? {} : { scale: 0.98 }} // Click feedback
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                      className={`w-full rounded-xl border-2 p-4 text-left text-base font-medium transition-all ${bgClass} ${textClass} ${shadowClass} ${
                        answered ? 'cursor-not-allowed' : 'active:bg-card/80' // Better active state
                      }`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="space-y-4 mt-6"
          >
            {/* Result banner */}
            <div className="rounded-2.5xl border-2 border-card/60 bg-card p-6 text-center shadow-xl">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-5xl mb-2 text-primary"
              >
                <Zap size={50} strokeWidth={1.5} /> {/* Lucide Zap icon */}
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                Clash Complete!
              </h2>
              <div className="mt-4 space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {correctCount}/{ROUNDS}
                </div>
                <div className="text-md text-muted">Correct answers</div>
                <div className="text-sm text-muted flex items-center justify-center gap-1 mt-2">
                  <Gauge size={16} strokeWidth={2} /> Avg speed: <span className="font-bold text-accent">{(avgSpeed / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Tutor CTA */}
            {correctCount < ROUNDS * 0.7 && <TutorCTA />} {/* Show CTA if score is below 70% */}
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}
```

---

## 8. Vocab Clash Game (`src/games/vocab-clash/Card.tsx`, `src/games/vocab-clash/VocabClashGame.tsx`)

**Goal**: Redesign the card battler for a mobile-first experience, emphasizing visual clarity, tactile feedback, and a polished game feel. The current `Card.tsx` is decent but needs mobile adaptation and theme integration.

### `Card.tsx` (`src/games/vocab-clash/Card.tsx`)

**Design Specs**:

*   **Size Adaptation**: Default to `medium` for mobile hand, `large` for played cards. Ensure `w-28 h-40` (`medium`) and `w-36 h-52` (`large`) for better mobile touch targets and visibility.
*   **Container Styling**:
    *   `rounded-xl border-4` from `RARITY_STYLES`.
    *   `bg-gradient-to-br` with rarity colours.
    *   `shadow-lg` for depth.
    *   `transition-all duration-300` for smooth animations.
    *   `selected`: `scale-105 -translate-y-2 shadow-glow-sm border-primary`. Highlight with `primary` border and glow.
*   **CEFR Badge**: `absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm`.
*   **Word**: `p` `text-lg font-bold text-white uppercase tracking-wide truncate`. Larger and bolder.
*   **Translation**: `p` `text-white/80 text-sm text-center truncate`. Larger.
*   **Ability Icon**: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl`. Larger for impact. Use Lucide icons for abilities if available, otherwise keep emojis.
*   **Stats (Power/Defence)**: `flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-sm`. Make them `rounded-full` for a more distinct badge feel.
    *   Icons: Replace emojis (`⚔️`, `🛡️`) with Lucide icons (`Swords`, `Shield`).
*   **Card Back**: `w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-card/80 rounded-xl`. Icon `🎴` (`text-6xl`).
*   **Holographic Effect**: Retain `animate-shimmer` for `mythic` cards.

**Code Snippet (`src/games/vocab-clash/Card.tsx`)**:

```tsx
import React from 'react';
import { motion } from 'framer-motion'; // Import motion
import type { VocabCard, CardRarity } from './types';
import { Swords, Shield, HelpCircle, Zap, Eye } from 'lucide-react'; // Import Lucide icons

interface CardProps {
  card: VocabCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  revealed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const RARITY_STYLES: Record<CardRarity, { border: string; glow: string; bg: string }> = {
  common: {
    border: 'border-gray-400',
    glow: 'shadow-gray-400/50',
    bg: 'bg-gradient-to-br from-gray-700 to-gray-800', // Darker base for common
  },
  uncommon: {
    border: 'border-emerald-400', // Green
    glow: 'shadow-emerald-400/50',
    bg: 'bg-gradient-to-br from-emerald-700 to-emerald-800',
  },
  rare: {
    border: 'border-blue-400',
    glow: 'shadow-blue-400/50',
    bg: 'bg-gradient-to-br from-blue-700 to-blue-800',
  },
  epic: {
    border: 'border-purple-400',
    glow: 'shadow-purple-400/50',
    bg: 'bg-gradient-to-br from-purple-700 to-purple-800',
  },
  legendary: {
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/50 animate-pulse',
    bg: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600',
  },
  mythic: {
    border: 'border-pink-400',
    glow: 'shadow-pink-400/50 animate-pulse',
    bg: 'bg-gradient-to-br from-pink-600 via-purple-500 to-blue-600',
  },
};

const ABILITY_ICONS: Record<string, JSX.Element> = { // Using JSX.Element for Lucide icons
  confuse: <HelpCircle size={40} strokeWidth={1.5} />,
  shield: <Shield size={40} strokeWidth={1.5} />,
  surprise: <Zap size={40} strokeWidth={1.5} />,
  specialist: <GraduationCap size={40} strokeWidth={1.5} />, // Assuming GraduationCap is available
  scout: <Eye size={40} strokeWidth={1.5} />,
};

const CEFR_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500',
  A2: 'bg-blue-500',
  B1: 'bg-amber-500',
  B2: 'bg-violet-500',
};

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  revealed = true,
  size = 'medium',
}) => {
  const rarityStyle = RARITY_STYLES[card.rarity];
  
  const sizeClasses = {
    small: 'w-24 h-36 text-xs',
    medium: 'w-28 h-40 text-sm', // Adjusted for mobile-first
    large: 'w-36 h-52 text-base', // Adjusted for mobile-first
  }[size];
  
  return (
    <motion.div
      initial={false} // Prevent initial animation on first render if part of a list
      animate={selected ? { scale: 1.05, y: -8, boxShadow: rarityStyle.glow } : { scale: 1, y: 0, boxShadow: 'none' }} // Subtle lift for selected
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={!disabled && onClick ? { scale: 0.98 } : {}} // Tap feedback
      className={`
        ${sizeClasses}
        relative rounded-xl border-4 ${rarityStyle.border}
        ${rarityStyle.bg}
        shadow-lg
        transition-all duration-300
        ${selected ? 'border-primary' : ''} {/* Highlight border with primary color when selected */}
        ${!disabled && onClick ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      {revealed ? (
        <>
          {/* CEFR Badge */}
          <div className={`absolute top-2 right-2 ${CEFR_COLORS[card.cefrLevel]} text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm`}>
            {card.cefrLevel}
          </div>
          
          {/* Word */}
          <div className="absolute top-8 left-0 right-0 px-3">
            <p className="text-white font-bold text-center uppercase tracking-wide truncate text-lg"> {/* Larger text */}
              {card.word}
            </p>
          </div>
          
          {/* Translation */}
          <div className="absolute top-16 left-0 right-0 px-3">
            <p className="text-white/80 text-sm text-center truncate"> {/* Larger text */}
              {card.translation}
            </p>
          </div>
          
          {/* Ability Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent"> {/* Use accent color for ability icon */}
            {ABILITY_ICONS[card.ability] || <HelpCircle size={40} strokeWidth={1.5} />} {/* Fallback for specialist */}
          </div>
          
          {/* Stats */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-sm"> {/* text-sm for stats */}
            {/* Power (Attack) */}
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full"> {/* Rounded-full for stat badges */}
              <Swords size={16} className="text-red-400" /> {/* Lucide Swords icon */}
              <span className="text-white font-bold">{card.power}</span>
            </div>
            
            {/* Defence */}
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full"> {/* Rounded-full for stat badges */}
              <Shield size={16} className="text-blue-400" /> {/* Lucide Shield icon */}
              <span className="text-white font-bold">{card.defence}</span>
            </div>
          </div>
        </>
      ) : (
        // Card back
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-card/80 rounded-xl shadow-inner"> {/* Themed card back, inner shadow */}
          <div className="text-6xl text-primary/50">🎴</div> {/* Themed card back icon */}
        </div>
      )}
      
      {/* Holographic effect for Mythic cards */}
      {card.rarity === 'mythic' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}
    </motion.div>
  );
};
```

### `VocabClashGame` (`src/games/vocab-clash/VocabClashGame.tsx`)

**Design Specs**:

*   **Overall Container**: `min-h-screen bg-background text-foreground p-4 relative overflow-hidden`.
    *   Add a subtle background gradient `bg-gradient-to-br from-background via-card/50 to-background opacity-50` behind content.
*   **HP Bars**:
    *   Container: `max-w-md mx-auto mb-6`.
    *   Bar: `w-full h-3 bg-card/60 rounded-full overflow-hidden shadow-inner`.
    *   Fill: `h-full bg-red-500` (opponent) / `bg-success` (player). Animate `width` with `transition-all duration-300`.
    *   Labels: `text-sm font-bold text-foreground` for names, `text-sm text-muted` for HP count.
*   **Round Indicator**: `text-base text-muted mb-4 text-center`.
*   **Battle Arena**:
    *   Container: `flex justify-center items-center gap-4 min-h-[180px] max-w-md mx-auto mb-6`. Reduced min-height for mobile.
    *   Empty Slot: `w-28 h-40 border-2 border-dashed border-muted/50 rounded-xl flex items-center justify-center shadow-inner`. Use a themed dashed border.
    *   "VS" Text: `text-3xl font-bold text-primary`.
*   **Player Hand**:
    *   Title: `h3` `text-lg font-bold mb-4 text-center`.
    *   Hand Display: `flex justify-center gap-2 mb-6 flex-wrap`. Reduced gap for mobile.
*   **Play Button**:
    *   `px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-md`.
    *   `active`: `bg-primary hover:bg-primary/90 shadow-glow-sm`.
    *   `disabled`: `bg-card/60 text-muted cursor-not-allowed`.
*   **Results Modal**:
    *   Container: `fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md`.
    *   Content Card: `max-w-sm mx-4 px-6 py-8 rounded-2.5xl shadow-2xl text-white text-center`.
        *   `winner == 'player'`: `bg-gradient-to-br from-success to-blue-600`.
        *   `winner == 'opponent'`: `bg-gradient-to-br from-destructive to-purple-600`.
    *   Icon: `text-6xl mb-4`. Use `Trophy` for victory, `Skull` for defeat (Lucide icons).
    *   Title: `h2` `text-3xl font-bold mb-4`.
    *   Stats: `space-y-2 mb-6 text-base`.
    *   Buttons: `flex gap-2`.
        *   `Play Again`: `bg-card text-foreground font-bold text-lg rounded-xl shadow-md`.
        *   `Share`: `bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-md`.

**Code Snippet (`src/games/vocab-clash/VocabClashGame.tsx`)**:

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion, AnimatePresence
import { Card } from './Card';
import { initializeBattle, playRound, aiSelectCard, generateAIDeck } from './battle-engine';
import { getRandomCards } from './data/card-database';
import { generateShareCard } from './share';
import type { VocabCard, BattleState, Language } from './types';
import { hapticPress, hapticVictory, hapticDefeat } from '@/lib/haptics'; // Import haptics

// Import Lucide icons
import { Award, Skull, Swords } from 'lucide-react';

interface VocabClashGameProps {
  language: Language;
  playerDeck?: VocabCard[];
  difficulty?: 'easy' | 'medium' | 'hard';
  onGameOver?: (winner: 'player' | 'opponent', shareText: string) => void;
}

export const VocabClashGame: React.FC<VocabClashGameProps> = ({
  language,
  playerDeck,
  difficulty = 'medium',
  onGameOver,
}) => {
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Initialize battle
  useEffect(() => {
    const pDeck = playerDeck || getRandomCards(language, 12);
    const oDeck = generateAIDeck(difficulty, language);
    const initialState = initializeBattle(pDeck, oDeck);
    setBattle(initialState);
  }, [language, difficulty, playerDeck]); // Added playerDeck to deps

  // Handle card selection
  const handleCardSelect = (card: VocabCard) => {
    if (animating || !battle || battle.winner) return;
    hapticPress(); // Haptic feedback on card selection
    setSelectedCard(card.id === selectedCard?.id ? null : card);
  };
  
  // Play a round
  const handlePlayCard = async () => {
    if (!selectedCard || !battle || animating) return;
    
    setAnimating(true);
    hapticPress(); // Haptic feedback on play
    
    // AI selects its card
    const aiCard = aiSelectCard(battle.opponentHand, battle.round);
    
    // Play the round
    const newState = playRound(battle, selectedCard, aiCard);
    
    // Animate the clash
    await new Promise(resolve => setTimeout(resolve, 1500)); // Shorter animation
    
    setBattle(newState);
    setSelectedCard(null);
    setAnimating(false);
    
    // Check if game is over
    if (newState.winner) {
      if (newState.winner === 'player') hapticVictory();
      else hapticDefeat();
      setShowResults(true);
      const shareText = generateShareCard(newState, language);
      onGameOver?.(newState.winner, shareText);
    }
  };
  
  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground text-xl animate-pulsefast">Loading battle...</div> {/* Themed, animated */}
      </div>
    );
  }
  
  const languageFlag = {
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
  }[language];
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card/50 to-background opacity-50" />

      {/* Header: HP Bars */}
      <div className="max-w-md mx-auto mb-6 relative z-10"> {/* max-w-md, smaller mb */}
        {/* Opponent HP */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1"> {/* Smaller mb */}
            <span className="text-sm font-bold">Opponent</span>
            <span className="text-sm text-muted">{battle.opponentHP}/20 HP</span>
          </div>
          <div className="w-full h-3 bg-card/60 rounded-full overflow-hidden shadow-inner"> {/* Thinner bar, themed bg */}
            <motion.div
              className="h-full bg-destructive transition-all duration-300" // Themed destructive color
              style={{ width: `${(battle.opponentHP / 20) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Round indicator */}
        <div className="text-center text-sm text-muted mb-4"> {/* Themed muted text */}
          Round {battle.round} / {battle.maxRounds}
        </div>
        
        {/* Player HP */}
        <div>
          <div className="flex justify-between items-center mb-1"> {/* Smaller mb */}
            <span className="text-sm font-bold">You</span>
            <span className="text-sm text-muted">{battle.playerHP}/20 HP</span>
          </div>
          <div className="w-full h-3 bg-card/60 rounded-full overflow-hidden shadow-inner"> {/* Thinner bar, themed bg */}
            <motion.div
              className="h-full bg-success transition-all duration-300" // Themed success color
              style={{ width: `${(battle.playerHP / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Battle Arena */}
      <div className="max-w-md mx-auto mb-6 relative z-10"> {/* max-w-md, smaller mb */}
        <div className="flex justify-center items-center gap-4 min-h-[180px]"> {/* Smaller gap, min-h */}
          {/* Opponent's played card */}
          {battle.playedCards.opponent ? (
            <Card card={battle.playedCards.opponent} size="large" revealed={true} />
          ) : (
            <div className="w-28 h-40 border-2 border-dashed border-muted/50 rounded-xl flex items-center justify-center shadow-inner"> {/* Themed empty slot */}
              <span className="text-4xl text-muted">🎴</span>
            </div>
          )}
          
          {/* VS */}
          <div className="text-3xl font-bold text-primary">VS</div> {/* Themed, smaller text */}
          
          {/* Player's played card */}
          {battle.playedCards.player ? (
            <Card card={battle.playedCards.player} size="large" revealed={true} />
          ) : (
            <div className="w-28 h-40 border-2 border-dashed border-muted/50 rounded-xl flex items-center justify-center shadow-inner"> {/* Themed empty slot */}
              <span className="text-4xl text-muted">🎴</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Player Hand */}
      <div className="max-w-md mx-auto relative z-10"> {/* max-w-md */}
        <h3 className="text-lg font-bold mb-4 text-center">Your Hand</h3>
        <div className="flex justify-center gap-2 mb-6 flex-wrap"> {/* Smaller gap, smaller mb */}
          {battle.playerHand.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => handleCardSelect(card)}
              selected={selectedCard?.id === card.id}
              disabled={animating}
              size="medium" // Ensure medium size
            />
          ))}
        </div>
        
        {/* Play button */}
        <div className="flex justify-center">
          <motion.button
            whileTap={{ scale: 0.98 }} // Tap feedback
            onClick={handlePlayCard}
            disabled={!selectedCard || animating}
            className={`
              px-6 py-3 rounded-xl font-bold text-lg
              transition-all duration-300 shadow-md
              ${selectedCard && !animating
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm' // Themed primary
                : 'bg-card/60 text-muted cursor-not-allowed' // Themed disabled
              }
            `}
          >
            {animating ? 'Clashing...' : 'Play Card'}
          </motion.button>
        </div>
      </div>
      
      {/* Results Modal */}
      <AnimatePresence>
        {showResults && battle.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className={`
              max-w-sm mx-4 px-6 py-8 rounded-2.5xl shadow-2xl text-white text-center
              ${battle.winner === 'player'
                ? 'bg-gradient-to-br from-success to-blue-600' // Themed success gradient
                : 'bg-gradient-to-br from-destructive to-purple-600' // Themed destructive gradient
              }
            `}>
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="text-6xl mb-4"
              >
                {battle.winner === 'player' ? <Award size={60} strokeWidth={1.5} /> : <Skull size={60} strokeWidth={1.5} />}
              </motion.div>
              <h2 className="text-3xl font-bold mb-4"> {/* Smaller mb */}
                {battle.winner === 'player' ? 'Victory!' : 'Defeat'}
              </h2>
              
              <div className="space-y-2 mb-6 text-base"> {/* Smaller mb, text-base */}
                <div className="flex justify-between">
                  <span>Your HP:</span>
                  <span className="font-bold">{battle.playerHP}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Opponent HP:</span>
                  <span className="font-bold">{battle.opponentHP}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Rounds:</span>
                  <span className="font-bold">{battle.round - 1}/{battle.maxRounds}</span>
                </div>
              </div>
              
              <div className="flex gap-2"> {/* Smaller gap */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()} // Simple reload for now
                  className="flex-1 py-3 bg-card text-foreground font-bold text-lg rounded-xl hover:bg-card/90 transition-colors shadow-md" // Themed card button
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const shareText = generateShareCard(battle, language);
                    // This should ideally use ShareCard component
                    // For now, using window alert as a fallback for demo
                    alert(`Share this: \n${shareText}`);
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors shadow-md" // Themed primary button
                >
                  Share
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## 9. Micro-Interactions & Animation

All animations should use `framer-motion` for consistency and performance.

*   **Global `spring` preset**: Most UI elements and interactive feedback should use a `type: 'spring', stiffness: 200, damping: 25` for a responsive, tactile feel.
*   **Staggered Entry**: For lists of items (e.g., onboarding options, game cards, word tiles), use `custom` props with `delay` to create a pleasing staggered appearance.
*   **Hover/Tap Effects**:
    *   `whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-glow-sm)' }}` for subtle lift and glow.
    *   `whileTap={{ scale: 0.98 }}` for a "squash" effect on press.
*   **Visibility Toggle**: For conditional elements (e.g., "One Away" toast, explanations), use `AnimatePresence` with `initial={{ opacity: 0, y: -10 }}` and `exit={{ opacity: 0, y: -10 }}`.
*   **Haptics Integration**:
    *   Ensure every significant interaction (tap, selection, correct, wrong, victory, defeat, shuffle) has a corresponding haptic feedback using the `haptic` utility.
    *   `hapticCombo` should escalate with streak level.
    *   `hapticTimerWarning` for time-sensitive games.
*   **Celebrations**: For game victory/defeat, use a more elaborate animation sequence (e.g., multiple elements scaling, rotating, fading) potentially combined with confetti/particle effects (though be mindful of performance for the latter).

## 10. Mobile-First Concerns & Telegram-Specific UX

These have been integrated into the component designs.

*   **Safe Area Handling**: By using `min-h-screen` and `p-4` (or similar padding on containers), the design implicitly respects safe areas. The sticky header (`GameShell`) also accounts for Telegram's top bar.
*   **48px Minimum Touch Targets**: Button and card sizes have been increased (`p-4`, `p-5`, `h-12 w-12` for icons, `text-base` minimum for CTA text) to ensure easy tapping.
*   **Thumb-zone Optimisation**: Main navigation and primary actions are generally towards the bottom or center of the screen, or accessible via standard Telegram BackButton.
*   **Landscape Handling**: It's recommended to **lock to portrait mode** for simplicity and consistency, especially given the vertical nature of most games and Telegram's UI. This would typically be handled at the OS level or via WebView settings if supported. For a React app within a WebView, it's often implicit or controlled by the Telegram client itself.
*   **Keyboard Avoidance**:
    *   When an input field (like a chat input in a future feature) is present, Telegram Mini Apps typically handle keyboard avoidance by resizing the WebView, and `viewportStableHeight` in `tg` utility can help measure the available space. The current games don't have text input in main game flow, so this is less critical here.
*   **Scroll Behavior**: `overflow-y-auto` on main content areas to allow scrolling where needed, while `overscroll-behavior: none` in `index.css` prevents pull-to-refresh on iOS, which can interfere with game interactions.
*   **Telegram `MainButton`**:
    *   The `MainButton` is powerful for primary CTAs. For this redesign, I've opted to use prominent in-app buttons (e.g., "Submit", "Play Card") as they offer more visual customisation and animation flexibility.
    *   However, `MainButton` could be used for a clear "Back to Menu" or "Continue" after a game result if desired, especially if the screen is cluttered. For now, a dedicated button is assumed.
*   **Back Button Behavior**: Handled by `GameShell` using `tg.showBackButton()`, which is the correct approach.
*   **Theme Switching**: Addressed by strictly using Tailwind's `var(--tg-theme-...)` colours. The `applyTheme()` method in `telegram.ts` ensures CSS variables are set.
*   **Reduced Viewport Height**: All designs prioritize vertical scrolling and compact layouts to accommodate the Telegram chrome.

---

## 11. Priority Order

Here's the recommended implementation order for maximum impact and a structured workflow:

1.  **Phase 1: Design System Foundation (Highest Priority)**
    *   Update `tailwind.config.js` with new colours, border radii, shadows, and animations.
    *   Implement `hexToRgba` utility and ensure `src/telegram.ts` properly sets RGB values for glow effects.
    *   Install `lucide-react`.
    *   This is fundamental and affects everything else.

2.  **Phase 2: Core Shared Components (High Priority)**
    *   Redesign `src/components/StreakBadge.tsx`.
    *   Redesign `src/components/ShareCard.tsx`.
    *   Redesign `src/components/TutorCTA.tsx`.
    *   Update `src/components/GameShell.tsx` (applies to all game screens).
    *   These components are reused and will immediately elevate the feel of multiple screens.

3.  **Phase 3: Onboarding Flow (Critical First Impression)**
    *   Redesign `src/components/OnboardingFlow.tsx`.
    *   This is the user's first experience; making it polished is crucial for retention.

4.  **Phase 4: Game Hub / Menu Screen (Primary Navigation)**
    *   Redesign the menu section within `src/App.tsx`.
    *   This is where users choose games, so it needs to be engaging and clear.

5.  **Phase 5: Connections Game (Most Prominent Existing Game)**
    *   Redesign `src/games/connections/WordTile.tsx`.
    *   Redesign `src/games/connections/CategoryReveal.tsx`.
    *   Redesign `src/games/connections/ConnectionsGame.tsx`.
    *   Connections is often a flagship game, so a polished experience here is important.

6.  **Phase 6: Spell Cast Game**
    *   Redesign `src/games/spell-cast/HexGrid.tsx`.
    *   Redesign `src/games/spell-cast/SpellCastGame.tsx`.
    *   This game has unique UI challenges (hex grid) that need careful implementation.

7.  **Phase 7: Speed Clash Game**
    *   Redesign `src/games/speed-clash/SpeedClashGame.tsx`.
    *   Focus on the time pressure and rapid feedback loop.

8.  **Phase 8: Vocab Clash Game (Most Complex Redesign)**
    *   Redesign `src/games/vocab-clash/Card.tsx`.
    *   Redesign `src/games/vocab-clash/VocabClashGame.tsx`.
    *   This is the most involved, requiring a full mobile-first overhaul of a card battler UI.

9.  **Phase 9: Animation & Polish Pass (Ongoing & Final)**
    *   Continuously refine `framer-motion` animations, ensuring smooth transitions and performance.
    *   Verify haptic feedback integration across all interactions.
    *   Perform thorough testing on various mobile devices (especially Android) for performance and responsiveness.
    *   Review overall aesthetic and consistency.

This detailed plan provides a clear roadmap for achieving a world-class UI/UX redesign for the TutorLingua Telegram Mini App.
