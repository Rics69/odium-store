"use client";

import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  rating,
  max = 5,
  size = "md",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const r = Math.max(0, Math.min(max, Math.round(rating)));
  const starCls = size === "sm" ? "text-base leading-none" : "text-xl leading-none";
  return (
    <span
      className={cn("inline-flex gap-px text-amber-400", starCls)}
      aria-label={`Оценка ${r} из ${max}`}
      role="img"
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn(i < r ? "opacity-100" : "opacity-25")}>
          ★
        </span>
      ))}
    </span>
  );
}

export function StarRatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={cn(
            "rounded px-1 text-xl leading-none transition-colors hover:bg-muted",
            n <= value ? "text-amber-400" : "text-muted-foreground/35"
          )}
          aria-label={`Оценка ${n} из 5`}
          aria-pressed={n <= value}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="text-muted-foreground ml-2 text-sm">{value} из 5</span>
    </div>
  );
}
