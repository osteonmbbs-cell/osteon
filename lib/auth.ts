import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./firebase";
import { authConfig } from "./auth.config";

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase().trim());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      
      // Implicitly allow Admins to bypass student payment checks
      if (isAdmin(email)) {
        return true;
      }

      try {
        const studentDoc = await db.collection('students').doc(email).get();
        if (studentDoc.exists && studentDoc.data()?.isPaid === true) {
          return true;
        }
      } catch (error) {
        console.error("Firestore Auth Error:", error);
      }

      return '/?' + new URLSearchParams({ error: 'not_authorized' }).toString();
    },
    async session({ session, token }) {
      if (session.user && token?.email) {
        session.user.email = token.email as string;
      }
      return session;
    }
  }
});
