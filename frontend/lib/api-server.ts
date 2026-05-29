import { cookies, headers } from "next/headers";
import { API_URL } from "./config";
import { ApiError } from "./api-error";

export { ApiError } from "./api-error";

async function buildUpstreamAuthHeaders(
  initHeaders?: HeadersInit
): Promise<Record<string, string>> {
  const headersOut: Record<string, string> = {
    ...(initHeaders as Record<string, string> | undefined),
  };
  try {
    const incomingCookie = (await headers()).get("cookie");
    if (incomingCookie) {
      headersOut["Cookie"] = incomingCookie;
    }
  } catch {
  }
  const token = (await cookies()).get("access_token")?.value;
  if (token) {
    headersOut["Authorization"] = `Bearer ${token}`;
  }
  return headersOut;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const hdr = await buildUpstreamAuthHeaders(init?.headers as HeadersInit);
  let body = init?.body as BodyInit | undefined;
  if (init?.json !== undefined) {
    hdr["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: hdr,
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером. Попробуйте позже.", 0);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(text || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Сервер вернул некорректный ответ.", res.status);
  }
}
