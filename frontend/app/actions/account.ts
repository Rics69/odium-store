"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api-server";

export type AccountFormState = { error?: string; ok?: boolean } | null;

export async function updateDisplayName(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const display_name = String(formData.get("display_name") || "").trim();
  if (!display_name) return { error: "Введите имя" };
  try {
    await apiFetch("/v1/users/me", {
      method: "PUT",
      json: { display_name },
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function uploadAvatar(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл" };
  }
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "Нет сессии" };
  const data = new FormData();
  data.append("file", file);
  const res = await fetch(`${API_URL}/v1/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  });
  if (!res.ok) {
    return { error: await res.text() };
  }
  revalidatePath("/account");
  return { ok: true };
}
