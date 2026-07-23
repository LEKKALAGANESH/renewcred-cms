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

## Pending

- **B12** — custom auth vs Supabase Auth ([ADR-0005](docs/adr/0005-custom-auth-over-supabase-auth.md)). Reversible until roadmap step 6.
- **G2** — admin responsive design has no Figma reference and must be designed.
- **G3** — empty/loading/error states appear nowhere in the design and must be designed.
