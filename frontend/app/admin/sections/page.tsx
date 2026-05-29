"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import type { HomepageSectionOption } from "@/components/admin/homepage-sections-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AdminSectionsPage() {
  const submittingRef = useRef(false);
  const [sections, setSections] = useState<HomepageSectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/sections", { cache: "no-store" });
      const data = await readJsonSafe<{ sections?: HomepageSectionOption[] }>(r);
      if (!r.ok) throw new Error(formatApiErrorDetail(data ?? {}));
      setSections(Array.isArray(data?.sections) ? data.sections : []);
    } catch (e) {
      toast.error((e as Error).message);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title")).trim();
    const slug = String(fd.get("slug"))
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    const sortRaw = String(fd.get("sort_order") || "").trim();
    submittingRef.current = true;
    setCreating(true);
    try {
      const body: { title: string; slug: string; sort_order?: number } = { title, slug };
      if (sortRaw) body.sort_order = Number(sortRaw);
      const r = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const data = await readJsonSafe(r);
      if (!r.ok) throw new Error(formatApiErrorDetail(data ?? {}));
      toast.success("Секция создана");
      form.reset();
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      submittingRef.current = false;
      setCreating(false);
    }
  }

  async function removeSection(id: string) {
    if (!confirm("Удалить секцию с главной? Товары останутся в каталоге.")) return;
    const r = await fetch(`/api/admin/sections/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    const data = await readJsonSafe(r);
    if (!r.ok) {
      toast.error(formatApiErrorDetail(data ?? {}) || "Не удалось удалить");
      return;
    }
    toast.success("Секция удалена");
    await load();
  }

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin"
          className="text-muted-foreground text-sm underline hover:text-foreground"
        >
          ← К товарам
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Секции главной</h1>
      <p className="text-muted-foreground text-sm">
        Блоки выводятся на главной странице по порядку «Порядок» (меньше — выше). Новая секция без
        номера добавляется в конец — после «Лучшие товары» и остальных.
      </p>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Новая секция</h2>
        <form onSubmit={onCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок на сайте</Label>
            <Input id="title" name="title" required placeholder="Например: Игры" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (латиница)</Label>
            <Input id="slug" name="slug" required placeholder="games" className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Порядок (необязательно)</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              placeholder="Оставьте пустым — в конец списка"
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Создаём…" : "Создать секцию"}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Текущие секции</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Загрузка…</p>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет секций.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {sorted.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {s.slug} · порядок {s.sort_order}
                  </p>
                </div>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeSection(s.id)}>
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/admin/products/new" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
        Создать товар
      </Link>
    </div>
  );
}
