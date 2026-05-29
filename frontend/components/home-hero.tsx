import Link from "next/link";
import { AnimatedHeroGem } from "@/components/animated-hero-gem";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERVICES = [
  "ChatGPT",
  "Cursor",
  "Claude",
  "Spotify",
  "Steam",
  "Discord Nitro",
  "Perplexity",
  "Suno",
  "Grok",
  "Gemini",
];

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/40">
      <div className="bg-grid absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -top-32 left-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-[360px] w-[360px] rounded-full bg-[oklch(0.62_0.22_320/0.18)] blur-[120px]"
        aria-hidden
      />

      <div className="relative grid items-center gap-10 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.4fr_auto] lg:gap-16 lg:px-14 lg:py-20">
        <div className="space-y-7 odium-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            <span className="relative inline-flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-primary odium-pulse-ring" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span>online · поддержка 24/7</span>
          </div>

          <h1 className="font-display text-[clamp(2.25rem,5.2vw,3.75rem)] font-bold leading-[1.02]">
            Зарубежные подписки{" "}
            <span className="relative inline-block text-primary">
              без лишних
              <svg
                aria-hidden
                viewBox="0 0 240 14"
                className="absolute -bottom-2 left-0 h-3 w-full text-primary/70"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 C 60 1, 120 13, 238 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            барьеров.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Оформляем ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и другие
            сервисы для пользователей СНГ — без иностранных карт, прозрачной комиссией и
            живой поддержкой в Telegram.
          </p>

          <div className="flex flex-wrap items-center gap-3">
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

          <dl className="grid max-w-md grid-cols-3 gap-4 pt-2 text-left">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                комиссия
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                от 0%
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                выдача
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                10мин
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                сервисов
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                30+
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <AnimatedHeroGem className="h-48 w-48 md:h-60 md:w-60" />
        </div>
      </div>

      <div className="relative h-12 border-t border-border/60 bg-background/30 overflow-hidden">
        <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card/80 to-transparent" />
        <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card/80 to-transparent" />
        <div className="odium-marquee absolute inset-y-0 flex items-center gap-10 whitespace-nowrap pl-10 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {[...SERVICES, ...SERVICES].map((s, i) => (
            <span key={`${s}-${i}`} className="inline-flex items-center gap-2">
              <span className="text-primary">◆</span>
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
