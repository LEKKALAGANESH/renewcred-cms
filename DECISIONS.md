# Engineering Decisions Log

Running log kept **during** development, not reconstructed at the end. The brief requires "a brief explanation of the architectural decisions you made" at submission; this file is that deliverable.

Structural decisions expensive to reverse get a full ADR in [`docs/adr/`](docs/adr/). This file holds the running narrative, including smaller calls that do not warrant an ADR — and the interview framing for each.

---

## Step 0 — Foundation · 2026-07-23

### Monorepo on npm workspaces → [ADR-0001](docs/adr/0001-monorepo-npm-workspaces.md)

**Trade accepted:** npm hoisting permits phantom dependencies that pnpm would prevent. Taken knowingly to keep a cold-clone reviewer at `npm install` with no global prerequisite.

**Interview framing:** _"Three units share a block schema that must validate identically on server and client. A drifted copy is exactly how malformed content reaches the database, so one definition was the requirement. I chose npm over pnpm because the evaluator clones cold — I traded strict dependency isolation for zero setup friction, and I know which risk I took."_

### TypeScript strictness beyond `strict: true`

Enabled `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.

**Why:** `noUncheckedIndexedAccess` is the one that matters for this codebase. Content is arrays of blocks all the way down; `blocks[0]` is genuinely `Block | undefined` and pretending otherwise is how a renderer crashes on empty content. `noFallthroughCasesInSwitch` guards the `BlockRenderer` switch specifically.

**Cost:** more explicit narrowing at call sites. Accepted — the alternative is discovering it at runtime.

**Interview framing:** _"`strict` alone still lets `array[i]` lie about being defined. In a system whose entire data model is nested arrays, that is the failure mode I most wanted the compiler to catch."_

### ESLint rules as enforcement, not style

`no-explicit-any`, the `no-unsafe-*` family, `no-floating-promises`, and `no-misused-promises` are errors.

**Why:** the project standard forbids `any` on trust boundaries and requires an error branch on every async boundary. A rule that is not enforced is a preference. `no-floating-promises` in particular catches the un-awaited write whose failure nobody ever sees.

**Note:** `console.log` is a warning, not an error — bootstrap paths run before the logger exists. `console.warn`/`console.error` stay allowed.

### Structured logging with central redaction → [ADR-0007](docs/adr/0007-logging-strategy.md)

**Trade accepted:** the redaction path list needs maintaining; a newly-added secret-bearing field logs in the clear until it is listed.

**Interview framing:** _"Redaction that relies on every call site remembering will fail eventually. Configuring it once means someone who logs the whole request object still cannot leak an authorization header. I also made the logger take an injected destination so the redaction tests exercise the real path list — a test that reimplements the config proves nothing."_

### Fail-fast environment validation

`parseEnv` throws on any missing or invalid variable, naming every offender at once.

**Why:** the pattern being eliminated is `process.env.JWT_SECRET || 'fallback_secret'`, where a missing variable silently downgrades the app to a publicly-known signing key. Crashing at boot is loud and happens before the first request.

**Detail worth noting:** typed as `z.ZodType<TOutput, …>` rather than `z.ZodTypeAny`, because `ZodTypeAny` widens the output to `any` — which would smuggle `any` through the exact boundary the function exists to guard. ESLint's `no-unsafe-return` caught this.

**Interview framing:** _"A fallback secret is not a fallback, it is a published key. The env parser reports every problem at once rather than one per restart — and the type signature had to be tightened because the obvious generic silently returned `any`."_

### `.gitignore` before anything else

**Why:** a Figma personal access token and a 4.3 MB design dump were already in the working tree. `.gitignore` written and verified before the first file was staged. `figma/file.json` and the ~27 MB of renders are excluded and reproducible via `node figma/pull.mjs`; the distilled `design-tokens.json` is committed because it is the reviewed artifact.

**Interview framing:** _"Secrets in git history survive deletion. The cheapest moment to prevent that is before the first commit exists."_

### No `JWT_REFRESH_SECRET` — refresh tokens are opaque, not signed

Access tokens are JWTs signed with `JWT_SECRET`. Refresh tokens are **opaque 256-bit random strings stored hashed** in the sessions table, so there is no second secret to configure.

**Why this is not a shortcut:** a signed refresh JWT is self-validating, which means it cannot be revoked before it expires — logout does not actually log the user out, and a stolen token stays valid for its full lifetime. A DB-backed opaque token costs one lookup per refresh and buys instant revocation, rotation, and **reuse detection**: a replayed token is proof of theft, so the entire session family gets revoked.

**Interview framing:** _"Adding a JWT_REFRESH_SECRET would have implied refresh tokens were JWTs. They are not, deliberately — a self-validating refresh token can't be revoked, so logout becomes a lie. I traded a database round-trip for real revocation and theft detection."_

### No browser-facing Supabase key at all

Not the `service_role` key, and not a publishable/`anon` key either. Express is the only Supabase client; the storage bucket is private and the API issues short-lived signed URLs.

**Why:** the usual advice is "use the anon key in the browser, never service_role." That is correct advice for a client-direct architecture. This is not one — so the stronger position is available: the safest browser credential is the one that does not exist. It also keeps the brief's requirement intact, since the public site must consume content through the API rather than reaching past it.

### API response envelope → [`docs/API_CONVENTIONS.md`](docs/API_CONVENTIONS.md)

Adopted `{ success, data, meta, error }` on the wire, modelled in TypeScript as a **discriminated union on `success`** rather than a flat object with optional fields.

**Why the union:** `{ data?: T; error?: E }` forces a non-null assertion at every call site — the compiler cannot know that `success: true` implies `data` is present. The union makes `if (res.success)` sufficient to narrow. Same bytes on the wire, materially better ergonomics in the clients.

### ULID for request IDs, not UUIDv4

**Why:** ULIDs are lexicographically sortable by creation time, so sorting log lines by request ID sorts them chronologically with no timestamp parsing. Same collision resistance, strictly more useful ordering.

### Storage access goes through a `StorageService` interface

Even though assets are not implemented until roadmap step 11, the constraint is recorded now: **no module outside `StorageService` may call the Supabase Storage SDK.**

**Why record it rather than stub it:** writing the interface before any real call site exists would be guessing at its shape — premature abstraction is worse than duplication. The risk actually worth preventing is Storage calls scattered across controllers, and a written constraint prevents that just as effectively as an empty file, without inventing an API for callers that do not yet exist.

**Interview framing:** _"I recorded the boundary before writing the code, but didn't write the interface until I had call sites to design it against. An abstraction invented before its consumers is a guess."_

### `PORT`, not `API_PORT`

Hosting platforms inject `PORT` and expect the process to bind to it. Naming it anything else means the app works locally and fails on first deploy.

---

## Step 2 — Database · 2026-07-23

### CMS lives in a dedicated `renewcred` schema, not `public`

Supabase's free tier allows two projects and both were already in use, so this project shares a Supabase instance with an unrelated live application (23 tables, real data). Rather than accept the risk or demand a paid upgrade, the CMS is scoped to its own Postgres schema via `?schema=renewcred` on both connection URLs.

**What this buys:** Prisma manages only that schema. Drift detection ignores `public`, so `migrate dev` never proposes resetting the co-tenant's tables. `migrate reset` drops only `renewcred`. The RLS `REVOKE` in `rls.sql` is schema-scoped, so it cannot break the other application's Data API.

**Why it mattered:** without isolation, three separate routine operations were each independently destructive — `migrate dev` would see 23 unknown tables as drift and offer a reset; `REVOKE ALL ON SCHEMA public FROM anon, authenticated` would break the live app instantly with no reset involved; and `db:reset` is a normal part of the workflow.

**Trade accepted:** one extra connection parameter, and `search_path` matters for any raw SQL. Cheap relative to a shared-database accident.

**Interview framing:** _"I had to share a Supabase project with a live app. Rather than treat that as a constraint to work around carefully, I made it structurally safe — a dedicated Postgres schema means the destructive operations physically cannot reach the co-tenant. Isolation beats discipline; discipline fails once."_

### RLS uses FORCE, not just ENABLE

`ENABLE ROW LEVEL SECURITY` alone leaves the table owner exempt. Local testing then passes while the protection does nothing, which is worse than no protection because it produces false confidence. `FORCE` closes it. `ALTER DEFAULT PRIVILEGES` also covers tables created by future migrations, so a new table is never exposed in the window between its migration and the next RLS pass.

### One `.env` at the repo root, loaded via `dotenv-cli`

Prisma resolves `.env` relative to its working directory, which is `apps/api` for a workspace script — so a root `.env` was invisible to it. Options were a second `.env` per workspace or pointing Prisma at the root one. Chose the latter: the reviewer's setup stays a single `cp env.example .env`, and there is one place where a secret can be wrong.

---

### Connection URLs must be percent-encoded — the `P1001` that was not an outage

The configured password contained a literal `@`. A URI parser splits userinfo at a delimiter, so the driver read the host as everything after the _first_ `@`, resolved a hostname that does not exist, and reported `P1001: Can't reach database server`.

**Why it cost time:** `P1001` reads as "the server is down." It was verified not to be — DNS resolved, TCP to both pooler ports was open, and the Supabase control plane reported `ACTIVE_HEALTHY`. The error names the wrong layer, and every instinct it triggers (is the project paused? is the region right? is there a firewall?) investigates the wrong thing.

**How it was isolated:** a raw Postgres wire-protocol probe — `SSLRequest`, then `StartupMessage` — against each port, reading the server's own response instead of the driver's collapsed error.

**Interview framing:** _"The error said the database was unreachable. The database was fine — the connection string was unparseable, so the driver never dialled the right host. I stopped trusting the ORM's error class and spoke the Postgres wire protocol directly, which named the real layer in one step. Percent-encoding is now documented in `env.example` rather than left as folklore."_

### Migrations applied via the control plane when the session pooler is unreachable

`prisma migrate dev` requires `directUrl` — a **session**-mode connection, because migrations need advisory locks and a shadow database that transaction pooling cannot carry. On this network the session pooler (`:5432`) accepts TCP but never completes the Postgres handshake, and the direct host publishes only an `AAAA` record with no IPv6 route available. The transaction pooler (`:6543`) works.

So Prisma had no usable migration endpoint, while the application connection was healthy.

**Resolution — split generation from application:**

1. `prisma migrate diff --from-empty --to-schema-datamodel` generates the migration **offline**, no database required.
2. The committed `migrations/20260723000000_init/migration.sql` is ordinary unqualified Prisma output, so `migrate deploy` works normally on any network with session access.
3. That SQL was applied through the Supabase control plane, wrapped in `CREATE SCHEMA IF NOT EXISTS renewcred; SET search_path TO renewcred;` — the wrapper is deliberately _not_ in the committed file, because Prisma derives the schema from `?schema=` in the URL and a hard-coded `SET` would make the migration non-portable.
4. `_prisma_migrations` was written with the real SHA-256 of the migration file, so Prisma's ledger matches the database rather than drifting from it.

**Trade accepted:** one migration was applied by a path that CI will not use. Mitigated by the checksum being computed from the committed file — if the file is edited, Prisma reports the mismatch instead of silently diverging.

**Interview framing:** _"Prisma's migration engine needs a session connection I did not have, but the migration itself is just SQL. I generated it offline, applied it out-of-band scoped to the right schema, and wrote the checksum ledger so the tooling's view of the world still matched the database. The committed artifact stays portable — the workaround lives in the runbook, not in the migration."_

### Schema isolation verified by assertion, not by inspection

Applying DDL through the control plane defaults to `search_path = public` — the co-tenant's schema. Table counts were captured before and after every DDL step: `public` held 23 tables throughout and `renewcred` went 0 → 8 → 9 (`_prisma_migrations`).

The RLS backstop was checked the same way, by asserting rather than reading: `SET LOCAL ROLE anon`, attempt a read, and raise if it **succeeds**. A test that fails when protection is absent is worth more than one confirming a `pg_class` flag is set.

### `tsx` for the seed — `--experimental-strip-types` cannot resolve `.js` specifiers

The seed ran under neither of its two documented paths. Type-stripping does not map TypeScript's mandatory `.js` import specifiers back to `.ts`, and the compiled output could not run either because the generated Prisma client is `tsc`-excluded and so never reaches `dist/`.

`tsx` is Prisma's documented runner for ESM TypeScript seeds and resolves both. Also fixed: `bcryptjs@2.4.3` is CommonJS, so ESM cannot statically detect its named exports — the default import is destructured at runtime.

**Note:** the seed is idempotent by construction and was verified as such — run twice, identical counts (1 user · 4 standards · 5 versions · 19 navigation items · 10 settings).

---

## Step 3 — Design tokens · 2026-07-23

### The Tailwind preset **replaces** the default theme rather than extending it

`theme.colors`, `theme.spacing`, `theme.fontSize`, `theme.borderRadius`, and `theme.borderWidth` are overridden, not placed under `extend`.

**Why:** with `extend`, `bg-blue-500` and `p-7` keep working. "No hardcoded colours, no magic spacing" then depends on a reviewer noticing — and reviewers notice the colour, never the `p-7`. Replacing the scales makes an off-token value a class that does not exist, so the failure moves from code review to the build. The extracted palette is nine colours and thirteen spacing steps, so nothing legitimate is lost.

**Trade accepted:** a genuinely new value must be added to the token file rather than typed inline. That friction is the point.

**Interview framing:** _"I made the design system enforce itself. Extending Tailwind's theme leaves every escape hatch open and turns token discipline into a code-review chore; replacing it means an off-token class fails to compile. The constraint is the deliverable."_

### Spacing in px, type in rem

Spacing, radii, and layout are pixel-derived from a 1920 canvas, so they stay px and the layout matches the design exactly. Font sizes and line heights are emitted in **rem** so browser font-size preferences still scale the text (WCAG 1.4.4). Fractional line heights from Figma (37.54, 28.15) are kept exact rather than rounded — they are computed leading from a percentage setting, and rounding them shifts every heading's baseline.

### Tokens are hand-authored, with a test that proves they match the extract

`tokens.ts` is written by hand so it can carry types and the usage notes that explain _why_ a token exists. That reintroduces the risk it was meant to remove — a hand copy can drift from its source — so `tokens.test.ts` asserts every value against `figma/design-tokens.json` and fails the build on any divergence.

**This paid for itself immediately.** The first run failed: `label` had been transcribed as weight 400 where the design uses 500 — the style behind nav items and version chips, 34 occurrences. A wrong font weight is invisible in review and produces a build that looks _almost_ right, which is the hardest class of design bug to find later.

**Interview framing:** _"I wanted typed tokens with intent, which meant hand-writing them, which meant they could drift from the design. So I wrote the test that compares them to the extract. It caught a wrong font weight on the very first run — exactly the defect that ships silently and gets noticed in the design review three weeks later."_

### Shadow alpha came from the node tree, not the token extract

The extract recorded shadow _geometry_ only — radius and offset, no colour. Those tokens would have been incomplete, and the gap is the kind that gets filled with a plausible guess. Re-read from `figma/file.json`: `0 0 4px rgba(0,0,0,.25)` and `0 4px 16px rgba(0,0,0,.16)`.

**Noted for later:** the design also uses a Figma `NOISE` effect (7 occurrences) which has no CSS equivalent. It needs a tiled PNG/SVG overlay at implementation time — recorded now so it is not discovered during the pixel-perfect pass.

---

## Step 4 — Design system foundation · 2026-07-23

### A CSS-compilation test, because the token override creates a silent failure mode

Replacing Tailwind's scales means an off-token class is **not an error** — it is a class that generates no CSS. `h-48` type-checks, renders, and satisfies every DOM assertion while doing nothing at all.

Three such defects existed in the first Button implementation, and no existing test could see any of them:

| Class        | Why it emitted nothing                                         | Visible effect                  |
| ------------ | -------------------------------------------------------------- | ------------------------------- |
| `h-48`       | 48 is not a spacing step — the extract counted gaps, not sizes | button collapses to text height |
| `ring-brand` | the palette is nested; the real name is `ring-brand-primary`   | **no focus ring at all**        |
| `border-2`   | `borderWidth` is replaced by the extracted `{1, 1.5}`          | spinner has no visible ring     |

`styles.test.ts` compiles the CSS with PostCSS and asserts that every class the components use produces a rule. It also asserts the guard itself still detects `h-48`, `bg-blue-500`, and `p-7` — a guard that silently stops guarding is worse than none.

**Interview framing:** _"Overriding Tailwind's theme converts off-token values from a review comment into a build error — but only for values that don't exist. A class that merely generates no CSS still passes typecheck, tests, and review; the focus ring was missing entirely and nothing failed. So I compile the CSS in a test and require every class to produce a rule. It found three defects on the first run, one of them an accessibility regression."_

### Control heights are not spacing steps

The extraction counted auto-layout gaps and padding, so element _heights_ never entered the spacing scale — which is why `h-48` did not exist. Added as a separate `controlHeight` scale (40 / 48 / 56, the three control sizes in the design) rather than widening `spacing`, because putting 48 in the spacing scale would also sanction `p-48` and `gap-48`, which the design never uses.

The 44px WCAG target size is likewise kept out of the scale — it is a standards constant, not a design decision — and exposed only as `min-h-touch` / `min-w-touch`.

### The loading button keeps focus

A button that becomes `disabled` while a request is in flight blurs to `<body>` and leaves the tab order, so a keyboard user loses their place on every save. `isLoading` uses `aria-disabled` + a blocked handler instead: focus stays, activation is refused, `aria-busy` announces the state, and the label stays rendered so the button does not resize mid-request.

### `npm run typecheck` can pass on stale state — added `validate:ci`

`tsc --build` is incremental and reported success while `Button.test.tsx` contained five genuine `TS2339` errors; `--force` surfaced them immediately. An incremental gate that can pass on stale build info is not a gate.

Local `validate` stays incremental for speed. `validate:ci` runs `typecheck:ci` (`tsc --build --force`) and is what CI must run.

**Interview framing:** _"My own gate lied to me — the incremental build reported clean while five type errors sat in a file it had decided was up to date. I kept the fast path for the inner loop and made CI run the forced build, because a gate you cannot trust is worse than a slow one."_

### `user-event` v14 must be imported by name under NodeNext

`import userEvent from '@testing-library/user-event'` resolves to the module namespace, not the callable object, so every `userEvent.click` was a `TS2339`. The named export `{ userEvent }` is correct. Recorded because the default import is what almost every tutorial shows.

---

## Pending

- **B12** — custom auth vs Supabase Auth ([ADR-0005](docs/adr/0005-custom-auth-over-supabase-auth.md)). Reversible until roadmap step 6.
- **G2** — admin responsive design has no Figma reference and must be designed.
- **G3** — empty/loading/error states appear nowhere in the design and must be designed.
