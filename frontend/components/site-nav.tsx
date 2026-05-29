"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/catalog", label: "Каталог" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "О нас" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-wrap items-center gap-1 text-sm", className)}>
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center rounded-full px-3 py-1.5 font-medium tracking-tight transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {item.label}
            {active ? (
              <span
                aria-hidden
                className="ml-2 inline-block size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
