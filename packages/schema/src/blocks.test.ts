import { describe, expect, it } from 'vitest';
import {
  BLOCK_TYPES,
  blockToPlainText,
  listItemDepth,
  parseBlock,
  type Block,
  type ListItem,
} from './blocks.js';
import { BLOCK_EXAMPLES, INVALID_BLOCK_EXAMPLES } from './fixtures.js';
import { inlineToPlainText } from './inline.js';

describe('valid payload acceptance', () => {
  it.each(BLOCK_TYPES)('accepts the %s example', (type) => {
    const result = parseBlock(BLOCK_EXAMPLES[type]);
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it('has an example for every block type', () => {
    expect(Object.keys(BLOCK_EXAMPLES).sort()).toEqual([...BLOCK_TYPES].sort());
  });
});

describe('invalid payload rejection', () => {
  it.each(INVALID_BLOCK_EXAMPLES)('rejects: $reason', ({ value }) => {
    expect(parseBlock(value).success).toBe(false);
  });

  it('names the offending field rather than dumping every union member', () => {
    const result = parseBlock({ type: 'video', src: 'x.mp4' });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toHaveLength(1);
    expect(result.error.issues[0]?.message).toContain('video');
    expect(result.error.issues[0]?.message).toContain('paragraph');
  });

  it('reports a table row-length mismatch with the row index', () => {
    const result = parseBlock({
      type: 'table',
      headers: [[{ type: 'text', text: 'A' }], [{ type: 'text', text: 'B' }]],
      rows: [
        [[{ type: 'text', text: '1' }], [{ type: 'text', text: '2' }]],
        [[{ type: 'text', text: '3' }]],
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(['rows', 1]);
    expect(result.error.issues[0]?.message).toContain('2 headers defined');
  });
});

describe('unknown field handling', () => {
  it('rejects unknown keys rather than silently stripping them', () => {
    const result = parseBlock({
      type: 'math',
      latex: 'x = 1',
      displayMode: true, // plausible but not in the schema
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown keys nested inside inline content', () => {
    const result = parseBlock({
      type: 'paragraph',
      content: [{ type: 'text', text: 'x', color: 'red' }],
    });

    expect(result.success).toBe(false);
  });
});

describe('serialization stability', () => {
  it.each(BLOCK_TYPES)('%s survives a JSON round trip unchanged', (type) => {
    const original = BLOCK_EXAMPLES[type];
    const revived: unknown = JSON.parse(JSON.stringify(original));

    const result = parseBlock(revived);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual(original);
  });

  it('parsing is idempotent — parse(parse(x)) equals parse(x)', () => {
    for (const type of BLOCK_TYPES) {
      const once = parseBlock(BLOCK_EXAMPLES[type]);
      expect(once.success).toBe(true);
      if (!once.success) continue;

      const twice = parseBlock(once.data);
      expect(twice.success).toBe(true);
      if (!twice.success) continue;

      expect(twice.data).toEqual(once.data);
    }
  });

  it('does not mutate its input', () => {
    const input = structuredClone(BLOCK_EXAMPLES.table);
    const snapshot = JSON.stringify(input);

    parseBlock(input);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('nested lists', () => {
  const nested = BLOCK_EXAMPLES.list;

  it('accepts three levels of nesting', () => {
    expect(nested.type).toBe('list');
    if (nested.type !== 'list') return;
    expect(listItemDepth(nested.items)).toBe(3);
  });

  it('accepts depth far beyond what any renderer displays', () => {
    let deepest: ListItem = { content: [{ type: 'text', text: 'leaf' }], children: [] };
    for (let level = 0; level < 12; level += 1) {
      deepest = { content: [{ type: 'text', text: `level ${level}` }], children: [deepest] };
    }

    const result = parseBlock({ type: 'list', ordered: false, items: [deepest] });
    expect(result.success).toBe(true);
    expect(listItemDepth([deepest])).toBe(13);
  });

  it('rejects a list item with no inline content', () => {
    expect(
      parseBlock({ type: 'list', ordered: false, items: [{ content: [], children: [] }] }).success
    ).toBe(false);
  });
});

describe('inline math — the requirement a flat model cannot express', () => {
  it('places math between text runs inside one paragraph', () => {
    const paragraph = BLOCK_EXAMPLES.paragraph;
    expect(paragraph.type).toBe('paragraph');
    if (paragraph.type !== 'paragraph') return;

    const kinds = paragraph.content.map((node) => node.type);
    const mathIndex = kinds.indexOf('inlineMath');

    expect(mathIndex).toBeGreaterThan(0);
    expect(kinds.slice(mathIndex + 1)).toContain('text');
  });

  it('renders math inside a table cell without a dedicated block type', () => {
    const table = BLOCK_EXAMPLES.table;
    expect(table.type).toBe('table');
    if (table.type !== 'table') return;

    const cellKinds = table.rows.flat().flatMap((cell) => cell.map((node) => node.type));
    expect(cellKinds).toContain('inlineMath');
  });
});

describe('plain-text flattening', () => {
  it.each(BLOCK_TYPES)('produces non-empty search text for %s', (type) => {
    expect(blockToPlainText(BLOCK_EXAMPLES[type]).trim().length).toBeGreaterThan(0);
  });

  it('includes nested list content, not just top-level items', () => {
    expect(blockToPlainText(BLOCK_EXAMPLES.list)).toContain('Category M1');
  });

  it('contributes latex source for math rather than dropping the run', () => {
    expect(inlineToPlainText([{ type: 'inlineMath', latex: 'E = mc^2' }])).toBe('E = mc^2');
  });
});

describe('exhaustiveness', () => {
  it('blockToPlainText handles every block type without a default branch', () => {
    // A new block type added to the union makes blockToPlainText fail to
    // compile, because its switch has no default. This asserts the runtime half.
    const handled = BLOCK_TYPES.map((type) => {
      const block: Block = BLOCK_EXAMPLES[type];
      return typeof blockToPlainText(block) === 'string';
    });

    expect(handled.every(Boolean)).toBe(true);
  });
});
