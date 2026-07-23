// Generates docs/BLOCK_REFERENCE.md from the registry and fixtures.
// The reference cannot drift from the schema because it is derived from it —
// that is the point of BLOCK_REGISTRY being typed Record<BlockType, BlockMeta>.
//
//   npm run docs --workspace=@renewcred/schema

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BLOCK_EXAMPLES,
  BLOCK_REGISTRY,
  BLOCK_TYPES,
  CURRENT_SCHEMA_VERSION,
} from '../dist/index.js';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/BLOCK_REFERENCE.md');

const statusBadge = {
  stable: '🟢 stable',
  experimental: '🟡 experimental',
  deprecated: '🔴 deprecated',
};

const sections = BLOCK_TYPES.map((type) => {
  const meta = BLOCK_REGISTRY[type];
  const example = JSON.stringify(BLOCK_EXAMPLES[type], null, 2);

  const editorLine = meta.editor.supported
    ? `✅ Supported${meta.editor.note ? ` — ${meta.editor.note}` : ''}`
    : `⛔ Not yet — ${meta.editor.note ?? 'no reason recorded'}`;

  return `### \`${type}\` — ${meta.displayName}

${meta.description}

| | |
|---|---|
| **Status** | ${statusBadge[meta.status]} |
| **Since** | schema v${meta.since} |
| **Editor** | ${editorLine} |
| **Renders as** | \`${meta.renderer.html}\` |

**Accessibility contract.** ${meta.renderer.accessibility}
${meta.migrationNotes ? `\n**Migration notes.** ${meta.migrationNotes}\n` : ''}${
    meta.deprecation
      ? `\n> **Deprecated since v${meta.deprecation.since}.** ${meta.deprecation.note}${
          meta.deprecation.replacedBy ? ` Use \`${meta.deprecation.replacedBy}\` instead.` : ''
        }\n`
      : ''
  }
<details>
<summary>Example payload</summary>

\`\`\`json
${example}
\`\`\`

</details>`;
}).join('\n\n---\n\n');

const content = `# Block Reference

<!-- GENERATED FILE — do not edit by hand.
     Produced from BLOCK_REGISTRY and BLOCK_EXAMPLES by
     packages/schema/scripts/generate-docs.mjs -->

Every content block type, its rendering contract, and a valid example payload.

This file is **generated from the schema itself**. \`BLOCK_REGISTRY\` is typed
\`Record<BlockType, BlockMeta>\`, so a new block type will not compile without a
registry entry — and once it has one, it appears here automatically. The reference
cannot fall out of sync with the code.

Current content schema version: **${CURRENT_SCHEMA_VERSION}**.

## Structure

Content is three levels deep:

1. **Section** — recursive tree; produces the 1.0 / 2.1 / 2.1.1 hierarchy
2. **Block** — flat ordered array within a section; the types below
3. **InlineNode** — array within text-bearing blocks: \`text\`, \`link\`, \`inlineMath\`

The third level is why inline math works. \`The factor $EF = 0.82$ applies\` is one
paragraph containing text → math → text, which a \`{ type, text: string }\` model
cannot express.

## Validation rules that apply everywhere

- **Unknown fields are rejected**, not stripped. Silent stripping is data loss
  disguised as success — the editor reports a save that partly did not happen.
- **Text-bearing blocks require non-empty content.** An empty paragraph is a
  defect, not a state.
- **Image \`alt\` is required**, never optional. Optional alt text guarantees
  missing alt text at scale.
- **Table rows must match the header count**, checked per row with the row index
  in the error path.

## Block types

${sections}
`;

await writeFile(OUT, content);
console.log(`Wrote ${OUT} (${BLOCK_TYPES.length} block types)`);
