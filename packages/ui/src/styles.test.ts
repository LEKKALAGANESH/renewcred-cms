// @vitest-environment node
//
// Runs in node, not jsdom: this suite compiles CSS and touches the filesystem,
// and under jsdom `import.meta.url` is not a file URL, so path resolution fails.
/**
 * Guards the failure mode the token-override strategy creates.
 *
 * Replacing Tailwind's default scales means an off-token class is not an error —
 * it is simply a class that generates no CSS. `h-48` type-checks, renders,
 * passes every DOM assertion, and does nothing at all; the button quietly
 * collapses to its content height. Three such defects were present the first
 * time this ran (`h-48`, `ring-brand`, `border-2`), none of which any other test
 * could see.
 *
 * So the CSS is actually compiled and every class the components use is required
 * to produce a rule.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import { renewcredPreset } from '@renewcred/tokens';
import { collectClassNames } from './lib/collectClassNames.js';

const SRC_DIR = fileURLToPath(new URL('.', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'test' ? [] : sourceFiles(full);
    // `.tsx` only — classes live in markup. Plain `.ts` here is configuration
    // (`cn.ts` names class *groups* and a package), and scanning it yields
    // false positives like `font-size` and `tailwind-merge`.
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') ? [full] : [];
  });
}

/** Compiles the given classes and returns those that produced no rule. */
async function findClassesEmittingNoCss(classNames: Iterable<string>): Promise<string[]> {
  const candidates = [...classNames];
  const result = await postcss([
    tailwindcss({
      presets: [renewcredPreset],
      // Feed the classes directly so the check is independent of file globbing.
      content: [{ raw: candidates.join(' '), extension: 'html' }],
    }),
  ]).process('@tailwind utilities;', { from: undefined });

  const css = result.css;
  return candidates.filter((className) => {
    // Escape the characters Tailwind escapes when emitting a selector.
    const escaped = className.replace(/[:.[\]()/%@]/g, (char) => `\\${char}`);
    return !css.includes(`.${escaped}`);
  });
}

describe('every class the components use compiles to real CSS', () => {
  const files = sourceFiles(SRC_DIR);

  it('finds component sources to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const classNames = collectClassNames(readFileSync(file, 'utf8'));
    if (classNames.size === 0) continue;

    it(`${path.basename(file)} has no dead classes`, async () => {
      expect(await findClassesEmittingNoCss(classNames)).toEqual([]);
    }, 30_000);
  }
});

describe('the guard itself detects a dead class', () => {
  it('reports an off-token utility as emitting nothing', async () => {
    // h-48 is the exact defect this suite caught on its first run: 48 is not a
    // spacing step, so the class is silently inert.
    expect(await findClassesEmittingNoCss(['h-48', 'bg-blue-500', 'p-7'])).toEqual([
      'h-48',
      'bg-blue-500',
      'p-7',
    ]);
  }, 30_000);

  it('does not report a valid token class', async () => {
    expect(await findClassesEmittingNoCss(['h-md', 'px-24', 'text-body'])).toEqual([]);
  }, 30_000);
});
