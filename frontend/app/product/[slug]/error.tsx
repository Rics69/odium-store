"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

import { cn } from "@/lib/utils";

export default function ProductErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-card p-6">
      <h1 className="text-xl font-semibold">Товар не загрузился</h1>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        Не удалось открыть страницу товара. Попробуйте обновить страницу или вернитесь в каталог.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Повторить
        </Button>
        <Link
          href="/catalog"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          В каталог
        </Link>
      </div>
    </div>
  );
}
