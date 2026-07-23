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
    /** footer and sub-menu link text — 15 */
    link: '#202020',
  },
  brand: {
    /** logo mark, active nav, active TOC item, accents — 47 */
    primary: '#be202e',
    /** brand-tinted surface — 1 */
    tint: '#fcf4f5',
    /** newsletter text field surface — 5 */
    tintSoft: '#f8e9ea',
    /** sub-menu active surface — 6 */
    tintStrong: '#f1dae0',
  },
  surface: {
    /** page background — 11 */
    page: '#f5f5f5',
    /** cards, nav bar, inputs — 150 */
    card: '#ffffff',
  },
  /**
   * Strokes. Absent from the original extraction, which captured fills only —
   * `default` is the single most-used colour of any kind in the file at 88
   * occurrences, so every bordered surface would otherwise have been a guess.
   */
  border: {
    /** cards, inputs, icon buttons, dividers — 88 */
    default: '#d8d8d8',
    /** secondary divider — 3 */
    muted: '#d2d1d1',
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
    /** page title — "EV", "RenewCred Standards". WorkSans-MediumItalic. */
    display: { size: 72, lineHeight: 78, weight: 500, italic: true },
    /** numbered section headings — "1.0 Introduction" */
    heading: { size: 32, lineHeight: 37.54, weight: 500 },
    /** newsletter headline — WorkSans-Italic */
    subheadingLg: { size: 24, lineHeight: 28.15, weight: 400, italic: true },
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
    /** hero eyebrow chip — 20/23.46, NOT the 20/24 of bodyStrong */
    chip: { size: 20, lineHeight: 23.46, weight: 500 },
    /** "Read more" — 20/28.96 and always underlined in the design */
    link: { size: 20, lineHeight: 28.96, weight: 500 },
    /** footer address, legal links, "Back to Top" — weight 400, not label's 500 */
    labelRegular: { size: 16, lineHeight: 24, weight: 400 },
    /** version/status line — "Certified - 12 Jul 2025" */
    meta: { size: 14, lineHeight: 20, weight: 400 },
    /** footer legal — WorkSans-Italic */
    caption: { size: 12, lineHeight: 16, weight: 400, italic: true },
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

/**
 * Control heights, measured from the Figma frames.
 *
 * These are deliberately **not** spacing steps. The extraction counted
 * auto-layout gaps and padding, so element heights never entered the spacing
 * scale — which means `h-48` does not exist and a primary button styled with it
 * silently collapses to its content height. Naming the control sizes separately
 * keeps the spacing scale honest and makes the three real control shapes
 * explicit.
 */
export const controlHeight = {
  /** outline button, icon button — 40×40 for the icon variant */
  sm: 40,
  /** primary button */
  md: 48,
  /** search field, newsletter field */
  lg: 56,
} as const;

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

/**
 * Scales the design sets in italic. Tailwind's fontSize tuple cannot express
 * font-style, so these require the  utility alongside the size class.
 */
export const italicScales = ['display', 'subheadingLg', 'caption'] as const;

export type ColorTokens = typeof color;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyScaleToken = keyof typeof typography.scale;
