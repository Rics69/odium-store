export type ProductImage = { id: string; url: string; sort_order: number };
export type ProductInputField = {
  id: string;
  field_key: string;
  label: string;
  field_type: "text" | "email" | "password";
  required: boolean;
  placeholder: string | null;
  sort_order: number;
};

export type ProductCardT = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string | number;
  old_price: string | number | null;
  fulfillment: "manual" | "automated";
  purchase_count: number;
  review_count?: number;
  average_rating?: number | null;
  images: ProductImage[];
};

export type AccordionSectionT = {
  title: string;
  content: string;
};

export type PricingVariantT = {
  label: string;
  price: string | number;
  old_price?: string | number | null;
};

export type ProductPostPaymentFieldT = {
  field_key: string;
  label: string;
  field_type: "text" | "email" | "password";
  required: boolean;
  placeholder: string | null;
  sort_order: number;
};

export type ProductDetailT = ProductCardT & {
  product_type?: "standard" | "steam_topup";
  steam_commission_percent?: string | number;
  steam_usd_to_rub?: string | number;
  steam_kzt_to_rub?: string | number;
  input_fields: ProductInputField[];
  is_published: boolean;
  is_active: boolean;
  homepage_section_slugs: string[];
  instruction_title: string;
  instruction_body: string;
  faq_sections: AccordionSectionT[];
  pricing_variants: PricingVariantT[];
  post_payment_fields: ProductPostPaymentFieldT[];
};

export type OrderSuccessPayloadT = {
  id: string;
  product_title: string;
  status?: string;
  status_display?: string;
  post_payment_fields: ProductPostPaymentFieldT[];
  post_payment_already_submitted?: boolean;
};

export type OrderRepeatDataT = {
  product_slug: string;
  product_title: string;
  product_type: "standard" | "steam_topup";
  product_is_available: boolean;
  variant_label: string | null;
  steam_deposit_amount: string | number | null;
  steam_deposit_currency: "rub" | "kzt" | "usd" | null;
  fields: { field_key: string; value: string }[];
  estimated_price: string | number;
};
export type UserMe = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
};
