import type { BlockType } from './blocks.js';

/**
 * Self-describing metadata for every block type.
 *
 * The admin editor palette, the documentation, migration tooling, and the
 * renderer capability checks all read from here rather than each maintaining
 * their own list. A second list is a list that drifts.
 *
 * Enforcement lives in the type, not in a convention: BLOCK_REGISTRY is typed
 * `Record<BlockType, BlockMeta>`, so adding a block type to the union without a
 * registry entry is a COMPILE ERROR. That is what makes the schema genuinely
 * self-documenting rather than documented-and-hopefully-updated.
 */
export interface BlockMeta {
  type: BlockType;
  /** Shown in the editor's block palette. */
  displayName: string;
  /** One line, shown as palette help text. */
  description: string;
  /** Content schema version in which this block type first appeared. */
  since: number;
  status: 'stable' | 'experimental' | 'deprecated';
  deprecation?: {
    since: number;
    replacedBy?: BlockType;
    note: string;
  };
  editor: {
    /** False means seed/API-authored only — no editor UI yet. */
    supported: boolean;
    note?: string;
  };
  renderer: {
    /** The HTML element or structure this block produces. */
    html: string;
    /** Accessibility obligations the renderer must satisfy. */
    accessibility: string;
  };
  /** Anything a future migration author needs to know about this shape. */
  migrationNotes?: string;
}

export const BLOCK_REGISTRY: Record<BlockType, BlockMeta> = {
  paragraph: {
    type: 'paragraph',
    displayName: 'Paragraph',
    description: 'Body text with inline formatting, links, and inline equations.',
    since: 1,
    status: 'stable',
    editor: { supported: true },
    renderer: {
      html: '<p> containing inline runs',
      accessibility: 'Inherits document language. Inline math must carry an accessible label.',
    },
    migrationNotes:
      'Content is InlineNode[], never a string. Any migration producing a bare string is wrong.',
  },

  list: {
    type: 'list',
    displayName: 'List',
    description: 'Ordered or unordered list. Items nest to unlimited depth.',
    since: 1,
    status: 'stable',
    editor: { supported: true, note: 'Tab / Shift+Tab adjusts nesting depth.' },
    renderer: {
      html: 'Recursive <ul> or <ol> with nested lists inside <li>',
      accessibility:
        'Nested lists must be children of <li>, not siblings — screen readers announce depth from structure.',
    },
    migrationNotes: 'Renderers cap display at MAX_RENDERED_LIST_DEPTH; stored depth is unbounded.',
  },

  table: {
    type: 'table',
    displayName: 'Table',
    description: 'Tabular data with a header row. Cells accept inline content, including math.',
    since: 1,
    status: 'stable',
    editor: { supported: true },
    renderer: {
      html: '<table> with <thead>/<tbody>, wrapped in an overflow-x:auto container',
      accessibility:
        'Header cells use <th scope="col">. Caption uses <caption>. The scroll container needs tabindex="0" so keyboard users can reach overflow.',
    },
    migrationNotes:
      'Row length is validated against header count at parse time; a migration that changes header count must rewrite every row.',
  },

  math: {
    type: 'math',
    displayName: 'Equation',
    description: 'A display equation on its own line, optionally labelled for cross-reference.',
    since: 1,
    status: 'stable',
    editor: { supported: true, note: 'LaTeX source with live KaTeX preview.' },
    renderer: {
      html: '<figure> wrapping KaTeX output in displayMode',
      accessibility:
        'Enable KaTeX MathML output and label the container. Never render math as an image without alt text.',
    },
    migrationNotes:
      'KaTeX runs with trust:false. A migration must never enable trust to fix rendering.',
  },

  image: {
    type: 'image',
    displayName: 'Image',
    description: 'An uploaded image with required alt text and an optional caption.',
    since: 1,
    status: 'stable',
    editor: { supported: false, note: 'Blocked on the asset pipeline (roadmap step 11).' },
    renderer: {
      html: '<figure><img><figcaption>',
      accessibility: 'alt is required by the schema. Decorative images do not belong in content.',
    },
    migrationNotes:
      'assetId is a foreign key living inside jsonb, so it has no DB-level integrity. Renderers degrade gracefully on a dangling reference rather than throwing.',
  },

  callout: {
    type: 'callout',
    displayName: 'Callout',
    description: 'A note, warning, or important aside set apart from body text.',
    since: 1,
    status: 'stable',
    editor: { supported: true },
    renderer: {
      html: '<aside> with a variant class',
      accessibility:
        'role="note". Never signal the variant by colour alone — include a text or icon label.',
    },
  },

  code: {
    type: 'code',
    displayName: 'Code',
    description: 'A preformatted code block with a language hint.',
    since: 1,
    status: 'stable',
    editor: { supported: true },
    renderer: {
      html: '<pre><code class="language-*">',
      accessibility:
        'Preserve whitespace. The scroll container needs tabindex="0" for keyboard access to overflow.',
    },
    migrationNotes: 'Syntax highlighting is presentational and never stored.',
  },
};

/** Registry entries in editor-palette order, excluding deprecated types. */
export function editorPalette(): BlockMeta[] {
  return Object.values(BLOCK_REGISTRY).filter(
    (meta) => meta.editor.supported && meta.status !== 'deprecated'
  );
}

export function blockMeta(type: BlockType): BlockMeta {
  return BLOCK_REGISTRY[type];
}

export function isDeprecated(type: BlockType): boolean {
  return BLOCK_REGISTRY[type].status === 'deprecated';
}
