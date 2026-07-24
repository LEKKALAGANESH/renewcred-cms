import { EmptyState } from '@/components/states/States';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-24 lg:px-104 py-160">
      <EmptyState
        title="Page not found"
        description="The page you asked for does not exist, or it may have been moved."
        action={{ label: 'Back to standards', href: '/standards' }}
      />
    </div>
  );
}
