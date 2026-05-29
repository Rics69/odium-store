"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import { RepeatOrderButton } from "@/components/repeat-order-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrderRow = {
  id: string;
  product_title: string;
  product_slug: string;
  status: string;
  status_display?: string;
  price_at_purchase: string | number;
  variant_label?: string | null;
};

function formatPrice(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusPill({ status, label }: { status: string; label: string }) {
  let toneClass = "bg-muted text-muted-foreground ring-border";
  if (status === "fulfilled") {
    toneClass = "bg-primary/10 text-primary ring-primary/30";
  } else if (status === "cancelled") {
    toneClass = "bg-destructive/15 text-destructive ring-destructive/30";
  } else if (status === "processing") {
    toneClass = "bg-amber-500/10 text-amber-400 ring-amber-500/30";
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ring-1 ${toneClass}`}
    >
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function AccountOrders({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/orders", { cache: "no-store" });
      const data = await readJsonSafe<OrderRow[] | { detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(data ?? {}));
      if (Array.isArray(data)) {
        setOrders((prev) => {
          const changed =
            prev.length !== data.length ||
            prev.some(
              (o, i) => data[i]?.id !== o.id || data[i]?.status !== o.status
            );
          if (changed && typeof console !== "undefined") {
            console.info(
              "[orders] статусы обновлены",
              data.map((o) => ({ id: o.id, status: o.status }))
            );
          }
          return data;
        });
      }
    } catch (e) {
      if (typeof console !== "undefined") {
        console.warn("[orders] не удалось обновить список", e);
      }
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 8000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Покупок пока нет. Загляните в{" "}
          <Link href="/catalog" className="text-foreground underline underline-offset-2">
            каталог
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Тариф</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead className="text-right">Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  className="font-medium underline-offset-2 hover:underline"
                  href={`/product/${o.product_slug}`}
                >
                  {o.product_title}
                </Link>
              </TableCell>
              <TableCell>
                <StatusPill
                  status={o.status}
                  label={o.status_display ?? o.status}
                />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {o.variant_label?.trim() ? o.variant_label : "—"}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatPrice(o.price_at_purchase)}
              </TableCell>
              <TableCell className="text-right">
                <RepeatOrderButton
                  orderId={o.id}
                  productTitle={o.product_title}
                  variantLabel={o.variant_label}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
