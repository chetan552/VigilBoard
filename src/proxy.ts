import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "vb_session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const expected = process.env.SESSION_SECRET;

  if (session !== expected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/screens/:path*", "/api/auth/google/:path*", "/api/photos/:path*", "/api/tasks/:path*", "/api/calendar/:path*"],
};
