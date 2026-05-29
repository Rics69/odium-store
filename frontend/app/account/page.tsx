import Link from "next/link";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api-server";
import type { UserMe } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountOrders } from "@/components/account-orders";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { DisplayNameForm, AvatarForm } from "./client-forms";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description:
    "Личный кабинет Odium: ваши покупки, статусы заказов и настройки профиля.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

type OrderRow = {
  id: string;
  product_title: string;
  product_slug: string;
  status: string;
  status_display?: string;
  price_at_purchase: string | number;
  variant_label?: string | null;
};

export default async function AccountPage() {
  let user: UserMe | null = null;
  let orders: OrderRow[] = [];
  try {
    user = await apiFetch<UserMe>("/v1/users/me");
  } catch {
    user = null;
  }
  if (user) {
    try {
      orders = await apiFetch<OrderRow[]>("/v1/users/me/orders");
    } catch {
      orders = [];
    }
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p>Необходимо войти.</p>
        <Link
          href="/login"
          className={cn(buttonVariants(), "inline-flex")}
        >
          Вход
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/50">
        <div className="bg-grid absolute pointer-events-none" aria-hidden />
        <div className="flex flex-col gap-8 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
          <div className="flex items-center gap-5">
            <div className="relative size-20 overflow-hidden rounded-full border border-primary/40 bg-muted shadow-[0_0_0_4px_oklch(0.88_0.215_138_/_0.12)]">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  нет фото
                </div>
              )}
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                личный кабинет
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                {user.display_name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DisplayNameForm defaultName={user.display_name} />
            <AvatarForm />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              мои покупки
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight">История заказов</h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            обновление каждые 8с
          </p>
        </div>
        <AccountOrders initialOrders={orders} />
      </section>
    </div>
  );
}
