"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SteamProductFields({
  productType,
  onProductTypeChange,
  commission,
  onCommissionChange,
  usdToRub,
  onUsdToRubChange,
  kztToRub,
  onKztToRubChange,
}: {
  productType: "standard" | "steam_topup";
  onProductTypeChange: (v: "standard" | "steam_topup") => void;
  commission: string;
  onCommissionChange: (v: string) => void;
  usdToRub: string;
  onUsdToRubChange: (v: string) => void;
  kztToRub: string;
  onKztToRubChange: (v: string) => void;
}) {
  const isSteam = productType === "steam_topup";

  return (
    <div className="space-y-4 rounded-xl border border-dashed p-4">
      <div className="space-y-2">
        <Label htmlFor="product_type">Тип товара</Label>
        <select
          id="product_type"
          value={productType}
          onChange={(e) =>
            onProductTypeChange(e.target.value as "standard" | "steam_topup")
          }
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="standard">Обычный</option>
          <option value="steam_topup">Пополнение Steam</option>
        </select>
        {isSteam ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            На странице товара покупатель вводит сумму зачисления на Steam; цена к оплате
            считается в рублях с комиссией. Минимумы: 100 ₽, 500 ₸, 1.30 $.
          </p>
        ) : null}
      </div>
      {isSteam ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="steam_commission">Комиссия, %</Label>
            <Input
              id="steam_commission"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={commission}
              onChange={(e) => onCommissionChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steam_usd_to_rub">Курс $ → ₽</Label>
            <Input
              id="steam_usd_to_rub"
              type="number"
              min={0.01}
              step="0.01"
              value={usdToRub}
              onChange={(e) => onUsdToRubChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steam_kzt_to_rub">Курс ₸ → ₽ (за 1 ₸)</Label>
            <Input
              id="steam_kzt_to_rub"
              type="number"
              min={0.000001}
              step="0.0001"
              value={kztToRub}
              onChange={(e) => onKztToRubChange(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
