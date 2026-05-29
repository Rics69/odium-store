import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Заказ оформлен",
  description:
    "Заказ принят в работу. При необходимости заполните дополнительные данные и следите за статусом в личном кабинете.",
  alternates: { canonical: "/payment/success" },
  robots: { index: false, follow: true },
};

export default function PaymentSuccessLayout({ children }: { children: ReactNode }) {
  return children;
}
