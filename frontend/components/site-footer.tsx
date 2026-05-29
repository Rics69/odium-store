import Image from "next/image";
import Link from "next/link";
import { LEGAL_DOCS, TG_SUPPORT_URL } from "@/lib/legal-links";
import { siteContainerClass } from "@/lib/site-layout";
import { cn } from "@/lib/utils";

function PdfLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </a>
  );
}

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className={cn(siteContainerClass, "py-12")}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/logo-odium.svg"
                alt=""
                width={32}
                height={32}
                className="logo-adaptive"
              />
              <span className="font-display text-lg font-bold tracking-tight">odium</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Простой способ оплачивать зарубежные подписки из стран СНГ — без иностранных
              карт, сложных схем и лишних комиссий.
            </p>
            <div className="space-y-1 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <p className="text-foreground/80">Клементьев Данил Сергеевич</p>
              <p>ИНН · 165722004452</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Навигация
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/catalog" className="text-muted-foreground hover:text-foreground">
                Каталог
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                FAQ
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                О нас
              </Link>
              <a
                href={TG_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                Поддержка в Telegram
              </a>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Документы
            </p>
            <div className="flex flex-col gap-2">
              <PdfLink href={LEGAL_DOCS.privacy.href} label={LEGAL_DOCS.privacy.label} />
              <PdfLink href={LEGAL_DOCS.userAgreement.href} label={LEGAL_DOCS.userAgreement.label} />
              <PdfLink href={LEGAL_DOCS.personalData.href} label={LEGAL_DOCS.personalData.label} />
              <PdfLink href={LEGAL_DOCS.cookies.href} label={LEGAL_DOCS.cookies.label} />
            </div>
          </div>
        </div>

        <div className="hairline mt-10 h-px" aria-hidden />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>© {YEAR} odium · все права защищены</span>
          <span className="text-primary">made in СНГ</span>
        </div>
      </div>
    </footer>
  );
}
