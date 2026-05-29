"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DraftInputField,
  draftsToPayload,
  InputFieldsBuilder,
} from "@/components/admin/input-fields-builder";
import { HomepageSectionsField } from "@/components/admin/homepage-sections-field";
import { SteamProductFields } from "@/components/admin/steam-product-fields";
import {
  AccordionSectionsField,
  DraftAccordionSection,
  DraftPricingVariant,
  accordionDraftsToPayload,
  variantsDraftsToPayload,
  PricingVariantsField,
} from "@/components/admin/product-extras-fields";

export default function NewProductPage() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [sectionSlugs, setSectionSlugs] = useState<string[]>([]);
  const [inputDrafts, setInputDrafts] = useState<DraftInputField[]>([]);
  const [faqDrafts, setFaqDrafts] = useState<DraftAccordionSection[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<DraftPricingVariant[]>([]);
  const [postPayDrafts, setPostPayDrafts] = useState<DraftInputField[]>([]);
  const [productType, setProductType] = useState<"standard" | "steam_topup">("standard");
  const [steamCommission, setSteamCommission] = useState("20");
  const [steamUsdToRub, setSteamUsdToRub] = useState("92");
  const [steamKztToRub, setSteamKztToRub] = useState("0.2");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title"));
    const slug = String(fd.get("slug") || "").trim() || undefined;
    const description = String(fd.get("description") || "");
    const price = Number(fd.get("price"));
    const old_price_raw = String(fd.get("old_price") || "").trim();
    const fulfillment = String(fd.get("fulfillment"));
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
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
      toast.success("Товар создан");
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
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin" className="text-muted-foreground text-sm underline hover:text-foreground">
          ← К списку
        </Link>
        <Link
          href="/admin/sections"
          className="text-muted-foreground text-sm underline hover:text-foreground"
        >
          Секции главной
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Новый товар</h1>
      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Название</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (пусто — из названия)</Label>
          <Input id="slug" name="slug" placeholder="spotify-premium" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" name="description" rows={5} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Цена</Label>
            <Input id="price" name="price" type="number" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="old_price">Старая цена</Label>
            <Input id="old_price" name="old_price" type="number" step="0.01" />
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
            defaultValue="automated"
          >
            <option value="automated">Автоматически</option>
            <option value="manual">Ручная (10 мин — 6 ч)</option>
          </select>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border"
          />
          <div>
            <Label htmlFor="is_published" className="cursor-pointer">
              Сразу опубликовать на сайте
            </Label>
            <p className="text-muted-foreground text-xs">
              Если снять, товар сохранится как черновик — позже включите публикацию в редактировании.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image_urls">Изображения (URL, по одному в строке)</Label>
          <Textarea
            id="image_urls"
            name="image_urls"
            rows={3}
            placeholder="/logo-odium.svg"
          />
          <p className="text-muted-foreground text-xs">
            Относительный путь ведёт к файлам из каталога <code className="rounded bg-muted px-1">public</code>.
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
              Обычный текст под заголовком «Инструкция»: без аккордеона (аккордеон только для FAQ).
            </p>
            <div className="space-y-2">
              <Label htmlFor="instruction_title">Заголовок</Label>
              <Input id="instruction_title" name="instruction_title" placeholder="Например: После оплаты" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instruction_body">Текст</Label>
              <Textarea id="instruction_body" name="instruction_body" rows={6} placeholder="" />
            </div>
          </div>
          <AccordionSectionsField
            label="FAQ (аккордеон)"
            hint="Вопрос и ответ. Вкладка «FAQ» на странице товара."
            value={faqDrafts}
            onChange={setFaqDrafts}
          />
          <PricingVariantsField value={variantDrafts} onChange={setVariantDrafts} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Создаём…" : "Создать товар"}
        </Button>
      </form>
    </div>
  );
}
