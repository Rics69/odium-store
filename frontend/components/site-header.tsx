import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api-server";
import type { UserMe } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { siteContainerClass } from "@/lib/site-layout";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search-bar";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserCircleIcon } from "@heroicons/react/24/outline";

async function getUser(): Promise<UserMe | null> {
  try {
    return await apiFetch<UserMe>("/v1/users/me");
  } catch {
    return null;
  }
}

export async function SiteHeader() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/55">
      <div className={cn(siteContainerClass, "flex flex-col gap-3 py-3.5 md:flex-row md:items-center md:justify-between")}>
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5"
            aria-label="Odium — главная"
          >
            <Image
              src="/logo-odium.svg"
              alt=""
              width={32}
              height={32}
              priority
              className="logo-adaptive transition-transform group-hover:scale-105"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight">
                odium
              </span>
              <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                подписки · пополнения
              </span>
            </span>
          </Link>
          <SiteNav />
        </div>
        <div className="flex flex-1 flex-col gap-2 md:max-w-lg md:flex-row md:items-center md:justify-end">
          <SearchBar className="w-full md:max-w-sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Админ
                  </Link>
                )}
                <Link
                  href="/account"
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  <UserCircleIcon className="mr-1 size-4" />
                  Кабинет
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Вход
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
