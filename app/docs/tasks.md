# TutorLingua Platform Remediation Tasks

**Date**: January 28, 2026
**Source**: Retesting Report by Manus AI
**Status**: Ready for Implementation

---

## Critical: Site Publishing Failure

### Problem
Tutors see "Save failed" error when trying to publish their public profiles, making them undiscoverable to new students.

### Root Cause
The error originates in `studio-editor-client.tsx` during the auto-save flow. Potential causes (in order of likelihood):

1. **Username UNIQUE constraint violation** - Username taken by another tutor
2. **Version conflict** - `_prev_updated_at` mismatch during optimistic concurrency
3. **Missing/invalid username** - Empty or invalid characters
4. **RLS policy violation** - Auth mismatch

### Tasks

- [ ] **Task 1.1**: Add typed error codes to `upsertSiteConfig()` in `lib/actions/tutor-sites/site-config.ts`
  - Return specific error codes: `VERSION_CONFLICT`, `USERNAME_TAKEN`, `INVALID_USERNAME`, `UNKNOWN`
  - Replace generic error returns with typed responses

- [ ] **Task 1.2**: Update `studio-editor-client.tsx` to display specific error messages
  - File: `app/(dashboard)/pages/editor/studio-editor-client.tsx` (lines 196-216)
  - Show user-actionable messages based on error code
  - Add toast notifications for each error type

- [ ] **Task 1.3**: Add retry logic for transient failures
  - Implement 1 automatic retry for version conflicts
  - Add 500ms delay between retries
  - Auto-refresh on persistent version conflicts

### Files to Modify
| File | Changes |
|------|---------|
| `lib/actions/tutor-sites/site-config.ts` | Add typed error responses |
| `app/(dashboard)/pages/editor/studio-editor-client.tsx` | Error handling UI |
| `lib/actions/tutor-sites/publish.ts` | Ensure errors propagate |

---

## Minor: Onboarding Price Field Validation

### Problem
During tutor onboarding, price fields require manual re-entry to be recognized by form validation.

### Root Cause
Three layered problems in `StepLanguagesServices.tsx`:

1. **Premature error clearing** - `updateLocalService()` clears error immediately on input change
2. **Validator inconsistency** - Service prices require `.int()`, package prices allow decimals
3. **Floating-point precision** - `price / 100` conversion can cause precision issues

### Tasks

- [ ] **Task 2.1**: Fix premature error clearing in `StepLanguagesServices.tsx`
  - File: `components/onboarding/steps/StepLanguagesServices.tsx` (lines 166-175)
  - Remove immediate error clearing from `updateLocalService()`
  - Let validation handle error clearing

- [ ] **Task 2.2**: Add `onBlur` validation for price fields
  - Create `validatePriceField()` function for immediate feedback
  - Validate on blur instead of only on submit
  - Clear errors only when input is valid

- [ ] **Task 2.3**: Make package price validator consistent with service validator
  - File: `lib/validators/session-package.ts` (lines 25-27)
  - Add `.int()` requirement to match service validator
  - Update error message: "Use whole dollars (no cents) for package pricing."

### Files to Modify
| File | Changes |
|------|---------|
| `components/onboarding/steps/StepLanguagesServices.tsx` | Fix error clearing, add onBlur validation |
| `lib/validators/session-package.ts` | Add `.int()` to price field |

---

## Verification Checklist

### Site Publishing
- [ ] Log in as tutor (maria.santos.test@example.com / TestPassword123!)
- [ ] Navigate to Pages > Editor
- [ ] Make changes to the site
- [ ] Verify auto-save shows "Saved" status
- [ ] Click "Publish" button
- [ ] Verify site is accessible at public URL
- [ ] Test: Try publishing with taken username → shows specific error
- [ ] Test: Simulate version conflict → auto-retry or clear message

### Price Validation
- [ ] Create new tutor account or use test account
- [ ] Navigate to onboarding Step 3 (Languages & Services)
- [ ] Enter service price (e.g., "50")
- [ ] Tab away from field → validates immediately
- [ ] Clear and re-enter same value → passes without re-entry
- [ ] Try decimal values → shows "Use whole dollars" error
- [ ] Complete onboarding → services created with correct prices

---

## Summary

| Issue | Severity | Files | Est. Lines |
|-------|----------|-------|------------|
| Site Publishing | CRITICAL | 3 | ~50 |
| Price Validation | MINOR | 2 | ~30 |

**Priority**: Fix Site Publishing first - it blocks tutors from being discoverable.
