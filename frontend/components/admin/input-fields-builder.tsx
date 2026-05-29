"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductInputField, ProductPostPaymentFieldT } from "@/lib/types";

export type DraftInputField = {
  tempId: string;
  field_key: string;
  label: string;
  field_type: "text" | "email" | "password";
  required: boolean;
  placeholder: string;
};

function newTempId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyDraftField(): DraftInputField {
  return {
    tempId: newTempId(),
    field_key: "",
    label: "",
    field_type: "text",
    required: true,
    placeholder: "",
  };
}

export function draftsFromProductFields(rows: ProductInputField[]): DraftInputField[] {
  return rows.map((p) => ({
    tempId: p.id || newTempId(),
    field_key: p.field_key,
    label: p.label,
    field_type: p.field_type,
    required: p.required,
    placeholder: p.placeholder ?? "",
  }));
}

export function draftsFromPostPaymentFields(rows: ProductPostPaymentFieldT[]): DraftInputField[] {
  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted.map((p) => ({
    tempId: newTempId(),
    field_key: p.field_key,
    label: p.label,
    field_type: p.field_type,
    required: p.required,
    placeholder: p.placeholder ?? "",
  }));
}

export function draftsToPayload(
  rows: DraftInputField[]
): { ok: true; input_fields: object[] } | { ok: false; detail: string } {
  const trimmed = rows
    .map((r, i) => ({ ...r, sort_order: i }))
    .filter((r) => r.field_key.trim() || r.label.trim() || r.placeholder.trim());

  const keys = new Set<string>();
  for (const r of trimmed) {
    const k = r.field_key.trim();
    const label = r.label.trim();
    if (!k) {
      return { ok: false, detail: "У каждого поля должен быть ключ (латиница/цифры, например login_email)." };
    }
    if (!label) {
      return { ok: false, detail: "У каждого поля должна быть подпись." };
    }
    if (!/^[a-z0-9_]+$/.test(k)) {
      return {
        ok: false,
        detail: `Некорректный ключ «${k}»: только латиница в нижнем регистре, цифры и _.`,
      };
    }
    if (keys.has(k)) {
      return { ok: false, detail: `Повторяется ключ поля «${k}».` };
    }
    keys.add(k);
  }

  return {
    ok: true,
    input_fields: trimmed.map((r, i) => ({
      field_key: r.field_key.trim(),
      label: r.label.trim(),
      field_type: r.field_type,
      required: r.required,
      placeholder: r.placeholder.trim() ? r.placeholder.trim() : null,
      sort_order: i,
    })),
  };
}

type Props = {
  value: DraftInputField[];
  onChange: (next: DraftInputField[]) => void;
  heading?: string;
  hint?: string;
};

export function InputFieldsBuilder({
  value,
  onChange,
  heading = "Поля ввода при заказе",
  hint = "Данные клиента перед оформлением (email, логин и т.п.).",
}: Props) {
  const updateAt = useCallback(
    (index: number, patch: Partial<DraftInputField>) => {
      onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    },
    [value, onChange]
  );

  const removeAt = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const move = useCallback(
    (index: number, dir: -1 | 1) => {
      const j = index + dir;
      if (j < 0 || j >= value.length) return;
      const next = [...value];
      [next[index], next[j]] = [next[j], next[index]];
      onChange(next);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label className="text-base">{heading}</Label>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyDraftField()])}
        >
          Добавить поле
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет полей — заказ можно оформить без дополнительных данных.</p>
      ) : (
        <ul className="space-y-3">
          {value.map((row, i) => (
            <li
              key={row.tempId}
              className="space-y-3 rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">Поле {i + 1}</span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    Выше
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={i === value.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    Ниже
                  </Button>
                  <Button type="button" variant="ghost" size="xs" onClick={() => removeAt(i)}>
                    Удалить
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`fk-${row.tempId}`}>
                    Ключ (внутренний)
                  </Label>
                  <Input
                    id={`fk-${row.tempId}`}
                    value={row.field_key}
                    onChange={(e) => updateAt(i, { field_key: e.target.value })}
                    placeholder="login_email"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`lb-${row.tempId}`}>
                    Подпись
                  </Label>
                  <Input
                    id={`lb-${row.tempId}`}
                    value={row.label}
                    onChange={(e) => updateAt(i, { label: e.target.value })}
                    placeholder="Почта аккаунта"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`tp-${row.tempId}`}>
                    Тип
                  </Label>
                  <select
                    id={`tp-${row.tempId}`}
                    value={row.field_type}
                    onChange={(e) =>
                      updateAt(i, {
                        field_type: e.target.value as DraftInputField["field_type"],
                      })
                    }
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="text">Текст</option>
                    <option value="email">Email</option>
                    <option value="password">Пароль</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`ph-${row.tempId}`}>
                    Плейсхолдер (необязательно)
                  </Label>
                  <Input
                    id={`ph-${row.tempId}`}
                    value={row.placeholder}
                    onChange={(e) => updateAt(i, { placeholder: e.target.value })}
                    placeholder="user@mail.com"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.required}
                  onChange={(e) => updateAt(i, { required: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                Обязательное поле
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
