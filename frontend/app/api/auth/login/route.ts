import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";
import { COOKIE_CONSENT_COOKIE_NAME } from "@/lib/cookie-consent";

function consentBlocked() {
  return NextResponse.json(
    { detail: "Примите cookie на сайте, чтобы войти в аккаунт." },
    { status: 403 }
  );
}

export async function POST(req: Request) {
  const consent = (await cookies()).get(COOKIE_CONSENT_COOKIE_NAME)?.value;
  if (consent !== "accepted") {
    return consentBlocked();
  }
  const body = await req.json();
  const r = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: r.status });
  if (r.ok && data?.access_token) {
    res.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
