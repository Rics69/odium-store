"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { OrderSuccessPayloadT, ProductPostPaymentFieldT } from "@/lib/types";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import { PersonalDataConsentField } from "@/components/personal-data-consent-field";
import { useCookieConsent } from "@/components/cookie-consent-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { TG_SUPPORT_URL } from "@/lib/legal-links";

function fieldInputType(t: ProductPostPaymentFieldT["field_type"]) {
  if (t === "password") return "password";
  if (t === "email") return "email";
  return "text";
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = (searchParams.get("order_id") || "").trim();

  const [payload, setPayload] = useState<OrderSuccessPayloadT | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [orderStatusLabel, setOrderStatusLabel] = useState<string | null>(null);
  const [pdConsent, setPdConsent] = useState(false);
  const { canUseCookies } = useCookieConsent();

  const loadOrder = useCallback(async (silent = false) => {
    if (!orderId) return;
    if (!silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      const data = await readJsonSafe<{ detail?: unknown } & Partial<OrderSuccessPayloadT>>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(data ?? {}));
      if (!data) throw new Error("Пустой ответ сервера");
      const p: OrderSuccessPayloadT = {
        id: String(data.id ?? ""),
        product_title: String(data.product_title ?? ""),
        status: data.status ? String(data.status) : undefined,
        status_display: data.status_display ? String(data.status_display) : undefined,
        post_payment_fields: Array.isArray(data.post_payment_fields)
          ? (data.post_payment_fields as ProductPostPaymentFieldT[])
          : [],
        post_payment_already_submitted: Boolean(data.post_payment_already_submitted),
      };
      setPayload(p);
      setPosted(Boolean(data.post_payment_already_submitted));
      setOrderStatus(p.status ?? null);
      setOrderStatusLabel(p.status_display ?? null);
      if (!silent) {
        const next: Record<string, string> = {};
        for (const f of p.post_payment_fields) {
          next[f.field_key] = "";
        }
        setValues(next);
      }
    } catch (e) {
      if (!silent) {
        const msg = (e as Error).message;
        setErr(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setPayload(null);
      setErr(null);
      setPosted(false);
      setOrderStatus(null);
      setOrderStatusLabel(null);
      return;
    }
    void loadOrder(false);
    const id = window.setInterval(() => void loadOrder(true), 8000);
    return () => clearInterval(id);
  }, [orderId, loadOrder]);

  const fields = payload?.post_payment_fields ?? [];

  async function submitPostPayment() {
    if (!orderId || fields.length === 0 || posted || submitting) return;
    if (!canUseCookies) {
      toast.error("Примите cookie в плашке внизу справа.");
      return;
    }
    if (!pdConsent) {
      toast.error("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    const bodyValues: Record<string, string> = {};
    for (const f of fields) {
      bodyValues[f.field_key] = (values[f.field_key] ?? "").trim();
      if (f.required && !bodyValues[f.field_key]) {
        toast.error(`Заполните поле: ${f.label}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: bodyValues }),
        cache: "no-store",
      });
      const data = await readJsonSafe<{ detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(data ?? {}));
      toast.success("Данные отправлены в поддержку");
      setPosted(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Спасибо за покупку</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Спасибо, что воспользовались нашими услугами — мы уже работаем над вашим заказом.
          {payload?.product_title ? (
            <>
              {" "}
              <span className="text-foreground font-medium">{payload.product_title}</span>
            </>
          ) : null}
        </p>
        {orderStatusLabel ? (
          <p className="text-sm font-medium">
            Статус заказа:{" "}
            <span
              className={
                orderStatus === "fulfilled"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : orderStatus === "cancelled"
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-400"
              }
            >
              {orderStatusLabel}
            </span>
          </p>
        ) : null}
      </div>

      {!orderId ? (
        <p className="text-muted-foreground text-sm">
          Откройте ссылку из подтверждения заказа или перейдите в личный кабинет.
        </p>
      ) : null}

      {orderId && loading ? (
        <p className="text-muted-foreground text-sm">Загрузка…</p>
      ) : null}

      {orderId && err ? <p className="text-destructive text-sm">{err}</p> : null}

      {orderId && !loading && !err && fields.length > 0 ? (
        <div className="w-full space-y-4 rounded-2xl border bg-card p-6 text-left">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Заполните поля по инструкции к товару и нажмите «Отправить». Передавайте пароли только если
            это нужно для выдачи заказа.
          </p>
          {posted ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Данные отправлены. Статус заказа смотрите в личном кабинете.
            </p>
          ) : null}
          {fields.map((f) => (
            <div key={f.field_key} className="space-y-2">
              <Label htmlFor={`pp_${f.field_key}`}>
                {f.label}
                {f.required ? " *" : ""}
              </Label>
              <Input
                id={`pp_${f.field_key}`}
                type={fieldInputType(f.field_type)}
                value={values[f.field_key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.field_key]: e.target.value }))
                }
                autoComplete="off"
                placeholder={f.placeholder ?? undefined}
                className="font-mono"
                disabled={posted}
              />
            </div>
          ))}
          {!posted ? (
            <>
              <PersonalDataConsentField
                id="post-payment-pd-consent"
                checked={pdConsent}
                onCheckedChange={setPdConsent}
              />
              <Button
                type="button"
                className="w-full cursor-pointer sm:w-auto"
                disabled={submitting}
                onClick={() => void submitPostPayment()}
              >
                {submitting ? "Отправка…" : "Отправить"}
              </Button>
            </>
          ) : null}
          <p className="text-muted-foreground text-xs leading-relaxed">
            По вопросам:{" "}
            <Link
              href={TG_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              Telegram поддержка
            </Link>
            .
          </p>
        </div>
      ) : null}

      {orderId && !loading && !err && fields.length === 0 ? (
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          Дополнительных данных для этого заказа не требуется. Статус смотрите в личном кабинете или
          напишите в{" "}
          <Link
            href={TG_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            поддержку
          </Link>
          .
        </p>
      ) : null}

      {!orderId ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Поддержка:{" "}
          <Link
            href={TG_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            Telegram-поддержка
          </Link>
          .
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "inline-flex cursor-pointer")}>
          Мои покупки и статус
        </Link>
        <Link href="/catalog" className={cn(buttonVariants(), "inline-flex cursor-pointer")}>
          В каталог
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
          Загрузка…
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
