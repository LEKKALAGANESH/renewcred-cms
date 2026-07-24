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
 * Below `lg` the centred links and Registry button would overflow the bar and
 * force a horizontal page scroll, so they collapse behind a menu button into a
 * flat, tap-and-keyboard reachable sheet. The desktop submenu is the design's
 * third frame variant — 320 wide, r8, white — a real menu here: it opens on
 * hover *and* focus, closes on Escape and outside click, every item reachable by
 * keyboard. Hover-only would make the Standards list unreachable without a pointer.
 */
export function SiteHeader({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuId = useId();

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (openId === null && !mobileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenId(null);
        setMobileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Escape from the mobile sheet returns focus to the button that opened it.
      if (mobileOpen) mobileToggleRef.current?.focus();
      setOpenId(null);
      setMobileOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openId, mobileOpen]);

  // Navigating away must dismiss both menus; otherwise they survive the route change.
  useEffect(() => {
    setOpenId(null);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 px-16 py-16 lg:px-80 lg:py-24">
      <nav
        ref={navRef}
        aria-label="Primary"
        className={cn(
          'relative mx-auto flex h-[90px] max-w-content items-center justify-between gap-8 rounded-lg px-24',
          'border border-DEFAULT bg-surface-card',
          // The design blurs what passes behind the bar.
          'supports-[backdrop-filter:blur(0px)]:bg-surface-card/90 supports-[backdrop-filter:blur(0px)]:backdrop-blur-nav'
        )}
      >
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Logo alt="" />
          <span className="sr-only">RenewCred home</span>
        </Link>

        {/* Desktop navigation. Collapses at xl, not lg: the six links + logo +
            Registry need ~1280px to sit in the bar without the Registry button
            spilling off the right edge (measured: overflows through ~1265px). */}
        <ul className="hidden items-center xl:flex">
          {items.map((item) => (
            <NavEntry
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onOpenChange={(open) => setOpenId(open ? item.id : null)}
              isCurrent={isCurrent(item.href)}
            />
          ))}
        </ul>

        <div className="hidden xl:block">
          <Button variant="outline" className="shrink-0">
            Registry
          </Button>
        </div>

        {/* Mobile trigger — below lg the row is just logo + this button. */}
        <button
          ref={mobileToggleRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={mobileMenuId}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary xl:hidden"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Mobile sheet — flattened (no hover), every item and sub-item reachable
            by tap and keyboard. Scrolls within its own height on short/landscape
            viewports rather than pushing the page. */}
        <div
          id={mobileMenuId}
          hidden={!mobileOpen}
          className={cn(
            // Full-width on phones, a capped dropdown anchored under the button
            // from the point the bar has room for it.
            'absolute right-0 top-[calc(100%+8px)] w-full max-w-[360px] xl:hidden',
            'max-h-[calc(100dvh-140px)] overflow-y-auto overscroll-contain',
            'rounded-md border border-DEFAULT bg-surface-card p-16 shadow-md'
          )}
        >
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-sm px-16 py-16 text-label',
                    'hoverable:hover:bg-brand-tintStrong focus-visible:bg-brand-tintStrong focus-visible:outline-none',
                    isCurrent(item.href) ? 'text-brand-primary' : 'text-text-primary'
                  )}
                >
                  {item.label}
                </Link>
                {item.children.length > 0 && (
                  <ul className="flex flex-col gap-4 pl-16">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.href}
                          aria-current={isCurrent(child.href) ? 'page' : undefined}
                          className={cn(
                            'block rounded-sm px-16 py-16 text-labelRegular',
                            'hoverable:hover:bg-brand-tintStrong focus-visible:bg-brand-tintStrong focus-visible:outline-none',
                            isCurrent(child.href) ? 'text-brand-primary' : 'text-text-primary'
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-16">
            <Button variant="outline" className="w-full">
              Registry
            </Button>
          </div>
        </div>
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

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
