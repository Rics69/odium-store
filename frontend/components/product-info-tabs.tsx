"use client";

import type { AccordionSectionT } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function InstructionPlain({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {title.trim() ? <h3 className="text-lg font-semibold tracking-tight">{title.trim()}</h3> : null}
      {body.trim() ? (
        <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{body.trim()}</p>
      ) : null}
    </div>
  );
}

function FaqAccordion({ items }: { items: AccordionSectionT[] }) {
  if (items.length === 0) return null;
  return (
    <Accordion className="w-full rounded-xl border px-4" multiple>
      {items.map((it, i) => (
        <AccordionItem key={`${it.title}-${i}`} value={`faq-${i}`}>
          <AccordionTrigger>{it.title || `Вопрос ${i + 1}`}</AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{it.content}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ProductInfoTabs({
  instructionTitle,
  instructionBody,
  faq,
}: {
  instructionTitle: string;
  instructionBody: string;
  faq: AccordionSectionT[];
}) {
  const tt = instructionTitle.trim();
  const tb = instructionBody.trim();
  const hasI = !!(tt || tb);
  const hasF = faq.length > 0;
  if (!hasI && !hasF) return null;

  if (hasI && !hasF) {
    return (
      <section className="mt-14 w-full space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Инструкция</h2>
        <InstructionPlain title={instructionTitle} body={instructionBody} />
      </section>
    );
  }

  if (!hasI && hasF) {
    return (
      <section className="mt-14 w-full space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">FAQ</h2>
        <FaqAccordion items={faq} />
      </section>
    );
  }

  return (
    <section className="mt-14 w-full space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Инструкция и вопросы</h2>
      <Tabs defaultValue="instruction" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="instruction">Инструкция</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        <TabsContent value="instruction" className="mt-4">
          <InstructionPlain title={instructionTitle} body={instructionBody} />
        </TabsContent>
        <TabsContent value="faq" className="mt-4">
          <FaqAccordion items={faq} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
