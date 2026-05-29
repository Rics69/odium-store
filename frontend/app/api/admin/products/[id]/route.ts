import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const r = await fetch(`${API_URL}/v1/admin/products/${id}`, {
    method: "PUT",
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

export async function DELETE(_req: Request, ctx: Ctx) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await fetch(`${API_URL}/v1/admin/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
