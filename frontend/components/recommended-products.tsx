"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { productGridClass } from "@/lib/site-layout";
import type { ProductCardT } from "@/lib/types";

function useVisibleCount() {
  const [visible, setVisible] = useState(4);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1536) setVisible(5);
      else if (window.innerWidth >= 1280) setVisible(4);
      else if (window.innerWidth >= 1024) setVisible(3);
      else if (window.innerWidth >= 640) setVisible(2);
      else setVisible(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return visible;
}

export function RecommendedProducts({ products }: { products: ProductCardT[] }) {
  const visible = useVisibleCount();
  const [index, setIndex] = useState(0);
  const n = products.length;

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, n - visible)));
  }, [n, visible]);

  const maxIndex = useMemo(() => Math.max(0, n - visible), [n, visible]);
  const canPrev = index > 0;
  const canNext = index < maxIndex;
  const slidePct = 100 / visible;

  if (n === 0) return null;

  if (n <= visible) {
    return (
      <section className="mt-20 space-y-6 border-t border-border/60 pt-12">
        <SectionHeading
          eyebrow="рекомендуем"
          title="Также берут"
          description="Подборка из раздела «Лучшие товары»."
        />
        <div className={productGridClass}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20 space-y-6 border-t border-border/60 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="рекомендуем"
          title="Также берут"
          description="Подборка из раздела «Лучшие товары»."
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={!canPrev}
            aria-label="Предыдущие товары"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
          <span className="text-muted-foreground min-w-[4rem] text-center text-sm tabular-nums">
            {index + 1} / {maxIndex + 1}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={!canNext}
            aria-label="Следующие товары"
            onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
          >
            <ChevronRightIcon className="size-5" />
          </Button>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * slidePct}%)` }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="box-border shrink-0 grow-0 px-1.5"
              style={{ width: `${slidePct}%` }}
            >
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
