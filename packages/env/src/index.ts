import type { z } from 'zod';

/**
 * Parses `source` against `schema` and returns typed, validated config.
 *
 * Throws on the first invalid or missing variable. That is the point: the
 * blueprint (§B1, review finding B1) forbids `process.env.X || 'fallback'`
 * for any secret, because a missing env var then silently downgrades the app
 * to a publicly-known signing key. Failing at boot is loud, immediate, and
 * happens before the process can accept a single request.
 *
 * Typed as `z.ZodType<TOutput, …>` rather than `z.ZodTypeAny` so the parsed
 * result carries a real type — `ZodTypeAny` widens `_output` to `any`, which
 * would smuggle `any` across the boundary this function exists to guard.
 */
export function parseEnv<TOutput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, unknown>,
  source: Record<string, string | undefined> = process.env
): TOutput {
  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const key = issue.path.join('.');
        return `  ${key || '(root)'}: ${issue.message}`;
      })
      .join('\n');

    throw new EnvironmentError(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env and fill in the missing values.`
    );
  }

  return result.data;
}

export class EnvironmentError extends Error {
  override readonly name = 'EnvironmentError';
}

/**
 * Rejects the placeholder values shipped in .env.example so a half-configured
 * environment fails at boot rather than at first use.
 */
export const PLACEHOLDER_PATTERN = /^(changeme|xxx+|your[-_]|placeholder|todo)/i;

export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERN.test(value.trim());
}
