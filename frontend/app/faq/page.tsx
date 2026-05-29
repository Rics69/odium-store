import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/section-heading";
import { FAQ_ITEMS } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "Частые вопросы",
  description:
    "Ответы на частые вопросы о работе Odium: оплата зарубежных подписок, сроки выдачи, поддержка и возвраты.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ · Odium",
    description:
      "Как работает сервис, какие подписки доступны и что делать, если возникли вопросы.",
    url: "/faq",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <SectionHeading
        eyebrow="faq"
        title="Частые вопросы"
        description="Ответы о сервисе Odium, оплате подписок и поддержке."
      />
      <Accordion
        className="w-full divide-y divide-border/60 rounded-2xl border border-border/70 bg-card/60 px-4"
        multiple
      >
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={item.question} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-display text-base font-semibold">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
