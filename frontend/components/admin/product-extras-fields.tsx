"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AccordionSectionT, PricingVariantT } from "@/lib/types";

export type DraftAccordionSection = {
  tempId: string;
  title: string;
  content: string;
};

export type DraftPricingVariant = {
  tempId: string;
  label: string;
  price: string;
  old_price: string;
};

function newTempId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyAccordionDraft(): DraftAccordionSection {
  return { tempId: newTempId(), title: "", content: "" };
}

export function emptyVariantDraft(): DraftPricingVariant {
  return { tempId: newTempId(), label: "", price: "", old_price: "" };
}

export function accordionDraftsFromApi(rows: AccordionSectionT[]): DraftAccordionSection[] {
  const list = rows ?? [];
  return list.map((r) => ({
    tempId: newTempId(),
    title: r.title,
    content: r.content,
  }));
}

export function variantDraftsFromApi(rows: PricingVariantT[]): DraftPricingVariant[] {
  const list = rows ?? [];
  return list.map((r) => ({
    tempId: newTempId(),
    label: r.label,
    price: String(r.price),
    old_price: r.old_price != null ? String(r.old_price) : "",
  }));
}

export type AccordionPayloadItem = { title: string; content: string };
export type VariantPayloadItem = { label: string; price: number; old_price: number | null };

export function accordionDraftsToPayload(rows: DraftAccordionSection[]): AccordionPayloadItem[] {
  const kept = rows.filter((r) => r.title.trim() || r.content.trim());
  return kept.map((r) => ({ title: r.title.trim(), content: r.content.trim() }));
}

export function variantsDraftsToPayload(
  rows: DraftPricingVariant[]
): { ok: true; variants: VariantPayloadItem[] } | { ok: false; detail: string } {
  const kept = rows.filter((r) => r.label.trim() || r.price.trim() || r.old_price.trim());
  const labels = new Set<string>();

  const out: VariantPayloadItem[] = [];
  for (const r of kept) {
    const label = r.label.trim();
    if (!label) {
      return { ok: false, detail: "У каждого тарифа нужно указать название (например, «1 месяц»)." };
    }
    if (labels.has(label)) {
      return { ok: false, detail: `Название тарифа «${label}» повторяется.` };
    }
    labels.add(label);
    const price = Number(r.price);
    if (!Number.isFinite(price) || price <= 0) {
      return {
        ok: false,
        detail: `Некорректная цена для тарифа «${label}». Укажите положительное число.`,
      };
    }
    let old_price: number | null = null;
    if (r.old_price.trim()) {
      const o = Number(r.old_price);
      if (!Number.isFinite(o) || o <= 0) {
        return { ok: false, detail: `Некорректная старая цена для «${label}».` };
      }
      old_price = o;
    }
    out.push({ label, price, old_price });
  }

  return { ok: true, variants: out };
}

function AccordionRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: DraftAccordionSection;
  onChange: (next: DraftAccordionSection) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="space-y-2">
        <Label>Заголовок пункта</Label>
        <Input
          value={row.title}
          onChange={(e) => onChange({ ...row, title: e.target.value })}
          placeholder="Например: Вход и активация"
        />
      </div>
      <div className="space-y-2">
        <Label>Текст</Label>
        <Textarea
          value={row.content}
          onChange={(e) => onChange({ ...row, content: e.target.value })}
          rows={4}
          placeholder="Подробности для клиента."
        />
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Удалить пункт
      </Button>
    </div>
  );
}

export function AccordionSectionsField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: DraftAccordionSection[];
  onChange: (next: DraftAccordionSection[]) => void;
}) {
  const add = useCallback(() => {
    onChange([...value, emptyAccordionDraft()]);
  }, [onChange, value]);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <div className="space-y-3">
        {value.map((row) => (
          <AccordionRowEditor
            key={row.tempId}
            row={row}
            onChange={(next) => onChange(value.map((x) => (x.tempId === row.tempId ? next : x)))}
            onRemove={() => onChange(value.filter((x) => x.tempId !== row.tempId))}
          />
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add}>
        Добавить пункт
      </Button>
    </div>
  );
}

function VariantRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: DraftPricingVariant;
  onChange: (next: DraftPricingVariant) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <div className="space-y-2 sm:col-span-1">
        <Label className="text-xs">Название тарифа</Label>
        <Input
          value={row.label}
          onChange={(e) => onChange({ ...row, label: e.target.value })}
          placeholder="12 месяцев"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Цена (₽)</Label>
        <Input
          value={row.price}
          type="number"
          step="0.01"
          onChange={(e) => onChange({ ...row, price: e.target.value })}
          placeholder="1990"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Старая цена</Label>
        <Input
          value={row.old_price}
          type="number"
          step="0.01"
          onChange={(e) => onChange({ ...row, old_price: e.target.value })}
          placeholder="—"
        />
      </div>
      <Button type="button" variant="ghost" size="sm" className="justify-self-end" onClick={onRemove}>
        Удалить
      </Button>
    </div>
  );
}

export function PricingVariantsField({
  value,
  onChange,
}: {
  value: DraftPricingVariant[];
  onChange: (next: DraftPricingVariant[]) => void;
}) {
  const add = useCallback(() => {
    onChange([...value, emptyVariantDraft()]);
  }, [onChange, value]);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">Тарифы / варианты</p>
        <p className="text-muted-foreground text-xs">
          Если список пуст, на витрине используется одна цена из полей «Цена» и «Старая цена» выше. Если
          добавить тарифы — покупатель выбирает вариант (по умолчанию первый в списке).
        </p>
      </div>
      <div className="space-y-3">
        {value.map((row) => (
          <VariantRowEditor
            key={row.tempId}
            row={row}
            onChange={(next) => onChange(value.map((x) => (x.tempId === row.tempId ? next : x)))}
            onRemove={() => onChange(value.filter((x) => x.tempId !== row.tempId))}
          />
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add}>
        Добавить тариф
      </Button>
    </div>
  );
}
