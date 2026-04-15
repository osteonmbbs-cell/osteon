import NextAuth from "next-auth";
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
  callbacks: {
    ...authConfig.callbacks,
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
  }
});
