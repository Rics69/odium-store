import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-use-long-random-string"
);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("access_token")?.value;
  const needAuth = path.startsWith("/account") || path.startsWith("/admin");
  if (!needAuth) return NextResponse.next();
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    if (path.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/account/:path*", "/admin", "/admin/:path*"],
};
