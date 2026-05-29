export type SteamDepositCurrency = "rub" | "kzt" | "usd";

export const STEAM_MIN_DEPOSIT: Record<SteamDepositCurrency, number> = {
  rub: 100,
  kzt: 500,
  usd: 1.3,
};

export const STEAM_CURRENCY_OPTIONS: {
  id: SteamDepositCurrency;
  label: string;
  symbol: string;
  step: string;
  min: number;
}[] = [
  { id: "rub", label: "Рубли (₽)", symbol: "₽", step: "1", min: 100 },
  { id: "kzt", label: "Тенге (₸)", symbol: "₸", step: "1", min: 500 },
  { id: "usd", label: "Доллары ($)", symbol: "$", step: "0.01", min: 1.3 },
];

export function calcSteamPayRub(
  depositAmount: number,
  currency: SteamDepositCurrency,
  commissionPercent: number,
  usdToRub: number,
  kztToRub: number
): number {
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) return 0;
  const mult = 1 + commissionPercent / 100;
  if (currency === "rub") return Math.round(depositAmount * mult * 100) / 100;
  if (currency === "kzt") return Math.round(depositAmount * kztToRub * mult * 100) / 100;
  return Math.round(depositAmount * usdToRub * mult * 100) / 100;
}

export function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(n);
}
