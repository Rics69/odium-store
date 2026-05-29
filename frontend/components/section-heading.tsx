import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="inline-block h-px w-6 bg-primary" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.25rem)] font-bold leading-tight tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
