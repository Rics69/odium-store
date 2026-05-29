"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export type HomepageSectionOption = {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
};

function labelFor(slug: string, title: string) {
  if (slug === "best") return "Лучшие товары";
  if (slug === "new") return "Новинки";
  return title;
}

export function HomepageSectionsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  const [sections, setSections] = useState<HomepageSectionOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/sections", { cache: "no-store" });
        const data = (await r.json()) as { sections?: HomepageSectionOption[] };
        if (!cancelled && r.ok && Array.isArray(data.sections)) {
          setSections(data.sections);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  function toggle(slug: string) {
    const next = new Set(value);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    const ordered = sorted.filter((s) => next.has(s.slug)).map((s) => s.slug);
    onChange(ordered);
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div>
        <Label>Блоки на главной</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Выберите секции, где показывать карточку. Новые блоки и порядок на главной настраиваются в{" "}
          <Link href="/admin/sections" className="underline hover:text-foreground">
            секциях главной
          </Link>
          .
        </p>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Загрузка секций…</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Секций нет — добавьте их в разделе «Секции главной».
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.includes(s.slug)}
                  onChange={() => toggle(s.slug)}
                  className="h-4 w-4 rounded border"
                />
                <span>{labelFor(s.slug, s.title)}</span>
                <span className="text-muted-foreground font-mono text-xs">({s.slug})</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
