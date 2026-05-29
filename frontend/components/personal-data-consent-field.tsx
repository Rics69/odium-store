"use client";

import { LEGAL_DOCS } from "@/lib/legal-links";
import { cn } from "@/lib/utils";

export function PersonalDataConsentField({
  id = "personal-data-consent",
  checked,
  onCheckedChange,
  className,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-dashed px-3 py-2", className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 rounded border"
      />
      <label htmlFor={id} className="cursor-pointer text-xs leading-snug font-normal text-muted-foreground">
        Даю согласие на обработку персональных данных. Ознакомлен с{" "}
        <a
          href={LEGAL_DOCS.privacy.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          политикой конфиденциальности
        </a>
        .
      </label>
    </div>
  );
}
