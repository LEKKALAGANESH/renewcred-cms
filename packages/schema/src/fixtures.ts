import type { Block, BlockType, ListItem } from './blocks.js';
import { CURRENT_SCHEMA_VERSION, type ContentDocument, type Section } from './document.js';
import type { InlineNode } from './inline.js';

/** Fixed UUIDs so fixtures are deterministic across runs and snapshots. */
const ID = {
  intro: '11111111-1111-4111-8111-111111111111',
  scope: '22222222-2222-4222-8222-222222222222',
  boundaries: '33333333-3333-4333-8333-333333333333',
  gridFactor: '44444444-4444-4444-8444-444444444444',
  reporting: '55555555-5555-4555-8555-555555555555',
  asset: '66666666-6666-4666-8666-666666666666',
} as const;

const text = (value: string): InlineNode => ({ type: 'text', text: value });
const bold = (value: string): InlineNode => ({ type: 'text', text: value, marks: ['bold'] });
const math = (latex: string): InlineNode => ({ type: 'inlineMath', latex });
const item = (content: InlineNode[], children: ListItem[] = []): ListItem => ({
  content,
  children,
});

/**
 * One valid example per block type.
 *
 * Typed `Record<BlockType, Block>`, so a new block type without an example is a
 * COMPILE ERROR — the same enforcement the registry uses. These feed the docs,
 * the editor's insert-default, and the round-trip tests.
 */
export const BLOCK_EXAMPLES: Record<BlockType, Block> = {
  paragraph: {
    type: 'paragraph',
    content: [
      text('The baseline grid emission factor '),
      math('EF_{grid} = 0.82'),
      text(' tCO'),
      text('2'),
      text('e/MWh applies to all projects unless a '),
      bold('project-specific factor'),
      text(' has been certified.'),
    ],
  },

  list: {
    type: 'list',
    ordered: false,
    items: [
      item(
        [text('Eligible vehicle categories')],
        [
          item(
            [text('Passenger vehicles')],
            [
              item([text('Category M1 — up to 8 seats')]),
              item([text('Category M2 — 8 to 16 seats')]),
            ]
          ),
          item([text('Commercial vehicles')]),
        ]
      ),
      item([text('Excluded categories')]),
    ],
  },

  table: {
    type: 'table',
    caption: 'Emission factors by grid region',
    headers: [[text('Region')], [text('Factor')], [text('Valid from')]],
    rows: [
      [[text('Northern')], [math('0.82')], [text('12 Jul 2025')]],
      [[text('Western')], [math('0.79')], [text('12 Jul 2025')]],
      [[text('Southern')], [math('0.71')], [text('12 Jul 2025')]],
    ],
  },

  math: {
    type: 'math',
    latex: 'ER_y = BE_y - PE_y - LE_y',
    label: '(2.1)',
  },

  image: {
    type: 'image',
    assetId: ID.asset,
    alt: 'Flow diagram of the project boundary, showing grid electricity entering the charging system',
    caption: [text('Figure 1 — project boundary')],
    width: 'content',
  },

  callout: {
    type: 'callout',
    variant: 'important',
    content: [
      text('Projects certified before '),
      bold('12 Jul 2025'),
      text(' remain governed by version 0.9 until their next renewal.'),
    ],
  },

  code: {
    type: 'code',
    language: 'json',
    code: '{\n  "methodology": "RC-EV-001",\n  "version": "1.0.0"\n}',
  },
};

/**
 * A document exercising every supported block type, three levels of section
 * nesting, and both math forms.
 *
 * Serves three purposes at once: the seed's demo standard, the fixture set for
 * schema tests, and the proof that the capability exists — the Figma
 * demonstrates none of this content, so without a seeded example a reviewer
 * would never see it.
 */
export function richDemoDocument(): ContentDocument {
  const sections: Section[] = [
    {
      id: ID.intro,
      title: 'Introduction',
      anchor: 'introduction',
      blocks: [
        BLOCK_EXAMPLES.paragraph,
        {
          type: 'paragraph',
          content: [
            text('This standard defines the methodology for quantifying emission reductions from '),
            bold('electric vehicle'),
            text(' deployment. Where the reduction is expressed as '),
            math('ER_y'),
            text(', all terms follow the notation in Section 2.'),
          ],
        },
        BLOCK_EXAMPLES.callout,
      ],
      children: [],
    },
    {
      id: ID.scope,
      title: 'Scope and Boundaries',
      anchor: 'scope-and-boundaries',
      blocks: [BLOCK_EXAMPLES.math],
      children: [
        {
          id: ID.boundaries,
          title: 'Project Boundary',
          anchor: 'project-boundary',
          blocks: [BLOCK_EXAMPLES.list, BLOCK_EXAMPLES.image],
          children: [
            {
              id: ID.gridFactor,
              title: 'Grid Emission Factor',
              anchor: 'grid-emission-factor',
              blocks: [BLOCK_EXAMPLES.table],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: ID.reporting,
      title: 'Reporting Requirements',
      anchor: 'reporting-requirements',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            item([text('Submit the monitoring report annually.')]),
            item([text('Include raw telemetry in the machine-readable format below.')]),
          ],
        },
        BLOCK_EXAMPLES.code,
      ],
      children: [],
    },
  ];

  return { schemaVersion: CURRENT_SCHEMA_VERSION, sections };
}

/**
 * Payloads that MUST be rejected. Each names the defect it guards against, so a
 * regression reads as a sentence rather than an index into an array.
 */
export const INVALID_BLOCK_EXAMPLES: { reason: string; value: unknown }[] = [
  { reason: 'unknown block type', value: { type: 'video', src: 'x.mp4' } },
  { reason: 'missing block type', value: { content: [] } },
  { reason: 'paragraph with empty content', value: { type: 'paragraph', content: [] } },
  {
    reason: 'paragraph content as a bare string',
    value: { type: 'paragraph', content: 'plain text' },
  },
  {
    reason: 'unknown field on a known block',
    value: { type: 'paragraph', content: [{ type: 'text', text: 'x' }], colour: 'red' },
  },
  {
    reason: 'unknown inline node type',
    value: { type: 'paragraph', content: [{ type: 'emoji', name: 'smile' }] },
  },
  {
    reason: 'table row shorter than the header row',
    value: {
      type: 'table',
      headers: [[{ type: 'text', text: 'A' }], [{ type: 'text', text: 'B' }]],
      rows: [[[{ type: 'text', text: '1' }]]],
    },
  },
  {
    reason: 'image without alt text',
    value: { type: 'image', assetId: ID.asset, width: 'content' },
  },
  {
    reason: 'image with empty alt text',
    value: { type: 'image', assetId: ID.asset, alt: '', width: 'content' },
  },
  {
    reason: 'image assetId that is not a UUID',
    value: { type: 'image', assetId: 'not-a-uuid', alt: 'x', width: 'content' },
  },
  { reason: 'math with empty latex', value: { type: 'math', latex: '' } },
  { reason: 'list with no items', value: { type: 'list', ordered: false, items: [] } },
  {
    reason: 'link with a malformed href',
    value: {
      type: 'paragraph',
      content: [{ type: 'link', text: 'x', href: 'not a url', external: true }],
    },
  },
  {
    reason: 'callout with an unknown variant',
    value: { type: 'callout', variant: 'danger', content: [{ type: 'text', text: 'x' }] },
  },
];
