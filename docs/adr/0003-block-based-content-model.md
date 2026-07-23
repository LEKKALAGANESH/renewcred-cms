# ADR-0003 — Block-based content model over stored HTML

**Status:** Accepted · **Date:** 2026-07-23

## Context

The brief requires the CMS to handle long-form text, multiple paragraphs, lists, **nested lists**, tables, **mathematical equations**, structured documentation, and mixed content.

The Figma design contains none of these — verified against the node tree, which holds only `FRAME/VECTOR/TEXT/GROUP/LINE`. Every body paragraph in the mockup is lorem ipsum under a numbered heading. So the design cannot tell us what the content model needs; the brief must.

Storing rendered HTML is the obvious shortcut and fails on all three requirements that matter: it cannot be safely re-rendered across surfaces, it invites XSS on every read, and it makes structural queries (extract a table, renumber sections) string surgery.

## Decision

A three-level structural model:

1. **Sections** — a recursive tree. Gives the document hierarchy and the derived numbering.
2. **Blocks** — a flat ordered array within each section. A discriminated union on `type`.
3. **Inline nodes** — an array within text-bearing blocks. A discriminated union on `type`.

Every level is validated by a Zod discriminated union at the API boundary before persistence.

## Consequences

**Good**

- **Inline math works.** `The factor $EF = 0.82$ applies` is one paragraph containing text → math → text. A flat `{type:'paragraph', text: string}` model plus a sibling equation block physically cannot express this; the equation would break onto its own line.
- **Nested lists work.** A list item holds inline content _and_ child items, recursively, with no depth cap.
- **Table cells are inline arrays**, so math-in-a-table-cell falls out for free rather than needing a special case.
- Content is renderable to HTML, plain text (for search indexing), or any future surface, because it is structure rather than presentation.
- Adding a block type touches the schema and one renderer switch. No migration of existing rows.

**Bad**

- More verbose than HTML on the wire. A paragraph is an array, not a string.
- The editor must produce this shape. Rich-text editors that emit HTML need a conversion layer; TipTap/ProseMirror's document model maps closely.
- Recursive Zod schemas need `z.lazy` plus an explicit type annotation, because TypeScript cannot infer a recursive type.

## Alternatives considered

**Stored HTML + sanitiser.** Fastest to build. Rejected: sanitisation is a permanent XSS surface, structural edits become string manipulation, and nothing prevents an editor pasting arbitrary markup.

**Markdown.** Human-readable and compact, but tables are weak, inline math needs a non-standard extension, and arbitrary nesting depends on the parser. Rejected.

**Editor.js JSON.** Close, and it has a nested-list tool. Rejected on inline math: it is a block-level model, and interleaving math inside a sentence needs first-class inline nodes.
