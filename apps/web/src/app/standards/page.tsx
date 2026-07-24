import type { Metadata } from 'next';
import { contentRepository } from '@/lib/content';
import { PageHeading } from '@/components/standards/PageHeading';
import { StandardCard } from '@/components/standards/StandardCard';
import { EmptyState } from '@/components/states/States';

export const metadata: Metadata = {
  title: 'RenewCred Standards',
  description:
    'Methodologies and certification standards for measuring and verifying climate impact.',
};

const LEAD =
  'Lorem ipsum dolor sit amet consectetur. Gravida faucibus commodo leo eget commodo. Sit quis dolor non sed enim scelerisque.';

/**
 * Figma frame "Standards" (1920×2383).
 *
 * 1712 content column inside 104px gutters, 80px between the hero and the list,
 * and the list rendered as one data-driven component per row — the design draws
 * four structurally identical frames, which is one component over an array, not
 * four copies.
 */
export default async function StandardsPage() {
  const standards = await contentRepository.listStandards();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-80 px-24 lg:px-104 pt-80">
      <PageHeading eyebrow="Standards" title="RenewCred Standards" lead={LEAD} />

      {standards.length === 0 ? (
        <EmptyState
          title="No standards published yet"
          description="Standards appear here once they have been certified. Check back shortly."
        />
      ) : (
        <div className="flex flex-col">
          {standards.map((standard) => (
            <StandardCard key={standard.id} standard={standard} />
          ))}
        </div>
      )}
    </div>
  );
}
