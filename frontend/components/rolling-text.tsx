"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function RollingText({
  phrases,
  intervalMs = 2800,
  className,
}: {
  phrases: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % phrases.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [phrases.length, intervalMs]);

  const text = phrases[index] ?? "";
  const chars = Array.from(text);
  const center = (chars.length - 1) / 2;

  return (
    <span className={cn("odium-roll inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span key={index} aria-hidden className="inline-block">
        {chars.map((ch, i) => (
          <span
            key={i}
            className="odium-roll-char"
            style={{ animationDelay: `${Math.abs(i - center) * 0.04}s` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
