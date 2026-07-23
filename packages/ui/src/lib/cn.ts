import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge ships with Tailwind's *default* scales built in. This project
 * replaces those scales with the extracted design tokens, so the stock merger
 * does not recognise `text-body`, `rounded-pill`, or `shadow-md` as members of
 * their groups and fails to dedupe conflicting classes — the last-write-wins
 * behaviour callers rely on silently stops working.
 *
 * Registering the real token names restores it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'heading',
            'subheadingLg',
            'subheadingLt',
            'body',
            'bodyCompact',
            'bodyStrong',
            'bodyBold',
            'label',
          ],
        },
      ],
      rounded: [{ rounded: ['sm', 'md', 'lg', 'xl', '2xl', 'pill'] }],
      shadow: [{ shadow: ['sm', 'md', 'none'] }],
    },
  },
});

/** Joins conditional class names and resolves Tailwind conflicts token-aware. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
