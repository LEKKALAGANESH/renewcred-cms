'use client';

import { useId, useState } from 'react';
import { Button } from '@renewcred/ui';

type Status = { kind: 'idle' | 'submitting' | 'success' } | { kind: 'error'; message: string };

/** Stands in for the phase-2 API call; same signature, same failure mode. */
const subscribe = (_email: string): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 600));

/**
 * Figma: a #f8e9ea field (`brand.tintSoft`) with the pill "Subscribe" button.
 *
 * Validation is client-side and announced: the message is in a live region and
 * wired via `aria-describedby`, so a screen reader hears the reason rather than
 * just landing on an invalid field. Success replaces the form rather than
 * clearing it, so there is no ambiguity about whether the submit worked.
 */
export function NewsletterForm() {
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const isInvalid = status.kind === 'error';

  // Deliberately synchronous: a promise-returning submit handler is a floating
  // promise whose rejection nobody sees. The async work is delegated and its
  // failure is turned into a visible error state.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setStatus({ kind: 'submitting' });
    // Phase 2 posts to the API; the shape of this call does not change.
    subscribe(email).then(
      () => setStatus({ kind: 'success' }),
      () =>
        setStatus({
          kind: 'error',
          message: 'That did not go through. Please try again.',
        })
    );
  }

  if (status.kind === 'success') {
    return (
      <div className="flex max-w-[518px] flex-col gap-16 p-8" role="status">
        <p className="text-subheadingLg">Thanks — you are subscribed.</p>
        <p className="text-label font-400 text-surface-page">
          🔒 No spam. Just pure climate intelligence.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[518px] flex-col gap-24 p-8">
      <p className="text-subheadingLg">🔒 No spam. Just pure climate intelligence.</p>

      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-16 rounded-xl bg-brand-tintSoft p-12 pl-24">
          <label htmlFor={inputId} className="sr-only">
            Your email address
          </label>
          <input
            id={inputId}
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (isInvalid) setStatus({ kind: 'idle' });
            }}
            placeholder="Your Email Address Please!"
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? messageId : undefined}
            className="min-w-0 flex-1 bg-transparent text-subheadingLt text-text-primary outline-none placeholder:text-text-muted focus-visible:ring-0"
          />
          <Button type="submit" isLoading={status.kind === 'submitting'} loadingLabel="Subscribing">
            Subscribe
          </Button>
        </div>

        <p id={messageId} role="alert" className="min-h-16 text-label font-400 text-brand-tint">
          {isInvalid ? status.message : ''}
        </p>
      </div>
    </form>
  );
}
