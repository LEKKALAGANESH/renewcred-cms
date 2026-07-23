# Block Reference

<!-- GENERATED FILE — do not edit by hand.
     Produced from BLOCK_REGISTRY and BLOCK_EXAMPLES by
     packages/schema/scripts/generate-docs.mjs -->

Every content block type, its rendering contract, and a valid example payload.

This file is **generated from the schema itself**. `BLOCK_REGISTRY` is typed
`Record<BlockType, BlockMeta>`, so a new block type will not compile without a
registry entry — and once it has one, it appears here automatically. The reference
cannot fall out of sync with the code.

Current content schema version: **1**.

## Structure

Content is three levels deep:

1. **Section** — recursive tree; produces the 1.0 / 2.1 / 2.1.1 hierarchy
2. **Block** — flat ordered array within a section; the types below
3. **InlineNode** — array within text-bearing blocks: `text`, `link`, `inlineMath`

The third level is why inline math works. `The factor $EF = 0.82$ applies` is one
paragraph containing text → math → text, which a `{ type, text: string }` model
cannot express.

## Validation rules that apply everywhere

- **Unknown fields are rejected**, not stripped. Silent stripping is data loss
  disguised as success — the editor reports a save that partly did not happen.
- **Text-bearing blocks require non-empty content.** An empty paragraph is a
  defect, not a state.
- **Image `alt` is required**, never optional. Optional alt text guarantees
  missing alt text at scale.
- **Table rows must match the header count**, checked per row with the row index
  in the error path.

## Block types

### `paragraph` — Paragraph

Body text with inline formatting, links, and inline equations.

|                |                              |
| -------------- | ---------------------------- |
| **Status**     | 🟢 stable                    |
| **Since**      | schema v1                    |
| **Editor**     | ✅ Supported                 |
| **Renders as** | `<p> containing inline runs` |

**Accessibility contract.** Inherits document language. Inline math must carry an accessible label.

**Migration notes.** Content is InlineNode[], never a string. Any migration producing a bare string is wrong.

<details>
<summary>Example payload</summary>

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "The baseline grid emission factor "
    },
    {
      "type": "inlineMath",
      "latex": "EF_{grid} = 0.82"
    },
    {
      "type": "text",
      "text": " tCO"
    },
    {
      "type": "text",
      "text": "2"
    },
    {
      "type": "text",
      "text": "e/MWh applies to all projects unless a "
    },
    {
      "type": "text",
      "text": "project-specific factor",
      "marks": ["bold"]
    },
    {
      "type": "text",
      "text": " has been certified."
    }
  ]
}
```

</details>

---

### `list` — List

Ordered or unordered list. Items nest to unlimited depth.

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Status**     | 🟢 stable                                              |
| **Since**      | schema v1                                              |
| **Editor**     | ✅ Supported — Tab / Shift+Tab adjusts nesting depth.  |
| **Renders as** | `Recursive <ul> or <ol> with nested lists inside <li>` |

**Accessibility contract.** Nested lists must be children of <li>, not siblings — screen readers announce depth from structure.

**Migration notes.** Renderers cap display at MAX_RENDERED_LIST_DEPTH; stored depth is unbounded.

<details>
<summary>Example payload</summary>

```json
{
  "type": "list",
  "ordered": false,
  "items": [
    {
      "content": [
        {
          "type": "text",
          "text": "Eligible vehicle categories"
        }
      ],
      "children": [
        {
          "content": [
            {
              "type": "text",
              "text": "Passenger vehicles"
            }
          ],
          "children": [
            {
              "content": [
                {
                  "type": "text",
                  "text": "Category M1 — up to 8 seats"
                }
              ],
              "children": []
            },
            {
              "content": [
                {
                  "type": "text",
                  "text": "Category M2 — 8 to 16 seats"
                }
              ],
              "children": []
            }
          ]
        },
        {
          "content": [
            {
              "type": "text",
              "text": "Commercial vehicles"
            }
          ],
          "children": []
        }
      ]
    },
    {
      "content": [
        {
          "type": "text",
          "text": "Excluded categories"
        }
      ],
      "children": []
    }
  ]
}
```

</details>

---

### `table` — Table

Tabular data with a header row. Cells accept inline content, including math.

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Status**     | 🟢 stable                                                               |
| **Since**      | schema v1                                                               |
| **Editor**     | ✅ Supported                                                            |
| **Renders as** | `<table> with <thead>/<tbody>, wrapped in an overflow-x:auto container` |

**Accessibility contract.** Header cells use <th scope="col">. Caption uses <caption>. The scroll container needs tabindex="0" so keyboard users can reach overflow.

**Migration notes.** Row length is validated against header count at parse time; a migration that changes header count must rewrite every row.

<details>
<summary>Example payload</summary>

```json
{
  "type": "table",
  "caption": "Emission factors by grid region",
  "headers": [
    [
      {
        "type": "text",
        "text": "Region"
      }
    ],
    [
      {
        "type": "text",
        "text": "Factor"
      }
    ],
    [
      {
        "type": "text",
        "text": "Valid from"
      }
    ]
  ],
  "rows": [
    [
      [
        {
          "type": "text",
          "text": "Northern"
        }
      ],
      [
        {
          "type": "inlineMath",
          "latex": "0.82"
        }
      ],
      [
        {
          "type": "text",
          "text": "12 Jul 2025"
        }
      ]
    ],
    [
      [
        {
          "type": "text",
          "text": "Western"
        }
      ],
      [
        {
          "type": "inlineMath",
          "latex": "0.79"
        }
      ],
      [
        {
          "type": "text",
          "text": "12 Jul 2025"
        }
      ]
    ],
    [
      [
        {
          "type": "text",
          "text": "Southern"
        }
      ],
      [
        {
          "type": "inlineMath",
          "latex": "0.71"
        }
      ],
      [
        {
          "type": "text",
          "text": "12 Jul 2025"
        }
      ]
    ]
  ]
}
```

</details>

---

### `math` — Equation

A display equation on its own line, optionally labelled for cross-reference.

|                |                                                      |
| -------------- | ---------------------------------------------------- |
| **Status**     | 🟢 stable                                            |
| **Since**      | schema v1                                            |
| **Editor**     | ✅ Supported — LaTeX source with live KaTeX preview. |
| **Renders as** | `<figure> wrapping KaTeX output in displayMode`      |

**Accessibility contract.** Enable KaTeX MathML output and label the container. Never render math as an image without alt text.

**Migration notes.** KaTeX runs with trust:false. A migration must never enable trust to fix rendering.

<details>
<summary>Example payload</summary>

```json
{
  "type": "math",
  "latex": "ER_y = BE_y - PE_y - LE_y",
  "label": "(2.1)"
}
```

</details>

---

### `image` — Image

An uploaded image with required alt text and an optional caption.

|                |                                                               |
| -------------- | ------------------------------------------------------------- |
| **Status**     | 🟢 stable                                                     |
| **Since**      | schema v1                                                     |
| **Editor**     | ⛔ Not yet — Blocked on the asset pipeline (roadmap step 11). |
| **Renders as** | `<figure><img><figcaption>`                                   |

**Accessibility contract.** alt is required by the schema. Decorative images do not belong in content.

**Migration notes.** assetId is a foreign key living inside jsonb, so it has no DB-level integrity. Renderers degrade gracefully on a dangling reference rather than throwing.

<details>
<summary>Example payload</summary>

```json
{
  "type": "image",
  "assetId": "66666666-6666-4666-8666-666666666666",
  "alt": "Flow diagram of the project boundary, showing grid electricity entering the charging system",
  "caption": [
    {
      "type": "text",
      "text": "Figure 1 — project boundary"
    }
  ],
  "width": "content"
}
```

</details>

---

### `callout` — Callout

A note, warning, or important aside set apart from body text.

|                |                                |
| -------------- | ------------------------------ |
| **Status**     | 🟢 stable                      |
| **Since**      | schema v1                      |
| **Editor**     | ✅ Supported                   |
| **Renders as** | `<aside> with a variant class` |

**Accessibility contract.** role="note". Never signal the variant by colour alone — include a text or icon label.

<details>
<summary>Example payload</summary>

```json
{
  "type": "callout",
  "variant": "important",
  "content": [
    {
      "type": "text",
      "text": "Projects certified before "
    },
    {
      "type": "text",
      "text": "12 Jul 2025",
      "marks": ["bold"]
    },
    {
      "type": "text",
      "text": " remain governed by version 0.9 until their next renewal."
    }
  ]
}
```

</details>

---

### `code` — Code

A preformatted code block with a language hint.

|                |                                  |
| -------------- | -------------------------------- |
| **Status**     | 🟢 stable                        |
| **Since**      | schema v1                        |
| **Editor**     | ✅ Supported                     |
| **Renders as** | `<pre><code class="language-*">` |

**Accessibility contract.** Preserve whitespace. The scroll container needs tabindex="0" for keyboard access to overflow.

**Migration notes.** Syntax highlighting is presentational and never stored.

<details>
<summary>Example payload</summary>

```json
{
  "type": "code",
  "language": "json",
  "code": "{\n  \"methodology\": \"RC-EV-001\",\n  \"version\": \"1.0.0\"\n}"
}
```

</details>
