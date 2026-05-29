import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/app-providers";
import { Toaster } from "@/components/ui/sonner";
import { siteContainerClass } from "@/lib/site-layout";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://odium.local";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Odium — зарубежные подписки и пополнения из СНГ",
    template: "%s · Odium",
  },
  description:
    "Odium — оплата зарубежных подписок из СНГ без иностранных карт: ChatGPT, Cursor, Claude, Spotify, Steam, Discord Nitro и десятки других сервисов.",
  applicationName: "Odium",
  keywords: [
    "Odium",
    "оплата подписок",
    "ChatGPT подписка",
    "Spotify СНГ",
    "Steam пополнение",
    "Discord Nitro",
    "Cursor оплата",
    "Claude AI",
    "иностранные подписки",
  ],
  authors: [{ name: "Odium" }],
  creator: "Odium",
  publisher: "Odium",
  alternates: { canonical: "/" },
  icons: { icon: "/logo-odium.svg" },
  openGraph: {
    title: "Odium — зарубежные подписки и пополнения из СНГ",
    description:
      "Оформляйте ChatGPT, Cursor, Spotify, Steam, Discord Nitro и другие сервисы без иностранных карт и лишних комиссий.",
    url: SITE_URL,
    siteName: "Odium",
    locale: "ru_RU",
    type: "website",
    images: [{ url: "/logo-odium.svg", width: 1200, height: 630, alt: "Odium" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odium — зарубежные подписки и пополнения из СНГ",
    description:
      "Подписки и пополнения зарубежных сервисов без иностранных карт. Прозрачно, быстро, поддержка в Telegram.",
    images: ["/logo-odium.svg"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${jetbrainsMono.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans body-aurora">
        <AppProviders>
          <SiteHeader />
          <main className={cn(siteContainerClass, "flex-1 py-10 md:py-14")}>
            {children}
          </main>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </AppProviders>
      </body>
    </html>
  );
}
