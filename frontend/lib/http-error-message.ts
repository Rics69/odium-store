export async function readJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function formatApiErrorDetail(data: unknown): string {
  if (data === null || data === undefined) return "Запрос отклонён сервером";
  if (typeof data !== "object") return String(data);
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item !== null && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : JSON.stringify(item)
      )
      .join("; ");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return "Ошибка запроса";
  }
}
