/**
 * The RenewCred wordmark.
 *
 * The Figma draws it as 13 loose vector paths with no exported asset, so it is
 * reproduced as text with the two brand-coloured glyphs isolated — the same
 * split the design uses (`#be202e` on "Cr", ink elsewhere). Recorded as an
 * assumption: a real build would consume the supplied SVG.
 */
export function Logo({ tone = 'ink' }: { tone?: 'ink' | 'inverse' }) {
  const base = tone === 'inverse' ? 'text-text-inverse' : 'text-text-primary';
  return (
    <span className={`font-sans text-heading font-500 tracking-tight ${base}`}>
      Renew<span className="text-brand-primary">Cred</span>
    </span>
  );
}
