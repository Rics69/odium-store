"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = q.trim();
      if (!trimmed) return;
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    },
    [q, router]
  );

  return (
    <form onSubmit={onSubmit} className={cn("flex gap-2", className)}>
      <Input
        placeholder="Поиск товаров..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Поиск по названию"
      />
      <Button type="submit" size="icon" variant="secondary" aria-label="Искать">
        <MagnifyingGlassIcon className="size-4" />
      </Button>
    </form>
  );
}
