import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-server";
import type { ProductDetailT } from "@/lib/types";
import { EditProductForm } from "./form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const product = await apiFetch<ProductDetailT>(`/v1/admin/products/${id}`);
    return <EditProductForm product={product} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    const msg =
      e instanceof ApiError
        ? e.status === 401
          ? "API вернул 401 — чаще всего JWT_SECRET во frontend и backend не совпадает. Выровняйте .env, перезапустите сервисы и войдите снова."
          : `HTTP ${e.status}: ${e.message.slice(0, 600)}`
        : (e as Error).message;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Товар не загрузился для редактирования</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{msg}</AlertDescription>
        </Alert>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
          К списку товаров
        </Link>
      </div>
    );
  }
}
