import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildTableOfContents, flattenTableOfContents } from '@renewcred/schema';
import { contentRepository } from '@/lib/content';
import { DocumentBody } from '@/components/content/DocumentBody';
import { DocumentSearch } from '@/components/standards/DocumentSearch';
import { PageHeading } from '@/components/standards/PageHeading';
import { TableOfContents } from '@/components/standards/TableOfContents';
import { VersionPanel } from '@/components/standards/VersionPanel';
import { EmptyState } from '@/components/states/States';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const standard = await contentRepository.getStandard(slug);
  if (standard === null) return { title: 'Not found' };
  return { title: standard.title, description: standard.summary };
}

/**
 * Figma frame "View Standards" (1920×3349).
 *
 * Two columns inside the 1712 content width: a 312px sidebar and a 1320px
 * document column, separated by 80px — measured from the node tree. (Note:
 * `tokens.layout` records 292/842 for these; the frame disagrees, and the frame
 * is the source of truth.)
 *
 * The sidebar is sticky so search, version, and the TOC stay reachable through a
 * 3300px document, and it scrolls independently — a fixed-height column with no
 * overflow path would make the last TOC entries unreachable on a short viewport.
 */
export default async function StandardDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const requested = typeof query.version === 'string' ? query.version : undefined;

  const standard = await contentRepository.getStandard(slug, requested);
  if (standard === null) notFound();

  const toc = flattenTableOfContents(buildTableOfContents(standard.content.sections));
  const hasContent = standard.content.sections.length > 0;

  return (
    <div className="mx-auto flex max-w-content flex-col gap-80 px-104 pt-80">
      <PageHeading eyebrow="Standards" title={standard.title} lead={standard.summary} />

      <div className="flex items-start gap-80">
        <aside className="sticky top-[160px] flex max-h-[calc(100vh-200px)] w-[312px] shrink-0 flex-col gap-24 overflow-y-auto overscroll-contain pb-24">
          <DocumentSearch slug={slug} />
          <VersionPanel slug={slug} current={standard.version} versions={standard.versions} />
          <TableOfContents entries={toc} />
        </aside>

        <div className="min-w-0 flex-1">
          {hasContent ? (
            <DocumentBody document={standard.content} />
          ) : (
            <EmptyState
              title="This standard has no published content yet"
              description="The methodology is being drafted. It will appear here once the version is certified."
              action={{ label: 'Browse other standards', href: '/standards' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
