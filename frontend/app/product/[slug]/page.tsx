import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-server";
import type { ProductCardT, ProductDetailT, UserMe } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ProductInfoTabs } from "@/components/product-info-tabs";
import { ProductPurchase } from "@/components/product-purchase";
import { RecommendedProducts } from "@/components/recommended-products";
import { ReviewSection } from "@/components/review-section";
import { SteamTopupPurchase } from "@/components/steam-topup-purchase";
import { StarRatingDisplay } from "@/components/star-rating";

export const dynamic = "force-dynamic";

function trimDescription(text: string, max = 160): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let product: ProductDetailT | null = null;
  try {
    product = await apiFetch<ProductDetailT>(
      `/v1/products/${encodeURIComponent(slug)}`
    );
  } catch {
    product = null;
  }
  if (!product) {
    return {
      title: "Товар не найден",
      robots: { index: false, follow: true },
    };
  }

  const desc =
    trimDescription(product.description) ||
    `${product.title} — оформление и оплата на Odium без иностранных карт.`;
  const img = product.images[0]?.url;
  const canonical = `/product/${encodeURIComponent(product.slug)}`;

  return {
    title: product.title,
    description: desc,
    keywords: [product.title, "Odium", "подписка", "оплата", "СНГ"],
    alternates: { canonical },
    openGraph: {
      title: `${product.title} · Odium`,
      description: desc,
      type: "website",
      url: canonical,
      images: img ? [{ url: img, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} · Odium`,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

type ReviewRead = {
  id: string;
  rating: number;
  text: string;
  tags?: string[];
  created_at: string;
  display_name: string;
  avatar_url: string | null;
};

async function loadProduct(slug: string): Promise<ProductDetailT> {
  try {
    return await apiFetch<ProductDetailT>(`/v1/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    throw e;
  }
}

async function getReviews(slug: string): Promise<ReviewRead[]> {
  try {
    return await apiFetch<ReviewRead[]>(
      `/v1/products/${encodeURIComponent(slug)}/reviews`
    );
  } catch {
    return [];
  }
}

async function getMe(): Promise<UserMe | null> {
  try {
    return await apiFetch<UserMe>("/v1/users/me");
  } catch {
    return null;
  }
}

async function getRecommended(slug: string): Promise<ProductCardT[]> {
  try {
    return await apiFetch<ProductCardT[]>(
      `/v1/products/${encodeURIComponent(slug)}/recommended`
    );
  } catch {
    return [];
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, reviews, me, recommended] = await Promise.all([
    loadProduct(slug),
    getReviews(slug),
    getMe(),
    getRecommended(slug),
  ]);
  const manual = product.fulfillment === "manual";
  const isSteamTopup = product.product_type === "steam_topup";
  const mainImage = product.images[0]?.url;
  const imageUnoptimized =
    !mainImage ||
    mainImage.startsWith("http") ||
    mainImage.startsWith("//");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: trimDescription(product.description, 300) || product.title,
    image: mainImage ? [mainImage] : undefined,
    brand: { "@type": "Brand", name: "Odium" },
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: String(product.price ?? "0"),
      availability: product.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      (product.review_count ?? 0) > 0 && product.average_rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.average_rating).toFixed(1),
            reviewCount: product.review_count ?? 0,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="breadcrumbs"
        className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          главная
        </Link>
        <span aria-hidden>/</span>
        <Link href="/catalog" className="hover:text-foreground">
          каталог
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-foreground">{product.title}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/70 bg-card/60">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                className="object-cover"
                priority
                unoptimized={imageUnoptimized}
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        </div>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={manual ? "secondary" : "default"}>
            {manual ? "Ручная выдача" : "Автоматически"}
          </Badge>
          {manual ? (
            <Badge variant="outline">Время услуги: от 10 минут до 6 часов</Badge>
          ) : null}
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {product.title}
        </h1>
        {(product.review_count ?? 0) > 0 && product.average_rating != null ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StarRatingDisplay rating={Math.round(Number(product.average_rating))} />
            <span className="font-mono text-xs text-muted-foreground">
              {Number(product.average_rating).toFixed(1)} · {product.review_count ?? 0} отз.
            </span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>{product.purchase_count}× куплено</span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{product.description}</p>
        {isSteamTopup ? (
          <SteamTopupPurchase product={product} isLoggedIn={!!me} />
        ) : (
          <ProductPurchase product={product} isLoggedIn={!!me} />
        )}
        <ReviewSection
          slug={slug}
          initialReviews={reviews}
          isLoggedIn={!!me}
          canReview={!!me}
          isAdmin={me?.role === "admin"}
        />
      </div>
    </div>
    <ProductInfoTabs
      instructionTitle={product.instruction_title ?? ""}
      instructionBody={product.instruction_body ?? ""}
      faq={product.faq_sections ?? []}
    />
    <RecommendedProducts products={recommended} />
    </>
  );
}
