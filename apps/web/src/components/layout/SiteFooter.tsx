import Link from 'next/link';
import type { NavigationItem } from '@/lib/content';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';

/**
 * Figma: full-bleed #2b2c2c panel with an 80px top-rounded corner
 * (`radius.panelTop` = [80,80,0,0]), 80/104/40/104 padding, three columns
 * distributed SPACE_BETWEEN, a white hairline, then the legal row.
 */
export function SiteFooter({
  primary,
  legal,
}: {
  primary: NavigationItem[];
  legal: NavigationItem[];
}) {
  // The design splits the link list into two stacked columns of three.
  const half = Math.ceil(primary.length / 2);
  const columns = [primary.slice(0, half), primary.slice(half)];

  return (
    <footer className="mt-80 rounded-t-[40px] bg-text-primary px-24 pb-40 pt-64 text-text-inverse lg:mt-160 lg:rounded-t-[80px] lg:px-104 lg:pt-80">
      <div className="mx-auto max-w-content">
        <div className="flex flex-col gap-40 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-64">
          <div className="flex flex-col items-start gap-8">
            <Logo tone="inverse" />
            <address className="flex flex-col gap-8 not-italic">
              <span className="text-labelRegular">Indiranagar, Bengaluru, Karnataka, INDIA</span>
              <a
                href="mailto:yp@renewcred.com"
                className="w-fit text-labelRegular underline-offset-4 hoverable:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                yp@renewcred.com
              </a>
            </address>
            <p className="text-labelRegular">There is no time to save the planet</p>
            <p className="text-labelRegular">
              CIN No.: <span className="ml-8">XXXXXXXXX</span>
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-40 lg:gap-104">
            {columns.map((column, index) => (
              <ul key={index} className="flex flex-col gap-16">
                {column.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-labelRegular underline-offset-4 hoverable:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </nav>

          <NewsletterForm />
        </div>

        <hr className="my-40 border-0 border-t border-t-surface-card" />

        <div className="flex flex-wrap items-center justify-between gap-24">
          <p className="text-caption italic">Copyright © 2025 Renewred. All rights reserved.</p>
          <ul className="flex items-center gap-24">
            {legal.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="text-caption italic underline-offset-4 hoverable:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
