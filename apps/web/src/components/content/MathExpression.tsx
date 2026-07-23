/**
 * Math rendering.
 *
 * KaTeX is the eventual renderer and must run with `trust: false` (its default)
 * so `\href` cannot inject a `javascript:` URL — content is editor-authored, so
 * the LaTeX string is untrusted input. Until the dependency is added, the raw
 * expression is shown in a monospace frame rather than silently dropped: an
 * unrendered formula a reader can still read beats an empty gap, and it makes
 * the pending work visible instead of looking finished.
 *
 * The accessible name carries the source in both cases, because KaTeX's visual
 * output is meaningless to a screen reader on its own.
 */
export function MathExpression({ latex, display }: { latex: string; display: boolean }) {
  const shared = 'font-mono text-text-primary';

  if (display) {
    return (
      <div
        role="math"
        aria-label={`Formula: ${latex}`}
        className={`${shared} overflow-x-auto rounded-md border border-DEFAULT bg-surface-card px-24 py-16 text-center`}
      >
        {latex}
      </div>
    );
  }

  return (
    <span role="math" aria-label={`Formula: ${latex}`} className={`${shared} px-4`}>
      {latex}
    </span>
  );
}
