"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CatalogSectionOption = {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
};

function buildCatalogUrl(q: string, section: string) {
  const params = new URLSearchParams();
  const trimmedQ = q.trim();
  if (trimmedQ) params.set("q", trimmedQ);
  if (section) params.set("section", section);
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export function CatalogFilters({
  sections,
  initialQ,
  initialSection,
}: {
  sections: CatalogSectionOption[];
  initialQ: string;
  initialSection: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const skipDebounceRef = useRef(false);

  const navigate = useCallback(
    (nextQ: string, nextSection: string, replace = false) => {
      const url = buildCatalogUrl(nextQ, nextSection);
      if (replace) router.replace(url);
      else router.push(url);
    },
    [router]
  );

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }
    if (q.trim() === initialQ.trim()) return;

    const timer = setTimeout(() => {
      navigate(q, initialSection, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [q, initialQ, initialSection, navigate]);

  function onSectionChange(slug: string) {
    skipDebounceRef.current = true;
    navigate(q, slug === initialSection ? "" : slug);
  }

  function onReset() {
    skipDebounceRef.current = true;
    setQ("");
    router.replace("/catalog");
  }

  const hasFilters = Boolean(initialQ.trim() || initialSection);
  const activeSectionTitle = sections.find((s) => s.slug === initialSection)?.title;

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/40 p-4 md:p-5">
      <div className="relative">
        <MagnifyingGlassIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          placeholder="Поиск по названию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск по названию"
          className="pl-9"
        />
      </div>

      {sections.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Разделы
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={initialSection === s.slug ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onSectionChange(s.slug)}
              >
                {s.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          {initialQ.trim() ? (
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              Поиск:{" "}
              <span className="text-foreground ml-1 font-medium">«{initialQ.trim()}»</span>
            </span>
          ) : null}
          {activeSectionTitle ? (
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
              {activeSectionTitle}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "cursor-pointer rounded-full border-dashed",
              "text-muted-foreground hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
            )}
            onClick={onReset}
          >
            <XMarkIcon className="size-3.5" />
            Сбросить фильтры
          </Button>
        </div>
      ) : null}
    </div>
  );
}
