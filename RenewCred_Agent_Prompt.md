# Agent Operating Prompt — RenewCred CMS Assignment

Replaces the generic "production-grade frontend" mega-prompt. Shorter on purpose: every line below is falsifiable, and nothing instructs the agent to do something it cannot do.

---

## 0. Prerequisite — solve Figma access BEFORE prompting

No coding agent can read a Figma URL. Instructing one to "extract everything" from a link it cannot open invites invented design tokens presented as extracted fact. Establish real access first.

### Option A — REST API (recommended; works on any plan)

1. Figma → Settings → Security → **Generate personal access token** (`figd_…`). Scope: `file_content:read`.
2. Get your file key from the URL: `figma.com/design/<FILE_KEY>/<name>`. **Use your copy's key, not the original's** — copying to your account mints a new key.
3. Store as `FIGMA_TOKEN` and `FIGMA_FILE_KEY` in a local env file that is gitignored.

```bash
# Full node tree — fills, typography, auto-layout, spacing, effects, constraints
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FIGMA_FILE_KEY" > figma/file.json

# Published styles (color + text tokens, if the file defines them)
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FIGMA_FILE_KEY/styles" > figma/styles.json

# Render top-level frames to PNG for visual reference
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/$FIGMA_FILE_KEY?ids=<NODE_IDS>&format=png&scale=2" \
  > figma/images.json
```

Commit `figma/file.json` (or a distilled token extract) to the repo. The agent now reads a local file instead of guessing.

### Option B — Dev Mode MCP server

Figma desktop app exposes selected frames to an MCP-capable agent. Requires the desktop app and a plan that includes Dev Mode. Convenient when available; Option A is the universal fallback.

### Option C — manual

Export every frame as PNG at 2x and attach them to the session. Workable, but the agent reads pixels rather than values — expect approximate spacing and typography.

**Gate:** do not start the build until `figma/file.json` exists and is non-empty, or images are attached. If the agent cannot access the design, it must say so and stop, not proceed on inference.

---

## 1. Persistent project rules

Save as `CLAUDE.md` (Claude Code), `AGENTS.md` (Codex), or `.cursorrules` (Cursor) **in the repo root**. These persist across every session — do not paste them per message.

```markdown
# Project Rules — RenewCred CMS

## What is being graded

This is titled a frontend assignment but is graded on architecture. Priority order:

1. Content modeling for rich content (nested lists, tables, inline + block math, mixed content)
2. The Redux-vs-local-state split — the brief says this is explicitly evaluated
3. Auth, admin CRUD, and the public site consuming the API with zero hardcoded content
4. Docker, seed data, env template, README
5. Visual fidelity to the Figma

Do not spend budget on item 5 while items 1-4 are incomplete.

## Hard deliverables (from the brief — missing any is a fail)

- Source in a GitHub repo
- README: setup, technology choices, architecture overview, assumptions, how to run
- `.env.example` with every key the app reads, no real values
- Seed script creating the admin user and importing Figma content as real content blocks
- Sample credentials documented in the README

## Non-negotiables

- No hardcoded content anywhere in the public site. Text, images, nav links, and footer
  all come from the API. A hardcoded nav bar is the most visible way to fail the brief.
- No hardcoded design values. Colors, spacing, typography, radii, and shadows come from
  tokens derived from `figma/file.json`.
- Fail fast on missing env vars at boot. No `process.env.X || 'fallback'` for any secret.
- Validate every block at the API boundary with a discriminated union keyed on block type.
  `Mixed`/`any` storage is fine; unvalidated writes are not.
- No `any` on trust boundaries. TypeScript strict.
- Every async boundary has a loading state, an error state with a recovery action, and an
  empty state. Blank screens are defects.

## When information is missing

1. Check `figma/file.json`, the brief PDF, and existing code first.
2. If an industry-standard answer exists, implement it and note the assumption in
   `DECISIONS.md`. Do not ask.
3. Only genuine blockers — decisions where a wrong guess makes the work useless — get a
   question. Batch them; never one at a time.
4. Never claim to have read a source you could not access.

## Running decision log

Append to `DECISIONS.md` as you go: decision, alternatives considered, why, tradeoff
accepted. The brief requires an explanation of architectural decisions at submission —
this file is that deliverable, written incrementally rather than reconstructed at the end.
```

---

## 2. Phase prompts

The build is a sequence with human gates, not one prompt. Run these as separate turns.

### Phase 1 — Content model (do this first)

> Read the brief PDF and `figma/file.json`. Produce a content inventory: every distinct
> text region, image, list, table, and equation in the design, mapped to a block type.
> Then design the block schema as a discriminated union — include the nested-list and
> inline-math cases explicitly, since flat `items: string[]` cannot represent either.
> Model page hierarchy, slugs, and navigation as content, not as routing config.
> Output: schema file + inventory table. No other code yet.

**Gate:** can the schema represent a paragraph with inline math mid-sentence, and a
three-level nested list? If not, iterate before writing any application code.

### Phase 2 — Backend

> Implement Express + DB + auth + CRUD against the Phase 1 schema. Boot-time env
> validation. Block validation on every write. Seed script. `.env.example`.

**Gate:** `docker compose up` from clean, seed runs, `curl` a page by slug returns blocks.

### Phase 3 — Admin panel

> Editor, page list, auth flow. State the Redux-vs-local split in `DECISIONS.md` before
> implementing it. Responsive across screen sizes — the brief requires this for the admin
> panel specifically.

**Gate:** create → edit → publish a page containing a nested list and an inline equation,
then re-read it from the API and confirm it round-tripped unchanged.

### Phase 4 — Public site

> Next.js consuming the API. Design tokens from `figma/file.json`. Desktop widths first
> (1920/1440/1280); do not touch tablet or mobile until desktop is approved.

**Gate:** grep the public site for hardcoded strings from the design. Zero hits.

### Phase 5 — Hardening

> Tests on block validation and auth middleware. Accessibility pass. README. Final
> `DECISIONS.md` review.

---

## 3. Verification gates (replace self-scoring)

A model asked to rate its own work 95/100 will report 95/100. Use checks that can fail:

| Gate                 | Command                                                               |
| -------------------- | --------------------------------------------------------------------- |
| Types                | `tsc --noEmit` — zero errors                                          |
| Tests                | `npm test` — block schema + auth middleware pass                      |
| Cold boot            | `docker compose down -v && docker compose up` → seeded app reachable  |
| Round-trip           | Playwright: login → edit block → publish → assert text on public page |
| No hardcoded content | grep public site for design strings — zero hits                       |
| Console              | zero new errors during the Playwright run                             |

Report each as PASS/FAIL with the actual output. "Looks complete" is not a result.

---

## 4. What was removed from the original prompt, and why

| Removed                                              | Reason                                                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| "Extract EVERYTHING from Figma"                      | Agent has no access; the instruction invites fabricated tokens. Replaced by §0.                                               |
| "Pixel-perfect, 99%+ parity"                         | Unmeasurable without a baseline, so it gets asserted rather than achieved — and it is the lowest-weighted axis in this brief. |
| "Score 95/100 before proceeding"                     | Self-graded rubric with no external oracle. Replaced by §3.                                                                   |
| 12 stacked personas                                  | No evidence stacking roles improves output. Sequential review against concrete checklists does.                               |
| ~900 words of adjectives                             | "Everything reusable," "never rush," "feel intentional" do not constrain behavior; they dilute the instructions that do.      |
| "Never stop because of uncertainty" + "never assume" | Direct contradiction. Replaced by the explicit escalation ladder in §1.                                                       |

**Kept from the original:** desktop-first phase gating, the Redux ownership split, zero-hardcoded-values, and the running decision log — the four parts that were both specific and correct.
