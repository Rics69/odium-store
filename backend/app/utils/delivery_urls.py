"""Нормализация ссылок автовыдачи (по одной в строке или списком)."""

MAX_DELIVERY_URLS = 20
MAX_URL_LENGTH = 2048


def normalize_delivery_urls(raw: list[str] | str | None) -> list[str]:
    if raw is None:
        return []
    lines: list[str]
    if isinstance(raw, str):
        lines = raw.splitlines()
    else:
        lines = list(raw)
    out: list[str] = []
    seen: set[str] = set()
    for line in lines:
        url = line.strip()
        if not url or url in seen:
            continue
        if len(url) > MAX_URL_LENGTH:
            url = url[:MAX_URL_LENGTH]
        seen.add(url)
        out.append(url)
        if len(out) >= MAX_DELIVERY_URLS:
            break
    return out
