import { describe, expect, it } from 'vitest';
import type { Section } from './document.js';
import { richDemoDocument } from './fixtures.js';
import {
  buildTableOfContents,
  findDuplicateAnchors,
  findDuplicateSectionIds,
  flattenTableOfContents,
  sectionOrdinals,
} from './numbering.js';

/**
 * Builds a section tree from a nested title spec, so tests read structurally.
 *
 * Ids come from a monotonic counter, NOT from depth+index — the latter collides
 * across sibling branches (two different "depth 1, index 0" sections get the
 * same id), which silently corrupts any Map keyed by section id.
 */
function tree(spec: Record<string, unknown>): Section[] {
  let counter = 0;
  const nextId = (): string =>
    `00000000-0000-4000-8000-${String((counter += 1)).padStart(12, '0')}`;

  const build = (node: Record<string, unknown>): Section[] =>
    Object.entries(node).map(([title, children]) => ({
      id: nextId(),
      title,
      anchor: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      blocks: [],
      children: children ? build(children as Record<string, unknown>) : [],
    }));

  return build(spec);
}

describe('ordinals match the design exactly', () => {
  /**
   * The Figma sidebar shows: 1.0, 2.0, 2.1, 2.1.1, 2.1.2, 2.2, 3.0, 3.1,
   * 3.1.1, 3.1.2, 3.2 — this reproduces that structure and asserts the numbers.
   */
  const sections = tree({
    Introduction: null,
    'Future Versions': {
      'Sub A': { 'Deep A': null, 'Deep B': null },
      'Sub B': null,
    },
    Third: {
      'Third Sub A': { 'Third Deep A': null, 'Third Deep B': null },
      'Third Sub B': null,
    },
  });

  it('produces the exact ordinal sequence from the design', () => {
    const ordinals = flattenTableOfContents(buildTableOfContents(sections)).map((e) => e.ordinal);

    expect(ordinals).toEqual([
      '1.0',
      '2.0',
      '2.1',
      '2.1.1',
      '2.1.2',
      '2.2',
      '3.0',
      '3.1',
      '3.1.1',
      '3.1.2',
      '3.2',
    ]);
  });

  it('numbers top-level sections x.0 and children x.1, not x.0.1', () => {
    const toc = buildTableOfContents(sections);
    expect(toc[1]?.ordinal).toBe('2.0');
    expect(toc[1]?.children[0]?.ordinal).toBe('2.1');
    expect(toc[1]?.children[0]?.children[0]?.ordinal).toBe('2.1.1');
  });

  it('records depth for indentation', () => {
    const entries = flattenTableOfContents(buildTableOfContents(sections));
    expect(entries.find((e) => e.ordinal === '1.0')?.depth).toBe(0);
    expect(entries.find((e) => e.ordinal === '2.1')?.depth).toBe(1);
    expect(entries.find((e) => e.ordinal === '2.1.1')?.depth).toBe(2);
  });
});

describe('reordering renumbers everything — the reason ordinals are derived', () => {
  const original = tree({ First: { 'First Child': null }, Second: { 'Second Child': null } });

  it('renumbers descendants when a top-level section moves', () => {
    const before = sectionOrdinals(original);
    const firstId = original[0]?.id ?? '';
    const firstChildId = original[0]?.children[0]?.id ?? '';

    expect(before.get(firstId)).toBe('1.0');
    expect(before.get(firstChildId)).toBe('1.1');

    // Swap the two top-level sections — exactly what a drag-and-drop does.
    const reordered = [original[1], original[0]].filter((s): s is Section => s !== undefined);
    const after = sectionOrdinals(reordered);

    expect(after.get(firstId)).toBe('2.0');
    expect(after.get(firstChildId)).toBe('2.1');
  });

  it('keeps anchors stable across renumbering, so deep links survive', () => {
    const firstChild = original[0]?.children[0];
    const reordered = [original[1], original[0]].filter((s): s is Section => s !== undefined);

    const stillPresent = flattenTableOfContents(buildTableOfContents(reordered)).find(
      (entry) => entry.sectionId === firstChild?.id
    );

    expect(stillPresent?.anchor).toBe(firstChild?.anchor);
    expect(stillPresent?.ordinal).not.toBe('1.1');
  });
});

describe('table of contents from the demo document', () => {
  const toc = buildTableOfContents(richDemoDocument().sections);

  it('mirrors the section tree', () => {
    expect(toc.map((entry) => entry.title)).toEqual([
      'Introduction',
      'Scope and Boundaries',
      'Reporting Requirements',
    ]);
  });

  it('reaches three levels deep', () => {
    expect(toc[1]?.children[0]?.children[0]?.ordinal).toBe('2.1.1');
    expect(toc[1]?.children[0]?.children[0]?.title).toBe('Grid Emission Factor');
  });

  it('carries the anchor for each entry', () => {
    expect(toc[0]?.anchor).toBe('introduction');
  });
});

describe('edge cases', () => {
  it('returns an empty table of contents for an empty document', () => {
    expect(buildTableOfContents([])).toEqual([]);
  });

  it('finds no duplicate anchors in the demo document', () => {
    expect(findDuplicateAnchors(richDemoDocument().sections)).toEqual([]);
  });

  it('detects duplicate anchors across different branches', () => {
    const sections = tree({ Alpha: { Overview: null }, Beta: { Overview: null } });
    expect(findDuplicateAnchors(sections)).toEqual(['overview']);
  });

  it('finds no duplicate section ids in a well-formed tree', () => {
    expect(findDuplicateSectionIds(richDemoDocument().sections)).toEqual([]);
  });

  it('detects duplicate section ids, which silently corrupt the ordinal map', () => {
    const duplicateId = '00000000-0000-4000-8000-000000000099';
    const sections = tree({ Alpha: { Child: null }, Beta: { Child: null } });

    const alphaChild = sections[0]?.children[0];
    const betaChild = sections[1]?.children[0];
    if (!alphaChild || !betaChild) throw new Error('fixture shape changed');

    alphaChild.id = duplicateId;
    betaChild.id = duplicateId;

    expect(findDuplicateSectionIds(sections)).toEqual([duplicateId]);

    // Demonstrates the corruption the check exists to catch: the map holds one
    // entry for two sections, so Alpha's child reports Beta's child's ordinal.
    expect(sectionOrdinals(sections).get(duplicateId)).toBe('2.1');
  });
});
