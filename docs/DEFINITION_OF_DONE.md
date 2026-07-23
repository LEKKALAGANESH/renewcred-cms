# Definition of Done

A feature is not done when it renders. It is done when every box below is checked **in the running application**.

Reading the code is not verification. Running it is.

---

## Universal — every change

- [ ] **Functionally complete.** Every control added or touched is wired to a real effect and has been exercised in the running app. Zero placeholder handlers, zero no-op `onClick`.
- [ ] **Persistence verified.** After a write, the value is re-read from the source of truth. Optimistic UI lies; a re-read does not.
- [ ] **No dead code.** Unused components, handlers, state, imports, and fixtures are deleted, not commented out.
- [ ] **`npm run validate` passes** — typecheck, lint, format, tests. A red gate blocks completion regardless of how finished the feature looks.
- [ ] **Zero new console errors** during a manual pass.
- [ ] **Documentation updated** — README, ADR (for anything expensive to reverse), and `DECISIONS.md`.

## Backend changes

- [ ] Every input validated at the boundary with Zod. No `any` on a trust boundary.
- [ ] Every async path has an error branch. No silent failures.
- [ ] Errors return the standard shape with a `requestId`, and never leak stack traces or internals.
- [ ] Correct status codes — `401` for missing/invalid/**expired** credentials, `403` for authenticated-but-forbidden.
- [ ] Auth-relevant events logged through `@renewcred/logger`. No PII, no secrets.
- [ ] No query inside a loop (N+1).
- [ ] New tables have RLS enabled.
- [ ] Unit tests for the logic that can silently be wrong — validation rules, ordinal numbering, token rotation.

## Frontend changes

### The eight states

Every interactive control resolves all eight. Not "CSS will handle it" — decided.

- [ ] Default · [ ] Hover · [ ] Focus (visible ring) · [ ] Active
- [ ] Loading · [ ] Disabled · [ ] Error (with a recovery action) · [ ] Success

### The three data states

Every view that fetches:

- [ ] **Loading** — skeleton, never a blank screen and never `return null`
- [ ] **Empty** — a real designed state, not an empty `<div>`
- [ ] **Error** — a human-readable message plus a retry path

> The Figma shows none of these. They must be designed, not looked up.

### Responsive

- [ ] Verified at **320 · 480 · 768 · 1024 · 1440 · 1920**
- [ ] Verified at **640×320** (landscape phone) — the shortest viewport, which catches overflow that narrow-only testing passes
- [ ] No unintended wrapping; no horizontal page scroll
- [ ] A header/toolbar action that wraps to a second line on mobile is a **P1 bug** — collapse it into an overflow menu
- [ ] Every height-constrained container has a declared overflow path. Unreachable content is a P1 bug: from the user's side, the control does not exist.

### Accessibility — WCAG 2.2 AA

- [ ] Contrast ≥ 4.5:1 for body text. `#9f9f9f` on `#f5f5f5` is **2.43:1** and fails — decorative placeholder only.
- [ ] Full keyboard navigation; focus visible and never obscured
- [ ] Semantic HTML first; ARIA only where semantics run out
- [ ] Touch targets ≥ 44×44px under `@media (any-pointer: coarse)`
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Content visible with JS disabled — no `opacity: 0` base state gated on a script
- [ ] Images have real `alt` text; math has an accessible fallback

### Tokens

- [ ] No hardcoded colours, spacing, radii, or type sizes. Everything from `figma/design-tokens.json`.
- [ ] No hardcoded content. Text, images, nav, and footer come from the API.

---

## Completion verdicts

State these explicitly when claiming a feature is done. A FAIL blocks completion no matter how clean the build is.

```
Functional completeness: N controls — W wired+exercised · I inert · 0 placeholder
  — evidence: <how verified> — VERDICT: PASS/FAIL

Atomic responsiveness: N controls × 6 tiers — C clean · F fixed · 0 open
  — VERDICT: PASS/FAIL
```

Non-interactive changes state `N/A — <reason>` rather than skipping the line.
