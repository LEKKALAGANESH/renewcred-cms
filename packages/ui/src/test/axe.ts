/**
 * Accessibility assertion used by every component suite.
 *
 * axe-core is driven directly rather than through a matcher package so the
 * ruleset is explicit: violations are returned as readable text, and the caller
 * decides which rules apply. Colour-contrast is disabled because jsdom computes
 * no layout or real colours — running it there produces confident nonsense in
 * both directions. Contrast is verified against the token values instead, in
 * `contrast.test.ts`.
 */
import axe, { type ElementContext, type RunOptions } from 'axe-core';

const DEFAULT_OPTIONS: RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
};

export async function findAccessibilityViolations(
  container: ElementContext,
  options: RunOptions = DEFAULT_OPTIONS
): Promise<string[]> {
  const results = await axe.run(container, options);
  return results.violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
    return `${violation.id}: ${violation.help} (${targets})`;
  });
}
