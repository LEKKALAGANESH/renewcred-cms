import { z } from 'zod';

/**
 * Inline formatting applied to a text run. Additive: a new mark extends this
 * enum without touching any existing stored content.
 */
export const MarkSchema = z.enum(['bold', 'italic', 'code', 'underline', 'strike']);
export type Mark = z.infer<typeof MarkSchema>;

const TextNodeSchema = z
  .object({
    type: z.literal('text'),
    text: z.string(),
    marks: z.array(MarkSchema).optional(),
  })
  .strict();

const LinkNodeSchema = z
  .object({
    type: z.literal('link'),
    text: z.string().min(1),
    href: z.string().url(),
    /** Renderers add rel="noopener noreferrer" and a new-tab affordance. */
    external: z.boolean(),
  })
  .strict();

const InlineMathNodeSchema = z
  .object({
    type: z.literal('inlineMath'),
    /**
     * Rendered by KaTeX with `trust: false` (its default), which disables
     * \href, \url and \includegraphics. This field is user-authored input to
     * a renderer, so that setting is load-bearing, not incidental.
     */
    latex: z.string().min(1),
  })
  .strict();

/**
 * A run within a text-bearing block.
 *
 * The reason paragraph content is an array of these rather than a plain string:
 * "The factor $EF = 0.82$ applies" is ONE paragraph containing text → math →
 * text. A `{ type: 'paragraph', text: string }` model plus a sibling equation
 * block cannot express it — the equation would break onto its own line and
 * destroy the sentence. See ADR-0003.
 */
export const InlineNodeSchema = z.discriminatedUnion('type', [
  TextNodeSchema,
  LinkNodeSchema,
  InlineMathNodeSchema,
]);

export type InlineNode = z.infer<typeof InlineNodeSchema>;
export type TextNode = z.infer<typeof TextNodeSchema>;
export type LinkNode = z.infer<typeof LinkNodeSchema>;
export type InlineMathNode = z.infer<typeof InlineMathNodeSchema>;

/** Non-empty inline content. An empty paragraph is a defect, not a state. */
export const InlineContentSchema = z.array(InlineNodeSchema).min(1);

/**
 * Flattens inline content to plain text — used for search indexing, `alt`
 * fallbacks, and excerpt generation. Math contributes its LaTeX source, which
 * is imperfect for search but better than dropping the run entirely.
 */
export function inlineToPlainText(nodes: readonly InlineNode[]): string {
  return nodes.map((node) => (node.type === 'inlineMath' ? node.latex : node.text)).join('');
}
