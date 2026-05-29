import type { Metadata } from "next";
import { apiFetch } from "@/lib/api-server";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { productGridClass } from "@/lib/site-layout";
import type { ProductCardT } from "@/lib/types";

export const metadata: Metadata = {
  title: "Каталог подписок и пополнений",
  description:
    "Полный каталог Odium: подписки ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и других зарубежных сервисов.",
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Каталог Odium",
    description:
      "Все доступные подписки и пополнения в одном месте — без иностранных карт.",
    url: "/catalog",
  },
};

export default async function CatalogPage() {
  let items: ProductCardT[] = [];
  try {
    items = await apiFetch<ProductCardT[]>("/v1/products?limit=100");
  } catch {
    items = [];
  }
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="каталог"
        title="Все подписки и пополнения"
        description={`Опубликованных позиций: ${items.length}. Подробности и оформление — на странице товара.`}
      />
      {items.length === 0 ? (
        <p className="text-muted-foreground">Пока нет опубликованных товаров.</p>
      ) : (
        <div className={productGridClass}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
