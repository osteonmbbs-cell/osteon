import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Do not protect /api/webhook/* routes
  if (pathname.startsWith('/api/webhook/')) {
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
