# Implementation Guide

## Quick Start

The exercise catalogue is now complete and ready to use in TutorLingua. Here's how to integrate it:

### 1. Import in Your Components

```typescript
// Replace mock-data.ts imports with:
import { getExercises, getRandomExerciseSet } from '@/app/lib/exercise-catalogue';
```

### 2. Update Practice Components

**Before (using mock data):**
```typescript
import { mockExercises } from '@/app/lib/mock-data';
const exercises = mockExercises.filter(ex => ex.language === 'es');
```

**After (using catalogue):**
```typescript
import { getExercises } from '@/app/lib/exercise-catalogue';
const exercises = getExercises('es', 'beginner');
```

### 3. Common Patterns

#### Get Practice Session Exercises
```typescript
// Random set for practice
const sessionExercises = getRandomExerciseSet('fr', 'intermediate', 10);

// Specific topic practice
const travelExercises = getExercises('de', 'intermediate', undefined, 'travel');

// Specific exercise type
const translateExercises = getExercises('es', 'advanced', 'translate');
```

#### Placement Test
```typescript
import { getAssessmentExercises, calculateAssessmentResult } from '@/app/lib/exercise-catalogue';

const assessmentExs = getAssessmentExercises('ja');
// Present to user, collect answers
const result = calculateAssessmentResult('ja', assessmentExs, userAnswers);
console.log(`Suggested level: ${result.suggestedLevel}`);
```

#### Scoring
```typescript
import { calculateSessionScore } from '@/app/lib/exercise-catalogue';

const score = calculateSessionScore(exercises, answers, userStreak);
// Award score.totalXp to user
```

### 4. Type Safety

All functions return strongly-typed objects:

```typescript
import type { CatalogueExercise, Language, DifficultyLevel } from '@/app/lib/exercise-catalogue';

const exercise: CatalogueExercise = getExerciseById('es-beg-mc-001');
const languages: Language[] = getAvailableLanguages();
```

## API Reference

### Core Functions

#### `getExercises(language, level?, type?, topic?)`
Get exercises with optional filters.
```typescript
getExercises('es') // All Spanish
getExercises('es', 'beginner') // Spanish beginner
getExercises('es', 'intermediate', 'translate') // Spanish intermediate translations
getExercises('es', undefined, undefined, 'travel') // All Spanish travel exercises
```

#### `getRandomExerciseSet(language, level, count)`
Get random exercises for practice sessions.
```typescript
getRandomExerciseSet('fr', 'beginner', 10) // 10 random French beginner exercises
```

#### `getExerciseById(id)`
Get specific exercise.
```typescript
getExerciseById('es-beg-mc-001')
```

#### `getAvailableLanguages()`
Get all supported languages.
```typescript
const languages = getAvailableLanguages();
// Returns: [{ code: 'es', name: 'Spanish', nativeName: 'Español', ... }, ...]
```

#### `getTopicsForLanguage(language)`
Get topics available for a language.
```typescript
const topics = getTopicsForLanguage('es');
// Returns: ['greetings', 'food-drink', 'travel', ...]
```

### Scoring Functions

#### `calculateSessionScore(exercises, answers, streak)`
Calculate comprehensive session score.
```typescript
const score = calculateSessionScore(
  exercises,
  [{ exerciseId: 'es-beg-mc-001', isCorrect: true, timeMs: 5000 }, ...],
  3 // streak level
);
// Returns: { totalXp, correctAnswers, totalQuestions, accuracy, timeBonus, streakBonus }
```

#### `calculateXpReward(exercise, timeMs, streak)`
Calculate XP for single exercise.
```typescript
const xp = calculateXpReward(exercise, 8000, 2);
```

#### `determineLevelFromAssessment(correctAnswers, totalQuestions)`
Determine level from assessment results.
```typescript
const level = determineLevelFromAssessment(7, 10);
// Returns: 'intermediate'
```

### Assessment Functions

#### `getAssessmentExercises(language)`
Get placement test exercises.
```typescript
const exercises = getAssessmentExercises('es');
// Returns 10-15 exercises spanning all difficulty levels
```

#### `calculateAssessmentResult(language, exercises, answers)`
Calculate placement test results.
```typescript
const result = calculateAssessmentResult('es', exercises, answers);
// Returns: { language, correctAnswers, totalQuestions, suggestedLevel, score }
```

## Migration from Mock Data

### Step 1: Identify Mock Data Usage

Find all imports of mock-data.ts:
```bash
grep -r "from '@/app/lib/mock-data'" app/
```

### Step 2: Replace Imports

```typescript
// OLD
import { mockExercises } from '@/app/lib/mock-data';

// NEW
import { getExercises } from '@/app/lib/exercise-catalogue';
```

### Step 3: Update Filtering Logic

```typescript
// OLD
const filtered = mockExercises.filter(ex => 
  ex.language === selectedLang && 
  ex.level === selectedLevel
);

// NEW
const filtered = getExercises(selectedLang, selectedLevel);
```

### Step 4: Update Exercise Selection

```typescript
// OLD
const randomExercises = mockExercises
  .filter(ex => ex.language === 'es')
  .sort(() => 0.5 - Math.random())
  .slice(0, 10);

// NEW
const randomExercises = getRandomExerciseSet('es', 'beginner', 10);
```

### Step 5: Test

- Verify all practice sessions work
- Test exercise rendering for all types
- Verify scoring calculations
- Test language selection
- Test difficulty level filtering

## Advanced Usage

### Custom Exercise Selection

```typescript
// Get exercises and apply custom logic
const allSpanish = getExercises('es');
const customSet = allSpanish
  .filter(ex => ex.topic === 'travel' || ex.topic === 'food-drink')
  .filter(ex => ex.level === 'intermediate' || ex.level === 'advanced')
  .slice(0, 15);
```

### Progress Tracking

```typescript
// Track which exercises user has completed
const completedIds = new Set(user.completedExercises);
const availableExercises = getExercises(userLang, userLevel)
  .filter(ex => !completedIds.has(ex.id));
```

### Adaptive Difficulty

```typescript
function getAdaptiveExercises(user) {
  // Start at user's level
  let level = user.currentLevel;
  let exercises = getRandomExerciseSet(user.language, level, 5);
  
  // If user is doing well, add some harder exercises
  if (user.recentAccuracy > 0.85) {
    const nextLevel = getNextLevel(level);
    exercises.push(...getRandomExerciseSet(user.language, nextLevel, 2));
  }
  
  // If struggling, add some easier exercises
  if (user.recentAccuracy < 0.50) {
    const prevLevel = getPreviousLevel(level);
    exercises.push(...getRandomExerciseSet(user.language, prevLevel, 3));
  }
  
  return exercises;
}
```

### Topic-Based Learning Paths

```typescript
const topics = getTopicsForLanguage('fr');
const learningPath = topics.map(topic => ({
  topic,
  beginner: getExercises('fr', 'beginner', undefined, topic),
  elementary: getExercises('fr', 'elementary', undefined, topic),
  // ... etc
}));
```

## Performance Notes

- All exercises are statically imported at build time
- No database queries required
- Filtering is done in-memory (very fast)
- Random selection uses JavaScript's Math.random() (consider seeding for reproducibility)

## Extending the Catalogue

### Adding More Exercises

1. Open `/exercises/[language].ts`
2. Add new exercise objects to the EXERCISES array
3. Follow the CatalogueExercise interface
4. Use the next available ID number for that level/type
5. Ensure linguistic accuracy

### Adding a New Language

1. Create `/exercises/[code].ts`
2. Add 100 exercises following the pattern
3. Add language to `/languages.ts`
4. Add import and spread in `/index.ts`
5. Add assessment exercises to `/assessment.ts`

### Custom Exercise Types

To add a new exercise type:
1. Update `ExerciseType` in `types.ts`
2. Add new fields to `CatalogueExercise` interface
3. Create exercises using the new type
4. Update UI components to render the new type

## Troubleshooting

### "Module not found" errors
Ensure the import path matches your project structure:
```typescript
// Adjust based on your tsconfig paths
import { getExercises } from '@/app/lib/exercise-catalogue';
```

### TypeScript errors
Run type checking:
```bash
npx tsc --noEmit
```

### Missing exercises
Verify the language file exists and is imported in index.ts:
```typescript
// index.ts should have:
import { EXERCISES as XX_EXERCISES } from './exercises/xx';
// And include XX_EXERCISES in ALL_EXERCISES array
```

## Production Checklist

- [ ] All 12 language files present in `/exercises/`
- [ ] Foundation files present (types, languages, index, scoring, assessment)
- [ ] Imports updated from mock-data to exercise-catalogue
- [ ] Exercise rendering works for all 6 types
- [ ] Scoring calculates correctly
- [ ] Language selection shows all 12 languages
- [ ] Level filtering works
- [ ] Topic filtering works
- [ ] Assessment/placement test functional
- [ ] TypeScript compiles without errors
- [ ] Tests pass (if you have tests)

## Support

For questions or issues with the exercise catalogue:
1. Check the README.md for detailed documentation
2. Review this implementation guide
3. Inspect the TypeScript types in types.ts
4. Look at example exercises in any /exercises/[lang].ts file

---

**Catalogue Version**: 1.0  
**Last Updated**: 2025-01-08  
**Total Exercises**: 1,200  
**Production Status**: ✅ Ready
