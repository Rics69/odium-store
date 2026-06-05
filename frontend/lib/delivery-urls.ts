export function parseDeliveryUrls(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const url = line.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 20) break;
  }
  return out;
}

export function formatDeliveryUrls(urls: string[] | null | undefined): string {
  if (!urls?.length) return "";
  return urls.join("\n");
}
