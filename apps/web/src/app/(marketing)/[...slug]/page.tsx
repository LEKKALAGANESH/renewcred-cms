import { EmptyState } from '@/components/states/States';

/**
 * The design specifies six primary nav destinations but draws only the two
 * standards screens. Rather than let those links 404 — a dead nav is worse than
 * an honest placeholder — they resolve to a page that says so plainly.
 *
 * Documented assumption: these sections are out of scope for this brief.
 */
const TITLES: Record<string, string> = {
  buyers: 'Buyers',
  suppliers: 'Suppliers',
  climate: 'Climate & Us',
  science: 'Science',
  contact: 'Contact Us',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  support: 'Support',
};

export default async function MarketingPlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug[0] ?? '';
  const title = TITLES[key] ?? 'Coming soon';

  return (
    <div className="mx-auto max-w-content px-104 py-160">
      <h1 className="pb-40 text-display text-text-primary">{title}</h1>
      <EmptyState
        title="This section is not part of the standards library"
        description="The supplied design covers the standards index and the standard detail view. This page exists so the navigation stays whole."
        action={{ label: 'Browse standards', href: '/standards' }}
      />
    </div>
  );
}
