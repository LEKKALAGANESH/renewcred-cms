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
import plugin from 'tailwindcss/plugin.js';
import {
  border,
  color,
  controlHeight,
  effect,
  layout,
  radius,
  spacing,
  typography,
} from './tokens.js';

/**
 * WCAG 2.5.8 minimum target size. This is a standards constant, not a value the
 * design chose, so it is deliberately not a spacing step — putting it in the
 * scale would imply `p-44` and `gap-44` are sanctioned, which they are not.
 */
const MIN_TOUCH_TARGET = '44px';

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
  Object.entries(typography.scale).map(([name, scale]) => [
    name,
    [
      rem(scale.size),
      {
        lineHeight: rem(scale.lineHeight),
        fontWeight: String(scale.weight),
        // NOTE: Tailwind's fontSize tuple accepts only lineHeight,
        // letterSpacing and fontWeight. A fontStyle key here is silently
        // dropped, which is how the display title rendered upright when the
        // design sets WorkSans-MediumItalic. Italic scales therefore carry the
        // `italic` utility at the call site, and `italicScales` in tokens.ts
        // names them so that list cannot drift.
      },
    ],
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
    // DEFAULT is required or the bare `border` utility does not exist and every
    // stroke in the app silently disappears. 1px is the design's own default at
    // 955 occurrences, so this is the extracted hairline, not an invention.
    borderWidth: { DEFAULT: px(border.hairline), ...mapValues(border, px) },
    // Declared separately from `colors` so the common case is bare `border`.
    // Folding these into `colors` would spell the default stroke
    // `border-border-default` and also make `bg-border-*` expressible, which is
    // meaningless — a stroke colour is not a fill.
    borderColor: {
      DEFAULT: color.border.default,
      muted: color.border.muted,
      /** the outline button's stroke */
      strong: color.text.primary,
      brand: color.brand.primary,
      transparent: 'transparent',
      current: 'currentColor',
    },
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
      // Control heights are not spacing steps — see tokens.ts. Without these,
      // h-control-* emits nothing and the control collapses to content height.
      height: mapValues(controlHeight, (v) => px(v)),
      minHeight: { touch: MIN_TOUCH_TARGET },
      minWidth: { touch: MIN_TOUCH_TARGET },
    },
  },
  plugins: [
    plugin((api) => {
      // Hover affordances must be gated: on touch devices `:hover` sticks after
      // a tap, leaving elements permanently in their hover state.
      api.addVariant('hoverable', '@media (hover: hover)');
      // Pairs with min-h-touch/min-w-touch to meet the 44px target size on
      // touch input without altering the desktop design's exact dimensions.
      api.addVariant('coarse', '@media (any-pointer: coarse)');
    }),
  ],
} satisfies Config;
