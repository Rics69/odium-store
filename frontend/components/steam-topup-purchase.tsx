"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import {
  calcSteamPayRub,
  formatRub,
  STEAM_CURRENCY_OPTIONS,
  type SteamDepositCurrency,
} from "@/lib/steam-pricing";
import type { ProductDetailT } from "@/lib/types";
import { PersonalDataConsentField } from "@/components/personal-data-consent-field";
import { useCookieConsent } from "@/components/cookie-consent-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SteamTopupPurchase({
  product,
  isLoggedIn,
}: {
  product: ProductDetailT;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<SteamDepositCurrency>("rub");
  const [amountRaw, setAmountRaw] = useState("");
  const [pdConsent, setPdConsent] = useState(false);
  const { canUseCookies } = useCookieConsent();

  const commission = Number(product.steam_commission_percent ?? 20);
  const usdToRub = Number(product.steam_usd_to_rub ?? 92);
  const kztToRub = Number(product.steam_kzt_to_rub ?? 0.2);

  const currencyMeta = STEAM_CURRENCY_OPTIONS.find((c) => c.id === currency)!;
  const depositAmount = Number(amountRaw.replace(",", "."));

  const payRub = useMemo(() => {
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) return null;
    return calcSteamPayRub(depositAmount, currency, commission, usdToRub, kztToRub);
  }, [depositAmount, currency, commission, usdToRub, kztToRub]);

  const belowMin =
    Number.isFinite(depositAmount) &&
    depositAmount > 0 &&
    depositAmount < currencyMeta.min;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      toast.error("Укажите сумму пополнения");
      return;
    }
    if (belowMin) {
      toast.error(`Минимум — ${currencyMeta.min} ${currencyMeta.symbol}`);
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
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: product.slug,
          fields,
          steam_deposit_amount: depositAmount,
          steam_deposit_currency: currency,
        }),
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
      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-medium">Сумма на Steam</p>
        <div className="flex flex-wrap gap-2">
          {STEAM_CURRENCY_OPTIONS.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant={currency === c.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCurrency(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="steam_amount">
            Сколько зачислить ({currencyMeta.symbol})
          </Label>
          <Input
            id="steam_amount"
            type="number"
            min={currencyMeta.min}
            step={currencyMeta.step}
            inputMode="decimal"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            placeholder={`от ${currencyMeta.min} ${currencyMeta.symbol}`}
          />
          <p className="text-muted-foreground text-xs">
            Минимум: {currencyMeta.min} {currencyMeta.symbol}. Комиссия сервиса: {commission}%.
          </p>
        </div>
        {payRub != null && payRub > 0 ? (
          <div className="space-y-1 border-t pt-3">
            <p className="text-muted-foreground text-sm">
              На Steam:{" "}
              <span className="text-foreground font-medium">
                {depositAmount} {currencyMeta.symbol}
              </span>
            </p>
            <p className="text-2xl font-semibold">К оплате: {formatRub(payRub)}</p>
            {belowMin ? (
              <p className="text-destructive text-xs">Сумма ниже минимальной</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
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
            <p className="text-sm text-muted-foreground">
              Укажите логин Steam для пополнения.
            </p>
          ) : null}
          <PersonalDataConsentField
            id={`steam-pd-${product.slug}`}
            checked={pdConsent}
            onCheckedChange={setPdConsent}
          />
          <Button
            type="submit"
            disabled={loading || belowMin || !payRub}
            className="w-full cursor-pointer sm:w-auto"
          >
            {loading ? "Оформляем…" : "Оплатить"}
          </Button>
        </form>
      )}
    </div>
  );
}
