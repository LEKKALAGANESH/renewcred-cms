import type { Section } from './document.js';

/**
 * Derived section numbering and table of contents.
 *
 * The design's sidebar shows 1.0 → 2.0 → 2.1 → 2.1.1 → 2.1.2 → 2.2 → 3.0,
 * matching the numbered headings in the body exactly. Storing those numbers as
 * content would create a second source of truth that silently drifts the moment
 * an editor inserts a section. Computing them means dragging section 3.0 above
 * 2.0 renumbers everything correctly, everywhere, for free.
 *
 * Top-level sections read `1.0`, `2.0` — matching the design. Deeper levels drop
 * the trailing `.0`: `2.1`, then `2.1.1`.
 */

export interface TocEntry {
  sectionId: string;
  title: string;
  anchor: string;
  ordinal: string;
  depth: number;
  children: TocEntry[];
}

export function buildTableOfContents(sections: readonly Section[]): TocEntry[] {
  return build(sections, '', 0);
}

function build(sections: readonly Section[], parentOrdinal: string, depth: number): TocEntry[] {
  return sections.map((section, index) => {
    const ordinal = parentOrdinal ? `${parentOrdinal}.${index + 1}` : `${index + 1}.0`;

    // "2.0" parents its children as "2.1", not "2.0.1".
    const childPrefix = ordinal.endsWith('.0') ? ordinal.slice(0, -2) : ordinal;

    return {
      sectionId: section.id,
      title: section.title,
      anchor: section.anchor,
      ordinal,
      depth,
      children: build(section.children, childPrefix, depth + 1),
    };
  });
}

/** Flat `sectionId → ordinal` lookup, for rendering headings in the body. */
export function sectionOrdinals(sections: readonly Section[]): Map<string, string> {
  const ordinals = new Map<string, string>();

  const collect = (entries: readonly TocEntry[]): void => {
    for (const entry of entries) {
      ordinals.set(entry.sectionId, entry.ordinal);
      collect(entry.children);
    }
  };

  collect(buildTableOfContents(sections));
  return ordinals;
}

/** Depth-first flatten, preserving reading order. */
export function flattenTableOfContents(entries: readonly TocEntry[]): TocEntry[] {
  return entries.flatMap((entry) => [entry, ...flattenTableOfContents(entry.children)]);
}

/**
 * Duplicate anchors break deep linking silently — two sections claim the same
 * fragment and the browser picks the first. Surfaced at validation time.
 */
export function findDuplicateAnchors(sections: readonly Section[]): string[] {
  return findDuplicates(sections, (entry) => entry.anchor);
}

/**
 * Duplicate section ids are worse than duplicate anchors, and less visible.
 *
 * `sectionOrdinals` keys a Map by section id, so two sections sharing an id
 * means the later one silently overwrites the earlier — every heading rendered
 * from that map shows the wrong number, with no error anywhere. The schema
 * requires ids to be UUIDs but cannot enforce uniqueness across a tree, so it
 * is checked here.
 *
 * (Found the hard way: a test fixture generated ids from depth+index, which
 * collided across sibling branches and produced exactly this failure.)
 */
export function findDuplicateSectionIds(sections: readonly Section[]): string[] {
  return findDuplicates(sections, (entry) => entry.sectionId);
}

function findDuplicates(sections: readonly Section[], key: (entry: TocEntry) => string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const entry of flattenTableOfContents(buildTableOfContents(sections))) {
    const value = key(entry);
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
}
