# TutorLingua Exercise Catalogue

**Enterprise-grade exercise database for language learning**

## 📊 Overview

- **1,200 total exercises** across 12 languages
- **100 exercises per language** (20 per difficulty level)
- **5 difficulty levels**: Beginner, Elementary, Intermediate, Upper-Intermediate, Advanced
- **6 exercise types**: Multiple Choice, Fill-in-the-Blank, Translate, Word Order, Listening, Conversation
- **15+ topics**: Greetings, Food & Drink, Travel, Shopping, Family, Work, Health, Weather, Directions, Hobbies, Culture, Daily Routine, Emotions, Technology, Education

## 🌍 Supported Languages

| Code | Language | Native Name | Exercises | Script | Notes |
|------|----------|-------------|-----------|--------|-------|
| `es` | Spanish | Español | 100 | Latin | Spanish/Latin American culture |
| `fr` | French | Français | 100 | Latin | French culture |
| `ja` | Japanese | 日本語 | 100 | Hiragana/Katakana/Kanji | Mixed scripts by level |
| `de` | German | Deutsch | 100 | Latin | German culture |
| `it` | Italian | Italiano | 100 | Latin | Italian culture |
| `pt` | Portuguese | Português | 100 | Latin | Portuguese/Brazilian culture |
| `ko` | Korean | 한국어 | 100 | Hangul | Korean culture |
| `zh` | Mandarin | 中文 | 100 | Simplified Chinese | Pinyin in explanations |
| `ar` | Arabic | العربية | 100 | Arabic (RTL) | Arabic culture |
| `nl` | Dutch | Nederlands | 100 | Latin | Dutch culture |
| `ru` | Russian | Русский | 100 | Cyrillic | Russian culture |
| `en` | English | English | 100 | Latin | British/American culture |

## 📁 File Structure

```
exercise-catalogue/
├── README.md                 # This file
├── types.ts                  # TypeScript interfaces
├── languages.ts              # Language metadata
├── index.ts                  # Main API exports
├── scoring.ts                # XP and scoring logic
├── assessment.ts             # Placement test exercises
├── build-catalogue.py        # Generator script (used to create exercises)
└── exercises/
    ├── es.ts                # Spanish exercises
    ├── fr.ts                # French exercises
    ├── ja.ts                # Japanese exercises
    ├── de.ts                # German exercises
    ├── it.ts                # Italian exercises
    ├── pt.ts                # Portuguese exercises
    ├── ko.ts                # Korean exercises
    ├── zh.ts                # Mandarin exercises
    ├── ar.ts                # Arabic exercises
    ├── nl.ts                # Dutch exercises
    ├── ru.ts                # Russian exercises
    └── en.ts                # English exercises
```

## 🚀 Usage

### Import the catalogue

```typescript
import {
  getExercises,
  getExerciseById,
  getRandomExerciseSet,
  getAvailableLanguages,
  getTopicsForLanguage,
  calculateSessionScore,
  getAssessmentExercises
} from '@/app/lib/exercise-catalogue';
```

### Get exercises

```typescript
// Get all Spanish beginner exercises
const beginnerSpanish = getExercises('es', 'beginner');

// Get intermediate French translation exercises
const frenchTranslate = getExercises('fr', 'intermediate', 'translate');

// Get shopping-related German exercises
const germanShopping = getExercises('de', undefined, undefined, 'shopping');

// Get 10 random intermediate Spanish exercises
const randomSet = getRandomExerciseSet('es', 'intermediate', 10);

// Get a specific exercise by ID
const exercise = getExerciseById('es-beg-mc-001');
```

### Get metadata

```typescript
// Get all available languages
const languages = getAvailableLanguages();
// Returns array of Language objects with code, name, nativeName, flag, levels

// Get topics for a language
const spanishTopics = getTopicsForLanguage('es');
// Returns array of TopicCategory
```

### Scoring

```typescript
import { calculateSessionScore, calculateXpReward } from '@/app/lib/exercise-catalogue';

// Calculate session score
const exercises = getRandomExerciseSet('es', 'beginner', 10);
const answers = [
  { exerciseId: 'es-beg-mc-001', isCorrect: true, timeMs: 5000 },
  { exerciseId: 'es-beg-mc-002', isCorrect: false, timeMs: 12000 },
  // ... more answers
];

const score = calculateSessionScore(exercises, answers, 3); // 3 = streak
// Returns: { totalXp, correctAnswers, totalQuestions, accuracy, timeBonus, streakBonus }

// Calculate XP for a single exercise
const xp = calculateXpReward(exercise, 8000, 2); // 8s time, 2 streak
```

### Assessment/Placement Tests

```typescript
import { getAssessmentExercises, calculateAssessmentResult } from '@/app/lib/exercise-catalogue';

// Get placement test exercises
const assessmentExercises = getAssessmentExercises('es');

// Calculate suggested level from results
const result = calculateAssessmentResult('es', assessmentExercises, answers);
// Returns: { language, correctAnswers, totalQuestions, suggestedLevel, score }
```

## 🎯 Exercise Types

### 1. Multiple Choice
Student selects one correct answer from 4 options.
```typescript
{
  type: 'multiple-choice',
  prompt: 'How do you say "Hello" in Spanish?',
  options: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
  correctIndex: 0
}
```

### 2. Fill in the Blank
Student completes a sentence by selecting or typing the correct word.
```typescript
{
  type: 'fill-blank',
  sentence: 'Yo ___ estudiante',
  blankOptions: ['soy', 'eres', 'es', 'son'],
  blankCorrectIndex: 0,
  correctAnswer: 'soy'
}
```

### 3. Translate
Student translates a phrase from English to target language (or vice versa).
```typescript
{
  type: 'translate',
  sourceText: 'Thank you',
  targetText: 'Gracias',
  acceptedAnswers: ['Gracias', 'gracias']
}
```

### 4. Word Order
Student arranges scrambled words in correct order.
```typescript
{
  type: 'word-order',
  words: ['es', 'nombre', 'Mi', 'María'],
  correctOrder: ['Mi', 'nombre', 'es', 'María']
}
```

### 5. Listening
Student hears audio and selects meaning (audio simulation for now).
```typescript
{
  type: 'listening',
  prompt: 'You hear: "¿Cómo estás?" What does this mean?',
  options: ['How are you?', 'Where are you?', 'Who are you?', 'Why are you?'],
  correctIndex: 0
}
```

### 6. Conversation
Open-ended response to conversational prompt.
```typescript
{
  type: 'conversation',
  aiMessage: '¡Hola! ¿Cómo estás?',
  suggestedResponse: '¡Hola! Estoy bien, gracias. ¿Y tú?'
}
```

## 📚 Difficulty Levels

| Level | XP | Focus |
|-------|-----|-------|
| **Beginner** | 10 | Basic vocabulary, greetings, numbers, colors, present tense |
| **Elementary** | 15 | Short sentences, basic past/future, common phrases, daily activities |
| **Intermediate** | 20 | Complex sentences, all tenses, idioms, work/travel contexts |
| **Upper-Intermediate** | 30 | Subjunctive/conditional, nuanced vocab, cultural expressions, formal/informal |
| **Advanced** | 40 | Complex grammar, literary references, professional language, subtle distinctions |

## 🎨 Topics Covered

- **Greetings**: Hello, goodbye, introductions
- **Food & Drink**: Ordering, ingredients, meals
- **Travel**: Directions, transportation, hotels
- **Shopping**: Buying, prices, clothing
- **Family**: Relatives, relationships, home
- **Work**: Jobs, office, business
- **Health**: Body parts, illness, doctor
- **Weather**: Seasons, conditions, temperature
- **Directions**: Navigation, locations, landmarks
- **Hobbies**: Sports, music, leisure activities
- **Culture**: Traditions, holidays, customs
- **Daily Routine**: Morning, evening, schedule
- **Emotions**: Feelings, expressions, reactions
- **Technology**: Computers, phones, internet
- **Education**: School, learning, subjects

## ⚙️ XP System

```typescript
// Base XP by level
beginner: 10
elementary: 15
intermediate: 20
upper-intermediate: 30
advanced: 40

// Bonuses
timeBonus: up to 20% for fast answers (under 30s)
streakBonus: 5% per streak level (max 50%)

// Total XP = Base + Time Bonus + Streak Bonus
```

## 🔄 Integration Example

```typescript
// In a practice session component
import { getRandomExerciseSet, calculateSessionScore } from '@/app/lib/exercise-catalogue';

function PracticeSession({ language, level }) {
  const [exercises] = useState(() => 
    getRandomExerciseSet(language, level, 10)
  );
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentExercise = exercises[currentIndex];

  const handleAnswer = (answer) => {
    const isCorrect = checkAnswer(currentExercise, answer);
    setAnswers([...answers, {
      exerciseId: currentExercise.id,
      isCorrect,
      timeMs: Date.now() - startTime
    }]);
    
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      const score = calculateSessionScore(exercises, answers, userStreak);
      showResults(score);
    }
  };

  return <ExerciseRenderer exercise={currentExercise} onAnswer={handleAnswer} />;
}
```

## 🌐 Linguistic Accuracy

- ✓ All exercises use proper grammar, accents, and characters
- ✓ Spanish: Proper use of accents (é, ñ, ü, etc.)
- ✓ French: Accents (é, è, ê, ç, etc.) and elisions
- ✓ Japanese: Appropriate mix of hiragana, katakana, kanji by level
- ✓ Korean: Proper Hangul
- ✓ Mandarin: Simplified Chinese with pinyin in explanations
- ✓ Arabic: Arabic script, RTL support
- ✓ Russian: Cyrillic script
- ✓ German: Umlauts (ä, ö, ü, ß)
- ✓ Cultural context: References appropriate holidays, foods, customs

## 📝 Notes for Developers

### Expanding the Catalogue

To add more exercises to a language:
1. Open `/exercises/[language].ts`
2. Add new exercise objects following the CatalogueExercise interface
3. Ensure linguistic accuracy and cultural appropriateness
4. Maintain distribution across levels and types

### Generator Script

The `build-catalogue.py` script was used to generate the initial catalogue structure. It can be modified to:
- Add new languages
- Generate additional exercises
- Update exercise patterns

### Type Safety

All exercises are strongly typed using the `CatalogueExercise` interface. TypeScript will catch:
- Missing required fields
- Invalid exercise types
- Incorrect enum values

## 🎓 Pedagogical Design

Exercises are designed with progressive difficulty:

1. **Beginner**: Recognition and recall
   - Multiple choice with obvious distractors
   - Simple vocabulary
   - Present tense only

2. **Elementary**: Basic application
   - Common phrases and patterns
   - Introduction to past/future
   - Practical scenarios

3. **Intermediate**: Complex application
   - Multiple tenses
   - Longer sentences
   - Real-world contexts

4. **Upper-Intermediate**: Nuanced understanding
   - Subjunctive mood
   - Formal vs informal register
   - Cultural subtleties

5. **Advanced**: Mastery and sophistication
   - Literary references
   - Professional discourse
   - Idiomatic expressions

## 📊 Quality Metrics

- ✅ 1,200 exercises total
- ✅ 100% distribution across levels (20 per level × 5 levels)
- ✅ All 6 exercise types represented at every level
- ✅ 8+ topics covered per language
- ✅ Proper character encoding for all scripts
- ✅ Culturally appropriate content
- ✅ Grammatical accuracy verified
- ✅ Educational explanations for every exercise

## 🚀 Ready for Production

This catalogue is production-ready and can be used as a drop-in replacement for mock data. All exercises have been generated with attention to linguistic accuracy, cultural appropriateness, and pedagogical soundness.

---

**Generated**: 2025-01-08  
**Total Exercises**: 1,200  
**Languages**: 12  
**Status**: ✅ Production Ready
