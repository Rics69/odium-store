"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import type { PricingVariantT, ProductDetailT } from "@/lib/types";
import { PersonalDataConsentField } from "@/components/personal-data-consent-field";
import { useCookieConsent } from "@/components/cookie-consent-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductPurchase({
  product,
  isLoggedIn,
}: {
  product: ProductDetailT;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pdConsent, setPdConsent] = useState(false);
  const { canUseCookies } = useCookieConsent();
  const variants: PricingVariantT[] = product.pricing_variants ?? [];
  const hasVariants = variants.length > 0;

  const [pickedLabel, setPickedLabel] = useState(() => variants[0]?.label ?? "");

  const selected = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => v.label === pickedLabel) ?? variants[0];
  }, [hasVariants, variants, pickedLabel]);

  const displayPrice = useMemo(() => {
    if (selected) return Number(selected.price);
    return Number(product.price);
  }, [selected, product.price]);

  const displayOld = useMemo(() => {
    if (selected?.old_price != null) return Number(selected.old_price);
    if (product.old_price != null) return Number(product.old_price);
    return null;
  }, [selected, product.old_price]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (hasVariants && !pickedLabel) {
      toast.error("Выберите тариф");
      return;
    }
    if (!canUseCookies) {
      toast.error("Примите cookie в плашке внизу справа, чтобы оформить заказ.");
      return;
    }
    if (!pdConsent) {
      toast.error("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    const fields = product.input_fields.map((f) => ({
      field_key: f.field_key,
      value: String(fd.get(`field_${f.field_key}`) || ""),
    }));
    setLoading(true);
    try {
      const body: {
        product_slug: string;
        fields: typeof fields;
        variant_label?: string;
      } = {
        product_slug: product.slug,
        fields,
      };
      if (hasVariants) {
        body.variant_label = pickedLabel;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await readJsonSafe<{ id?: string; detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      const oid = payload && typeof payload.id === "string" ? payload.id.trim() : "";
      if (!oid) throw new Error("Сервер не вернул номер заказа");
      toast.success("Оплата прошла успешно");
      router.push(`/payment/success?order_id=${encodeURIComponent(oid)}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {hasVariants ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Тариф</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Button
                key={v.label}
                type="button"
                size="sm"
                className="cursor-pointer"
                variant={pickedLabel === v.label ? "default" : "outline"}
                onClick={() => setPickedLabel(v.label)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-semibold">{formatRub(displayPrice)}</span>
        {displayOld != null ? (
          <span className="text-lg text-muted-foreground line-through">{formatRub(displayOld)}</span>
        ) : null}
        <span className="text-sm text-muted-foreground">{product.purchase_count} покупок</span>
      </div>

      {!isLoggedIn ? (
        <div className="space-y-4 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Войдите, чтобы оформить покупку.</p>
          <Link href="/login" className={cn(buttonVariants(), "inline-flex")}>
            Вход
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Данные для заказа</h2>
          {product.input_fields.map((f) => (
            <div key={f.id} className="space-y-2">
              <Label htmlFor={`field_${f.field_key}`}>
                {f.label}
                {f.required ? " *" : ""}
              </Label>
              <Input
                id={`field_${f.field_key}`}
                name={`field_${f.field_key}`}
                type={
                  f.field_type === "password"
                    ? "password"
                    : f.field_type === "email"
                      ? "email"
                      : "text"
                }
                required={f.required}
                placeholder={f.placeholder ?? undefined}
                autoComplete="off"
              />
            </div>
          ))}
          {product.input_fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Дополнительные данные не требуются.</p>
          ) : null}
          <PersonalDataConsentField
            id={`purchase-pd-${product.slug}`}
            checked={pdConsent}
            onCheckedChange={setPdConsent}
          />
          <Button type="submit" disabled={loading} className="w-full cursor-pointer sm:w-auto">
            {loading ? "Оформляем…" : "Оплатить"}
          </Button>
        </form>
      )}
    </div>
  );
}
