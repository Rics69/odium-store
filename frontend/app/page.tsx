import Link from "next/link";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api-server";
import { HomeHero } from "@/components/home-hero";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import type { ProductCardT } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { productGridClass } from "@/lib/site-layout";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
  products: ProductCardT[];
};

async function getSections(): Promise<Section[]> {
  try {
    const data = await apiFetch<{ sections: Section[] }>("/v1/home/sections");
    return data.sections;
  } catch {
    return [];
  }
}

async function getFeatured(): Promise<ProductCardT[]> {
  try {
    return await apiFetch<ProductCardT[]>("/v1/products?limit=8");
  } catch {
    return [];
  }
}

async function searchProducts(q: string): Promise<ProductCardT[]> {
  if (!q.trim()) return [];
  try {
    const data = await apiFetch<{ items: ProductCardT[] }>(
      `/v1/search?q=${encodeURIComponent(q)}`
    );
    return data.items;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  if (q) {
    return {
      title: `Поиск: ${q}`,
      description: `Результаты поиска по «${q}» в каталоге Odium — подписки и пополнения.`,
      alternates: { canonical: `/?q=${encodeURIComponent(q)}` },
      robots: { index: false, follow: true },
    };
  }
  return {
    title: "Odium — зарубежные подписки и пополнения из СНГ",
    description:
      "Оплата ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и других сервисов без иностранных карт. Прозрачные цены и поддержка в Telegram.",
    alternates: { canonical: "/" },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const [sections, featured, results] = await Promise.all([
    getSections(),
    getFeatured(),
    searchProducts(q),
  ]);

  const gridClass = productGridClass;

  return (
    <div className="space-y-16 md:space-y-20">
      <HomeHero />

      {q ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="поиск"
            title={`Результаты: «${q}»`}
            description={
              results.length === 0
                ? "Ничего не нашли — попробуйте другой запрос."
                : `Найдено: ${results.length}`
            }
          />
          {results.length > 0 ? (
            <div className={gridClass}>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!q &&
        sections.map((s, idx) => (
          <section key={s.id} className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow={`раздел ${String(idx + 1).padStart(2, "0")}`}
                title={s.title}
              />
              <Link
                href="/catalog"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Все товары →
              </Link>
            </div>
            {s.products.length === 0 ? (
              <p className="text-muted-foreground text-sm">Секция пуста.</p>
            ) : (
              <div className={gridClass}>
                {s.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        ))}

      {!q && (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="каталог"
            title="Ещё из ассортимента"
            description="Все опубликованные позиции. Оформление — на странице товара."
          />
          <div className={gridClass}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
