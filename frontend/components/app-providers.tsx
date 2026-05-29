"use client";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { CookieConsentProvider } from "@/components/cookie-consent-context";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CookieConsentProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <CookieConsentBanner />
      </ThemeProvider>
    </CookieConsentProvider>
  );
}
