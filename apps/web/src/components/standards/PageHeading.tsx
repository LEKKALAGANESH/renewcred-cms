import { cn } from '@renewcred/ui';

/**
 * The hero shared by both screens: a pill chip (r48, white, 1px #d8d8d8), the
 * 72/78 display title, and a 776–1152px lead paragraph.
 */
export function PageHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-16', className)}>
      <span className="flex w-fit items-center gap-8 rounded-2xl border border-DEFAULT bg-surface-card px-16 py-8 text-chip">
        {eyebrow}
      </span>
      {/* Figma specs the display title only at the desktop 72/78. The clamp
          keeps that exact size from ~1000px up (7vw caps at 4.5rem = 72px) and
          scales it down to 40px on narrow screens, where a fixed 72px "Standards"
          is wider than the viewport and forces a horizontal scroll. */}
      <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-500 italic leading-[1.0833] text-text-primary">
        {title}
      </h1>
      <p className="max-w-[1152px] text-body text-text-primary">{lead}</p>
    </div>
  );
}
