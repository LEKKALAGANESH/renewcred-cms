/**
 * Design tokens — extracted from the Figma file, never invented.
 *
 * The file publishes zero shared Figma styles, so the token *names* here are
 * ours; every token *value* is counted from the node tree. `figma/design-tokens.json`
 * is the extraction record and `tokens.test.ts` asserts this file still agrees
 * with it — drift between the design and the code fails the build rather than
 * shipping as a visual regression nobody diffed.
 *
 * Occurrence counts are retained in comments where they justify a naming choice
 * (e.g. `body` is the most-used text style in the file at 56 occurrences, which
 * is why it is the default rather than one variant among several).
 */

/** Hex colours, grouped by role rather than by hue. */
export const color = {
  text: {
    /** body copy, headings — 167 occurrences */
    primary: '#2b2c2c',
    /** supporting copy, inactive table-of-contents entries — 57 */
    secondary: '#505050',
    /** input placeholder, meta — 4 */
    muted: '#9f9f9f',
    /** text on dark/brand surfaces — 150 */
    inverse: '#ffffff',
    /** display headings — 16 */
    strong: '#020202',
  },
  brand: {
    /** logo mark, active nav, active TOC item, accents — 47 */
    primary: '#be202e',
    /** brand-tinted surface — 1 */
    tint: '#fcf4f5',
  },
  surface: {
    /** page background — 11 */
    page: '#f5f5f5',
    /** cards, nav bar, inputs — 150 */
    card: '#ffffff',
  },
} as const;

/**
 * Work Sans throughout. Line heights are the raw Figma values — the fractional
 * ones (37.54, 28.15) are Figma's computed leading from a percentage setting and
 * are kept exact rather than rounded, so text metrics match the design.
 */
export const typography = {
  fontFamily: 'Work Sans',
  weights: [300, 400, 500, 600],
  scale: {
    /** page title — "EV", "RenewCred Standards" */
    display: { size: 72, lineHeight: 78, weight: 500 },
    /** numbered section headings — "1.0 Introduction" */
    heading: { size: 32, lineHeight: 37.54, weight: 500 },
    /** newsletter headline */
    subheadingLg: { size: 24, lineHeight: 28.15, weight: 400 },
    /** newsletter input text */
    subheadingLt: { size: 24, lineHeight: 28.15, weight: 300 },
    /** primary body paragraph — the most-used style in the file, 56 occurrences */
    body: { size: 20, lineHeight: 28, weight: 400 },
    /** table-of-contents entries */
    bodyCompact: { size: 20, lineHeight: 24, weight: 400 },
    /** "Read more", "Version", version label */
    bodyStrong: { size: 20, lineHeight: 24, weight: 500 },
    /** "Subscribe" */
    bodyBold: { size: 20, lineHeight: 24, weight: 600 },
    /** nav items, version chips — 34 occurrences */
    label: { size: 16, lineHeight: 24, weight: 500 },
  },
} as const;

/**
 * A clean 4px scale. These are the steps the design actually uses — the gaps
 * (no 28, 32, 48) are real, not omissions. Adding the missing steps "for
 * completeness" would invite spacing the design never sanctioned.
 */
export const spacing = {
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
  40: 40,
  64: 64,
  80: 80,
  104: 104,
  160: 160,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 40,
  '2xl': 48,
  /** search field, "Standards" chip, buttons — 15 occurrences */
  pill: 50,
} as const;

/** Top-rounded panel: [topLeft, topRight, bottomRight, bottomLeft]. */
export const radiusPanelTop = [80, 80, 0, 0] as const;

export const border = {
  /** 955 occurrences — effectively the default stroke */
  hairline: 1,
  medium: 1.5,
} as const;

/**
 * Shadow colour and alpha come from the Figma node tree, not from the token
 * extract, which recorded geometry only. Both are pure black at low alpha.
 */
export const effect = {
  shadowSm: { offsetX: 0, offsetY: 0, blur: 4, color: 'rgba(0, 0, 0, 0.25)' },
  shadowMd: { offsetX: 0, offsetY: 4, blur: 16, color: 'rgba(0, 0, 0, 0.16)' },
  /** sticky nav bar */
  backdropBlur: 40,
} as const;

/**
 * The design is drawn at 1920. `contentMaxWidth` is the content column, and
 * `gutter` is the space either side — 1712 + 2×104 = 1920 exactly.
 */
export const layout = {
  designWidth: 1920,
  contentMaxWidth: 1712,
  gutter: 104,
  docSidebarWidth: 292,
  docContentWidth: 842,
} as const;

export type ColorTokens = typeof color;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyScaleToken = keyof typeof typography.scale;
