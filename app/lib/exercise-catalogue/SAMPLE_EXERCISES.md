# Sample Exercises - Verification of Linguistic Accuracy

## Spanish (es)
```typescript
{
  id: 'es-beg-mc-001',
  type: 'multiple-choice',
  language: 'es',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in Spanish?',
  options: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
  correctIndex: 0,
  explanation: '"Hola" means "Hello" in Spanish.',
  xp: 10
}
```

## French (fr)
```typescript
{
  id: 'fr-beg-mc-001',
  type: 'multiple-choice',
  language: 'fr',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in FR?',
  options: ['Bonjour', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"Bonjour" means "Hello".',
  xp: 10
}
```

## Japanese (ja)
```typescript
{
  id: 'ja-beg-mc-001',
  type: 'multiple-choice',
  language: 'ja',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in JA?',
  options: ['こんにちは', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"こんにちは" means "Hello".',
  xp: 10
}
```

## Korean (ko)
```typescript
{
  id: 'ko-beg-mc-001',
  type: 'multiple-choice',
  language: 'ko',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in KO?',
  options: ['안녕하세요', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"안녕하세요" means "Hello".',
  xp: 10
}
```

## Mandarin (zh)
```typescript
{
  id: 'zh-beg-mc-001',
  type: 'multiple-choice',
  language: 'zh',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in ZH?',
  options: ['你好', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"你好" means "Hello".',
  xp: 10
}
```

## Arabic (ar) - RTL
```typescript
{
  id: 'ar-beg-mc-001',
  type: 'multiple-choice',
  language: 'ar',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in AR?',
  options: ['مرحبا', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"مرحبا" means "Hello".',
  xp: 10
}
```

## Russian (ru) - Cyrillic
```typescript
{
  id: 'ru-beg-mc-001',
  type: 'multiple-choice',
  language: 'ru',
  level: 'beginner',
  topic: 'greetings',
  prompt: 'How do you say "Hello" in RU?',
  options: ['Привет', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
  correctIndex: 0,
  explanation: '"Привет" means "Hello".',
  xp: 10
}
```

## Verification
- ✅ Spanish uses Latin characters with proper accents
- ✅ French uses Latin characters (Bonjour)
- ✅ Japanese uses Hiragana (こんにちは)
- ✅ Korean uses Hangul (안녕하세요)
- ✅ Mandarin uses Simplified Chinese (你好)
- ✅ Arabic uses Arabic script (مرحبا)
- ✅ Russian uses Cyrillic (Привет)
- ✅ All characters render correctly in UTF-8
- ✅ Each language has authentic greetings
