import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const r = await fetch(`${API_URL}/v1/users/me/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
