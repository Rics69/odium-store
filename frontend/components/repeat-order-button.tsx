"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import type { OrderRepeatDataT } from "@/lib/types";

const CURRENCY_LABEL: Record<NonNullable<OrderRepeatDataT["steam_deposit_currency"]>, string> = {
  rub: "₽",
  kzt: "₸",
  usd: "$",
};

function formatRub(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function RepeatOrderButton({
  orderId,
  productTitle,
  variantLabel,
}: {
  orderId: string;
  productTitle: string;
  variantLabel?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OrderRepeatDataT | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function openDialog() {
    setOpen(true);
    setErr(null);
    if (data) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/repeat-data`, {
        cache: "no-store",
      });
      const payload = await readJsonSafe<OrderRepeatDataT & { detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      if (!payload) throw new Error("Не удалось получить данные заказа");
      setData(payload);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function confirmRepeat() {
    if (!data) return;
    if (!data.product_is_available) {
      toast.error("Этот товар сейчас недоступен.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        product_slug: data.product_slug,
        fields: data.fields,
      };
      if (data.product_type === "steam_topup") {
        if (data.steam_deposit_amount != null) {
          body.steam_deposit_amount = data.steam_deposit_amount;
        }
        if (data.steam_deposit_currency) {
          body.steam_deposit_currency = data.steam_deposit_currency;
        }
      } else if (data.variant_label) {
        body.variant_label = data.variant_label;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await readJsonSafe<{ id?: string; detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      const oid =
        payload && typeof payload.id === "string" ? payload.id.trim() : "";
      if (!oid) throw new Error("Сервер не вернул номер заказа");
      toast.success("Заказ повторён — переходим к оплате");
      setOpen(false);
      router.push(`/payment/success?order_id=${encodeURIComponent(oid)}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="cursor-pointer gap-1.5"
        onClick={() => void openDialog()}
        aria-label={`Повторить покупку: ${productTitle}`}
      >
        <ArrowPathIcon aria-hidden className="size-3.5" />
        Повторить
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Повторить покупку?
            </DialogTitle>
            <DialogDescription>
              Создадим новый заказ с теми же параметрами и отправим вас на страницу оплаты.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-muted-foreground text-sm">Загрузка данных…</p>
          ) : err ? (
            <p className="text-destructive text-sm">{err}</p>
          ) : data ? (
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  товар
                </span>
                <span className="font-medium text-right">{data.product_title}</span>
              </div>
              {data.variant_label ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    тариф
                  </span>
                  <span className="text-right">{data.variant_label}</span>
                </div>
              ) : null}
              {data.product_type === "steam_topup" && data.steam_deposit_amount != null ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    пополнение
                  </span>
                  <span className="text-right">
                    {data.steam_deposit_amount}{" "}
                    {data.steam_deposit_currency
                      ? CURRENCY_LABEL[data.steam_deposit_currency]
                      : ""}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  к оплате
                </span>
                <span className="font-display text-xl font-semibold tabular-nums">
                  {formatRub(data.estimated_price)}
                </span>
              </div>
              {!data.product_is_available ? (
                <p className="text-destructive text-xs">
                  Товар сейчас снят с продажи — повтор недоступен.
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => void confirmRepeat()}
              disabled={
                submitting ||
                loading ||
                !data ||
                !data.product_is_available
              }
            >
              {submitting ? "Оформляем…" : "Подтвердить и оплатить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RepeatOrderButton;
