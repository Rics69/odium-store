import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api-server";
import type { ProductDetailT } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata = { title: "Админ — товары" };

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  let items: ProductDetailT[] = [];
  let loadError: string | null = null;
  try {
    items = await apiFetch<ProductDetailT[]>("/v1/admin/products");
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) {
        loadError =
          "API вернул 401: сессия не принята бэкендом. Чаще всего в frontend/.env.local и backend/.env разные значения JWT_SECRET — они должны совпадать.";
      } else {
        loadError = `Ошибка загрузки (HTTP ${e.status}): ${e.message.slice(0, 500)}`;
      }
    } else {
      loadError = (e as Error).message;
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Товары</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/sections"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Секции главной
          </Link>
          <Link
            href="/admin/products/new"
            className={cn(buttonVariants(), "inline-flex")}
          >
            Новый товар
          </Link>
        </div>
      </div>
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Не удалось загрузить список товаров</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{loadError}</AlertDescription>
        </Alert>
      ) : null}
      {!loadError && items.length === 0 ? (
        <p className="text-muted-foreground">Пока пусто — создайте первый товар.</p>
      ) : null}
      {!loadError && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Выдача</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.title}</TableCell>
                <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                <TableCell>
                  {!p.is_active ? (
                    <Badge variant="outline">Неактивен</Badge>
                  ) : p.is_published ? (
                    <Badge>На сайте</Badge>
                  ) : (
                    <Badge variant="secondary">Черновик</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {p.fulfillment === "manual" ? (
                    <Badge variant="outline">Ручное</Badge>
                  ) : (
                    <Badge variant="outline">Авто</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link
                    href={`/product/${encodeURIComponent(p.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "inline-flex text-muted-foreground"
                    )}
                  >
                    Превью
                  </Link>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "inline-flex"
                    )}
                  >
                    Изменить
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
