'use client';

import { useEffect, useState } from 'react';
import type { TocEntry } from '@renewcred/schema';
import { cn } from '@renewcred/ui';

/**
 * Figma: the sidebar TOC, indented 12px per level, active entry in brand red.
 *
 * Scroll-spy uses IntersectionObserver rather than scroll maths. The
 * `rootMargin` biases the active band toward the top of the viewport so the
 * highlighted entry is the section being *read*, not merely the one nearest the
 * vertical centre.
 *
 * Entries remain plain anchors, so the TOC works with JavaScript disabled and
 * every entry is keyboard reachable; the highlight is the enhancement.
 */
export function TableOfContents({ entries }: { entries: readonly TocEntry[] }) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveAnchor(visible[0].target.id);
      },
      { rootMargin: '-160px 0px -70% 0px', threshold: 0 }
    );

    for (const entry of entries) {
      const element = document.getElementById(entry.anchor);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className="flex flex-col gap-12">
      <ul className="flex flex-col gap-12">
        {entries.map((entry) => {
          const isActive = activeAnchor === entry.anchor;
          return (
            <li key={entry.anchor} style={{ paddingLeft: `${entry.depth * 12}px` }}>
              <a
                href={`#${entry.anchor}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block rounded-sm px-12 py-4 text-bodyCompact transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                  isActive
                    ? 'bg-brand-tintStrong text-brand-primary'
                    : 'text-text-secondary hoverable:hover:text-text-primary'
                )}
              >
                {entry.ordinal} {entry.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
