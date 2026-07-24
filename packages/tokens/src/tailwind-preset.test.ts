/**
 * The preset's job is to make off-token values unexpressible. These tests assert
 * that property directly — that the default palette and spacing scale are gone,
 * not merely supplemented — because an accidental `extend:` would silently
 * restore `bg-blue-500` and nothing else would notice.
 */
import { describe, expect, it } from 'vitest';
import { renewcredPreset } from './tailwind-preset.js';
import { color, layout, radius, spacing, typography } from './tokens.js';

const theme = renewcredPreset.theme;

describe('palette', () => {
  it('exposes every brand, text, and surface token', () => {
    expect(theme.colors.text).toEqual(color.text);
    expect(theme.colors.brand).toEqual(color.brand);
    expect(theme.colors.surface).toEqual(color.surface);
  });

  it('drops Tailwind default hues entirely', () => {
    const keys = Object.keys(theme.colors);
    expect(keys).not.toContain('blue');
    expect(keys).not.toContain('gray');
    expect(keys).not.toContain('red');
  });

  it('keeps transparent and currentColor, which are not colour choices', () => {
    expect(theme.colors.transparent).toBe('transparent');
    expect(theme.colors.current).toBe('currentColor');
  });

  it('exposes strokes through borderColor, not through the fill palette', () => {
    expect(theme.borderColor.DEFAULT).toBe(color.border.default);
    expect(theme.borderColor.muted).toBe(color.border.muted);
    // `border-strong` is the outline button; `border-brand` the primary button.
    expect(theme.borderColor.strong).toBe(color.text.primary);
    expect(theme.borderColor.brand).toBe(color.brand.primary);
    expect(Object.keys(theme.colors)).not.toContain('border');
  });
});

describe('spacing', () => {
  it('replaces the default scale with the extracted steps only', () => {
    expect(Object.keys(theme.spacing).sort()).toEqual(Object.keys(spacing).sort());
  });

  it('emits px so values stay pixel-exact to the 1920 canvas', () => {
    expect(theme.spacing['104']).toBe('104px');
    expect(theme.spacing['8']).toBe('8px');
  });

  it('has no off-token step', () => {
    expect(theme.spacing['7']).toBeUndefined();
    expect(theme.spacing['32']).toBeUndefined();
  });

  it('restores 0 as a reset via extend, not as a spacing step', () => {
    // 0 is not a design step, so it must not appear in the extract-parity scale...
    expect(theme.spacing['0']).toBeUndefined();
    // ...but it must be expressible, or min-w-0, inset-0, top-0, gap-0 and p-0 all
    // silently fail to generate (Tailwind derives inset/minWidth/etc. from spacing).
    expect(theme.extend.spacing).toMatchObject({ 0: '0px' });
  });
});

describe('typography', () => {
  it('emits rem so user font scaling is respected', () => {
    const [size, meta] = theme.fontSize.body as [
      string,
      { lineHeight: string; fontWeight: string },
    ];
    expect(size).toBe(`${typography.scale.body.size / 16}rem`);
    expect(meta.lineHeight).toBe(`${typography.scale.body.lineHeight / 16}rem`);
    expect(meta.fontWeight).toBe('400');
  });

  it('carries every scale entry', () => {
    expect(Object.keys(theme.fontSize).sort()).toEqual(Object.keys(typography.scale).sort());
  });

  it('preserves fractional line heights rather than rounding them', () => {
    const [, meta] = theme.fontSize.heading as [string, { lineHeight: string }];
    expect(meta.lineHeight).toBe(`${37.54 / 16}rem`);
  });
});

describe('radii, shadows, and layout', () => {
  it('maps every radius token', () => {
    expect(Object.keys(theme.borderRadius).sort()).toEqual(Object.keys(radius).sort());
    expect(theme.borderRadius.pill).toBe('50px');
  });

  it('exposes border-width 0 and surface stroke colours, or resets/dividers vanish', () => {
    // `border-0` must be expressible (the extracted border scale has no 0 step).
    expect(theme.borderWidth['0']).toBe('0px');
    // Surface colours are valid stroke colours (the footer's white divider).
    expect(theme.borderColor.surface).toEqual(color.surface);
  });

  it('composes shadows with their extracted alpha', () => {
    expect(theme.boxShadow.sm).toBe('0px 0px 4px rgba(0, 0, 0, 0.25)');
    expect(theme.boxShadow.md).toBe('0px 4px 16px rgba(0, 0, 0, 0.16)');
  });

  it('exposes the content and document widths', () => {
    expect(theme.maxWidth.content).toBe(`${layout.contentMaxWidth}px`);
    expect(theme.maxWidth.doc).toBe(`${layout.docContentWidth}px`);
    expect(theme.extend.width.sidebar).toBe(`${layout.docSidebarWidth}px`);
  });
});
