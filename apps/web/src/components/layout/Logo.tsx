/**
 * The RenewCred wordmark, rendered from the real Figma vector art.
 *
 * Two colour cuts ship: `ink` for light surfaces (the header card) and the
 * white `inverse` for the dark footer panel. Both are reconstructed from the
 * Figma path geometry by `figma/build-svgs.mjs` and copied into /public — the
 * earlier text placeholder is retired now that a faithful SVG exists.
 *
 * A11y: the mark names itself ("RenewCred") by default. Pass `alt=""` where a
 * sibling already labels the link — the header's home link is labelled
 * separately — so screen readers do not announce the name twice.
 */
const VARIANT = {
  ink: { src: '/renewcred-logo.svg', width: 144, height: 50 },
  inverse: { src: '/renewcred-logo-inverse.svg', width: 231, height: 80 },
} as const;

export function Logo({
  tone = 'ink',
  alt = 'RenewCred',
  className = 'h-[40px] w-auto',
}: {
  tone?: 'ink' | 'inverse';
  alt?: string;
  className?: string;
}) {
  const { src, width, height } = VARIANT[tone];
  return (
    // A plain <img> from /public: an 8KB wordmark does not belong in the JS
    // bundle, and next/image serves SVGs unoptimised anyway. The width/height
    // attributes carry the aspect ratio so the box is reserved before load.
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      aria-hidden={alt === '' || undefined}
      draggable={false}
    />
  );
}
