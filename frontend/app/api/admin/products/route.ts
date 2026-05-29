import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

export async function POST(req: Request) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const r = await fetch(`${API_URL}/v1/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
