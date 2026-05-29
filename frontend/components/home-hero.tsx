import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RollingText } from "@/components/rolling-text";
import { HeroBackdropIcons } from "@/components/hero-backdrop-icons";
import { HeroScrollCue } from "@/components/hero-scroll-cue";

const USP = [
  "без иностранных карт",
  "с выдачей за 10 минут",
  "с поддержкой в Telegram",
  "по честной цене",
];

export function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* atmosphere */}
      <div className="bg-grid absolute inset-0 -z-20 opacity-40" aria-hidden />
      <HeroBackdropIcons />
      <div
        className="pointer-events-none absolute -top-40 left-1/4 -z-10 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-48 right-[12%] -z-10 h-[440px] w-[440px] rounded-full bg-[oklch(0.62_0.22_320/0.14)] blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="odium-fade-up inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          <span className="relative inline-flex size-1.5">
            <span className="odium-pulse-ring absolute inset-0 rounded-full bg-primary" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          <span>online · поддержка 24/7</span>
        </div>

        <h1 className="odium-fade-up mt-8 max-w-5xl font-display text-[clamp(2.5rem,7.2vw,5.5rem)] font-semibold leading-[1.04]">
          Зарубежные подписки
          <span className="mt-1 block font-medium italic text-primary">
            <RollingText phrases={USP} />
          </span>
        </h1>

        <p className="odium-fade-up mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Оформляем ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и десятки
          других сервисов для пользователей СНГ — прозрачно, быстро и с живой
          поддержкой.
        </p>

        <div className="odium-fade-up mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalog"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex font-semibold")}
          >
            Открыть каталог
          </Link>
          <Link
            href="/faq"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "inline-flex"
            )}
          >
            Как это работает
          </Link>
        </div>

        <dl className="odium-fade-up mt-14 grid w-full max-w-md grid-cols-3 gap-6">
          {[
            { k: "комиссия", v: "от 0%" },
            { k: "выдача", v: "10 мин" },
            { k: "сервисов", v: "30+" },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {s.k}
              </dt>
              <dd className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
                {s.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HeroScrollCue />
    </section>
  );
}
