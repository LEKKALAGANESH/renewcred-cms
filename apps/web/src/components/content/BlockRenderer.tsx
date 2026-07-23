import { MAX_RENDERED_LIST_DEPTH, type Block, type ListItem } from '@renewcred/schema';
import { cn } from '@renewcred/ui';
import { InlineContent } from './InlineContent';
import { MathExpression } from './MathExpression';

/**
 * The single extension point for content rendering.
 *
 * One switch on `block.type`. `noFallthroughCasesInSwitch` plus the exhaustive
 * union means adding a block type fails to compile here until it is handled —
 * which is the whole point of the discriminated union.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-body text-text-primary [text-align:justify]">
          <InlineContent nodes={block.content} />
        </p>
      );

    case 'list':
      return <ListBlockView ordered={block.ordered} items={block.items} depth={0} />;

    case 'table':
      return (
        // The wrapper scrolls rather than the page: a wide table must never
        // force horizontal scroll on the document itself.
        <figure className="flex flex-col gap-8">
          <div className="overflow-x-auto rounded-md border border-DEFAULT">
            <table className="w-full border-collapse bg-surface-card text-left">
              <thead>
                <tr>
                  {block.headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="border-b border-b-DEFAULT px-16 py-12 text-bodyStrong"
                    >
                      <InlineContent nodes={header} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-b-DEFAULT last:border-b-0">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-16 py-12 text-body">
                        <InlineContent nodes={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption !== undefined && (
            <figcaption className="text-label font-400 text-text-secondary">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'math':
      return (
        <div className="flex items-center gap-16">
          <div className="flex-1">
            <MathExpression latex={block.latex} display />
          </div>
          {block.label !== undefined && (
            <span className="shrink-0 text-bodyStrong text-text-secondary">{block.label}</span>
          )}
        </div>
      );

    case 'image':
      return (
        <figure
          className={cn(
            'flex flex-col gap-8',
            block.width === 'wide' && '-mx-40',
            block.width === 'full' && '-mx-104'
          )}
        >
          {/* Assets resolve through the API in phase 2; the alt text is
              schema-required, so it is never absent. */}
          <div className="flex aspect-[16/9] items-center justify-center rounded-md border border-DEFAULT bg-surface-card text-label font-400 text-text-muted">
            {block.alt}
          </div>
          {block.caption !== undefined && (
            <figcaption className="text-label font-400 text-text-secondary">
              <InlineContent nodes={block.caption} />
            </figcaption>
          )}
        </figure>
      );

    case 'callout':
      return (
        <aside
          className={cn(
            'rounded-md border-l-medium px-24 py-16 text-body',
            block.variant === 'note' && 'border-l-DEFAULT bg-surface-card',
            block.variant === 'warning' && 'border-l-brand bg-brand-tintSoft',
            block.variant === 'important' && 'border-l-brand bg-brand-tintStrong'
          )}
        >
          <span className="sr-only">{block.variant}: </span>
          <InlineContent nodes={block.content} />
        </aside>
      );

    case 'code':
      return (
        <pre className="overflow-x-auto rounded-md border border-DEFAULT bg-surface-card px-24 py-16">
          <code className="font-mono text-label font-400">{block.code}</code>
        </pre>
      );
  }
}

/**
 * Nested lists. Depth is capped by the schema's `MAX_RENDERED_LIST_DEPTH`; past
 * it the items are still rendered, just without further indentation, so content
 * is never silently dropped.
 */
function ListBlockView({
  ordered,
  items,
  depth,
}: {
  ordered: boolean;
  items: readonly ListItem[];
  depth: number;
}) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <List
      className={cn(
        'flex flex-col gap-8 text-body',
        ordered ? 'list-decimal' : 'list-disc',
        depth < MAX_RENDERED_LIST_DEPTH ? 'pl-24' : 'pl-0'
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="pl-4">
          <InlineContent nodes={item.content} />
          {item.children.length > 0 && (
            <div className="mt-8">
              <ListBlockView ordered={ordered} items={item.children} depth={depth + 1} />
            </div>
          )}
        </li>
      ))}
    </List>
  );
}
