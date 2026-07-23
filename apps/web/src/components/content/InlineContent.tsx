import type { InlineNode, Mark } from '@renewcred/schema';
import { MathExpression } from './MathExpression';

const MARK_CLASS: Record<Mark, string> = {
  bold: 'font-500',
  italic: 'italic',
  underline: 'underline underline-offset-4',
  strike: 'line-through',
  code: 'rounded-sm border border-DEFAULT bg-surface-card px-4 font-mono text-[0.9em]',
};

/**
 * Renders one inline run. Marks compose, so a node may be bold *and* code.
 *
 * Links are rendered with `rel="noreferrer"` whenever they leave the site; the
 * schema permits arbitrary hrefs, and content is authored by editors rather than
 * developers, so the safe default is applied here rather than trusted upstream.
 */
export function InlineContent({ nodes }: { nodes: readonly InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case 'text': {
            const className = (node.marks ?? []).map((mark) => MARK_CLASS[mark]).join(' ');
            return className === '' ? (
              <span key={index}>{node.text}</span>
            ) : (
              <span key={index} className={className}>
                {node.text}
              </span>
            );
          }

          case 'link':
            return (
              <a
                key={index}
                href={node.href}
                // `external` is modelled on the node rather than sniffed from
                // the href, so the editor's intent decides — and rel is applied
                // here so no call site can forget it.
                {...(node.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                className="text-brand-primary underline underline-offset-4 hoverable:hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {node.text}
                {node.external && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            );

          case 'inlineMath':
            return <MathExpression key={index} latex={node.latex} display={false} />;
        }
      })}
    </>
  );
}
