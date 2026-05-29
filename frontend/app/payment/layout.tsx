import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Оплата",
  description: "Оформление и оплата заказов в Odium.",
  alternates: { canonical: "/payment" },
  robots: { index: false, follow: true },
};

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return children;
}
