import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Регистрация",
  description:
    "Создайте аккаунт Odium, чтобы оформлять подписки на зарубежные сервисы без иностранных карт.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
