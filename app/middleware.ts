import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authLimiter, apiLimiter, readLimiter, writeLimiter } from "@/app/lib/rate-limit";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  // Debug: log every middleware run (appears in dev console or Vercel/Edge logs)
  console.log(`[middleware] ${req.method} ${pathname}`);

  if (pathname.startsWith("/api")) {
    try {
      if (pathname.startsWith("/api/auth/")) {
        await authLimiter.check(req, 5);
      } else if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH" ||
        req.method === "DELETE"
      ) {
        await writeLimiter.check(req, 50);
      } else if (req.method === "GET") {
        await readLimiter.check(req, 200);
      } else {
        await apiLimiter.check(req, 100);
      }
    } catch {
      const tooMany = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      tooMany.headers.set("x-middleware-active", "1");
      return tooMany;
    }
  }

  const sessionToken = req.cookies.get("better-auth.session_token")?.value;

  const protectedRoutes = ["/admin", "/user", "/dashboard"];

  if (sessionToken && (pathname === "/login" || pathname === "/register")) {
    const redirectRes = NextResponse.redirect(new URL("/user", req.url));
    redirectRes.headers.set("x-middleware-active", "1");
    return redirectRes;
  }

  const isProtected = protectedRoutes.some((p) => pathname.startsWith(p));

  if (!sessionToken && isProtected) {
    const redirectRes = NextResponse.redirect(new URL("/login", req.url));
    redirectRes.headers.set("x-middleware-active", "1");
    return redirectRes;
  }

  const resp = NextResponse.next();
  resp.headers.set("x-middleware-active", "1");
  return resp;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
