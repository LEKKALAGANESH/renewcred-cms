# Domain Vocabulary

Fixed before Prisma exists, so database tables, API resources, admin forms, and renderers all reuse one set of names. Naming drift is cheap to prevent here and expensive to fix once four layers disagree.

These are **domain concepts**. A concept may map to a table, part of a table, a `jsonb` field, or nothing at all.

---

## Core concepts

| Term                | Means                                                                                                                | Materialises as                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Standard**        | A published standard — EV, Biochar, Methane, Renewable Energy. The thing a reader browses to.                        | table                                |
| **StandardVersion** | One dated, status-bearing revision of a Standard. Readers select between these; each carries its own content.        | table                                |
| **Document**        | The content of one StandardVersion: `{ schemaVersion, sections }`. The unit the editor loads and the renderer walks. | `jsonb` on `StandardVersion.content` |
| **Section**         | A numbered, titled node in the document tree. Recursive — sections contain sections.                                 | node inside Document                 |
| **Block**           | One unit of content within a Section: paragraph, list, table, math, image, callout, code.                            | node inside Section                  |
| **InlineNode**      | A run inside a text-bearing block: text, link, or inline math. What makes math-mid-sentence expressible.             | node inside Block                    |
| **Revision**        | An immutable historical snapshot of a Document, written on publish. Append-only.                                     | table                                |
| **Asset**           | An uploaded file plus its metadata and required alt text.                                                            | table + Supabase Storage object      |
| **NavigationItem**  | One entry in a menu. Self-referencing for dropdowns.                                                                 | table                                |
| **SiteSetting**     | A singleton key/value for global chrome — address, tagline, CIN, copyright.                                          | table                                |
| **User**            | An authenticated administrator.                                                                                      | table                                |
| **Session**         | A refresh-token family. Revocable, rotatable, reuse-detectable.                                                      | table                                |

## Derived concepts — computed, never stored

| Term                | Means                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Ordinal**         | A section's display number — `1.0`, `2.1`, `2.1.1`. Computed from tree position.                    |
| **TableOfContents** | The sidebar navigation. Computed from the section tree plus ordinals.                               |
| **Anchor**          | A section's stable URL fragment. **Stored**, unlike the ordinal, so deep links survive renumbering. |

Storing an ordinal would create a second source of truth that drifts the moment an editor inserts a section. See [ADR-0003](adr/0003-block-based-content-model.md).

## Status vocabulary

| Term             | Means                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Draft**        | Editable, invisible to the public API.                         |
| **Consultation** | Published for public comment within a dated window.            |
| **Certified**    | The authoritative published version.                           |
| **Archived**     | Superseded but still readable at its permalink.                |
| **Publication**  | The _act_ of moving a version to Certified. Writes a Revision. |

`Draft → Consultation → Certified → Archived` is the lifecycle. `Publication` is a verb in this vocabulary, not a noun — there is no `Publication` table.

---

## Terms deliberately **not** used

Recorded so nobody reintroduces them by accident.

**Page.** Tempting, but this system has no generic pages. The design has a standards index and a standard detail view; both are driven by `Standard` and `StandardVersion`. The index page's hero copy is a `SiteSetting`, not a page. Introducing a `Page` entity would add a table with two rows and a second content pathway to maintain. If genuinely generic pages arrive later, `Page` is the right name for them — it is reserved, not forbidden.

**Post / Article / Entry.** Blog vocabulary. This is standards documentation; the reader is looking up a specification, not reading a feed.

**Locale.** Out of scope — single locale, `en-IN` (blueprint B10). Named here so that when i18n arrives, `Locale` attaches to `StandardVersion` rather than being invented at the component layer. Copy is externalised regardless, so the change stays additive.

**Content / Data / Item.** Too vague to constrain anything. Use the specific term.

**Node.** Only ever qualified: `InlineNode`, never bare `Node` — it collides with the DOM type and reads as "anything".

---

## Naming rules

1. **One term per concept, everywhere.** A `StandardVersion` is a `StandardVersion` in the Prisma model, the API route, the Redux slice, and the React prop. Not `version`, `standardVersion`, `doc`, or `rev` depending on the file.
2. **Domain terms never take a layer suffix.** No `StandardEntity`, `StandardDTO`, `StandardModel`. If two shapes genuinely differ, the difference goes in the name: `Standard` vs `StandardSummary`.
3. **Derived values are named for what they are, not where they came from.** `ordinal`, not `computedNumber`.
4. **Booleans read as assertions:** `isPublished`, `hasConsultation` — never `published` alone, which reads as a date.
