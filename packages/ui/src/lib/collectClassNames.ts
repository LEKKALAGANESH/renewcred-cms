/**
 * Extracts the Tailwind class names written in a source file.
 *
 * Deliberately conservative: it reads string literals only, so a class built by
 * interpolation is skipped rather than guessed at. Tailwind cannot see such
 * classes either — its own scanner works the same way — so anything this misses
 * was already unsafe to write.
 */
const STRING_LITERAL = /'([^'\n]*)'|"([^"\n]*)"/g;

/** Matches a plausible utility: optional variants, then a utility-looking token. */
const UTILITY = /^(?:[a-z][a-zA-Z0-9@:.\-[\]()]*:)*-?[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9[\]().%/]+)*$/;

/** Tokens that look like utilities but are not — mostly CSS values and prose. */
const NOT_A_UTILITY = new Set(['presentation', 'status', 'button', 'true', 'false', 'sr-only']);

export function collectClassNames(source: string): Set<string> {
  const found = new Set<string>();

  for (const match of source.matchAll(STRING_LITERAL)) {
    const literal = match[1] ?? match[2] ?? '';
    for (const token of literal.split(/\s+/)) {
      if (token === '' || NOT_A_UTILITY.has(token)) continue;
      if (!UTILITY.test(token)) continue;
      // A bare word with no dash or variant is almost always prose.
      if (!token.includes('-') && !token.includes(':')) continue;
      found.add(token);
    }
  }

  return found;
}
