"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type CookieConsentValue,
  persistConsent,
  readStoredConsent,
} from "@/lib/cookie-consent";

type CookieConsentContextValue = {
  consent: CookieConsentValue | null;
  ready: boolean;
  canUseCookies: boolean;
  accept: () => void;
  decline: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setReady(true);
  }, []);

  const accept = useCallback(() => {
    persistConsent("accepted");
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    persistConsent("declined");
    setConsent("declined");
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      ready,
      canUseCookies: consent === "accepted",
      accept,
      decline,
    }),
    [consent, ready, accept, decline]
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
