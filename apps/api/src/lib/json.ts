import type { Prisma } from '../generated/prisma/index.js';

/**
 * Bridges a typed domain object into a Prisma `jsonb` column.
 *
 * Prisma's `InputJsonValue` requires an index signature, which no typed
 * interface has — so `ContentDocument` is structurally valid JSON but not
 * assignable. The cast is unavoidable at this boundary; what matters is that it
 * happens in exactly one place with the reasoning attached, rather than as an
 * `as unknown as` scattered through every repository.
 *
 * Safety rests on the caller: the value must already have been validated by
 * `parseDocument()` (or an equivalent schema) before it gets here. This
 * function converts a type, it does not confer trust.
 */
export function toJsonColumn<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * The reverse direction needs no helper: values read out of a `jsonb` column
 * are `Prisma.JsonValue`, which is assignable to `unknown`, and `parseDocument`
 * accepts `unknown`. Validation on read is not optional — a column can hold
 * anything written before the current schema existed.
 */
