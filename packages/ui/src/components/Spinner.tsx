import { cn } from '../lib/cn.js';

export interface SpinnerProps {
  className?: string;
  /**
   * Announced to screen readers. Pass `null` when the spinner sits inside a
   * control that already announces its own busy state, so the change is not
   * read out twice.
   */
  label?: string | null;
}

/**
 * Motion is opt-in rather than reset: the base style is motionless and the spin
 * is added only under `prefers-reduced-motion: no-preference`. A blanket
 * `animation-duration: 0.01ms` override leaves the element spinning
 * imperceptibly, which is still motion.
 *
 * Under reduced motion the arc remains visible as a static ring, so the busy
 * state is never conveyed by movement alone.
 */
export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block h-16 w-16 shrink-0 rounded-pill border-medium border-current border-r-transparent align-[-0.125em]',
        'motion-safe:animate-spin',
        className
      )}
      role={label === null ? 'presentation' : 'status'}
      aria-hidden={label === null ? true : undefined}
      aria-label={label ?? undefined}
    />
  );
}
