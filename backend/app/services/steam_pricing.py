from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

STEAM_DEPOSIT_CURRENCIES = ("rub", "kzt", "usd")

STEAM_MIN_DEPOSIT: dict[str, Decimal] = {
    "rub": Decimal("100"),
    "kzt": Decimal("500"),
    "usd": Decimal("1.30"),
}

STEAM_CURRENCY_LABELS: dict[str, str] = {
    "rub": "₽",
    "kzt": "₸",
    "usd": "$",
}


def _q2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_steam_checkout(
    deposit_amount: Decimal,
    currency: str,
    commission_percent: Decimal,
    usd_to_rub: Decimal,
    kzt_to_rub: Decimal,
) -> tuple[Decimal, Decimal, str]:
    """
    Возвращает (сумма на Steam, цена к оплате в RUB, подпись варианта для заказа).
    """
    cur = currency.strip().lower()
    if cur not in STEAM_DEPOSIT_CURRENCIES:
        raise HTTPException(400, "Некорректная валюта пополнения")

    min_dep = STEAM_MIN_DEPOSIT[cur]
    if deposit_amount < min_dep:
        label = STEAM_CURRENCY_LABELS[cur]
        raise HTTPException(
            400,
            f"Минимальная сумма пополнения — {min_dep} {label}",
        )

    multiplier = Decimal("1") + (commission_percent / Decimal("100"))
    if cur == "rub":
        pay_rub = _q2(deposit_amount * multiplier)
    elif cur == "kzt":
        pay_rub = _q2(deposit_amount * kzt_to_rub * multiplier)
    else:
        pay_rub = _q2(deposit_amount * usd_to_rub * multiplier)

    sym = STEAM_CURRENCY_LABELS[cur]
    variant_label = f"{deposit_amount} {sym} на Steam"
    return deposit_amount, pay_rub, variant_label
