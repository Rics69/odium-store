"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import type { ProductDetailT } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  draftsFromPostPaymentFields,
  draftsFromProductFields,
  draftsToPayload,
  DraftInputField,
  InputFieldsBuilder,
} from "@/components/admin/input-fields-builder";
import { HomepageSectionsField } from "@/components/admin/homepage-sections-field";
import { SteamProductFields } from "@/components/admin/steam-product-fields";
import {
  AccordionSectionsField,
  DraftAccordionSection,
  DraftPricingVariant,
  accordionDraftsFromApi,
  accordionDraftsToPayload,
  variantDraftsFromApi,
  variantsDraftsToPayload,
  PricingVariantsField,
} from "@/components/admin/product-extras-fields";

export function EditProductForm({ product }: { product: ProductDetailT }) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [sectionSlugs, setSectionSlugs] = useState<string[]>(
    () => product.homepage_section_slugs ?? []
  );
  const [inputDrafts, setInputDrafts] = useState<DraftInputField[]>(() =>
    draftsFromProductFields(product.input_fields)
  );
  const [postPayDrafts, setPostPayDrafts] = useState<DraftInputField[]>(() =>
    draftsFromPostPaymentFields(product.post_payment_fields ?? [])
  );
  const [faqDrafts, setFaqDrafts] = useState<DraftAccordionSection[]>(() =>
    accordionDraftsFromApi(product.faq_sections ?? [])
  );
  const [variantDrafts, setVariantDrafts] = useState<DraftPricingVariant[]>(() =>
    variantDraftsFromApi(product.pricing_variants ?? [])
  );
  const [productType, setProductType] = useState<"standard" | "steam_topup">(
    () => product.product_type ?? "standard"
  );
  const [steamCommission, setSteamCommission] = useState(() =>
    String(product.steam_commission_percent ?? 20)
  );
  const [steamUsdToRub, setSteamUsdToRub] = useState(() =>
    String(product.steam_usd_to_rub ?? 92)
  );
  const [steamKztToRub, setSteamKztToRub] = useState(() =>
    String(product.steam_kzt_to_rub ?? 0.2)
  );
  const [removing, setRemoving] = useState(false);

  async function deleteProduct() {
    if (
      !confirm(
        "Снять товар с продажи? Он пропадёт с сайта, купить его будет нельзя. Карточка останется в админке как неактивная."
      )
    )
      return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const payload = await readJsonSafe<{ detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      toast.success("Товар снят с продажи");
      router.replace("/admin");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemoving(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title"));
    const slug = String(fd.get("slug") || "").trim();
    const description = String(fd.get("description") || "");
    const price = Number(fd.get("price"));
    const old_price_raw = String(fd.get("old_price") || "").trim();
    const fulfillment = String(fd.get("fulfillment"));
    const is_active = fd.get("is_active") === "on";
    const is_published = fd.get("is_published") === "on";
    const image_urls = String(fd.get("image_urls") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const resolved = draftsToPayload(inputDrafts);
    if (!resolved.ok) {
      toast.error(resolved.detail);
      return;
    }

    const vf = variantsDraftsToPayload(variantDrafts);
    if (!vf.ok) {
      toast.error(vf.detail);
      return;
    }

    const pp = draftsToPayload(postPayDrafts);
    if (!pp.ok) {
      toast.error(pp.detail);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const instruction_title = String(fd.get("instruction_title") || "");
      const instruction_body = String(fd.get("instruction_body") || "");
      const faq_sections = accordionDraftsToPayload(faqDrafts);
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          title,
          slug,
          description,
          price,
          old_price: old_price_raw ? Number(old_price_raw) : null,
          fulfillment,
          product_type: productType,
          steam_commission_percent: Number(steamCommission) || 20,
          steam_usd_to_rub: Number(steamUsdToRub) || 92,
          steam_kzt_to_rub: Number(steamKztToRub) || 0.2,
          is_active,
          is_published,
          image_urls,
          input_fields: resolved.input_fields,
          homepage_section_slugs: sectionSlugs,
          instruction_title,
          instruction_body,
          faq_sections,
          pricing_variants: vf.variants,
          post_payment_fields: pp.input_fields,
        }),
      });
      const payload = await readJsonSafe<{ detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      toast.success("Сохранено");
      router.replace("/admin");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">Редактирование товара</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/product/${encodeURIComponent(product.slug)}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть на сайте
          </Link>
          {product.is_active ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={removing || loading}
              onClick={() => deleteProduct()}
            >
              {removing ? "Снимаем…" : "Снять с продажи"}
            </Button>
          ) : (
            <span className="text-muted-foreground max-w-[220px] text-xs leading-snug">
              Неактивен: верните галочку «Активен для продажи» ниже и сохраните.
            </span>
          )}
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Название</Label>
          <Input id="title" name="title" required defaultValue={product.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={product.slug} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" name="description" rows={5} defaultValue={product.description} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Цена</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              required
              defaultValue={String(product.price)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="old_price">Старая цена</Label>
            <Input
              id="old_price"
              name="old_price"
              type="number"
              step="0.01"
              defaultValue={product.old_price != null ? String(product.old_price) : ""}
            />
          </div>
        </div>
        <SteamProductFields
          productType={productType}
          onProductTypeChange={setProductType}
          commission={steamCommission}
          onCommissionChange={setSteamCommission}
          usdToRub={steamUsdToRub}
          onUsdToRubChange={setSteamUsdToRub}
          kztToRub={steamKztToRub}
          onKztToRubChange={setSteamKztToRub}
        />
        <div className="space-y-2">
          <Label htmlFor="fulfillment">Выдача</Label>
          <select
            id="fulfillment"
            name="fulfillment"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            defaultValue={product.fulfillment}
          >
            <option value="automated">Автоматически</option>
            <option value="manual">Ручная (10 мин — 6 ч)</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            defaultChecked={product.is_active}
            className="h-4 w-4 rounded border"
          />
          <div>
            <Label htmlFor="is_active" className="cursor-pointer">
              Активен для продажи
            </Label>
            <p className="text-muted-foreground text-xs">
              Если снять — товар скроется с витрины, заказать его нельзя. Карточка остаётся в админке внизу
              списка.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            defaultChecked={product.is_published}
            className="h-4 w-4 rounded border"
          />
          <div>
            <Label htmlFor="is_published" className="cursor-pointer">
              Опубликован на сайте
            </Label>
            <p className="text-muted-foreground text-xs">
              На витрине карточка видна только при включённой опции «Активен для продажи». Черновик можно
              открыть администратору по прямой ссылке (предпросмотр).
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image_urls">Изображения (URL, по одному в строке)</Label>
          <Textarea
            id="image_urls"
            name="image_urls"
            rows={4}
            defaultValue={product.images.map((i) => i.url).join("\n")}
          />
          <p className="text-muted-foreground text-xs">
            Для картинок с этого же приложения можно указать{' '}
            <code className="rounded bg-muted px-1">/logo-odium.svg</code> или файл из вашего CDN.
          </p>
        </div>
        <HomepageSectionsField value={sectionSlugs} onChange={setSectionSlugs} />
        <InputFieldsBuilder value={inputDrafts} onChange={setInputDrafts} />
        <InputFieldsBuilder
          heading="Поля после успешной оплаты"
          hint="Страница «Спасибо за покупку»: локальные поля только в браузере, на сервер не отправляются."
          value={postPayDrafts}
          onChange={setPostPayDrafts}
        />
        <div className="space-y-10 border-t pt-8">
          <div className="space-y-4">
            <Label className="text-base">Инструкция на странице товара</Label>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Обычный текст (без аккордеона). Аккордеон доступен только в блоке FAQ ниже.
            </p>
            <div className="space-y-2">
              <Label htmlFor="instruction_title">Заголовок</Label>
              <Input
                id="instruction_title"
                name="instruction_title"
                defaultValue={product.instruction_title ?? ""}
                placeholder="Например: После оплаты"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instruction_body">Текст</Label>
              <Textarea
                id="instruction_body"
                name="instruction_body"
                rows={8}
                defaultValue={product.instruction_body ?? ""}
              />
            </div>
          </div>
          <AccordionSectionsField
            label="FAQ (аккордеон)"
            hint="Вопросы и ответы на вкладке «FAQ»."
            value={faqDrafts}
            onChange={setFaqDrafts}
          />
          <PricingVariantsField value={variantDrafts} onChange={setVariantDrafts} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Сохраняем…" : "Сохранить изменения"}
        </Button>
      </form>
    </div>
  );
}
