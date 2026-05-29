import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Вход в аккаунт",
  description:
    "Войдите в аккаунт Odium, чтобы оформлять подписки, видеть историю покупок и получать поддержку.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
