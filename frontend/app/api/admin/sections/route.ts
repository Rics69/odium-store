import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

async function authHeaders(): Promise<HeadersInit | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function GET() {
  const h = await authHeaders();
  if (!h) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const r = await fetch(`${API_URL}/v1/admin/sections`, {
    headers: h,
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: Request) {
  const h = await authHeaders();
  if (!h) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const r = await fetch(`${API_URL}/v1/admin/sections`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
