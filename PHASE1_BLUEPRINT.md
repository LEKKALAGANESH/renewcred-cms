# Phase 1 — Implementation Blueprint

**Project:** RenewCred CMS · **Date:** 2026-07-23 · **Status:** awaiting approval
**Sources of truth:** `Frontend Engineering Assignment.pdf` (requirements) · `figma/file.json` (design, 4.3 MB node tree) · `figma/frames/*.png` (4 renders)
**No application code has been written.**

---

## ⚠️ Headline finding — read this first

**The Figma design contains zero tables, zero equations, and zero lists.**

Verified programmatically against the full node tree. The entire document contains only these node types:

```
FRAME 427 · VECTOR 301 · TEXT 300 · GROUP 50 · LINE 40 · INSTANCE 38 · RECTANGLE 4
```

No table structures. No math. A regex sweep of all 300+ node names for `table|math|equation|formula|latex|list|bullet|chart|figure` returns **nothing**. Every body paragraph in the design is lorem ipsum under a numbered heading.

Meanwhile the assignment PDF explicitly requires the CMS to handle _"long-form text, multiple paragraphs, lists, nested lists, tables, mathematical equations, structured documentation, mixed content."_

**The two sources disagree, and this is the single most consequential fact in Phase 1.** An agent instructed "the Figma is the source of truth, never invent, achieve pixel-perfect parity" would build a CMS supporting headings and paragraphs only — and fail the assignment's central requirement. The correct reading:

- **Figma governs visual design** — tokens, layout, chrome, spacing, typography.
- **The PDF governs content capability** — the block schema must support content types the design never demonstrates.

The design is a _documentation shell_. The CMS must fill it with content types richer than the mockup shows. §3 and §4 are built to that standard, and §11 tracks it as a formal gap.

---

## 1. Content inventory

### 1.1 What the design actually contains

Four top-level frames, all 1920 wide, one Figma page:

| Frame ID    | Name           | Size        | Role                                      |
| ----------- | -------------- | ----------- | ----------------------------------------- |
| `2190:5138` | Standards      | 1920 × 2383 | Standards **index** — lists all standards |
| `2190:851`  | View Standards | 1920 × 3349 | Standard **detail**, base state           |
| `2190:1073` | View Standards | 1920 × 3349 | Detail + version-history panel            |
| `2190:1310` | View Standards | 1920 × 3349 | Detail + consultation & feedback actions  |

The three detail frames are **states of one page**, not three pages — identical layout, progressively more sidebar content. That is a UI-state distinction, not a content-model one.

### 1.2 Region inventory

Every visible region, with a stable identifier, classification, and parent. `SRC` = where the content comes from at runtime.

#### Global chrome — appears on every page

| ID     | Region                                                                              | Classification                              | Parent | SRC            |
| ------ | ----------------------------------------------------------------------------------- | ------------------------------------------- | ------ | -------------- |
| `G-01` | Logo (RenewCred wordmark)                                                           | asset / brand                               | Header | Settings       |
| `G-02` | Primary nav — Buyers, Suppliers, Climate & Us, Science, Standards, Contact Us       | navigation (2 items have dropdown chevrons) | Header | **Navigation** |
| `G-03` | Registry button                                                                     | CTA                                         | Header | Navigation     |
| `G-04` | Footer link columns — Buyer, Supplier, Climate & Us, Science, Standards, Contact Us | navigation                                  | Footer | **Navigation** |
| `G-05` | Address — "Indiranagar, Bengaluru, Karnataka, INDIA"                                | metadata                                    | Footer | Settings       |
| `G-06` | Email — "yp@renewcred.com"                                                          | metadata                                    | Footer | Settings       |
| `G-07` | Tagline — "There is no time to save the planet"                                     | short text                                  | Footer | Settings       |
| `G-08` | CIN No. + value                                                                     | metadata pair                               | Footer | Settings       |
| `G-09` | Newsletter headline — "🔒 No spam. Just pure climate intelligence."                 | short text                                  | Footer | Settings       |
| `G-10` | Email input + Subscribe                                                             | form                                        | Footer | — (behaviour)  |
| `G-11` | Copyright — "Copyright © 2025 Renewred. All rights reserved."                      | legal text                                  | Footer | Settings       |
| `G-12` | Legal links — Privacy Policy, Terms & Conditions, Support                           | navigation                                  | Footer | Navigation     |
| `G-13` | Back to Top                                                                         | UI control                                  | Page   | — (behaviour)  |

> Note `G-11` reads **"Renewred"** while the logo reads **"RenewCred"**. Recorded as a design typo in §9-B4 — not replicated.

#### Standards index (`2190:5138`)

| ID      | Region                                                    | Classification    | Parent | SRC               |
| ------- | --------------------------------------------------------- | ----------------- | ------ | ----------------- |
| `L-01`  | "Standards" chip w/ logo mark                             | badge             | Hero   | Page              |
| `L-02`  | "RenewCred Standards"                                     | display heading   | Hero   | Page              |
| `L-03`  | Intro paragraph                                           | rich text         | Hero   | Page              |
| `L-04`  | Standard card ×4 — EV, Biochar, Methane, Renewable Energy | repeatable entity | List   | **Standard**      |
| `L-04a` | ↳ Category icon                                           | asset             | Card   | Standard          |
| `L-04b` | ↳ Title                                                   | heading           | Card   | Standard          |
| `L-04c` | ↳ Summary paragraph                                       | rich text         | Card   | Standard          |
| `L-04d` | ↳ "Read more" link                                        | CTA               | Card   | derived from slug |

#### Standard detail (`2190:851` / `1073` / `1310`)

| ID     | Region                                                                                | Classification                      | Parent  | SRC                    |
| ------ | ------------------------------------------------------------------------------------- | ----------------------------------- | ------- | ---------------------- |
| `D-01` | "Standards" chip                                                                      | badge                               | Hero    | static                 |
| `D-02` | Standard title — "EV"                                                                 | display heading                     | Hero    | Standard               |
| `D-03` | Standard description                                                                  | rich text                           | Hero    | Standard               |
| `D-04` | Search field                                                                          | UI control                          | Sidebar | — (behaviour)          |
| `D-05` | Version selector — "v1.0.0 - 12 Jul 2025" ▾                                           | UI control                          | Sidebar | **StandardVersion**    |
| `D-06` | Version chip — "v1.0.0"                                                               | badge                               | Sidebar | StandardVersion        |
| `D-07` | Status line — "Certified - 12 Jul 2025"                                               | metadata                            | Sidebar | StandardVersion        |
| `D-08` | "Public consultation" + "12 May 2025 - 12 Jul 2025"                                   | metadata                            | Sidebar | StandardVersion        |
| `D-09` | "View consultation" link _(state 3 only)_                                             | CTA                                 | Sidebar | StandardVersion        |
| `D-10` | "View Feedback" + "Feedback summary & actions" _(state 3 only)_                       | CTA + caption                       | Sidebar | StandardVersion        |
| `D-11` | **Table of contents** — 1.0, 2.0, 2.1, 2.1.1, 2.1.2, 2.2, 3.0, 3.1, 3.1.1, 3.1.2, 3.2 | nested navigation, 3 levels         | Sidebar | **derived — see §1.3** |
| `D-12` | Numbered section heading — "1.0 Introduction"                                         | heading w/ ordinal                  | Content | Section                |
| `D-13` | Section anchor-link icon (🔗)                                                         | UI control                          | Content | derived                |
| `D-14` | Body paragraphs                                                                       | **rich text — the extension point** | Content | Block                  |
| `D-15` | Section divider rule                                                                  | decoration                          | Content | —                      |
| `D-16` | "BACK TO TOP ↑" (vertical, right rail)                                                | UI control                          | Page    | —                      |

**Nothing in the design is left unclassified.** 259 text nodes reconcile to the regions above.

### 1.3 The critical modelling insight

**The table of contents is not content — it is derived.**

`D-11` shows `1.0 → 2.0 → 2.1 → 2.1.1 → 2.1.2 → 2.2 → 3.0 → 3.1 …`, matching the numbered headings in the body exactly. Storing the TOC as editable content would create a second source of truth that silently drifts the moment an editor inserts a section.

**Decision:** the TOC is computed from the section tree at render time. The ordinals (`2.1.1`) are computed from tree depth and position, never typed by an editor. An editor who drags section 3.0 above 2.0 gets correct renumbering everywhere, for free.

This is the highest-leverage decision in the blueprint and it drives §3's tree-structured content model.

### 1.4 What versioning implies

`D-05` through `D-10` show version selection, a certification date, a public-consultation window, and links to consultation and feedback. **Version history is a visible product feature in this design, not an optional CMS nicety.** A standard has many versions; the reader picks one; each carries its own status and dates. This is modelled as a first-class entity in §5, not bolted on.

---

## 2. Design tokens

Fully extracted to **`figma/design-tokens.json`** with occurrence counts for every value. The file publishes **no shared Figma styles**, so token _names_ are ours; every token _value_ is counted from the node tree. Nothing is invented.

**Typeface:** Work Sans — weights 300/400/500/600.

| Token         | Value            | Uses                                 |
| ------------- | ---------------- | ------------------------------------ |
| `display`     | 72 / 78, w500    | 4                                    |
| `heading`     | 32 / 37.54, w500 | 28                                   |
| `body`        | 20 / 28, w400    | **56 — most-used style in the file** |
| `bodyCompact` | 20 / 24, w400    | 36                                   |
| `label`       | 16 / 24, w500    | 34                                   |
| `meta`        | 14 / 20, w400    | 5                                    |
| `legal`       | 12 / 16, w400    | 16                                   |

**Colour** — 9 distinct fills total, a disciplined palette:

| Token            | Value     | Uses |
| ---------------- | --------- | ---- |
| `text.primary`   | `#2b2c2c` | 167  |
| `surface.card`   | `#ffffff` | 150  |
| `text.secondary` | `#505050` | 57   |
| `brand.primary`  | `#be202e` | 47   |
| `surface.page`   | `#f5f5f5` | 11   |
| `text.muted`     | `#9f9f9f` | 4    |

**Spacing** — clean 4px scale: `2, 4, 8, 12, 14, 16, 20, 24, 40, 64, 80, 104, 160`. The `8px` step dominates (378 uses).

**Radius:** 4, 8, 16, 40, 48, **50 (pill)**, and a `[80,80,0,0]` top-rounded panel.
**Borders:** 1px hairline (955 uses), 1.5px medium.
**Effects:** drop-shadow 4px and 16px/y4; **40px background blur** on the sticky nav; a `NOISE` effect (7 uses).

> ⚠️ `NOISE` has no CSS equivalent. Reproduce with a tiled PNG/SVG grain overlay — flagged in §9-B5.

**Layout:** design width 1920 · content max 1712 · gutter 104 · doc sidebar 292 · doc content 842.

---

## 3. Content model requirements

Driven by the PDF, **not** by the Figma (see headline finding). The model must support:

1. Rich text with inline formatting — bold, italic, links, code
2. Multiple paragraphs
3. **Nested lists to unlimited depth**, ordered and unordered
4. Tables with header rows
5. **Block equations** (own line, centred)
6. **Inline equations mid-sentence** — the requirement that breaks naive block models
7. Images with alt text and captions
8. Callouts / admonitions
9. Structured documentation — the numbered section tree from §1.3
10. Mixed content — all of the above interleaved
11. Extensibility — a new block type must not require migrating existing rows

### 3.1 The inline-math problem

This is where flat block models fail. Consider:

> The baseline emission factor $EF_{grid} = 0.82$ tCO₂/MWh applies to all projects.

This is **one paragraph** containing text, an inline equation, and more text. A model of `{type: 'paragraph', text: string}` plus a sibling `{type: 'equation'}` block cannot express it — the equation would break onto its own line and destroy the sentence.

**Therefore: paragraph content is an array of inline nodes, not a string.** This single decision is what makes requirements 1, 6, and 10 satisfiable.

### 3.2 The nested-list problem

`items: string[]` cannot nest. A list item must be able to contain both inline content _and_ a nested list — recursively, without a depth cap.

### 3.3 Architecture chosen

**A hybrid tree**, because the two problems above have different shapes:

- **Section tree** — recursive, gives §1.3's derived numbering and TOC
- **Block array** within each section — flat, ordered, easy to edit
- **Inline array** within text-bearing blocks — solves §3.1
- **Recursive list items** — solves §3.2

---

## 4. Discriminated union schema

Discriminated on `type` in all three unions. Expressed as Zod; validation runs at the API boundary on every write.

### 4.1 Inline nodes

```ts
const Mark = z.enum(['bold', 'italic', 'code', 'underline', 'strike']);

const InlineText = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(Mark).optional(),
});

const InlineLink = z.object({
  type: z.literal('link'),
  text: z.string(),
  href: z.string().url(),
  external: z.boolean().default(false),
});

const InlineMath = z.object({
  type: z.literal('inlineMath'),
  latex: z.string().min(1), // rendered by KaTeX with trust:false
});

const InlineNode = z.discriminatedUnion('type', [InlineText, InlineLink, InlineMath]);
type InlineNode = z.infer<typeof InlineNode>;
```

| Node         | Required       | Optional   | Rendering                                                      | Extensibility                      |
| ------------ | -------------- | ---------- | -------------------------------------------------------------- | ---------------------------------- |
| `text`       | `text`         | `marks[]`  | `<span>` w/ mark wrappers                                      | new marks are additive to the enum |
| `link`       | `text`, `href` | `external` | `<a>`; external gets `rel="noopener noreferrer"`               | —                                  |
| `inlineMath` | `latex`        | —          | KaTeX `renderToString`, `displayMode:false`, **`trust:false`** | —                                  |

```json
[
  { "type": "text", "text": "The baseline emission factor " },
  { "type": "inlineMath", "latex": "EF_{grid} = 0.82" },
  { "type": "text", "text": " tCO", "marks": [] },
  { "type": "text", "text": " applies to all projects." }
]
```

### 4.2 List items — recursive

```ts
const ListItem: z.ZodType<ListItem> = z.lazy(() =>
  z.object({
    content: z.array(InlineNode).min(1),
    children: z.array(ListItem).default([]), // unlimited depth
  })
);
```

`z.lazy` is required for the self-reference; the explicit type annotation is required because TypeScript cannot infer a recursive type. Depth is unbounded by design — §9-B2 proposes a render-time cap.

### 4.3 Blocks

```ts
const ParagraphBlock = z.object({
  type: z.literal('paragraph'),
  content: z.array(InlineNode).min(1),
});

const ListBlock = z.object({
  type: z.literal('list'),
  ordered: z.boolean().default(false),
  items: z.array(ListItem).min(1),
});

const TableBlock = z
  .object({
    type: z.literal('table'),
    caption: z.string().optional(),
    headers: z.array(z.array(InlineNode)).min(1),
    rows: z.array(z.array(z.array(InlineNode))).min(1),
  })
  .refine((t) => t.rows.every((r) => r.length === t.headers.length), {
    message: 'Every row must have exactly as many cells as there are headers',
  });

const MathBlock = z.object({
  type: z.literal('math'),
  latex: z.string().min(1),
  label: z.string().optional(), // e.g. "(2.1)" for cross-references
});

const ImageBlock = z.object({
  type: z.literal('image'),
  assetId: z.string(),
  alt: z.string(), // REQUIRED — accessibility is not optional
  caption: z.array(InlineNode).optional(),
  width: z.enum(['content', 'wide', 'full']).default('content'),
});

const CalloutBlock = z.object({
  type: z.literal('callout'),
  variant: z.enum(['note', 'warning', 'important']),
  content: z.array(InlineNode).min(1),
});

const CodeBlock = z.object({
  type: z.literal('code'),
  language: z.string().default('text'),
  code: z.string(),
});

const Block = z.discriminatedUnion('type', [
  ParagraphBlock,
  ListBlock,
  TableBlock,
  MathBlock,
  ImageBlock,
  CalloutBlock,
  CodeBlock,
]);
```

| Block       | Required               | Optional           | Rendering                      | Extensibility notes                                        |
| ----------- | ---------------------- | ------------------ | ------------------------------ | ---------------------------------------------------------- |
| `paragraph` | `content[]`            | —                  | `<p>` + inline renderer        | inline union extends independently                         |
| `list`      | `items[]`              | `ordered`          | recursive `<ul>`/`<ol>`        | depth unbounded                                            |
| `table`     | `headers[]`, `rows[]`  | `caption`          | `<table>` in `overflow-x:auto` | cells are inline arrays → math in cells works free         |
| `math`      | `latex`                | `label`            | KaTeX `displayMode:true`       | `label` enables cross-refs later                           |
| `image`     | `assetId`, **`alt`**   | `caption`, `width` | `<figure>`                     | `assetId` indirection → re-encode without touching content |
| `callout`   | `variant`, `content[]` | —                  | styled aside w/ `role="note"`  | new variants extend the enum                               |
| `code`      | `code`                 | `language`         | `<pre><code>`                  | highlighting is presentational                             |

**`alt` is required, not optional.** Making it optional guarantees missing alt text at scale.

**Table cells are `InlineNode[]`**, so an equation inside a table cell works with no extra block type. That falls out of the design rather than being special-cased.

### 4.4 Sections — the recursive document tree

```ts
const Section: z.ZodType<Section> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    anchor: z.string().regex(/^[a-z0-9-]+$/), // stable across renumbering
    blocks: z.array(Block).default([]),
    children: z.array(Section).default([]),
  })
);
```

**No `order` field and no `number` field.** Order is array position — one source of truth (this resolves the rev-1/rev-2 debate in `RenewCred_Reference_Review.md` §E1 in favour of positional ordering, because sections are an embedded tree, not a separate collection). Ordinals like `2.1.1` are computed:

```ts
function numbering(sections: Section[], prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  sections.forEach((section, index) => {
    const ordinal = prefix ? `${prefix}.${index + 1}` : `${index + 1}.0`;
    out.set(section.id, ordinal);
    for (const [k, v] of numbering(section.children, ordinal.replace(/\.0$/, ''))) {
      out.set(k, v);
    }
  });
  return out;
}
```

Produces `1.0, 2.0, 2.1, 2.1.1` exactly as the design shows. **The TOC is `numbering()` + a tree walk — never stored.**

`anchor` is stored and stable, so deep links survive renumbering. Ordinals are for display only.

---

## 5. Database model

**Supabase (hosted PostgreSQL) + Prisma.** Decided 2026-07-23 (§9-A2). Supabase _is_ Postgres, so the model below is unchanged from a plain-Postgres design; what changes is connection handling, security posture, and asset storage — §5.1–§5.3.

Versioning, navigation, and assets are genuinely relational, and `jsonb` handles the block tree natively with GIN-indexable search.

### 5.1 The architectural constraint that drives everything else

**Express is the only database client.** Neither frontend talks to Supabase directly.

This is not a preference — the brief requires it: _"The public frontend should retrieve its content from your backend rather than relying on static data."_ Wiring Next.js straight to Supabase would technically render content dynamically while bypassing the API layer the assignment is asking you to build.

Consequences, all of them good:

- The **`service_role` key lives only in the Express process.** It is never sent to a browser, never in a `NEXT_PUBLIC_` variable, never in the admin bundle.
- Neither frontend needs a publishable or `anon` key at all.
- The PostgREST **Data API is unused.** As of **28 Apr 2026** Supabase no longer auto-exposes new `public`-schema tables to the Data and GraphQL APIs, so the default posture already matches the design. Leave it that way — do not grant `anon`/`authenticated` access.

### 5.2 Connection strings — the Prisma + Supavisor gotcha

Prisma needs **two** URLs, and getting this wrong produces migrations that hang or connection exhaustion under load:

```bash
# Pooled — Supavisor transaction mode. Used by the running app.
DATABASE_URL="postgresql://…@…pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct — session mode. Used by `prisma migrate` only.
DIRECT_URL="postgresql://…@…pooler.supabase.com:5432/postgres"
```

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`pgbouncer=true` is required — it disables prepared statements, which transaction-mode pooling cannot support. Migrations must use `DIRECT_URL` because they need session-level features the pooler will not carry.

> **Deprecation note:** Supavisor _session_ mode on port 6543 was deprecated 28 Feb 2025. The split above is the current-correct arrangement — **6543 = transaction**, **5432 = session/direct** — not the older session-on-6543 pattern that still appears in stale tutorials.

### 5.3 RLS posture — defense in depth, deny by default

Because Express holds `service_role` (which bypasses RLS), row-level security is not the primary access control here — the API layer is. That is precisely why it must still be enabled: RLS is the backstop for the day a key leaks or a table gets accidentally exposed.

- **Enable RLS on every table in `public`.** No exceptions.
- **Write no permissive policies.** With RLS on and zero policies, every non-`service_role` request returns zero rows. That is the correct default when the only legitimate client is a trusted server.
- Do **not** reach for `SECURITY DEFINER` functions to resolve permission errors — they silently bypass RLS, and in `public` they are callable by any role by default.
- Run `supabase db advisors` before committing any migration.

If a future requirement ever puts a browser directly in front of the database, policies get written then — combining `TO authenticated` with an ownership predicate in `USING`, never `TO authenticated` alone, which is authentication without authorization.

### 5.4 Assets — Supabase Storage

Supabase Storage replaces the local-disk volume the earlier draft assumed. `Asset.storageKey` becomes the object path in a private bucket; Express signs time-limited URLs for the public site. Validate MIME by magic bytes server-side before upload, never by file extension.

> **Gotcha:** replacing an existing object (upsert) requires **INSERT + SELECT + UPDATE** permissions together. Granting INSERT alone lets new uploads succeed while replacements fail silently.

### 5.5 Schema

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(EDITOR)
  createdAt    DateTime @default(now())
  versions     StandardVersion[] @relation("authoredVersions")
  sessions     Session[]
}

enum Role { ADMIN EDITOR }

// Refresh-token rotation; access tokens stay in memory (see §6.4).
model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshTokenHash String   @unique      // hashed — a DB leak must not yield live tokens
  expiresAt        DateTime
  revokedAt        DateTime?
  userAgent        String?
  createdAt        DateTime @default(now())
  @@index([userId])
}

model Standard {
  id          String   @id @default(uuid())
  slug        String   @unique              // "ev", "biochar"
  title       String                        // L-04b / D-02
  summary     String   @db.Text             // L-04c
  description String   @db.Text             // D-03
  iconAssetId String?                       // L-04a
  position    Int                           // index-page ordering
  versions    StandardVersion[]
  seo         Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([position])
}

model StandardVersion {
  id                String        @id @default(uuid())
  standardId        String
  standard          Standard      @relation(fields: [standardId], references: [id], onDelete: Cascade)
  version           String                            // "v1.0.0" — D-06
  status            VersionStatus @default(DRAFT)
  content           Json                              // Section[] — validated by §4.4
  certifiedAt       DateTime?                         // D-07
  consultationStart DateTime?                         // D-08
  consultationEnd   DateTime?
  consultationUrl   String?                           // D-09
  feedbackUrl       String?                           // D-10
  feedbackSummary   String?       @db.Text
  publishedAt       DateTime?
  authorId          String
  author            User          @relation("authoredVersions", fields: [authorId], references: [id])
  revisions         Revision[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  @@unique([standardId, version])
  @@index([standardId, status])
}

enum VersionStatus { DRAFT CONSULTATION CERTIFIED ARCHIVED }

// Append-only history. Written on every publish; never updated.
model Revision {
  id        String   @id @default(uuid())
  versionId String
  version   StandardVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  content   Json
  note      String?
  authorId  String
  createdAt DateTime @default(now())
  @@index([versionId, createdAt])
}

model NavigationItem {
  id       String  @id @default(uuid())
  menu     MenuKey                      // HEADER | FOOTER_PRIMARY | FOOTER_LEGAL
  label    String
  href     String
  position Int
  parentId String?                      // self-relation → nav dropdowns (G-02)
  parent   NavigationItem?  @relation("navTree", fields: [parentId], references: [id], onDelete: Cascade)
  children NavigationItem[] @relation("navTree")
  @@index([menu, position])
}

enum MenuKey { HEADER FOOTER_PRIMARY FOOTER_LEGAL }

model Asset {
  id        String   @id @default(uuid())
  filename  String
  mimeType  String
  byteSize  Int
  width     Int?
  height    Int?
  alt       String
  storageKey String  @unique
  createdAt DateTime @default(now())
}

// Singleton key/value for G-05..G-11 — address, email, tagline, CIN, copyright.
model SiteSetting {
  key   String @id
  value Json
}
```

**Why `content Json` rather than a `Block` table:** blocks are always read as a whole document and never queried individually. Normalising into rows would mean a recursive CTE per page render to reassemble a tree the app treats as one value. `jsonb` + Zod at the boundary gives structural integrity where it matters — on write — without the join cost. Full-text search is served by a GIN index over extracted plain text.

---

## 6. API contract

Base: `/api/v1`. JSON throughout.

### 6.1 Public — no auth

| Method | Path                                 | Returns                                                         |
| ------ | ------------------------------------ | --------------------------------------------------------------- |
| `GET`  | `/standards`                         | `Standard[]` — index cards (`L-04`)                             |
| `GET`  | `/standards/:slug`                   | `Standard` + version list (`D-05`)                              |
| `GET`  | `/standards/:slug/versions/:version` | `StandardVersion` w/ `content` — **CERTIFIED/ARCHIVED only**    |
| `GET`  | `/navigation`                        | `{header, footerPrimary, footerLegal}` (`G-02`, `G-04`, `G-12`) |
| `GET`  | `/settings`                          | site settings (`G-05`–`G-11`)                                   |
| `GET`  | `/search?q=`                         | matches across certified versions (`D-04`)                      |

Public endpoints never return `DRAFT`. Enforced in the query layer, not the controller — a controller-level check is one forgotten line away from leaking unpublished standards.

### 6.2 Auth

| Method | Path            | Body                | Returns                                                |
| ------ | --------------- | ------------------- | ------------------------------------------------------ |
| `POST` | `/auth/login`   | `{email, password}` | `{accessToken, user}` + `refreshToken` httpOnly cookie |
| `POST` | `/auth/refresh` | — (cookie)          | `{accessToken}`; rotates refresh token                 |
| `POST` | `/auth/logout`  | —                   | `204`; revokes session                                 |
| `GET`  | `/auth/me`      | —                   | `{user}`                                               |

### 6.3 Admin — bearer token required

```
GET    /admin/standards                          POST   /admin/standards
GET    /admin/standards/:id                      PATCH  /admin/standards/:id
DELETE /admin/standards/:id
POST   /admin/standards/:id/versions             PATCH  /admin/versions/:id
POST   /admin/versions/:id/publish                POST   /admin/versions/:id/duplicate
GET    /admin/versions/:id/revisions             POST   /admin/versions/:id/restore/:revisionId
GET    /admin/navigation                         PUT    /admin/navigation
POST   /admin/assets                             DELETE /admin/assets/:id
PUT    /admin/settings
```

### 6.4 Auth flow

Access token: **JWT, 15 min, held in memory only** — never `localStorage`, never a cookie.
Refresh token: **opaque random, 7 days, httpOnly + Secure + SameSite=Strict**, stored hashed, rotated on every use.

This resolves the review's B3 finding. `localStorage` is the common assignment shortcut, but this app renders admin-authored rich content into a public DOM, so the XSS surface is concrete. Rotation also gives reuse detection: a replayed refresh token means theft → revoke the whole session family.

### 6.5 Error model

One shape everywhere:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request body failed validation",
    "details": [
      { "path": "content.0.blocks.2.rows", "message": "Row 3 has 4 cells; 3 headers defined" }
    ],
    "requestId": "01J8Z..."
  }
}
```

| Code                | HTTP    | When                                            |
| ------------------- | ------- | ----------------------------------------------- |
| `VALIDATION_FAILED` | 400     | Zod rejected the payload                        |
| `UNAUTHENTICATED`   | **401** | missing, malformed, **or expired** token        |
| `FORBIDDEN`         | 403     | authenticated, insufficient role                |
| `NOT_FOUND`         | 404     | no such resource                                |
| `CONFLICT`          | 409     | slug/version collision, or stale-write conflict |
| `RATE_LIMITED`      | 429     | login throttle exceeded                         |
| `INTERNAL`          | 500     | unexpected — message never leaks internals      |

**401 for expired tokens** per RFC 9110 §15.5.2 and RFC 6750 §3.1 — an expired token is _invalid credentials_, not _insufficient permission_. This lets the client distinguish "refresh and retry" from "stop." Resolves review finding B7.

### 6.6 Validation strategy

One Zod schema per endpoint, applied as middleware before the controller. **The same block schemas from §4 run on the server and are imported by both frontends** — one definition, no drift. `Section[]` is validated in full on every version write.

---

## 7. Frontend architecture

```
apps/
├── api/                    Express + Prisma
│   └── src/{routes,controllers,services,middleware,lib}/
├── admin/                  Vite + React + RTK   (auth-gated, no SEO need)
│   └── src/
│       ├── app/            store, router
│       ├── features/       auth/ standards/ versions/ navigation/ assets/ settings/
│       ├── components/     editor/  ui/  layout/
│       └── lib/            apiClient, tokenStore
└── web/                    Next.js App Router   (public, SSR/ISR)
    └── src/
        ├── app/            (routes)
        ├── components/     BlockRenderer/  layout/
        └── lib/            api, numbering
packages/
├── schema/                 §4 Zod schemas — imported by all three
└── tokens/                 design-tokens.json → Tailwind preset
```

Feature-based, not type-based: everything for "versions" lives together.

### 7.1 State ownership — the explicitly-graded decision

| State                                 | Owner                    | Why                                                                                  |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Access token, current user            | **Redux**                | cross-cutting; every request and guard reads it                                      |
| Standards/versions/nav lists          | **RTK Query**            | server cache — ships inside `@reduxjs/toolkit`, no new dependency                    |
| Editor document buffer                | **Local (`useReducer`)** | keystroke-rate updates; in Redux this re-renders every subscriber on every character |
| Dirty flag, publish status            | **Redux**                | read by the nav guard and the toolbar, which are far apart                           |
| Modals, dropdowns, hover, form fields | **Local `useState`**     | no consumer outside the component                                                    |
| Selected version                      | **URL**                  | shareable and back-button-correct; not state at all                                  |

**The reasoning matters more than the split.** The editor buffer is the interesting call: it is the largest object in the app and the most frequently mutated, which makes it exactly the thing that _looks_ like it belongs in global state and must not be. It is committed to RTK Query on save.

### 7.2 BlockRenderer

Shared shape across both frontends; one switch on `block.type` is the single extension point. Adding a block type touches the schema and this file — nothing else.

KaTeX runs with **`trust: false`** (its default) so `\href` cannot inject `javascript:` URLs. Inline math renders inside the paragraph flow, satisfying §3.1.

### 7.3 Routing

| Route                         | Rendering                                           |
| ----------------------------- | --------------------------------------------------- |
| `/standards`                  | ISR, `revalidateTag('standards')`                   |
| `/standards/[slug]`           | ISR → latest certified version                      |
| `/standards/[slug]/[version]` | ISR, `generateStaticParams` over certified versions |

Publishing calls `revalidateTag` — content goes live without a redeploy.

---

## 8. Implementation roadmap

| #   | Phase                                                             | Depends on | Complexity           | Delivers                                                             |
| --- | ----------------------------------------------------------------- | ---------- | -------------------- | -------------------------------------------------------------------- |
| 1   | `packages/schema` — §4 + unit tests                               | —          | **M**                | the contract everything imports                                      |
| 2   | `packages/tokens` → Tailwind preset                               | —          | S                    | design tokens as code                                                |
| 3   | Supabase local stack + Prisma schema + migration + seed           | 1          | M                    | DB, admin user, EV/Biochar/Methane/Renewable, **rich demo doc (A1)** |
| 4   | Auth — login, refresh rotation, guard, rate limit                 | 3          | **M**                | secured API                                                          |
| 5   | Public API + search                                               | 3          | M                    | endpoints the site consumes                                          |
| 6   | Admin API + publish/revision                                      | 4          | M                    | CRUD + history                                                       |
| 7   | Admin shell — router, guard, layout, responsive                   | 4          | M                    | navigable panel                                                      |
| 8   | **Block editor**                                                  | 1, 7       | **L — highest risk** | nested lists, tables, inline math                                    |
| 9   | Version & navigation management                                   | 6, 7       | M                    | versioning + nav CMS                                                 |
| 10  | Public site — layout, index, detail, TOC                          | 2, 5       | **L**                | the Figma build                                                      |
| 11  | Assets — Supabase Storage, magic-byte validation, signed URLs     | 3          | M                    | images                                                               |
| 12  | Docker compose (api/admin/web) + `supabase start` + RLS migration | all        | M                    | one-command boot, no cloud account needed                            |
| 13  | Tests, a11y, README, `DECISIONS.md`                               | all        | M                    | deliverables                                                         |

**Critical path:** 1 → 3 → 4 → 6 → 8. **Step 8 is the risk concentration** — it is where the assignment is won or lost, and where estimates are least reliable. Steps 2 and 10 can proceed in parallel with the backend.

---

## 9. Ambiguities and blockers

All available sources were exhausted first: the PDF, the full node tree, the four renders, and the extracted tokens. Grouped into one message per the contract.

### A. Genuine blockers — need a decision

**A1 — Are tables and equations in scope for the public site, given the design shows neither?** ✅ **RESOLVED 2026-07-23 — build fully.**
_Decision:_ full editor UI and renderer styling for tables, block math, inline math, and nested lists. Seed at least one standard containing all four so the capability is visible to a reviewer without hunting.
_Impact:_ roughly 30–40% of step 8; step 3's seed grows to include a rich demo document.

**A2 — Which database?** ✅ **RESOLVED 2026-07-23 — Supabase (hosted PostgreSQL) + Prisma.**
_Decision:_ Supabase for Postgres and Storage. Express holds `service_role` and remains the only database client (§5.1). Connection uses the Supavisor transaction pooler for the app and a direct connection for migrations (§5.2). RLS enabled everywhere, deny-by-default (§5.3).
_Consequence:_ the §5.5 model is unchanged — Supabase is Postgres. Asset storage moves from a local-disk volume to Supabase Storage (§5.4). Local development changes; see B11.

### B. Assumptions being made — proceeding, flagged for the record

**B1 — Three "View Standards" frames are states of one page**, not three routes. Layout is identical; only sidebar affordances differ (`D-09`, `D-10` appear in state 3). Building one page with conditional regions driven by `VersionStatus`.

**B2 — Nested lists and sections are unbounded in the schema**, capped at **6 levels in the renderer**. The design shows 3 (`2.1.1`). Deeper is representable but unreadable; the cap is presentational, so no data is lost.

**B3 — Search (`D-04`) is scoped to the current standard's certified version**, not global. The field sits inside the document sidebar, which implies local scope.

**B4 — Footer says "Renewred", logo says "RenewCred".** Treating as a design typo. Using **RenewCred** and storing it as a setting, so it is editable either way.

**B5 — The `NOISE` effect (7 uses) has no CSS equivalent.** Reproducing with a tiled SVG grain overlay at matched opacity. Will not be pixel-identical.

**B6 — Work Sans is loaded from Google Fonts**, self-hosted via `next/font` to avoid a render-blocking third-party request and to keep CSP tight.

**B7 — The newsletter form (`G-10`) stores submissions and does not integrate an ESP.** No provider is specified anywhere in the brief.

**B8 — "Read more" (`L-04d`) links to `/standards/{slug}`** at its latest certified version.

**B9 — Icons are exported as SVG from the node tree** (301 `VECTOR` nodes), not re-drawn.

**B10 — Locale is `en-IN`; dates render as "12 Jul 2025"** matching `D-07`/`D-08` exactly.

**B11 — Local development uses the Supabase CLI stack, not a hand-rolled Postgres container.** `supabase start` runs Postgres, Storage, and Studio in Docker locally. This preserves the brief's one-command-boot expectation: a reviewer runs `supabase start` then `docker compose up` and has a working system **with no cloud account and no credentials of mine**. Hosted Supabase is used only for a live demo URL. This matters because the brief requires _"any sample credentials or seed data required to evaluate the application"_ — an evaluation path that depends on my private cloud project would be a deliverable failure, not a convenience issue.

**B12 — Authentication stays custom on Express (§6.4); Supabase Auth is not used.** Supabase was chosen as the _database_. Auth is one of only two explicitly-named functional requirements in the brief, and the preferred backend is Express — delegating it to a BaaS would remove the thing being evaluated and thin the Express layer to a proxy. The custom implementation (refresh-token rotation, hashed token storage, reuse detection) is a stronger demonstration of the security reasoning the brief is probing. Supabase Auth remains a legitimate alternative; the trade is recorded in `DECISIONS.md`. **Flagging explicitly because it is reversible now and expensive later — say so if you would rather use Supabase Auth.**

**B13 — `service_role` key handling.** Lives only in the Express environment. Never in `NEXT_PUBLIC_*`, never in the admin bundle, never committed. `.env.example` ships with placeholders and a comment saying so.

---

## 10. Self-review

**Principal Backend** — `content Json` is the right call for read-whole/write-whole documents, but it forfeits DB-level referential integrity on `assetId` inside blocks. Mitigation: validate asset existence at the service layer on write, and have the renderer degrade gracefully on a dangling reference rather than crash. _Accepted with mitigation._

**Principal Frontend** — the largest risk is step 8. Nested lists, tables, and inline math in one editor is where scope overruns. Mitigation: build against the §4 schema as the contract and ship a JSON fallback view, so content is always editable even if a rich control is incomplete.

**UX** — the design shows no empty, loading, or error states anywhere. All three must be invented; they will not be in the Figma. Flagged because "pixel-perfect to Figma" gives no guidance here, and blank screens during load are a defect (§11-G3).

**Accessibility** — computed contrast against the extracted palette:

| Pair                   | Ratio       | AA normal    | AAA |
| ---------------------- | ----------- | ------------ | --- |
| `#2b2c2c` on `#f5f5f5` | **12.85:1** | ✅           | ✅  |
| `#505050` on `#f5f5f5` | **7.40:1**  | ✅           | ✅  |
| `#be202e` on `#ffffff` | **6.11:1**  | ✅           | ✗   |
| `#be202e` on `#f5f5f5` | **5.61:1**  | ✅           | ✗   |
| `#9f9f9f` on `#f5f5f5` | **2.43:1**  | ❌ **fails** | ❌  |

The palette is sound apart from `#9f9f9f`, which fails AA and is acceptable only for genuinely decorative placeholder text — never for meaningful content. Brand red passes AA in both placements, so active nav and TOC items are fine. Beyond colour: KaTeX needs its MathML output enabled plus an `aria-label` on the container, and the TOC must be a `<nav>` with `aria-current` on the active entry.

**Security** — refresh rotation with reuse detection (§6.4); KaTeX `trust:false`; asset MIME validated by magic bytes not extension; login rate limited; `helmet` + CSP; boot-time env validation that **crashes** on a missing `JWT_SECRET`. Remaining risk: LaTeX is user-authored input to a renderer — KaTeX is not a full TeX engine and `trust:false` blocks URL commands, but pin the version and watch advisories.

**Performance** — a 3349px page with ~76 text nodes is heavy. ISR makes the public site static. TOC numbering is `O(n)` and memoised. KaTeX renders server-side, so no client-side math library ships to readers. Watch: the editor re-rendering the whole document on each keystroke — hence the local-buffer decision in §7.1.

**QA** — highest-value tests are the §4 schema (a table with mismatched row lengths must fail; 6-level nesting must pass; inline math must round-trip) and the `numbering()` function against the exact ordinals in the design. Both are pure functions — cheap, fast, high signal.

**Solution Architect** — `packages/schema` shared across all three apps is the structural bet: one definition, validated identically on both sides. The cost is a monorepo. That is the right trade for a content system whose entire risk is malformed content.

---

## 11. Gap analysis

### Against the assignment PDF

| Requirement                         | Covered | Where                                         |
| ----------------------------------- | ------- | --------------------------------------------- |
| Auth — login + logout               | ✅      | §6.2                                          |
| Admin dashboard                     | ✅      | §7, step 7                                    |
| Manage all displayed content        | ✅      | incl. navigation + settings — §5              |
| Long-form text, multiple paragraphs | ✅      | §4.3                                          |
| Lists, **nested lists**             | ✅      | §4.2 recursive                                |
| Tables                              | ✅      | §4.3                                          |
| Mathematical equations              | ✅      | block **and** inline — §4.1/§4.3              |
| Structured documentation            | ✅      | §4.4 section tree                             |
| Mixed content                       | ✅      | §3.1 inline arrays                            |
| Public site consumes API            | ✅      | §6.1, §7.3                                    |
| Redux Toolkit where appropriate     | ✅      | §7.1 **with rationale**                       |
| Responsive admin panel              | ⚠️      | step 7 — not yet designed, no Figma reference |
| Scalable organisation               | ✅      | §7                                            |
| README                              | ⏳      | step 13                                       |
| `.env.example`                      | ⏳      | step 3                                        |
| Seed data + credentials             | ⏳      | step 3                                        |
| Docker                              | ⏳      | step 12                                       |

### Against the Figma

| Region                                       | Covered                             |
| -------------------------------------------- | ----------------------------------- |
| Header, nav, dropdowns, Registry             | ✅ `G-01`–`G-03`                    |
| Standards index + cards                      | ✅ `L-01`–`L-04`                    |
| Detail hero, sidebar, versions, consultation | ✅ `D-01`–`D-10`                    |
| **Derived TOC w/ 3-level numbering**         | ✅ §1.3                             |
| Numbered sections + anchors                  | ✅ §4.4                             |
| Footer, newsletter, legal                    | ✅ `G-04`–`G-12`                    |
| `NOISE` texture                              | ⚠️ B5 — approximated                |
| Empty / loading / error states               | ❌ **not in the design** — G3 below |

### Against production practice

| Gap                                                          | Severity | Resolution                                                                           |
| ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------ |
| **G1** — Figma shows no tables/equations, PDF requires them  | **High** | headline finding; blocker A1                                                         |
| **G2** — no responsive reference for the admin panel         | Medium   | design it; brief requires it, Figma is desktop-only                                  |
| **G3** — no empty/loading/error states in the design         | Medium   | invent them; blank screens are defects                                               |
| **G4** — LaTeX is user input to a renderer                   | Medium   | `trust:false`, pin KaTeX, watch advisories                                           |
| **G5** — `assetId` has no FK integrity inside `jsonb`        | Low      | service-layer validation + graceful degradation                                      |
| **G6** — `#9f9f9f` fails AA on the page background           | Low      | restrict to decorative placeholder text only                                         |
| **G7** — concurrent edits can silently clobber               | Low      | `updatedAt` precondition → `409 CONFLICT`                                            |
| **G8** — `service_role` bypasses RLS, so a key leak is total | Medium   | server-only env, RLS deny-by-default as backstop, Data API left unexposed (§5.1–5.3) |

---

## 12. Readiness report

**✅ Ready to implement. No open blockers.**

**Settled:** content inventory complete, every region classified and mapped · design tokens fully extracted from real node values, nothing invented · block schema satisfies all eleven §3 requirements including the two hard ones (inline math, unbounded nesting) · database model covers versioning, navigation, assets, and revisions · API contract specified with a single error shape · state ownership decided _with rationale_ · roadmap sequenced with the critical path identified.

**Blockers:** none. **A1 resolved** — build rich content fully, seed a demo document. **A2 resolved** — Supabase (hosted Postgres) + Prisma, Express as sole DB client.

**Non-blocking, tracked:** B1–B13 assumptions · G2/G3 (admin responsive + the eight states, both requiring design invention) · G4–G8 with mitigations.

**One assumption worth a second look before step 4:** **B12** — auth stays custom on Express rather than using Supabase Auth. Reversible cheaply now, expensive after step 6.

**Recommended start:** step 1 (`packages/schema`) — on the critical path, depends on nothing, independently testable, and imported by every other step.

---

### Appendix — provenance

| Artifact                              | What it is                                      |
| ------------------------------------- | ----------------------------------------------- |
| `figma/file.json`                     | 4.3 MB node tree — the extraction source        |
| `figma/design-tokens.json`            | every token + occurrence count                  |
| `figma/frames.json`                   | 4 top-level frames                              |
| `figma/frames/*.png`                  | renders at 1920                                 |
| `Frontend Engineering Assignment.pdf` | requirements ground truth                       |
| `RenewCred_Reference_Review.md`       | rev-2 review; §E1/E2 resolved here in §4.4/§6.5 |
