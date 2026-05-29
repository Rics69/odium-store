export type CookieConsentValue = "accepted" | "declined";

export const COOKIE_CONSENT_STORAGE_KEY = "odium-cookie-consent";
export const COOKIE_CONSENT_COOKIE_NAME = "odium_cookie_consent";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

export function readStoredConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function persistConsent(value: CookieConsentValue) {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_SEC}; SameSite=Lax`;
  if (value === "declined") {
    localStorage.removeItem("odium-theme");
  }
}

export function hasCookieConsentAccepted(): boolean {
  return readStoredConsent() === "accepted";
}
