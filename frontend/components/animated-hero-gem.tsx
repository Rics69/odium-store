"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function AnimatedHeroGem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative shrink-0 opacity-95 odium-gem-animate dark:opacity-[0.92]",
        className
      )}
      aria-hidden
    >
      <Image
        src="/logo-odium.svg"
        alt=""
        fill
        sizes="(max-width:1024px) 176px, 208px"
        className="object-contain drop-shadow-[0_0_32px_rgba(96,165,250,0.4)] dark:drop-shadow-[0_0_36px_rgba(125,184,255,0.35)]"
        priority
      />
    </div>
  );
}
