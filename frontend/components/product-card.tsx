import Image from "next/image";
import Link from "next/link";
import { StarRatingDisplay } from "@/components/star-rating";
import type { ProductCardT } from "@/lib/types";

function formatPrice(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardT;
  compact?: boolean;
}) {
  const img = product.images[0]?.url;
  const manual = product.fulfillment === "manual";
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const rc = product.review_count ?? 0;
  const avg = product.average_rating;

  return (
    <article className="card-lift group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 hover:border-primary/50 hover:shadow-[0_18px_40px_-20px_oklch(0.88_0.215_138_/_0.4)]">
      <Link
        href={href}
        prefetch
        className="flex h-full min-h-0 flex-col rounded-[inherit] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div
          className={
            compact
              ? "relative aspect-[5/3] w-full shrink-0 overflow-hidden bg-muted"
              : "relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted"
          }
        >
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              unoptimized={img.startsWith("http")}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/80 px-4 text-center text-xs text-muted-foreground">
              Нет изображения
            </div>
          )}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur " +
                (manual
                  ? "bg-background/70 text-foreground ring-1 ring-border"
                  : "bg-primary/15 text-primary ring-1 ring-primary/30")
              }
            >
              <span aria-hidden className="inline-block size-1 rounded-full bg-current" />
              {manual ? "ручная" : "авто"}
            </span>
            {manual && !compact ? (
              <span className="inline-flex items-center rounded-full bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border backdrop-blur">
                10м · 6ч
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={
            compact
              ? "flex min-h-0 flex-1 flex-col gap-2 p-4"
              : "flex min-h-0 flex-1 flex-col gap-3 p-5"
          }
        >
          <h3
            className={
              compact
                ? "line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight"
                : "line-clamp-2 font-display text-xl font-semibold leading-snug tracking-tight"
            }
          >
            {product.title}
          </h3>

          <p
            className={
              compact
                ? "text-muted-foreground line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed"
                : "text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed"
            }
          >
            {product.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {rc > 0 && avg != null ? (
              <>
                <StarRatingDisplay rating={Math.round(Number(avg))} size="sm" />
                <span className="font-mono text-xs text-muted-foreground">
                  {Number(avg).toFixed(1)} · {rc} отз.
                </span>
              </>
            ) : (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                нет отзывов
              </span>
            )}
          </div>

          <div
            className={
              compact
                ? "mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-border/60 pt-3"
                : "mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-border/60 pt-4"
            }
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={
                  compact
                    ? "font-display text-lg font-semibold tabular-nums"
                    : "font-display text-2xl font-semibold tabular-nums"
                }
              >
                {formatPrice(product.price)}
              </span>
              {product.old_price ? (
                <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                  {formatPrice(product.old_price)}
                </span>
              ) : null}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {product.purchase_count}× куплено
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
