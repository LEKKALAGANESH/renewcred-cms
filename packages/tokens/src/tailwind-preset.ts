/**
 * Tailwind preset built from the design tokens.
 *
 * These keys **replace** Tailwind's defaults rather than extending them. That is
 * deliberate: with `extend`, `bg-blue-500` and `p-7` keep working, so "no
 * hardcoded colours, no magic spacing" stays a review comment that someone has
 * to catch. Replacing the scales makes an off-token value fail to compile — the
 * class simply does not exist. The design's palette is small enough that this
 * costs nothing and removes a whole category of drift.
 *
 *   // tailwind.config.ts
 *   import { renewcredPreset } from '@renewcred/tokens/tailwind-preset';
 *   export default { presets: [renewcredPreset], content: [...] };
 */
import type { Config } from 'tailwindcss';
import { border, color, effect, layout, radius, spacing, typography } from './tokens.js';

const ROOT_FONT_SIZE = 16;

/** Font sizes are emitted in rem so user font-scaling is respected (WCAG 1.4.4). */
const rem = (px: number): string => `${px / ROOT_FONT_SIZE}rem`;

/** Spacing, radii, and layout stay in px — they are pixel-derived from a 1920 canvas. */
const px = (value: number): string => `${value}px`;

const mapValues = <T, R>(
  source: Record<string, T>,
  transform: (value: T) => R
): Record<string, R> =>
  Object.fromEntries(Object.entries(source).map(([key, value]) => [key, transform(value)]));

const fontSize = Object.fromEntries(
  Object.entries(typography.scale).map(([name, { size, lineHeight, weight }]) => [
    name,
    [rem(size), { lineHeight: rem(lineHeight), fontWeight: String(weight) }],
  ])
) as Config['theme'] & Record<string, unknown>;

export const renewcredPreset = {
  content: [],
  theme: {
    colors: {
      // Kept so `border-transparent` and `bg-transparent` remain expressible;
      // neither is a colour choice, so neither belongs in the extracted palette.
      transparent: 'transparent',
      current: 'currentColor',
      text: color.text,
      brand: color.brand,
      surface: color.surface,
    },
    spacing: mapValues(spacing, px),
    borderRadius: mapValues(radius, px),
    borderWidth: mapValues(border, px),
    fontFamily: {
      sans: [typography.fontFamily, 'system-ui', 'sans-serif'],
    },
    fontWeight: Object.fromEntries(
      typography.weights.map((weight) => [String(weight), String(weight)])
    ),
    fontSize,
    boxShadow: {
      sm: `${px(effect.shadowSm.offsetX)} ${px(effect.shadowSm.offsetY)} ${px(effect.shadowSm.blur)} ${effect.shadowSm.color}`,
      md: `${px(effect.shadowMd.offsetX)} ${px(effect.shadowMd.offsetY)} ${px(effect.shadowMd.blur)} ${effect.shadowMd.color}`,
      none: 'none',
    },
    backdropBlur: {
      nav: px(effect.backdropBlur),
    },
    maxWidth: {
      content: px(layout.contentMaxWidth),
      doc: px(layout.docContentWidth),
    },
    extend: {
      width: {
        sidebar: px(layout.docSidebarWidth),
      },
    },
  },
} satisfies Config;
