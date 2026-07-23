import Link from 'next/link';
import { cn } from '@renewcred/ui';
import type { StandardVersionSummary, VersionStatus } from '@/lib/content';

const STATUS_LABEL: Record<VersionStatus, string> = {
  DRAFT: 'Draft',
  CONSULTATION: 'In consultation',
  CERTIFIED: 'Certified',
  ARCHIVED: 'Archived',
};

const STATUS_CLASS: Record<VersionStatus, string> = {
  DRAFT: 'border-DEFAULT bg-surface-page text-text-secondary',
  CONSULTATION: 'border-brand bg-brand-tintSoft text-brand-primary',
  CERTIFIED: 'border-DEFAULT bg-surface-card text-text-primary',
  ARCHIVED: 'border-DEFAULT bg-surface-page text-text-muted',
};

export function StatusBadge({ status }: { status: VersionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-pill border px-12 py-4 text-label',
        STATUS_CLASS[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Figma: the 312×94 bordered panel (#d2d1d1) reading "Version" then
 * "v1.0.0 - 12 Jul 2025".
 *
 * Extended with a version switcher, because the data model supports several
 * versions per standard and a reader on an older one otherwise has no route
 * back. The selected version lives in the URL rather than in state — ADR-0006
 * puts it there so the link is shareable and the back button behaves.
 */
export function VersionPanel({
  slug,
  current,
  versions,
}: {
  slug: string;
  current: StandardVersionSummary;
  versions: StandardVersionSummary[];
}) {
  const published = current.publishedAt ?? current.certifiedAt;
  const formatted =
    published === null
      ? null
      : new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date(published));

  return (
    <div className="flex flex-col gap-8 border border-muted px-8 py-16">
      <div className="flex items-center justify-between gap-8">
        <span className="text-bodyStrong text-text-primary">Version</span>
        <StatusBadge status={current.status} />
      </div>

      <p className="text-bodyStrong text-text-primary">
        {current.version}
        {formatted !== null && (
          <>
            <span className="px-8 text-text-secondary">-</span>
            <span>{formatted}</span>
          </>
        )}
      </p>

      {versions.length > 1 && (
        <ul className="flex flex-col gap-4 pt-8">
          {versions
            .filter((version) => version.version !== current.version)
            .map((version) => (
              <li key={version.id}>
                <Link
                  href={`/standards/${slug}?version=${encodeURIComponent(version.version)}`}
                  className="flex items-center gap-8 rounded-sm text-label font-400 text-text-secondary underline-offset-4 hoverable:hover:text-brand-primary hoverable:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  View {version.version}
                  <span className="sr-only">({STATUS_LABEL[version.status]})</span>
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
