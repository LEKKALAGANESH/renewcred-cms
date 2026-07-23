import { z } from 'zod';
import { BlockSchema, parseBlock, type Block } from './blocks.js';

/**
 * A node in the document tree. Recursive — sections contain sections, which is
 * what produces the 1.0 / 2.1 / 2.1.1 hierarchy the design's sidebar shows.
 *
 * Deliberately absent: `order` and `number`.
 *   - Order is array position. Storing it alongside would create two sources of
 *     truth that drift the moment an editor reorders.
 *   - The ordinal is computed (see numbering.ts). Storing it would break every
 *     descendant's number when a sibling is inserted.
 * `anchor` IS stored, so deep links survive renumbering.
 */
export interface Section {
  id: string;
  title: string;
  anchor: string;
  blocks: Block[];
  children: Section[];
}

export const AnchorSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Anchor must be lowercase kebab-case');

export const SectionSchema: z.ZodType<Section> = z.lazy(() =>
  z
    .object({
      id: z.string().uuid(),
      title: z.string().min(1),
      anchor: AnchorSchema,
      blocks: z.array(BlockSchema),
      children: z.array(SectionSchema),
    })
    .strict()
);

/**
 * Current content schema version. Bumped only for a BREAKING change to the
 * block or section shape — a change that stored content cannot satisfy.
 *
 * Additive changes (a new block type, a new mark, a new optional field) do NOT
 * bump this: existing documents remain valid, so there is nothing to migrate.
 * Bumping on additive changes would force a no-op migration every release and
 * train everyone to ignore the version.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * The unit the editor loads and the renderer walks — the content of one
 * StandardVersion.
 *
 * `schemaVersion` is the forward-compatibility mechanism. Unknown fields are
 * rejected (every object is `.strict()`), so a document written by a newer
 * client fails loudly rather than being silently stripped. Silent stripping is
 * data loss disguised as success: the editor reports a successful save while
 * the new field never reaches the database.
 */
export const DocumentSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    sections: z.array(SectionSchema),
  })
  .strict();

export type ContentDocument = z.infer<typeof DocumentSchema>;

/** An empty but valid document — the starting state for a new version. */
export function emptyDocument(): ContentDocument {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, sections: [] };
}

export type DocumentParseResult =
  | { success: true; document: ContentDocument }
  | { success: false; issues: DocumentIssue[] };

export interface DocumentIssue {
  path: string;
  message: string;
}

/**
 * Parses a whole document, reporting block failures with the path of the block
 * that actually failed rather than a union-wide error dump.
 */
export function parseDocument(input: unknown): DocumentParseResult {
  const shell = DocumentSchema.safeParse(input);

  if (!shell.success) {
    return { success: false, issues: toIssues(shell.error) };
  }

  if (shell.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      issues: [
        {
          path: 'schemaVersion',
          message:
            `Document declares schema version ${shell.data.schemaVersion}, but this ` +
            `build understands at most ${CURRENT_SCHEMA_VERSION}. Upgrade the reader ` +
            `rather than downgrading the document.`,
        },
      ],
    };
  }

  const issues = collectBlockIssues(shell.data.sections, 'sections');
  return issues.length > 0 ? { success: false, issues } : { success: true, document: shell.data };
}

function collectBlockIssues(sections: readonly Section[], path: string): DocumentIssue[] {
  return sections.flatMap((section, sectionIndex) => {
    const sectionPath = `${path}.${sectionIndex}`;

    const blockIssues = section.blocks.flatMap((block, blockIndex) => {
      const result = parseBlock(block);
      return result.success ? [] : toIssues(result.error, `${sectionPath}.blocks.${blockIndex}`);
    });

    return [...blockIssues, ...collectBlockIssues(section.children, `${sectionPath}.children`)];
  });
}

function toIssues(error: z.ZodError, prefix = ''): DocumentIssue[] {
  return error.issues.map((issue) => {
    const suffix = issue.path.join('.');
    const path = [prefix, suffix].filter(Boolean).join('.');
    return { path: path || '(root)', message: issue.message };
  });
}

/** Depth-first walk in reading order. */
export function walkSections(
  sections: readonly Section[],
  visit: (section: Section, depth: number) => void,
  depth = 0
): void {
  for (const section of sections) {
    visit(section, depth);
    walkSections(section.children, visit, depth + 1);
  }
}

/** Flattens a document to plain text for search indexing. */
export function documentToPlainText(document: ContentDocument): string {
  const parts: string[] = [];
  walkSections(document.sections, (section) => parts.push(section.title));
  return parts.join(' ');
}
