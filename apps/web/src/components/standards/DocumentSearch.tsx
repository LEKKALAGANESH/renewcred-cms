'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@renewcred/ui';
import { contentRepository, type SearchHit } from '@/lib/content';

type State =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; hits: SearchHit[] }
  | { kind: 'error' };

/**
 * Figma: the 312×56 pill field (r50, white, 1px #d8d8d8) with a trailing icon.
 *
 * Implemented as an ARIA combobox with a listbox popup so results are announced
 * and arrow-key navigable. Queries are debounced, and every response carries the
 * query it was issued for so a slow earlier request cannot overwrite a newer
 * result — the classic out-of-order race that makes search feel haunted.
 */
export function DocumentSearch({ slug }: { slug?: string }) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [activeIndex, setActiveIndex] = useState(-1);
  const latestQuery = useRef('');

  useEffect(() => {
    const trimmed = query.trim();
    latestQuery.current = trimmed;

    if (trimmed === '') {
      setState({ kind: 'idle' });
      return;
    }

    setState({ kind: 'searching' });
    const timer = setTimeout(() => {
      contentRepository
        .search(trimmed, slug)
        .then((hits) => {
          if (latestQuery.current !== trimmed) return;
          setState({ kind: 'results', hits });
          setActiveIndex(-1);
        })
        .catch(() => {
          if (latestQuery.current === trimmed) setState({ kind: 'error' });
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, slug]);

  const hits = state.kind === 'results' ? state.hits : [];
  const isExpanded = state.kind !== 'idle';

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setQuery('');
      return;
    }
    if (hits.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % hits.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? hits.length - 1 : index - 1));
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      const hit = hits[activeIndex];
      if (hit) window.location.assign(`/standards/${hit.slug}`);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search standards
      </label>
      <div className="flex h-lg items-center gap-8 rounded-pill border border-DEFAULT bg-surface-card px-24 focus-within:ring-2 focus-within:ring-brand-primary">
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-bodyCompact text-text-primary outline-none placeholder:text-text-secondary"
        />
        <SearchIcon />
      </div>

      {isExpanded && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-md border border-DEFAULT bg-surface-card shadow-md">
          <p aria-live="polite" className="sr-only">
            {state.kind === 'searching'
              ? 'Searching'
              : state.kind === 'results'
                ? `${hits.length} results`
                : 'Search failed'}
          </p>

          {state.kind === 'searching' && (
            <p className="px-16 py-12 text-label font-400 text-text-secondary">Searching…</p>
          )}

          {state.kind === 'error' && (
            <p className="px-16 py-12 text-label font-400 text-brand-primary">
              Search is unavailable. Try again.
            </p>
          )}

          {state.kind === 'results' && hits.length === 0 && (
            <p className="px-16 py-12 text-label font-400 text-text-secondary">
              No matches for “{query.trim()}”.
            </p>
          )}

          {hits.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Search results">
              {hits.map((hit, index) => (
                <li
                  key={`${hit.slug}-${index}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(index === activeIndex && 'bg-brand-tintStrong')}
                >
                  <a
                    href={`/standards/${hit.slug}`}
                    className="flex flex-col gap-4 px-16 py-12 hoverable:hover:bg-brand-tintStrong focus-visible:outline-none focus-visible:bg-brand-tintStrong"
                  >
                    <span className="text-label text-text-primary">{hit.title}</span>
                    <span className="line-clamp-2 text-label font-400 text-text-secondary">
                      {hit.excerpt}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
