import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "О проекте Odium",
  description:
    "Odium — витрина подписок и пополнений зарубежных сервисов для пользователей СНГ. Что мы делаем и почему.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "О проекте Odium",
    description:
      "Зарубежные подписки и пополнения из СНГ — что предлагает Odium.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <SectionHeading
        eyebrow="о нас"
        title="Odium — витрина зарубежных подписок"
        description="Собираем подписки и пополнения иностранных сервисов в одном каталоге."
      />
      <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Odium — это сервис, через который пользователи из стран СНГ оформляют
          ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и другие
          зарубежные подписки без иностранных карт.
        </p>
        <p>
          Мы показываем условия выдачи, отзывы и статистику покупок. После
          оформления заказ обрабатывается командой поддержки в Telegram.
        </p>
      </div>
    </div>
  );
}
