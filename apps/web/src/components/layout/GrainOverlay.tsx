/**
 * Figma `NOISE` effect, alpha 0.30.
 *
 * Figma's noise has no CSS equivalent, but it is a *procedural* texture rather
 * than an exported asset, so it is reproduced with an SVG `feTurbulence` filter
 * inlined as a data URI. That is a real implementation of the effect, not a
 * placeholder standing in for one — nothing is being approximated away.
 *
 * `baseFrequency` 0.8 gives the fine grain of the render; `numOctaves` 4 keeps
 * it from tiling visibly. The layer is inert: `pointer-events-none` and
 * `aria-hidden`, so it can never intercept a click or reach a screen reader.
 */
const GRAIN = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="160" height="160" filter="url(#n)"/>
</svg>`;

const GRAIN_URI = `url("data:image/svg+xml,${encodeURIComponent(GRAIN)}")`;

export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-30 mix-blend-multiply"
      style={{ backgroundImage: GRAIN_URI, backgroundRepeat: 'repeat' }}
    />
  );
}
