<h1 align="center">RenewCred</h1>

<p align="center">
  A production-grade <strong>standards-library web app</strong> — a document reader with
  numbered sections, inline math, tables, in-document search and versioning, built from a
  Figma design against a strict, self-enforcing design-token system.
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000?logo=next.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="React 18" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-token--locked-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-235%20passing-3FB950">
  <img alt="License" src="https://img.shields.io/badge/license-private-lightgrey">
</p>

---

The shipped product (`apps/web`) is a **Next.js App Router** public site that renders a
standards library — the standard-detail view supports the content types the source Figma
never demonstrates (equations, tables, nested lists) because the brief required them. It is
fully responsive, accessible, and covered by 235 tests, with **zero console errors** across
every route (see the [walkthrough report](docs/WALKTHROUGH_COVERAGE.md)).

## Highlights

- **A real document system** — numbered sections, `role="math"` equations, data tables, and nested lists, driven by a Zod-validated block schema (not hard-coded markup).
- **Self-enforcing design tokens** — the Tailwind preset _replaces_ the default scales, so an off-token colour or spacing value (`bg-blue-500`, `p-7`) simply **fails to compile**. Drift is impossible, not merely discouraged.
- **Accessibility built in** — keyboard-operable menus with focus restoration (WCAG 2.4.3), `aria-current`/`aria-expanded`, live-region form validation, ≥44px touch targets, no horizontal scroll at any breakpoint.
- **Reconstructed vector assets** — the brand wordmark and icons are rebuilt from Figma path geometry (full affine-matrix composition), bypassing the rasterisation quota entirely.
- **Monorepo with typed boundaries** — npm workspaces, project-referenced TypeScript, ADRs for every expensive decision.

## Screenshots

### Standards index & primary navigation

| Standards index (`/standards`)                              | Hover / focus dropdown menu                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| ![Standards index](docs/screenshots/01-standards-index.png) | ![Navigation dropdown](docs/screenshots/07-nav-dropdown.png) |

### Standard detail — sticky sidebar (search · version · TOC) with math, tables & lists

| Detail — sidebar + document                                    | Document body — equation & nested lists                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ![Standard detail](docs/screenshots/02-standard-detail-ev.png) | ![Document body with math](docs/screenshots/03-document-body-math.png) |

### The eight states — empty, coming-soon, 404

| Unpublished standard                                      | Marketing catch-all                                     | Not found (404)                           |
| --------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| ![Empty standard](docs/screenshots/04-empty-standard.png) | ![Coming soon](docs/screenshots/05-marketing-empty.png) | ![404](docs/screenshots/06-not-found.png) |

### Newsletter — client-side validation → success

| Footer + newsletter form                                            | Success state                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| ![Footer and newsletter](docs/screenshots/08-footer-newsletter.png) | ![Newsletter success](docs/screenshots/09-newsletter-success.png) |

### Responsive (mobile)

| Mobile menu (full-width sheet)                      | Mobile index (single column)                          |
| --------------------------------------------------- | ----------------------------------------------------- |
| ![Mobile menu](docs/screenshots/10-mobile-menu.png) | ![Mobile index](docs/screenshots/11-mobile-index.png) |

> A full narrated video walkthrough and a route-by-route coverage report are in
> [`docs/WALKTHROUGH_COVERAGE.md`](docs/WALKTHROUGH_COVERAGE.md).

## What's shipped vs designed

Scope is stated honestly — the repository is a **frontend-complete** slice of a larger CMS
whose backend is designed and scaffolded but not yet wired up.

| Area                                                                                               | Status                                                                   |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **`apps/web`** — public standards site (routing, document reader, states, forms, responsive, a11y) | ✅ **Shipped & tested**                                                  |
| **`packages/*`** — schema, design tokens, UI kit, env validation, logger                           | ✅ **Shipped & tested** (235 tests)                                      |
| **`apps/api`** — Express/Prisma backend (schema, RLS policies, seed)                               | 🟡 **Designed & scaffolded** — not deployed or wired to the web app      |
| Admin panel, live auth, uploads                                                                    | 📋 **Designed** — see the ADRs and [blueprint](docs/PHASE1_BLUEPRINT.md) |

The public site currently reads content from typed **mock adapters** (`apps/web/src/lib/content`),
so it runs with no database or secrets — the adapter seam is where the API drops in later.

## Tech stack

**Web:** Next.js 15 (App Router, SSR/SSG) · React 18 · TypeScript (strict) · Tailwind CSS (token-locked preset)
**Content:** Zod block schema · KaTeX-style math rendering
**Backend (designed):** Express · Prisma · Postgres + row-level security
**Tooling:** npm workspaces · Vitest · ESLint (type-aware) · Prettier · Husky + lint-staged

## Architecture

```
apps/
  web/       Next.js App Router — the shipped public site (SSR/SSG)
  api/       Express + Prisma — backend contract: schema, RLS, seed (scaffolded)
packages/
  schema/    Zod block/section/inline content model — one definition, shared
  tokens/    design tokens → a Tailwind preset that rejects off-token values
  ui/        design-system components (Button, etc.) built on the tokens
  env/       fail-fast environment validation
  logger/    structured logging with enforced secret redaction
```

Content is a three-level model — a recursive **section** tree, an ordered **block** array per
section, and an **inline node** array within text — which is what makes math _inside_ a
sentence expressible. See [ADR-0003](docs/adr/0003-block-based-content-model.md).

Workspace packages are consumed as TypeScript **source** (via `transpilePackages`), so a clean
checkout builds with no pre-compilation step.

## Run it locally

**Prerequisites:** Node ≥ 20.

```bash
npm install

# run the public site (mock content — no database or secrets needed)
npm run dev --workspace apps/web      # http://localhost:3001

# or a production build
npm run build --workspace apps/web
npm run start --workspace apps/web
```

## Testing & quality

```bash
npm run validate        # typecheck → lint → format check → tests (the CI gate)
```

- **235 tests** across the workspaces (Vitest).
- `tsc --build` in strict mode; ESLint with type-aware rules (no `any` on trust boundaries).
- Git hooks: `lint-staged` on pre-commit, `typecheck` on pre-push.

## Deployment

Deploys to **Vercel**. Because the Next app lives in `apps/web`, set the Vercel project's
**Root Directory to `apps/web`**; npm-workspaces install runs from the repo root.

## Documentation

| Document                                                                                                | Contents                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`docs/PHASE1_BLUEPRINT.md`](docs/PHASE1_BLUEPRINT.md)                                                  | content inventory, schema, DB model, API contract, roadmap   |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)                                                                | running engineering-decision log                             |
| [`docs/adr/`](docs/adr/)                                                                                | architecture decision records                                |
| [`docs/WALKTHROUGH_COVERAGE.md`](docs/WALKTHROUGH_COVERAGE.md)                                          | route-by-route walkthrough + coverage report                 |
| [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md)                                              | completion criteria — the eight states, responsiveness, a11y |
| [`docs/API_CONVENTIONS.md`](docs/API_CONVENTIONS.md) · [`docs/DATA_WORKFLOW.md`](docs/DATA_WORKFLOW.md) | API envelope · migrate/seed/RLS workflow                     |

## License

Private — assessment submission.
