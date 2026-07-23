'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';
import { Spinner } from './Spinner.js';

/**
 * Variants are enumerated from the Figma node tree, not invented. The design
 * contains exactly two button shapes, and they differ in more than fill:
 *
 *   primary  48h · r40 · #be202e fill + stroke · pad 12/24 · gap 16 · bodyBold
 *   outline  40h · r8  · transparent · #2b2c2c 1px stroke · pad 8/24 · label
 *
 * Collapsing these into one component with a colour prop would lose the radius
 * and height difference, which is the part that makes a rebuild look subtly
 * wrong. `ghost` is the one addition — it carries no Figma instance because the
 * design never shows a destructive-adjacent or low-emphasis action, but the
 * admin panel needs one for cancel affordances in dialogs. It is deliberately
 * derived from `outline` (same geometry, no stroke) rather than newly styled.
 */
export type ButtonVariant = 'primary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  /** Renders a spinner and blocks activation. The label stays visible so the button does not resize. */
  isLoading?: boolean;
  /** Announced while `isLoading`; defaults to the button's own text being sufficient. */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
}

const BASE = cn(
  'relative inline-flex items-center justify-center gap-16 whitespace-nowrap',
  'font-sans transition-[background-color,color,border-color,opacity] duration-150',
  // Focus must be visible against both the page and card surfaces, so the ring
  // is offset rather than inset.
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40',
  // The outline button is 40px tall by design, below the 44px minimum for touch.
  // Rather than change the visual height, the hit area is expanded on coarse
  // pointers only, so the desktop design stays pixel-exact.
  'coarse:min-h-touch coarse:min-w-touch'
);

const VARIANT: Record<ButtonVariant, string> = {
  primary: cn(
    'h-md rounded-xl px-24 py-12 text-bodyBold',
    'border border-brand bg-brand-primary text-text-inverse',
    // Hover/active shift opacity rather than swapping to an unspecified tint —
    // the design defines no hover fill, and inventing one would be a guess.
    'hoverable:hover:opacity-90',
    'active:opacity-80'
  ),
  outline: cn(
    'h-sm rounded-md px-24 py-8 text-label',
    'border border-strong bg-transparent text-text-primary',
    'hoverable:hover:bg-surface-page',
    'active:bg-surface-page'
  ),
  ghost: cn(
    'h-sm rounded-md px-24 py-8 text-label',
    'border border-transparent bg-transparent text-text-secondary',
    'hoverable:hover:bg-surface-page hoverable:hover:text-text-primary',
    'active:bg-surface-page'
  ),
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    isLoading = false,
    loadingLabel,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    type = 'button',
    children,
    ...rest
  },
  ref
) {
  // A loading button must not be `disabled`: disabling moves focus to the body
  // mid-interaction and drops the element from the tab order, so a keyboard user
  // loses their place every time a request starts. `aria-disabled` + a blocked
  // handler keeps focus and still refuses activation.
  const isInert = isLoading || disabled === true;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={isLoading ? true : undefined}
      aria-busy={isLoading || undefined}
      className={cn(BASE, VARIANT[variant], className)}
      onClick={(event) => {
        if (isInert) {
          event.preventDefault();
          return;
        }
        rest.onClick?.(event);
      }}
    >
      {isLoading ? (
        <Spinner className="h-16 w-16" label={null} />
      ) : (
        leadingIcon !== undefined && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {leadingIcon}
          </span>
        )
      )}
      {children}
      {trailingIcon !== undefined && !isLoading && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {trailingIcon}
        </span>
      )}
      {isLoading && loadingLabel !== undefined && (
        <span className="sr-only" role="status">
          {loadingLabel}
        </span>
      )}
    </button>
  );
});
