import Link from 'next/link';
import { Button, cn } from '@renewcred/ui';

/**
 * The three data-view states every list and document must be able to render.
 *
 * They live together because they share one shape — icon, headline, explanation,
 * recovery action — and drift apart the moment they are written separately.
 */

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-16 rounded-md border border-DEFAULT bg-surface-card px-24 py-80 text-center',
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <Panel>
      <p className="text-subheadingLg text-text-primary">{title}</p>
      <p className="max-w-[560px] text-body text-text-secondary">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button variant="outline">{action.label}</Button>
        </Link>
      )}
    </Panel>
  );
}

/**
 * `onRetry` is required, not optional. An error state without a recovery path
 * leaves the reader with nothing to do but reload the page by hand.
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Panel>
      <p role="alert" className="text-subheadingLg text-brand-primary">
        {title}
      </p>
      <p className="max-w-[560px] text-body text-text-secondary">{description}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </Panel>
  );
}

export function PermissionDeniedState() {
  return (
    <Panel>
      <p className="text-subheadingLg text-text-primary">You do not have access to this</p>
      <p className="max-w-[560px] text-body text-text-secondary">
        This standard is not published yet. If you expected to see it, sign in to the registry.
      </p>
      <Link href="/">
        <Button variant="outline">Back to standards</Button>
      </Link>
    </Panel>
  );
}

/** Skeletons mirror the real layout's geometry so nothing shifts on load. */
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-16 animate-pulse rounded-sm bg-surface-card', className)}
    />
  );
}

export function StandardCardSkeleton() {
  return (
    <div className="flex flex-col gap-16 px-8 py-24">
      <div className="flex items-center gap-24">
        <SkeletonLine className="h-40 w-[240px]" />
        <SkeletonLine className="ml-auto h-24 w-[106px]" />
      </div>
      <hr className="border-0 border-t border-t-DEFAULT" />
      <div className="flex flex-col gap-8">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-[70%]" />
      </div>
    </div>
  );
}

export function StandardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading standards" className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <StandardCardSkeleton key={index} />
      ))}
    </div>
  );
}
