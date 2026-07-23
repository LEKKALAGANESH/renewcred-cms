import Link from 'next/link';
import type { StandardSummary } from '@/lib/content';

/**
 * Figma: a 1712×318 row — 24/8 padding, a 32/500 title beside a brand disc, a
 * "Read more" affordance at the far right, a #d8d8d8 hairline, then justified
 * body copy.
 *
 * The whole row is the link target via a stretched overlay: the design puts the
 * affordance at the far right of a 1712px row, and requiring a reader to travel
 * there to click is needless. The visible "Read more" carries the accessible
 * name so screen-reader users get "Read more about EV" rather than the entire
 * paragraph read as a link.
 */
export function StandardCard({ standard }: { standard: StandardSummary }) {
  return (
    <article className="relative flex flex-col gap-16 px-8 py-24 transition-colors hoverable:hover:bg-surface-card/60 focus-within:bg-surface-card/60">
      <div className="flex items-center gap-24">
        <h2 className="flex flex-1 items-center gap-8 text-heading text-text-primary">
          <span
            aria-hidden="true"
            className="inline-block h-16 w-16 shrink-0 rounded-pill bg-brand-primary"
          />
          {standard.title}
        </h2>

        <Link
          href={`/standards/${standard.slug}`}
          className="shrink-0 rounded-sm text-bodyStrong text-text-secondary underline underline-offset-4 hoverable:hover:text-brand-primary hoverable:hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {/* Stretched hit area — the row is the target, the text is the name. */}
          <span className="absolute inset-0" aria-hidden="true" />
          Read more
          <span className="sr-only"> about {standard.title}</span>
        </Link>
      </div>

      <hr className="border-0 border-t border-t-DEFAULT" />

      <p className="text-body text-text-primary [text-align:justify]">{standard.description}</p>
    </article>
  );
}
