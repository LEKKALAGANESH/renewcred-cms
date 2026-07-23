'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, cn } from '@renewcred/ui';
import type { NavigationItem } from '@/lib/content';
import { Logo } from './Logo';

/**
 * Sticky navigation.
 *
 * Figma: a 1760×90 white card (r16, 1px #d8d8d8) inset 80px from a 1920 canvas,
 * with 24px of vertical padding. The bar itself is 1712 wide with the logo left,
 * links centred, and the outline "Registry" button right.
 *
 * The submenu is the design's third frame variant — 320 wide, r8, white — and is
 * a real menu here: it opens on hover *and* focus, closes on Escape and on
 * outside click, and every item is reachable by keyboard. Hover-only would make
 * the Standards list unreachable without a pointer.
 */
export function SiteHeader({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openId === null) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openId]);

  // Navigating away must dismiss the menu; otherwise it survives the route change.
  useEffect(() => setOpenId(null), [pathname]);

  return (
    <header className="sticky top-0 z-30 px-80 py-24">
      <nav
        ref={navRef}
        aria-label="Primary"
        className={cn(
          'mx-auto flex h-[90px] max-w-content items-center justify-between gap-8 rounded-lg px-24',
          'border border-DEFAULT bg-surface-card',
          // The design blurs what passes behind the bar.
          'supports-[backdrop-filter:blur(0px)]:bg-surface-card/90 supports-[backdrop-filter:blur(0px)]:backdrop-blur-nav'
        )}
      >
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Logo />
          <span className="sr-only">RenewCred home</span>
        </Link>

        <ul className="flex items-center">
          {items.map((item) => (
            <NavEntry
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onOpenChange={(open) => setOpenId(open ? item.id : null)}
              isCurrent={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </ul>

        <Button variant="outline" className="shrink-0">
          Registry
        </Button>
      </nav>
    </header>
  );
}

function NavEntry({
  item,
  isOpen,
  onOpenChange,
  isCurrent,
}: {
  item: NavigationItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCurrent: boolean;
}) {
  const menuId = useId();
  const hasChildren = item.children.length > 0;
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Hover-intent: a short grace period stops the menu snapping shut while the
  // pointer travels the gap between the trigger and the panel.
  const openNow = () => {
    clearTimeout(closeTimer.current);
    onOpenChange(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onOpenChange(false), 120);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const label = (
    <span
      className={cn(
        'text-label transition-colors',
        isCurrent ? 'text-brand-primary' : 'text-text-primary'
      )}
    >
      {item.label}
    </span>
  );

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          aria-current={isCurrent ? 'page' : undefined}
          className="flex h-sm items-center gap-8 rounded-sm px-16 py-8 hoverable:hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {label}
        </Link>
      </li>
    );
  }

  return (
    <li className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => onOpenChange(!isOpen)}
        onFocus={openNow}
        className="flex h-sm items-center gap-4 rounded-sm px-16 py-8 hoverable:hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        {label}
        <Caret className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      <div
        id={menuId}
        hidden={!isOpen}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) closeSoon();
        }}
        className="absolute left-0 top-[calc(100%+8px)] w-[320px] overflow-hidden rounded-md border border-DEFAULT bg-surface-card shadow-md"
      >
        <ul>
          {item.children.map((child) => (
            <li key={child.id}>
              <Link
                href={child.href}
                className="block px-16 py-16 text-label text-text-primary hoverable:hover:bg-brand-tintStrong focus-visible:outline-none focus-visible:bg-brand-tintStrong"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function Caret({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
