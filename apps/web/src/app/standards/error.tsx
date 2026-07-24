'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/states/States';

export default function StandardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle support has on a production stack trace,
    // so it is logged rather than discarded — never shown raw to the reader.
    console.error('standards route failed', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-content px-24 lg:px-104 py-160">
      <ErrorState
        description="The standards list could not be loaded. This is usually temporary."
        onRetry={reset}
      />
      {error.digest !== undefined && (
        <p className="pt-16 text-center text-label font-400 text-text-muted">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
