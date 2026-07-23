import type { Metadata } from 'next';
import { Work_Sans } from 'next/font/google';
import { contentRepository } from '@/lib/content';
import { BackToTop } from '@/components/layout/BackToTop';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import './globals.css';

/**
 * Work Sans is the design's only family. Self-hosted through next/font so there
 * is no render-blocking request to a third party and no layout shift from a
 * late-arriving face.
 */
const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-work-sans',
});

export const metadata: Metadata = {
  title: { default: 'RenewCred Standards', template: '%s · RenewCred' },
  description:
    'Methodologies and certification standards for measuring and verifying climate impact.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [header, footerPrimary, footerLegal] = await Promise.all([
    contentRepository.getNavigation('HEADER'),
    contentRepository.getNavigation('FOOTER_PRIMARY'),
    contentRepository.getNavigation('FOOTER_LEGAL'),
  ]);

  return (
    <html lang="en" className={workSans.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-24 focus:top-24 focus:z-50 focus:rounded-md focus:bg-surface-card focus:px-24 focus:py-12 focus:text-label focus:ring-2 focus:ring-brand-primary"
        >
          Skip to content
        </a>
        <SiteHeader items={header} />
        <main id="main">{children}</main>
        <SiteFooter primary={footerPrimary} legal={footerLegal} />
        <BackToTop />
      </body>
    </html>
  );
}
