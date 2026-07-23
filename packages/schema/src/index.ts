/**
 * @renewcred/schema — the domain content contract.
 *
 * Pure: depends on Zod and nothing else. No Prisma, no Express, no React. The
 * database schema is derived from this model, not the other way around, and both
 * frontends import the same definitions the server validates against — one
 * definition, no drift.
 */

export {
  InlineContentSchema,
  InlineNodeSchema,
  MarkSchema,
  inlineToPlainText,
  type InlineMathNode,
  type InlineNode,
  type LinkNode,
  type Mark,
  type TextNode,
} from './inline.js';

export {
  BLOCK_TYPES,
  BlockSchema,
  ListItemSchema,
  MAX_RENDERED_LIST_DEPTH,
  blockToPlainText,
  listItemDepth,
  parseBlock,
  type Block,
  type BlockType,
  type CalloutBlock,
  type CodeBlock,
  type ImageBlock,
  type ListBlock,
  type ListItem,
  type MathBlock,
  type ParagraphBlock,
  type TableBlock,
} from './blocks.js';

export {
  AnchorSchema,
  CURRENT_SCHEMA_VERSION,
  DocumentSchema,
  SectionSchema,
  documentToPlainText,
  emptyDocument,
  parseDocument,
  walkSections,
  type ContentDocument,
  type DocumentIssue,
  type DocumentParseResult,
  type Section,
} from './document.js';

export {
  buildTableOfContents,
  findDuplicateAnchors,
  findDuplicateSectionIds,
  flattenTableOfContents,
  sectionOrdinals,
  type TocEntry,
} from './numbering.js';

export {
  BLOCK_REGISTRY,
  blockMeta,
  editorPalette,
  isDeprecated,
  type BlockMeta,
} from './registry.js';

export { BLOCK_EXAMPLES, INVALID_BLOCK_EXAMPLES, richDemoDocument } from './fixtures.js';
