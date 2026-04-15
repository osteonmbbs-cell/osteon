import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// This config is shared between the main auth.ts AND the middleware.
// The middleware runs in Edge Runtime and CANNOT import firebase-admin,
// so we keep this file free of any Node.js-only imports.
//
// The provider must be declared here so that the middleware's NextAuth
// instance uses the same JWT encoding/decoding as the main auth instance.
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token?.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
