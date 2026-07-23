# Review — `RenewCred_Assignment_reference.txt` vs. `Frontend Engineering Assignment.pdf`

Date: 2026-07-23 · **Revision 2** (recalibrated after peer review — see _Changelog_)

---

## Severity legend

Rev 1 conflated objective requirements with architectural preferences. Every item below is now tagged:

| Tag        | Meaning                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------- |
| **[REQ]**  | The assignment PDF asks for this. Not doing it is a gap against ground truth.            |
| **[PROD]** | Not required by the PDF, but expected of anything claiming "production-ready."           |
| **[PREF]** | Defensible engineering preference. An alternative choice is equally valid if documented. |

The PDF repeatedly says _"the implementation details are entirely your choice"_ and _"you are free to decide."_ Anything tagged **[PREF]** is exactly that — a recommendation, not a correction.

---

## Verdict

**Directionally correct; roughly 60% of the way to what the PDF asks for.** The block-based schema instinct is right and is the highest-value decision in the whole assignment. The gaps cluster in the areas the PDF explicitly says it is _evaluating_, plus two hard deliverables that are absent.

---

## A. Requirement gaps vs. the assignment PDF

**A1. [REQ] Next.js is demoted to a parenthetical.** PDF: _"Preferred Technology Stack → Frontend: Next js, Redux toolkit."_ The doc specifies React+Vite for admin and "React.js (or Next.js)" for public. Use Next.js for the public site. Vite for the admin panel is defensible — it's auth-gated with no SEO need — but say so in the README, or it reads as having skipped the preferred stack. **[PREF]** App Router over Pages Router: better fit for CMS content via `revalidateTag` on publish, but the PDF only says "Next js."

**A2. [REQ] The Redux boundary is the thing being graded, and the doc gets it backwards.** PDF: _"How much application state belongs in Redux versus local component state is part of the design decision we are evaluating."_ Step 6.3 says to dispatch every edit-form action into Redux — that is the anti-pattern being probed. A defensible split:

- Redux: auth/session, page list, publish status, dirty flag
- Server cache: CRUD reads/writes **[PREF]** — RTK Query is the low-cost option since it ships inside `@reduxjs/toolkit` with no extra dependency; hand-rolled thunks are fine if you keep them thin
- Local: editor buffer, modal/toggle/form-field state

Whatever split you pick, write it down in the README. The PDF says it's being evaluated; stating the reasoning is free marks.

**A3. [REQ] Nested lists and mixed content aren't representable in the proposed schema.** The PDF names both explicitly. The doc's list block is `data.items: string[]` — flat, no nesting. The paragraph block is plain text — no inline math, no marks. The `equation` block's "inline" mode renders a `[Formula]:` label as a _standalone block_, which defeats the purpose: inline math means _inside a sentence_. **This is the single biggest correctness gap** and it is objective, independent of editor choice.

**[PREF] on the remedy:** both editors can get there. Editor.js has a nested-list tool and community math plugins; TipTap/ProseMirror has first-class _inline_ nodes, which is the part that's hard — inline math interleaved with prose is a poor fit for a purely block-level model. TipTap is the lower-risk path for that specific requirement, not the only valid one. If you choose Editor.js, budget for a custom inline tool and say so.

**A4. [REQ] Admin responsiveness is unaddressed.** PDF calls out responsive design _for the admin panel_. The doc only mentions responsive styling for the public frontend (Step 7.4).

**A5. [REQ] Two required deliverables are absent.** PDF deliverables list _"Environment variable template"_ and _"Any sample credentials or seed data required to evaluate the application."_ The doc shows `.env.example` in the tree but never lists its keys, and there is no seed script anywhere. Add a seed that creates the admin user and imports the Figma content as real blocks — a reviewer who can't boot the app with data sees an empty CMS.

**A6. [REQ] Page hierarchy, routing, and navigation are never modeled.** PDF: manage _"the content displayed throughout the provided frontend."_ That includes the nav menu, footer links, and the page tree — not just page bodies. The schema has a flat `slug` and nothing else. Decide and document: nested slugs vs. flat, a `parentId` tree vs. a separate `Navigation` document, and how the public site's menu is driven from the DB rather than hardcoded. **A hardcoded nav bar on a CMS-driven site is the most visible way to fail the core objective.**

---

## B. Defects in the sample code

| #   | Sev           | Issue                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **[PROD] P1** | `jwt.verify(token, process.env.JWT_SECRET \|\| 'fallback_secret')` — a missing env var silently downgrades to a publicly-known signing key. Validate env at boot and **crash** if `JWT_SECRET` is unset.                                                                                                                                                                                                             |
| B2  | **[PROD] P1** | `data: Mixed, required: true` with **no per-type validation**. `Mixed` is the right storage primitive but must be gated at the API boundary by a discriminated union keyed on `type` (zod or equivalent). The doc mentions zod once in Step 3, then never applies it to the one place it matters. Unvalidated blocks mean the public renderer crashes on read.                                                       |
| B3  | **[PROD] P2** | JWT in `localStorage`. Common and accepted in interview assignments — downgraded from P1 accordingly. It stays above a nit here for one app-specific reason: this system renders admin-authored rich content into a public DOM, so the XSS surface is concrete, not theoretical. httpOnly `SameSite=Strict` cookie is the stronger choice; `localStorage` is acceptable **if the tradeoff is stated in the README.** |
| B4  | [PROD] P2     | No sanitization story. Run KaTeX with `trust: false` (its default — do not enable `\href`), and if any block renders HTML, sanitize server-side before persist _and_ client-side before render.                                                                                                                                                                                                                      |
| B5  | [PROD] P2     | Ordering has two sources of truth — see §E1 for the full argument.                                                                                                                                                                                                                                                                                                                                                   |
| B6  | [PROD] P2     | No rate limiting on `/auth/login`, no `helmet`, no CSP.                                                                                                                                                                                                                                                                                                                                                              |
| B7  | [PREF] P3     | Invalid/expired token returns `403`; the spec-conventional code is `401` — see §E2. Convention polish, not a production issue.                                                                                                                                                                                                                                                                                       |
| B8  | [PROD] P3     | `case 'equation':` declares `const` inside a `switch` without block scope — TDZ/redeclaration hazard across cases. Wrap each case body in `{ }`.                                                                                                                                                                                                                                                                     |

---

## C. Missing from the content model

- **[PROD] Publication state and revision history.** `status: draft \| published \| archived` plus `publishedAt` is table stakes for a CMS — you cannot safely edit a live page without it. Beyond that, **revision history is the strongest single differentiator available here.** The PDF's _"allow the system to evolve over time"_ is pointing at it directly. Cheapest credible version: an append-only `PageRevision` collection storing `{pageId, blocks, authorId, createdAt}` written on every publish, with a restore endpoint. That demonstrates immutable-history thinking without building a diff engine.
- **[REQ-adjacent] Media management.** Every Figma design contains images, and the PDF says all displayed content comes from your APIs — an image whose URL is hardcoded in JSX is content that isn't managed. Needs a real pipeline: upload endpoint, server-side MIME validation (by magic bytes, not extension), size cap, storage outside the webroot or in object storage, a stored `alt` field for accessibility, and an `image` block type. Local-disk volume via Docker is a perfectly good answer for an assignment; say so in the README rather than leaving it implicit.
- **[PROD] SEO/meta fields** on the page schema (title, description, OG) — trivial to add, obviously correct for a public site.
- **[PREF] Roles and permissions.** The PDF only requires login/logout, so single-admin is fully compliant. But a `role: admin \| editor` field plus one authorization middleware is ~20 lines and shows you distinguished _authentication_ from _authorization_ — a distinction the reference doc's `protectRoute` conflates. Worth it only if the core is already done.
- **[PROD] Public read endpoint shape.** `GET /api/v1/pages/:slug` unauthenticated, with cache headers, wired to on-publish revalidation. Public reads must never require a token.
- **[REQ-adjacent] Content inventory pass.** Before writing schema, walk the Figma and map every text region to a block type. Step 1.1 gestures at this; make it a real artifact — it's the evidence that nothing is hardcoded.

---

## D. Missing from the application layer

- **[PROD] Error and loading UX.** The PDF evaluates engineering quality and the reference doc has no story for the states that dominate real usage: loading skeletons, empty states (no pages yet), error states with a recovery action, save-conflict handling, and unsaved-changes warnings on navigate-away. A page builder with no "you have unsaved changes" guard loses user work. Decide explicitly whether saves are optimistic (fast, needs rollback) or pessimistic (simpler, honest) — and if optimistic, re-read from the source of truth after write, because optimistic UI will happily show a save that never landed.
- **[PROD] API documentation.** The README is required; OpenAPI/Swagger is not. But a spec served at `/api/docs` materially strengthens a "production-ready" claim and doubles as the reviewer's exploration tool. `swagger-jsdoc` over existing route annotations is a low-cost path.
- **[PROD] Tests.** Not required by the PDF. Block-schema validation tests plus auth-middleware tests are the highest signal-per-minute available against a "production-ready" claim.
- **[PROD] Docker.** Compose needs `depends_on: condition: service_healthy` (the backend will otherwise race the database on cold start), multi-stage builds, a non-root user, and Next's `output: 'standalone'`.
- **[PREF] Single origin.** Three services with no proxy means inheriting CORS. An nginx front or Next rewrites removes the problem instead of configuring around it.

---

## E. Points held under challenge

Two rev-1 criticisms were contested. Both are kept, with the reasoning made explicit.

### E1. The `order` field

**Challenge:** an explicit `order` field is standard, because drag-and-drop, page builders, and reorder APIs all need stable ordering.

**Response — the general principle is right, but doesn't apply to this design.** The objection isn't to ordering metadata; it's to having _two_ sources of truth. The reference embeds `blocks: [BlockSchema]` as an array, and MongoDB preserves array order. Reordering is therefore "reorder the array, PUT the array" — drag-and-drop works without `order` existing. With both present, array index and `order` can silently disagree, and the renderer's `.sort((a,b) => a.order - b.order)` will then contradict what the editor displayed.

An explicit order field genuinely earns its place in two designs the reference doesn't use:

1. **Blocks in a separate collection** — no inherent array order, so ordering must be a column.
2. **Fractional / LexoRank-style indexing** — `order` as a float or sortable string so a single-block move rewrites one row instead of all siblings. This matters at high block counts and is the better long-term design.

Either is a fine choice. Pick one model and commit: embedded array with positional order, _or_ explicit ordering keys. The defect is holding both.

### E2. `403` vs `401` on an invalid token

**Challenge:** both conventions exist in the wild; this isn't a real production issue.

**Response — agreed on impact, held on correctness.** It was tagged P2 in rev 1 and is now P3/[PREF], which matches "not a production issue." But the specs are not ambiguous: RFC 9110 §15.5.2 defines **401** as the request _"lacks valid authentication credentials,"_ and §15.5.4 defines **403** as credentials being _understood but insufficient_. RFC 6750 §3.1 maps `invalid_token` — expired, malformed, or bad-signature — explicitly to **401**, and a compliant 401 carries a `WWW-Authenticate` header.

An expired token is invalid credentials, not insufficient permission. The practical reason to care: a client can distinguish "refresh my token and retry" (401) from "stop, you'll never be allowed" (403). Collapsing both to 403 removes that signal. It costs one character to get right, and auth middleware is read closely by reviewers.

---

## F. What the reference doc gets right

Block-based schema over raw HTML — the single most important call, and it's correct. Decoupled admin/public. `/api/v1` versioning from the start. JWT verification isolated in its own middleware layer. Clean RTK slice structure with proper pending/fulfilled/rejected handling. `BlockRenderer` as a single switch — the right extension point, and adding a block type touches exactly one file.

---

## G. Changelog (rev 1 → rev 2)

**Recalibrated** — rev 1 stated preferences in the register of requirements. All items now carry [REQ]/[PROD]/[PREF] tags.

- TipTap, App Router, and RTK Query reclassified [REQ] → [PREF]; the _underlying_ gap (inline math and nested lists are unrepresentable) remains [REQ], since it holds regardless of editor.
- `localStorage` JWT downgraded P1 → P2 — common and accepted in assignments; app-specific XSS reasoning retained.
- `403`/`401` downgraded P2 → P3/[PREF] with RFC citations.

**Added** — page hierarchy/navigation/slugs (A6, the most significant omission); revision history expanded with a concrete minimal design; media pipeline expanded from a bullet to a full spec; roles/permissions; OpenAPI; error/loading/empty-state UX (§D).

**Held** — `order` field and `403`/`401`, both with reasoning now stated in §E rather than asserted.

---

## Appendix: assignment PDF requirements (extracted)

For traceability, the PDF's stated requirements:

- **Auth** — login + logout; implementation details free.
- **Admin dashboard** — entry point into the CMS; design/functionality at discretion.
- **Content management** — manage all content displayed throughout the provided frontend.
- **Rich content** — long-form text, multiple paragraphs, lists, **nested lists**, tables, mathematical equations, structured documentation, **mixed content**.
- **Public website integration** — content from the backend, not static data.
- **State management** — Redux Toolkit "where appropriate"; the Redux-vs-local split is explicitly evaluated.
- **Responsive design** — the **admin panel** must work across screen sizes.
- **Technical expectations** — no required structure, API conventions, or DB models; organize as it would scale.
- **Documentation** — README with setup, technology choices, architecture overview, assumptions, how to run.
- **Deliverables** — source code, GitHub repo, README, **environment variable template**, **sample credentials / seed data**.
- **Submission** — repo link, setup instructions, credentials, brief explanation of architectural decisions.
- **Preferred stack** — Next.js + Redux Toolkit / Express.js / Docker / database of choice.
