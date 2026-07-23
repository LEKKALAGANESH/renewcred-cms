import { z } from 'zod';
import { InlineContentSchema, InlineNodeSchema, type InlineNode } from './inline.js';

/**
 * A list item holds inline content AND nested items, recursively, with no depth
 * cap in the schema. `items: string[]` cannot express nesting at all, which is
 * why the brief's "nested lists" requirement forces this shape.
 *
 * The renderer caps display depth at 6 (blueprint B2) — a presentational limit,
 * so no stored content is ever unrepresentable.
 */
export interface ListItem {
  content: InlineNode[];
  children: ListItem[];
}

/**
 * `children` is required rather than defaulted. A `.default([])` would make the
 * parser's input and output types diverge, forcing every recursive annotation
 * to carry a separate input interface. Content is produced by an editor, never
 * hand-authored, so the explicit `children: []` costs nothing at the call site
 * and keeps the exported types honest.
 */
export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z
    .object({
      content: InlineContentSchema,
      children: z.array(ListItemSchema),
    })
    .strict()
);

const ParagraphBlockSchema = z
  .object({
    type: z.literal('paragraph'),
    content: InlineContentSchema,
  })
  .strict();

const ListBlockSchema = z
  .object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(ListItemSchema).min(1),
  })
  .strict();

const TableBlockSchema = z
  .object({
    type: z.literal('table'),
    caption: z.string().optional(),
    /**
     * Cells are inline arrays, so math inside a table cell works with no extra
     * block type — it falls out of the model rather than being special-cased.
     */
    headers: z.array(InlineContentSchema).min(1),
    rows: z.array(z.array(InlineContentSchema)).min(1),
  })
  .strict()
  .superRefine((table, ctx) => {
    table.rows.forEach((row, index) => {
      if (row.length !== table.headers.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', index],
          message: `Row ${index + 1} has ${row.length} cells; ${table.headers.length} headers defined`,
        });
      }
    });
  });

const MathBlockSchema = z
  .object({
    type: z.literal('math'),
    latex: z.string().min(1),
    /** Display label such as "(2.1)", enabling cross-references later. */
    label: z.string().optional(),
  })
  .strict();

const ImageBlockSchema = z
  .object({
    type: z.literal('image'),
    assetId: z.string().uuid(),
    /**
     * Required, not optional. An optional alt field guarantees missing alt text
     * at scale — the accessibility cost is paid by readers who never complain.
     */
    alt: z.string().min(1),
    caption: InlineContentSchema.optional(),
    width: z.enum(['content', 'wide', 'full']),
  })
  .strict();

const CalloutBlockSchema = z
  .object({
    type: z.literal('callout'),
    variant: z.enum(['note', 'warning', 'important']),
    content: InlineContentSchema,
  })
  .strict();

const CodeBlockSchema = z
  .object({
    type: z.literal('code'),
    language: z.string().min(1),
    code: z.string(),
  })
  .strict();

/**
 * Discriminated on `type`. Adding a block type touches this union, the registry
 * (which will not compile without a matching entry), and the renderer switch.
 * No migration of existing stored content is required.
 *
 * Note: `TableBlockSchema` carries a `superRefine`, making it a ZodEffects
 * rather than a ZodObject, so `z.discriminatedUnion` cannot accept it. The
 * union is therefore a plain union with a manual discriminator check — see
 * `parseBlock` for the error-quality compensation.
 */
export const BlockSchema = z.union([
  ParagraphBlockSchema,
  ListBlockSchema,
  TableBlockSchema,
  MathBlockSchema,
  ImageBlockSchema,
  CalloutBlockSchema,
  CodeBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block['type'];

export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type MathBlock = z.infer<typeof MathBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

/** Every block type, in registry and editor-palette order. */
export const BLOCK_TYPES = [
  'paragraph',
  'list',
  'table',
  'math',
  'image',
  'callout',
  'code',
] as const satisfies readonly BlockType[];

const SCHEMA_BY_TYPE = {
  paragraph: ParagraphBlockSchema,
  list: ListBlockSchema,
  table: TableBlockSchema,
  math: MathBlockSchema,
  image: ImageBlockSchema,
  callout: CalloutBlockSchema,
  code: CodeBlockSchema,
} as const satisfies Record<BlockType, z.ZodTypeAny>;

function isKnownBlockType(value: unknown): value is BlockType {
  return typeof value === 'string' && value in SCHEMA_BY_TYPE;
}

/**
 * Parses a single block, dispatching on `type` first.
 *
 * A bare `z.union` reports failures by listing every member's errors, so a
 * malformed table yields seven unrelated complaints and the real one is buried.
 * Dispatching first means the caller gets the error for the block they actually
 * wrote.
 */
export function parseBlock(input: unknown): z.SafeParseReturnType<unknown, Block> {
  const type: unknown = (input as { type?: unknown } | null)?.type;

  if (!isKnownBlockType(type)) {
    const known = BLOCK_TYPES.join(', ');
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['type'],
          message:
            type === undefined
              ? `Missing block type. Expected one of: ${known}`
              : `Unknown block type ${JSON.stringify(type)}. Expected one of: ${known}`,
        },
      ]),
    };
  }

  return SCHEMA_BY_TYPE[type].safeParse(input) as z.SafeParseReturnType<unknown, Block>;
}

/** Maximum nesting depth a renderer will display; deeper content still parses. */
export const MAX_RENDERED_LIST_DEPTH = 6;

export function listItemDepth(items: readonly ListItem[]): number {
  if (items.length === 0) return 0;
  return 1 + Math.max(...items.map((item) => listItemDepth(item.children)));
}

/** Flattens a block to plain text for search indexing. */
export function blockToPlainText(block: Block): string {
  const inline = (nodes: readonly InlineNode[]): string =>
    nodes.map((node) => (node.type === 'inlineMath' ? node.latex : node.text)).join('');

  const flattenItems = (items: readonly ListItem[]): string =>
    items.map((item) => `${inline(item.content)} ${flattenItems(item.children)}`).join(' ');

  switch (block.type) {
    case 'paragraph':
    case 'callout':
      return inline(block.content);
    case 'list':
      return flattenItems(block.items).trim();
    case 'table':
      return [
        block.caption ?? '',
        ...block.headers.map(inline),
        ...block.rows.flatMap((row) => row.map(inline)),
      ]
        .filter(Boolean)
        .join(' ');
    case 'math':
      return block.latex;
    case 'image':
      return [block.alt, block.caption ? inline(block.caption) : ''].filter(Boolean).join(' ');
    case 'code':
      return block.code;
  }
}

export { InlineNodeSchema };
