# TutorLingua Engineering Standards: The 10x Laws

> **Gold Standard Reference**: The booking flow refactor (`lib/actions/bookings/`) exemplifies all five laws working together. Use it as the canonical implementation pattern.

---

## Quick Reference

| Law | When to Apply | Key Function/Pattern |
|-----|---------------|---------------------|
| **Repository** | All database operations | `lib/repositories/*.ts` |
| **Observability** | All server actions | `getTraceId()`, `logStep()` |
| **Safety** | Create/Payment operations | `withIdempotency()` |
| **Security** | Public/Expensive endpoints | `ServerActionLimiters.*()` |
| **Audit** | Status changes, admin actions | `recordAudit()` |

---

## 1. The Repository Law

### Why
Separation of concerns between **data access** and **business logic**. The action layer orchestrates workflows; the repository layer handles database operations.

### Principle
> *"Server actions never talk to Supabase directly. They always go through repositories."*

### How

**Repository Layer** (`lib/repositories/*.ts`):
- Single source of truth for all database queries
- Encapsulates Supabase client interactions
- Handles SQL/RPC operations, error handling, data transformation
- No business logic, only data operations
- Accepts `SupabaseClient` as dependency injection

**Action Layer** (`lib/actions/*.ts`):
- Orchestrates the business workflow
- Imports and calls repository functions
- Contains business logic (validation, conflict detection, notifications)
- Coordinates between multiple repositories and external services

### Gold Standard Example

**Repository** (`lib/repositories/bookings.ts`):
```typescript
export async function insertBookingAtomic(
  client: SupabaseClient,
  input: CreateBookingInput
): Promise<BookingResult> {
  const { data, error } = await client.rpc("create_booking_atomic", {
    p_tutor_id: input.tutorId,
    p_student_id: input.studentId,
    p_service_id: input.serviceId,
    p_scheduled_at: input.scheduledAt,
    p_duration_minutes: input.durationMinutes,
    // ...
  });

  if (error) throw error;
  return data as BookingResult;
}
```

**Action** (`lib/actions/bookings/create.ts`):
```typescript
import { insertBookingAtomic } from "@/lib/repositories/bookings";

// Action uses repository - no direct Supabase calls
try {
  booking = await insertBookingAtomic(adminClient, {
    tutorId: user.id,
    studentId: input.student_id,
    serviceId: input.service_id,
    scheduledAt: input.scheduled_at,
    // ...
  });
} catch (bookingError) {
  const err = bookingError as { code?: string };
  if (err?.code === "P0001") {
    return { error: "This time slot was just booked." };
  }
  return { error: "We couldn't save that booking." };
}
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **Testability** | Mock repositories independently; test actions without database |
| **Single Source of Truth** | Change a query once, fixes everywhere |
| **Query Optimization** | Parallel queries hidden in repository (`Promise.all()`) |
| **Type Safety** | Strongly-typed inputs and outputs with clear contracts |
| **Maintainability** | Action code reads like business flow, not SQL |

### Key Files
- `lib/repositories/bookings.ts` - Booking data access
- `lib/repositories/audit.ts` - Audit log recording
- `lib/actions/bookings/create.ts` - Uses repository pattern

---

## 2. The Observability Law

### Why
Request tracing, debugging, and production monitoring. Every action should be traceable from start to finish with structured JSON logs.

### Principle
> *"Every request gets a traceId. Every operation gets a logStep. Every error gets context."*

### How

1. **Generate traceId** at action start
2. **Create bound logger** with traceId and actor context
3. **Log each operation step** with `logStep()`
4. **Sanitize sensitive data** before logging
5. **Log errors with context** using `logStepError()`

### Gold Standard Example

```typescript
import {
  getTraceId,
  createRequestLogger,
  logStep,
  logStepError,
  sanitizeInput,
} from "@/lib/logger";

export async function createBookingAndCheckout(params) {
  // 1. Generate trace ID
  const traceId = await getTraceId();

  // 2. Create bound logger
  const log = createRequestLogger(traceId, params.tutorId);

  // 3. Log action start
  logStep(log, "createBookingAndCheckout:start", {
    serviceId: params.serviceId,
    scheduledAt: params.scheduledAt,
    studentEmail: params.student.email,
  });

  try {
    // 4. Log each significant operation
    const booking = await insertBookingAtomic(adminClient, input);
    logStep(log, "createBookingAndCheckout:booking_created", {
      bookingId: booking.id
    });

    // 5. Log success
    logStep(log, "createBookingAndCheckout:success", {
      bookingId: booking.id,
      paymentMethod: "manual"
    });

    return { success: true, bookingId: booking.id };
  } catch (error) {
    // 6. Log errors with context
    logStepError(log, "createBookingAndCheckout:failed", error, {
      serviceId: params.serviceId,
      studentEmail: params.student.email,
    });
    return { error: "Booking failed" };
  }
}
```

### Log Output Format

```json
{
  "level": "info",
  "time": "2026-01-05T14:32:18.123Z",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "tutorId": "user_123abc",
  "step": "createBookingAndCheckout:booking_created",
  "bookingId": "bk_xyz789"
}
```

### Step Naming Convention

Use format: `{actionName}:{substep}`

```
createBookingAndCheckout:start
createBookingAndCheckout:student_lookup
createBookingAndCheckout:booking_created
createBookingAndCheckout:calendar_event_created
createBookingAndCheckout:success
```

### Sensitive Data Protection

Always sanitize before logging:

```typescript
import { sanitizeInput } from "@/lib/logger";

const sanitizedBooking = sanitizeInput(bookingData);
// Fields containing "password", "token", "card", etc. → "[REDACTED]"
```

### Key Files
- `lib/logger.ts` - All logging utilities
- `lib/actions/bookings/create.ts` - Usage example

---

## 3. The Safety Law

### Why
Prevent duplicate bookings and payments when network failures cause client retries. Critical for financial operations.

### Principle
> *"All Create and Payment operations must be idempotent. Same request, same result, executed once."*

### When to Apply
- Public booking creation
- Payment processing
- Student creation during booking
- Package/subscription purchases
- Any operation with financial consequences

### How

1. **Frontend generates `clientMutationId`** (UUID) per submission
2. **Pass to server action** as parameter
3. **Wrap operation with `withIdempotency()`**
4. **Log cache hits** for visibility

### Gold Standard Example

**Frontend**:
```typescript
const clientMutationId = crypto.randomUUID();

const result = await createBookingAndCheckout({
  tutorId: "...",
  serviceId: "...",
  clientMutationId,  // Prevents duplicate bookings on retry
});
```

**Server Action** (`lib/actions/bookings/create.ts`):
```typescript
import { withIdempotency } from "@/lib/utils/idempotency";

export async function createBookingAndCheckout(params: {
  // ...
  clientMutationId?: string;
}) {
  const traceId = await getTraceId();
  const log = createRequestLogger(traceId, params.tutorId);

  // Wrap entire operation with idempotency
  const { cached, response } = await withIdempotency(
    adminClient,
    params.clientMutationId,
    async () => {
      // This block only executes ONCE per clientMutationId
      const booking = await insertBookingAtomic(adminClient, input);
      await sendConfirmationEmails(booking);
      return { success: true, bookingId: booking.id };
    },
    traceId  // For debugging stale reservations
  );

  // Log if this was a cached response
  if (cached) {
    logStep(log, "createBookingAndCheckout:idempotent_hit", {
      clientMutationId: params.clientMutationId,
    });
  }

  return response;
}
```

### How It Works: Reservation Pattern

1. **Atomic Claim**: INSERT row with `status='processing'`
2. **If claimed**: Execute operation, update to `status='completed'` with response
3. **If already exists**: Poll for completion or return cached response
4. **If error**: Delete reservation so retries can succeed

### Database Schema

```sql
CREATE TABLE processed_requests (
  idempotency_key TEXT PRIMARY KEY,
  status TEXT,           -- 'processing' | 'completed'
  response_body JSONB,   -- Cached response
  owner_id TEXT,         -- traceId for debugging
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Key Files
- `lib/utils/idempotency.ts` - Idempotency wrapper
- `lib/actions/bookings/create.ts` - Usage in `createBookingAndCheckout`

---

## 4. The Security Law

### Why
Prevent abuse, DoS attacks, and resource exhaustion on public and expensive endpoints.

### Principle
> *"All public endpoints and expensive operations must be rate-limited. Rate limit BEFORE idempotency check."*

### When to Apply
- Public booking creation
- Authentication (signup, login, password reset)
- Contact form submissions
- Any unauthenticated action
- Operations triggering external APIs (Stripe, AI, email)

### How

1. **Apply rate limiting FIRST** (before expensive operations)
2. **Use pre-configured limiters** from `ServerActionLimiters`
3. **Return early** if rate limit exceeded

### Gold Standard Example

```typescript
import { headers } from "next/headers";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";

export async function createBookingAndCheckout(params) {
  const traceId = await getTraceId();
  const log = createRequestLogger(traceId, params.tutorId);

  // 1. SECURITY LAW: Rate limit FIRST (cheap, fast, stops abuse early)
  const headersList = await headers();
  const rateLimitResult = await ServerActionLimiters.booking(headersList);

  if (!rateLimitResult.success) {
    logStep(log, "createBookingAndCheckout:rate_limited", {});
    return {
      error: rateLimitResult.error || "Too many booking attempts. Please try again later."
    };
  }

  // 2. SAFETY LAW: Then apply idempotency (more expensive)
  const { cached, response } = await withIdempotency(
    adminClient,
    params.clientMutationId,
    async () => {
      // Business logic only runs if both checks pass
      return createBookingLogic();
    },
    traceId
  );

  return response;
}
```

### Pre-Configured Limiters

```typescript
// lib/middleware/rate-limit.ts
export const ServerActionLimiters = {
  // Public booking: 5 per 5 minutes
  booking: (headers) => rateLimitServerAction(headers, {
    limit: 5,
    window: 5 * 60 * 1000,
    prefix: "sa:booking",
  }),

  // Contact form: 3 per 10 minutes
  contact: (headers) => rateLimitServerAction(headers, {
    limit: 3,
    window: 10 * 60 * 1000,
    prefix: "sa:contact",
  }),

  // Access request: 3 per 10 minutes
  accessRequest: (headers) => rateLimitServerAction(headers, {
    limit: 3,
    window: 10 * 60 * 1000,
    prefix: "sa:access",
  }),
};
```

### Execution Order (Critical)

```
1. Rate Limiting    ← Cheap, fast, stops abuse early
2. Idempotency      ← More expensive, prevents duplicates
3. Business Logic   ← Only runs if both checks pass
```

### Key Files
- `lib/middleware/rate-limit.ts` - Rate limiting utilities
- `lib/actions/bookings/create.ts` - Usage example

---

## 5. The Audit Law

### Why
Immutable trail of all administrative and status changes. Required for compliance, debugging, and user dispute resolution.

### Principle
> *"All administrative actions and status changes must be recorded in audit_logs with before/after state."*

### When to Apply
- Booking creation, update, cancellation
- Payment status changes
- Manual payment recording
- Student status changes
- Any action a user might dispute

### How

1. **Capture state before change** (or `null` for creates)
2. **Perform the operation**
3. **Capture state after change**
4. **Record audit with `recordAudit()`**
5. **Include relevant metadata**

### Gold Standard Example

```typescript
import { recordAudit } from "@/lib/repositories/audit";
import { sanitizeInput } from "@/lib/logger";

// After successful booking creation
const sanitizedBooking = sanitizeInput(bookingData);

await recordAudit(adminClient, {
  actorId: user.id,              // Who performed the action
  targetId: booking.id,          // What was affected
  entityType: "booking",         // Entity type
  actionType: "create",          // Action taken
  beforeState: null,             // No previous state for create
  afterState: sanitizedBooking,  // New state (sanitized)
  metadata: {
    studentId: booking.student_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
    serviceId: booking.service_id,
    source: "public_checkout",   // Where the action came from
  },
});
```

### Action Types

| Action Type | When to Use |
|-------------|-------------|
| `create` | New entity created |
| `update` | Entity data modified |
| `update_status` | Status field changed |
| `manual_payment` | Payment marked as received |
| `delete` | Entity deleted (soft or hard) |

### Entity Types

| Entity Type | Examples |
|-------------|----------|
| `booking` | Lesson bookings |
| `student` | Student records |
| `billing` | Payment records |

### Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,       -- Who (tutor/admin)
  target_id TEXT,               -- What entity
  entity_type TEXT NOT NULL,    -- booking, student, billing
  action_type TEXT NOT NULL,    -- create, update, delete
  before_state JSONB,           -- State before change
  after_state JSONB,            -- State after change
  metadata JSONB DEFAULT '{}',  -- Additional context
  created_at TIMESTAMPTZ DEFAULT now()
  -- Table is IMMUTABLE: no updates or deletes allowed
);
```

### Key Files
- `lib/repositories/audit.ts` - Audit recording
- `lib/actions/bookings/create.ts` - Create audit
- `lib/actions/bookings/cancel.ts` - Status change audit

---

## Implementation Checklist

### New Server Action Checklist

- [ ] **Repository Law**: Use repository functions, no direct Supabase calls
- [ ] **Observability Law**: Add traceId, logStep for key operations
- [ ] **Safety Law**: If Create/Payment, wrap with `withIdempotency()`
- [ ] **Security Law**: If public/expensive, add rate limiting FIRST
- [ ] **Audit Law**: If status change/admin action, record audit

### New Repository Function Checklist

- [ ] Accept `SupabaseClient` as first parameter (dependency injection)
- [ ] Return strongly-typed result
- [ ] Handle errors consistently (throw or return null)
- [ ] No business logic, only data operations
- [ ] Add JSDoc comment explaining purpose

### Code Review Checklist

- [ ] TraceId propagated through all log statements?
- [ ] Sensitive data sanitized before logging?
- [ ] Rate limiting applied before expensive operations?
- [ ] Idempotency key accepted for create/payment?
- [ ] Audit log recorded for status changes?
- [ ] Repository functions used (no direct Supabase)?

---

## File Reference

| Purpose | File Path |
|---------|-----------|
| **Repository: Bookings** | `lib/repositories/bookings.ts` |
| **Repository: Audit** | `lib/repositories/audit.ts` |
| **Action: Booking Create** | `lib/actions/bookings/create.ts` |
| **Action: Booking Cancel** | `lib/actions/bookings/cancel.ts` |
| **Logger Utilities** | `lib/logger.ts` |
| **Idempotency Wrapper** | `lib/utils/idempotency.ts` |
| **Rate Limiting** | `lib/middleware/rate-limit.ts` |

---

*Last Updated: 5 January 2026*
