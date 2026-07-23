import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES, parseBlock } from './blocks.js';
import { BLOCK_EXAMPLES } from './fixtures.js';
import { BLOCK_REGISTRY, blockMeta, editorPalette, isDeprecated } from './registry.js';

describe('registry completeness', () => {
  it('has an entry for every block type', () => {
    expect(Object.keys(BLOCK_REGISTRY).sort()).toEqual([...BLOCK_TYPES].sort());
  });

  it('has no entry for a block type that does not exist', () => {
    for (const key of Object.keys(BLOCK_REGISTRY)) {
      expect(BLOCK_TYPES).toContain(key);
    }
  });

  it("every entry's type field matches its key", () => {
    for (const [key, meta] of Object.entries(BLOCK_REGISTRY)) {
      expect(meta.type).toBe(key);
    }
  });
});

describe('renderer contract compliance', () => {
  it.each(BLOCK_TYPES)('%s documents the HTML it produces', (type) => {
    expect(blockMeta(type).renderer.html.trim().length).toBeGreaterThan(0);
  });

  it.each(BLOCK_TYPES)('%s documents its accessibility obligations', (type) => {
    expect(blockMeta(type).renderer.accessibility.trim().length).toBeGreaterThan(0);
  });

  it('requires alt text handling to be documented for images', () => {
    expect(blockMeta('image').renderer.accessibility).toMatch(/alt/i);
  });

  it('requires scroll containers to be keyboard reachable', () => {
    // Overflow that cannot be reached by keyboard is unreachable content.
    expect(blockMeta('table').renderer.accessibility).toContain('tabindex');
    expect(blockMeta('code').renderer.accessibility).toContain('tabindex');
  });

  it('requires nested lists to be structurally nested, not visually indented', () => {
    expect(blockMeta('list').renderer.accessibility).toContain('<li>');
  });

  it('does not signal callout variants by colour alone', () => {
    expect(blockMeta('callout').renderer.accessibility).toMatch(/colour alone|color alone/i);
  });
});

describe('metadata quality', () => {
  it.each(BLOCK_TYPES)('%s has a display name and description', (type) => {
    const meta = blockMeta(type);
    expect(meta.displayName.trim().length).toBeGreaterThan(0);
    expect(meta.description.trim().length).toBeGreaterThan(0);
  });

  it.each(BLOCK_TYPES)('%s declares the schema version it appeared in', (type) => {
    expect(blockMeta(type).since).toBeGreaterThanOrEqual(1);
  });

  it('records a deprecation note whenever status is deprecated', () => {
    for (const meta of Object.values(BLOCK_REGISTRY)) {
      if (meta.status === 'deprecated') {
        expect(meta.deprecation).toBeDefined();
        expect(meta.deprecation?.note.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('explains why a block is unsupported in the editor', () => {
    for (const meta of Object.values(BLOCK_REGISTRY)) {
      if (!meta.editor.supported) {
        expect(meta.editor.note?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});

describe('editor palette', () => {
  it('excludes block types with no editor support', () => {
    const palette = editorPalette().map((meta) => meta.type);
    expect(palette).not.toContain('image'); // blocked on the asset pipeline
    expect(palette).toContain('paragraph');
  });

  it('excludes deprecated block types', () => {
    expect(editorPalette().every((meta) => !isDeprecated(meta.type))).toBe(true);
  });
});

describe('registry and schema agree', () => {
  it('every registry entry has a parseable example', () => {
    for (const type of BLOCK_TYPES) {
      const result = parseBlock(BLOCK_EXAMPLES[type]);
      expect(result.success, `${type} example failed to parse`).toBe(true);
    }
  });

  it('every example carries the type its registry key claims', () => {
    for (const type of BLOCK_TYPES) {
      expect(BLOCK_EXAMPLES[type].type).toBe(BLOCK_REGISTRY[type].type);
    }
  });
});
