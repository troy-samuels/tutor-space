# Code Quality Review: De-Vibing the Codebase

> A systematic approach to identifying and remediating AI-generated code patterns

## Executive Summary

This document outlines the findings from a comprehensive code quality audit and provides actionable steps to transform this codebase from "vibe coded" to production-grade. The assessment identified **7 critical**, **12 high**, and **20+ medium** priority issues across security, architecture, type safety, and frontend quality.

---

## Table of Contents

1. [Assessment Methodology](#assessment-methodology)
2. [Critical Issues (Fix Immediately)](#critical-issues)
3. [Architecture Problems](#architecture-problems)
4. [Type Safety Violations](#type-safety-violations)
5. [Frontend Quality Issues](#frontend-quality-issues)
6. [Code Quality Infrastructure](#code-quality-infrastructure)
7. [Action Plan by Priority](#action-plan-by-priority)
8. [Verification Checklist](#verification-checklist)

---

## Assessment Methodology

The review analyzed three dimensions:

1. **Architecture & Structure** - File organization, module boundaries, dependencies
2. **Frontend Components** - React patterns, state management, accessibility, performance
3. **Backend & Data Layer** - API security, type safety, error handling, database patterns

### "Vibe Code" Indicators Searched For

- Bloated single files (1000+ lines)
- Duplicated helper functions across files
- `as any` type assertions
- Inconsistent error handling patterns
- Missing authentication/authorization
- Console.log spam (production debugging)
- Over-engineered simple solutions
- Missing edge case handling

---

## Critical Issues

### 1. Missing Authentication on Sensitive Endpoints

**Severity**: CRITICAL
**File**: `app/app/api/student-detail/route.ts:4-18`

```typescript
// CURRENT: No auth check - anyone can fetch any student's data
export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  const detail = await getStudentDetailData(studentId);
  return NextResponse.json(detail);
}
```

**Impact**: Unauthorized access to student PII (names, emails, learning data)

**Fix**:
```typescript
export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = url.searchParams.get("studentId");

  // Verify ownership or tutor relationship
  const hasAccess = await verifyStudentAccess(session.user.id, studentId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const detail = await getStudentDetailData(studentId);
  return NextResponse.json(detail);
}
```

---

### 2. Race Condition in Message Counting (TOCTOU)

**Severity**: CRITICAL
**File**: `app/app/api/practice/chat/route.ts:251-265`

```typescript
// CURRENT: Time-of-check-time-of-use vulnerability
if ((session.message_count || 0) + 2 > maxMessages) {
  return NextResponse.json({ error: "Limit reached" }, { status: 400 });
}
// Between check and update, another request can slip through
const { data } = await adminClient
  .from("student_practice_sessions")
  .update({ message_count: (session.message_count || 0) + 2 })
  // ...
```

**Impact**: Users can exceed message limits with concurrent requests

**Fix**: Use database constraint + atomic update
```sql
ALTER TABLE student_practice_sessions
ADD CONSTRAINT max_messages_check CHECK (message_count <= 100);
```

---

### 3. Missing Input Validation on Audio Uploads

**Severity**: HIGH
**File**: `app/app/api/practice/audio/route.ts:38-56`

```typescript
// CURRENT: Accepts any file type, wrong duration calculation
const audioFile = formData.get("audio") as File | null;
const language = formData.get("language") as string || "en-US"; // Silent default
const mimeType = formData.get("mimeType") as string || audioFile?.type;
// No MIME validation, no language validation
```

**Fix**:
```typescript
const ALLOWED_MIMES = new Set(['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg']);
const ALLOWED_LANGUAGES = new Set(['en-US', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'ja-JP']);

if (!ALLOWED_MIMES.has(mimeType)) {
  return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
}
if (!ALLOWED_LANGUAGES.has(language)) {
  return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
}
```

---

## Architecture Problems

### The Big 6 Files (All Violate Single Responsibility)

| File | Lines | Problem |
|------|-------|---------|
| `lib/repositories/bookings.ts` | 1,959 | Data access + business logic mixed |
| `lib/actions/bookings/create.ts` | 1,628 | Payment, email, calendar, validation in one |
| `lib/actions/types.ts` | 933 | Type dumping ground for all domains |
| `lib/repositories/marketplace.ts` | 927 | Query builder + domain logic |
| `lib/actions/student-connections.ts` | 900 | Search, requests, approvals mixed |
| `lib/actions/student-auth.ts` | 885 | All auth flows in single file |

### Decomposition Strategy

**bookings.ts (1,959 lines) → 4 files**:
```
lib/repositories/bookings/
├── queries.ts      # Pure SELECT queries
├── mutations.ts    # INSERT/UPDATE/DELETE
├── validators.ts   # Business validation logic
└── index.ts        # Barrel export
```

**types.ts (933 lines) → 5 files**:
```
lib/types/
├── calendar.ts
├── bookings.ts
├── students.ts
├── progress.ts
└── index.ts
```

---

### Duplicated Helper Functions

**Issue**: `requireTutor()` and `requireStudent()` implemented 3+ times

**Found in**:
- `lib/actions/student-timeline.ts:11-46`
- `lib/actions/bookings/helpers.ts`
- `lib/actions/auth/helpers.ts`

**Fix**: Consolidate to `lib/auth/guards.ts`:
```typescript
export async function requireTutor(): Promise<TutorSession> {
  const session = await getServerSession();
  if (!session?.user?.role === 'tutor') {
    throw new AuthError('Tutor access required');
  }
  return session as TutorSession;
}

export async function requireStudent(): Promise<StudentSession> {
  const session = await getServerSession();
  if (!session?.user?.role === 'student') {
    throw new AuthError('Student access required');
  }
  return session as StudentSession;
}
```

---

### Scattered Student Actions

**Current state**: 11 `student-*.ts` files PLUS `students/` subdirectory with 9 files

**Consolidation plan**:
```
lib/actions/students/
├── auth.ts         # Login, signup, password reset
├── connections.ts  # Tutor search, connection requests
├── billing.ts      # Payment methods, invoices
├── lessons.ts      # Bookings, homework, progress
├── settings.ts     # Profile, preferences, avatar
└── index.ts
```

---

## Type Safety Violations

### `as any` Usage (57 files affected)

**Worst offenders**:
- `app/api/practice/chat/route.ts:369,477,548`
- `app/api/practice/audio/route.ts:348,375`
- `lib/calendar/busy-windows.ts`
- `lib/actions/bookings/create.ts`

**Current pattern**:
```typescript
// BAD: Bypasses TypeScript completely
(err as any).code = "DATABASE_ERROR";
const currentTokens = (session as any).tokens_used || 0;
```

**Fix with Zod validation**:
```typescript
import { z } from 'zod';

const SessionSchema = z.object({
  id: z.string().uuid(),
  tokens_used: z.number().default(0),
  message_count: z.number().default(0),
});

const session = SessionSchema.parse(rawSession);
// Now session.tokens_used is properly typed
```

---

### Inconsistent Error Responses

**Current state**: Different shapes across routes
- `/api/practice/chat` returns `{ error, code, requestId }`
- `/api/practice/audio` returns `{ error, code }`
- `/api/booking/check-slot` returns `{ error }`

**Fix**: Standardize in `lib/api/responses.ts`:
```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  code: ApiErrorCode;
  message?: string;
  requestId?: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: code, message, requestId: crypto.randomUUID() },
    { status }
  );
}
```

---

## Frontend Quality Issues

### Oversized Components

| Component | Lines | Split Into |
|-----------|-------|------------|
| `components/marketing/site-preview.tsx` | 1,316 | `ThemePreview`, `SectionRenderer`, `FontStackProvider` |
| `components/students/HomeworkTab.tsx` | 1,200 | `HomeworkAssignmentForm`, `SubmissionList`, `SubmissionReviewer` |
| `components/dashboard/calendar-page-client.tsx` | 909 | Extract `useCalendarState` hook, separate view components |
| `components/student/AIPracticeChat.tsx` | 870 | Extract `useAIPracticeState`, `MessageList`, `AudioRecorder` |

---

### State Management Fragmentation

**File**: `components/student/AIPracticeChat.tsx`
**Issue**: 15+ useState calls for related concepts

```typescript
// CURRENT: Fragmented state
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [isEnded, setIsEnded] = useState(false);
const [feedback, setFeedback] = useState(null);
const [latestPronunciation, setLatestPronunciation] = useState(null);
const [usage, setUsage] = useState(null);
const [failedMessage, setFailedMessage] = useState(null);
const [upgradeUrl, setUpgradeUrl] = useState(null);
const [endSessionError, setEndSessionError] = useState(null); // Redundant!
const [showLimitOverlay, setShowLimitOverlay] = useState(false);
const [streamingContent, setStreamingContent] = useState("");
const [streamingCorrections, setStreamingCorrections] = useState([]);
```

**Fix with useReducer**:
```typescript
type ChatState = {
  messages: Message[];
  input: string;
  status: 'idle' | 'loading' | 'streaming' | 'ended' | 'error';
  error: string | null;
  streaming: {
    content: string;
    corrections: Correction[];
  };
  feedback: Feedback | null;
  pronunciation: PronunciationResult | null;
};

type ChatAction =
  | { type: 'SET_INPUT'; input: string }
  | { type: 'START_LOADING' }
  | { type: 'STREAM_CHUNK'; content: string; corrections?: Correction[] }
  | { type: 'MESSAGE_COMPLETE'; message: Message }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'END_SESSION'; feedback: Feedback };

const [state, dispatch] = useReducer(chatReducer, initialState);
```

---

### Accessibility Gaps

**Issue**: 0 uses of `aria-label`, `role`, `tabIndex` in most components

**Example fix for icon buttons**:
```typescript
// BEFORE
<button onClick={handleDelete}>
  <X className="h-3 w-3" />
</button>

// AFTER
<button
  onClick={handleDelete}
  aria-label={`Remove ${label}`}
  title={`Remove ${label}`}
>
  <X className="h-3 w-3" aria-hidden="true" />
</button>
```

---

### Performance Anti-Patterns

**Issue**: Missing `useMemo`/`useCallback`, inline functions in render

```typescript
// BEFORE: Inline function recreated every render
{items.map((item) => (
  <button onClick={() => handleSelect(item.id)}>  {/* New function each render */}
    {item.name}
  </button>
))}

// AFTER: Memoized callback
const handleItemSelect = useCallback((id: string) => {
  handleSelect(id);
}, [handleSelect]);

{items.map((item) => (
  <ItemButton key={item.id} item={item} onSelect={handleItemSelect} />
))}
```

---

## Code Quality Infrastructure

### Console.log Spam

**Current state**: 884 files contain `console.log/warn/error`

**Fix**: Create structured logger at `lib/logger.ts`:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel || 'info'];

export const logger = {
  debug: (message: string, context?: object) => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(JSON.stringify({ level: 'debug', message, ...context, timestamp: new Date().toISOString() }));
    }
  },
  info: (message: string, context?: object) => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(JSON.stringify({ level: 'info', message, ...context, timestamp: new Date().toISOString() }));
    }
  },
  // ... warn, error
};
```

Add ESLint rule:
```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

---

### Missing Constants Layer

**Issue**: Magic numbers/strings scattered throughout

**Fix**: Create `lib/constants/`:
```typescript
// lib/constants/limits.ts
export const LIMITS = {
  PAGINATION_DEFAULT: 20,
  PAGINATION_MAX: 100,
  FILE_UPLOAD_MAX_BYTES: 10 * 1024 * 1024, // 10MB
  AUDIO_MAX_BYTES: 25 * 1024 * 1024, // 25MB
  MESSAGE_MAX_LENGTH: 4000,
  PRACTICE_SESSION_MAX_MESSAGES: 100,
} as const;

// lib/constants/api.ts
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;
```

---

### CSP Hardening

**File**: `next.config.ts:111-129`
**Issue**: `unsafe-eval` and `unsafe-inline` defeat CSP purpose

**Current**:
```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' ..."
```

**Fix**: Identify which scripts need `unsafe-eval` and use nonces instead:
```typescript
// Generate nonce in middleware
const nonce = crypto.randomBytes(16).toString('base64');
response.headers.set('x-nonce', nonce);

// In CSP header
`script-src 'self' 'nonce-${nonce}' https://js.stripe.com;`
```

---

## Action Plan by Priority

### Week 1: Critical Security
- [x] Add auth to `/api/student-detail/route.ts`
- [x] Add auth to `/api/practice/audio/route.ts`
- [ ] Fix TOCTOU race condition with database constraint
- [x] Add input validation for audio uploads

### Week 2-3: Architecture Decomposition
- [x] Split `lib/repositories/bookings.ts` into 4 files
- [x] Split `lib/actions/types.ts` into 5 domain files
- [x] Consolidate `requireTutor()`/`requireStudent()` to single location
- [x] Merge 11 `student-*.ts` files into `students/` directory

### Week 3-4: Type Safety
- [ ] Create Zod schemas for all API request/response types
- [ ] Replace all `as any` with runtime validation
- [ ] Add ESLint rule: `@typescript-eslint/no-explicit-any: "error"`
- [x] Standardize error response format

### Week 4-5: Frontend Quality
- [ ] Split 4 oversized components (site-preview, HomeworkTab, calendar-page, AIPracticeChat)
- [ ] Refactor AIPracticeChat to useReducer
- [ ] Add `aria-label` to all icon buttons
- [ ] Add `useCallback`/`useMemo` to high-render components

### Week 5-6: Infrastructure
- [x] Create `lib/logger.ts` with structured logging
- [x] Create `lib/constants/` with centralized values
- [ ] Harden CSP (remove unsafe-eval, unsafe-inline)
- [ ] Replace console.log with logger calls

### Week 6-7: Testing & Documentation
- [x] Add integration tests for critical API endpoints
- [ ] Add JSDoc to complex business logic functions
- [ ] Run accessibility audit with axe-core

---

## Verification Checklist

After each change, verify:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm test

# Build
npm run build

# Security audit
npm audit
```

### Manual Checks
- [ ] All API endpoints require appropriate authentication
- [ ] No `any` types in modified files
- [ ] Error responses follow standard format
- [ ] Components have proper accessibility attributes
- [ ] No console.log statements (except logger module)

---

## Appendix: Files Reference

### Critical Priority Files
```
app/app/api/student-detail/route.ts
app/app/api/practice/chat/route.ts
app/app/api/practice/audio/route.ts
```

### Architecture Refactor Files
```
app/lib/repositories/bookings.ts (1,959 lines → split)
app/lib/actions/bookings/create.ts (1,628 lines → split)
app/lib/actions/types.ts (933 lines → split)
app/lib/actions/student-*.ts (11 files → consolidate)
```

### Frontend Refactor Files
```
app/components/marketing/site-preview.tsx (1,316 lines)
app/components/students/HomeworkTab.tsx (1,200 lines)
app/components/dashboard/calendar-page-client.tsx (909 lines)
app/components/student/AIPracticeChat.tsx (870 lines)
```

### New Files to Create
```
app/lib/auth/guards.ts
app/lib/logger.ts
app/lib/constants/limits.ts
app/lib/constants/api.ts
app/lib/api/responses.ts
app/lib/types/calendar.ts
app/lib/types/bookings.ts
app/lib/types/students.ts
app/lib/types/progress.ts
```
