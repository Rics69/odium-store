import type { Metadata } from "next";
import { apiFetch } from "@/lib/api-server";
import {
  CatalogFilters,
  type CatalogSectionOption,
} from "@/components/catalog-filters";
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

async function getSectionOptions(): Promise<CatalogSectionOption[]> {
  try {
    const data = await apiFetch<{ sections: CatalogSectionOption[] }>(
      "/v1/home/section-options"
    );
    return data.sections;
  } catch {
    return [];
  }
}

async function getProducts(q: string, section: string): Promise<ProductCardT[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (q) params.set("q", q);
  if (section) params.set("section", section);
  try {
    return await apiFetch<ProductCardT[]>(`/v1/products?${params.toString()}`);
  } catch {
    return [];
  }
}

function catalogDescription(
  count: number,
  q: string,
  section: string,
  sections: CatalogSectionOption[]
) {
  if (q && section) {
    const title = sections.find((s) => s.slug === section)?.title ?? section;
    return count === 0
      ? `По запросу «${q}» в разделе «${title}» ничего не найдено.`
      : `Найдено: ${count} — «${q}» в разделе «${title}».`;
  }
  if (q) {
    return count === 0
      ? `По запросу «${q}» ничего не найдено.`
      : `Найдено: ${count} по запросу «${q}».`;
  }
  if (section) {
    const title = sections.find((s) => s.slug === section)?.title ?? section;
    return count === 0
      ? `В разделе «${title}» пока нет товаров.`
      : `${count} поз. в разделе «${title}».`;
  }
  return `Опубликованных позиций: ${count}. Подробности и оформление — на странице товара.`;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; section?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const section = (sp.section ?? "").trim();

  const [sections, items] = await Promise.all([
    getSectionOptions(),
    getProducts(q, section),
  ]);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="каталог"
        title="Все подписки и пополнения"
        description={catalogDescription(items.length, q, section, sections)}
      />

      <CatalogFilters
        sections={sections}
        initialQ={q}
        initialSection={section}
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          {q || section
            ? "Попробуйте изменить запрос или выбрать другой раздел."
            : "Пока нет опубликованных товаров."}
        </p>
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
