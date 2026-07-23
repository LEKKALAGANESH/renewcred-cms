import { sectionOrdinals, type ContentDocument, type Section } from '@renewcred/schema';
import { BlockRenderer } from './BlockRenderer';

/**
 * Renders the document tree.
 *
 * Section numbering ("1.0", "2.1.1") comes from `sectionOrdinals` in the schema
 * package rather than being recomputed here — the admin editor and the public
 * site must agree on the number shown against a heading, and two
 * implementations would eventually disagree.
 *
 * Headings map to real levels (h2 for top level, h3, h4 …) capped at h6, so the
 * document outline is navigable by assistive technology.
 */
export function DocumentBody({ document }: { document: ContentDocument }) {
  const ordinals = sectionOrdinals(document.sections);

  return (
    <div className="flex flex-col">
      {document.sections.map((section) => (
        <SectionView key={section.id} section={section} ordinals={ordinals} depth={0} />
      ))}
    </div>
  );
}

function SectionView({
  section,
  ordinals,
  depth,
}: {
  section: Section;
  ordinals: Map<string, string>;
  depth: number;
}) {
  const Heading = `h${Math.min(depth + 2, 6)}` as 'h2';
  const ordinal = ordinals.get(section.id);

  return (
    <section
      id={section.anchor}
      // `scroll-mt` keeps the heading clear of the sticky header when jumped to.
      className="flex scroll-mt-[160px] flex-col gap-16 px-8 py-24"
    >
      <div className="flex flex-col gap-16">
        <Heading className="flex items-baseline gap-24 text-heading text-text-primary">
          {ordinal !== undefined && <span className="shrink-0 tabular-nums">{ordinal}</span>}
          <span>{section.title}</span>
        </Heading>
        <hr className="border-0 border-t border-t-DEFAULT" />
      </div>

      {section.blocks.length > 0 && (
        <div className="flex flex-col gap-24 py-8">
          {section.blocks.map((block, index) => (
            <BlockRenderer key={index} block={block} />
          ))}
        </div>
      )}

      {section.children.map((child) => (
        <SectionView key={child.id} section={child} ordinals={ordinals} depth={depth + 1} />
      ))}
    </section>
  );
}
