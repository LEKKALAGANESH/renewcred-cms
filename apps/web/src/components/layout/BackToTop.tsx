'use client';

import { useEffect, useState } from 'react';
import { cn } from '@renewcred/ui';

/**
 * Figma: a 40×149 rail pinned to the right edge with the label set vertically.
 *
 * Hidden until the reader is a viewport down — a "back to top" at the top is
 * noise. It is a real button in the tab order, and the scroll respects
 * `prefers-reduced-motion` rather than always smooth-scrolling.
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      }}
      // Kept mounted so the transition can run; `inert` when hidden so it never
      // becomes an invisible tab stop.
      inert={!isVisible}
      aria-hidden={!isVisible}
      className={cn(
        'fixed right-16 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-4 rounded-pill',
        'border border-DEFAULT bg-surface-card/80 p-8 backdrop-blur-nav transition-opacity duration-150',
        'hoverable:hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        'lg:flex',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-label font-400 underline underline-offset-4 [writing-mode:vertical-rl]">
        Back to Top
      </span>
    </button>
  );
}
