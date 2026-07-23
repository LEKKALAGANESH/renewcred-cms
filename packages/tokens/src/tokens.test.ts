/**
 * Drift guard.
 *
 * `tokens.ts` is hand-authored so it can carry types and intent, which means it
 * can silently disagree with the extraction it claims to mirror. That is exactly
 * the failure this suite exists to catch: a designer changes a value, the
 * extract is re-pulled, and the code keeps rendering last month's design because
 * nothing compared the two.
 *
 * The Figma extract is read from the repo root rather than imported, because it
 * belongs to the design pipeline, not to this package's public surface.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { border, color, effect, layout, radius, spacing, typography } from './tokens.js';

const EXTRACT_PATH = fileURLToPath(new URL('../../../figma/design-tokens.json', import.meta.url));

interface ValueToken {
  value: number;
}
interface ColorToken {
  value: string;
}
interface TypographyEntry {
  size: number;
  lineHeight: number;
  weight: number;
}
interface Extract {
  color: Record<string, Record<string, ColorToken>>;
  typography: {
    fontFamily: string;
    weights: number[];
    scale: Record<string, TypographyEntry>;
  };
  spacing: { scale: Record<string, ValueToken> };
  radius: Record<string, ValueToken | { value: number[] }>;
  border: Record<string, ValueToken>;
  layout: Record<string, number>;
}

const extract = JSON.parse(readFileSync(EXTRACT_PATH, 'utf8')) as Extract;

describe('colour tokens match the Figma extract', () => {
  const groups = [
    ['text', color.text],
    ['brand', color.brand],
    ['surface', color.surface],
    ['border', color.border],
  ] as const;

  for (const [group, tokens] of groups) {
    for (const [name, value] of Object.entries(tokens)) {
      it(`color.${group}.${name}`, () => {
        expect(extract.color[group]?.[name]?.value).toBe(value);
      });
    }
  }

  it('claims no colour the extract does not define', () => {
    // `surface.shadow` is intentionally absent: it is a shadow *component*,
    // consumed through effect.shadow* with its alpha, never as a fill.
    const extracted = new Set(
      groups.flatMap(([group]) =>
        Object.keys(extract.color[group] ?? {}).map((k) => `${group}.${k}`)
      )
    );
    const declared = groups.flatMap(([group, tokens]) =>
      Object.keys(tokens).map((k) => `${group}.${k}`)
    );
    expect(declared.filter((token) => !extracted.has(token))).toEqual([]);
  });
});

describe('typography matches the Figma extract', () => {
  it('uses the extracted family and weights', () => {
    expect(typography.fontFamily).toBe(extract.typography.fontFamily);
    expect([...typography.weights]).toEqual(extract.typography.weights);
  });

  for (const [name, scale] of Object.entries(typography.scale)) {
    it(`typography.scale.${name}`, () => {
      const source = extract.typography.scale[name];
      expect(source).toBeDefined();
      expect(scale.size).toBe(source?.size);
      expect(scale.lineHeight).toBe(source?.lineHeight);
      expect(scale.weight).toBe(source?.weight);
    });
  }

  it('every weight used by the scale is a declared weight', () => {
    const declared = new Set<number>(typography.weights);
    for (const scale of Object.values(typography.scale)) {
      expect(declared.has(scale.weight)).toBe(true);
    }
  });
});

describe('spacing matches the Figma extract', () => {
  it('declares exactly the steps the design uses', () => {
    expect(
      Object.keys(spacing)
        .map(Number)
        .sort((a, b) => a - b)
    ).toEqual(
      Object.keys(extract.spacing.scale)
        .map(Number)
        .sort((a, b) => a - b)
    );
  });

  it('every step maps to its own numeric value', () => {
    for (const [key, value] of Object.entries(spacing)) {
      expect(value).toBe(Number(key));
      expect(extract.spacing.scale[key]?.value).toBe(value);
    }
  });
});

describe('radius, border, and layout match the Figma extract', () => {
  for (const [name, value] of Object.entries(radius)) {
    it(`radius.${name}`, () => {
      expect(extract.radius[name]).toMatchObject({ value });
    });
  }

  for (const [name, value] of Object.entries(border)) {
    it(`border.${name}`, () => {
      expect(extract.border[name]?.value).toBe(value);
    });
  }

  it('layout dimensions are unchanged', () => {
    expect(layout.designWidth).toBe(extract.layout.designWidth);
    expect(layout.contentMaxWidth).toBe(extract.layout.contentMaxWidth);
    expect(layout.gutter).toBe(extract.layout.gutter);
    expect(layout.docSidebarWidth).toBe(extract.layout.docSidebarWidth);
    expect(layout.docContentWidth).toBe(extract.layout.docContentWidth);
  });

  it('content width plus both gutters equals the design canvas', () => {
    expect(layout.contentMaxWidth + layout.gutter * 2).toBe(layout.designWidth);
  });
});

describe('effects', () => {
  // Geometry is in the extract; colour and alpha were read from the node tree,
  // so they are asserted against the values recorded in DECISIONS.md rather
  // than against the extract, which never captured them.
  it('shadow alpha is preserved exactly', () => {
    expect(effect.shadowSm.color).toBe('rgba(0, 0, 0, 0.25)');
    expect(effect.shadowMd.color).toBe('rgba(0, 0, 0, 0.16)');
  });

  it('shadow geometry matches the extract', () => {
    expect(effect.shadowSm).toMatchObject({ offsetX: 0, offsetY: 0, blur: 4 });
    expect(effect.shadowMd).toMatchObject({ offsetX: 0, offsetY: 4, blur: 16 });
    expect(effect.backdropBlur).toBe(40);
  });
});
