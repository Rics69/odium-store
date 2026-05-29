"use client";

import Link from "next/link";
import { useCookieConsent } from "@/components/cookie-consent-context";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCS } from "@/lib/legal-links";

export function CookieConsentBanner() {
  const { ready, consent, accept, decline } = useCookieConsent();

  if (!ready || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Согласие на использование cookie"
      className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-primary/15 backdrop-blur-xl odium-fade-up"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
        cookie · согласие
      </p>
      <p className="mt-2 text-sm leading-snug">
        Мы используем cookie для работы сайта и сохранения настроек. Подробнее — в{" "}
        <Link
          href={LEGAL_DOCS.cookies.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-primary"
        >
          политике cookie
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="cursor-pointer" onClick={accept}>
          Согласен
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={decline}
        >
          Отказаться
        </Button>
      </div>
    </div>
  );
}
