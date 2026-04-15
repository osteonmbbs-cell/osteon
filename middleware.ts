import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// This uses authConfig (which now has the Google provider + JWT config)
// so it can properly validate session tokens created by the main auth.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Do not protect webhook or proxy-form routes
  if (pathname.startsWith('/api/webhook/') || pathname.startsWith('/api/proxy-form')) {
    return NextResponse.next();
  }

  // Paths requiring authentication
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/test/') ||
    pathname === '/test' ||
    pathname.startsWith('/admin') ||
    pathname === '/admin';

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
