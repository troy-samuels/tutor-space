# Codex 10x Code Review — Recap System
*15 Feb 2026, reviewed by GPT-5.3-codex (xhigh reasoning)*

## 🔴 CRITICAL (3)

1. **LLM output not schema-validated before persistence/rendering**
   - `lib/recap/generate.ts:119,121,137` + `app/api/recap/generate/route.ts:78`
   - Code trusts model JSON with unsafe casts — malformed payloads can break UI
   - Fix: Add strict Zod schema for summary + discriminated exercise union, enforce exactly 5 exercises

2. **`/api/recap/generate` is unauthenticated and unthrottled**
   - `app/api/recap/generate/route.ts:27,63`
   - Abuse-prone (cost/DoS) — invokes paid model + service-role writes
   - Fix: Add rate limiting (IP + fingerprint), abuse controls

3. **Student experience can hard-lock on bad content**
   - `components/recap/VocabCards.tsx:77`, `RecapExperience.tsx:122`, `ExerciseStep.tsx:63`
   - Empty vocabulary or invalid exercise shape = no path forward
   - Fix: Add defensive fallbacks, skip buttons, invalid-exercise fallback card

## 🟡 IMPORTANT (12)

4. **`recap_students` upsert resets `recap_count` to 1** instead of incrementing (route.ts:102)
5. **Attempt validation is weak** — impossible scores accepted (score > total)
6. **Attempt submitted on last "Next"** not on results mount (spec deviation) + non-idempotent
7. **`studentFingerprint` never sent** in attempt POST
8. **Answer values are lossy** ("correct"/"wrong" not actual user answer)
9. **No rotateY flip animation or swipe** on vocab cards (spec deviation)
10. **Exercise callback fires before "Next"** (spec says on Next tap)
11. **Word-order feedback incomplete** — misplaced words not individually highlighted
12. **Results thresholds don't match spec** (🎉≥4, 👏≥2, 💪 otherwise)
13. **Error handling leaks internals** — returns raw error.message to client
14. **GET /api/recap/[shortId] maps all errors to 404** — DB errors become false "not found"
15. **Type safety weakened by `as unknown as` casts** — bypasses compile-time guarantees

## 🟢 NICE TO HAVE (3)

16. **Lint warnings** — `<a>` should be `next/link`, hook dependency warning
17. **Nested interactive controls** — button inside button in vocab card (a11y)
18. **Minor perf** — O(n²) answers.find in map, progress bar starts at 0%

## Checks Passed
- ✅ `npm run type-check`
- ✅ `npx next build` (clean)
- ⚠️ ESLint: 2 warnings (not-found.tsx:11, WordOrderExercise.tsx:18)
