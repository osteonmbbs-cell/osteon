import { auth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import AdminTabs from "./AdminTabs";
import { signOut } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    redirect("/");
  }

  // Initial SSR fetch
  const studentsReq = await db.collection("students").get();
  const students = studentsReq.docs.map(doc => {
    const data = doc.data();
    return {
      email: doc.id,
      name: data.name || "",
      isPaid: !!data.isPaid,
      addedAt: data.addedAt ? (typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : new Date(data.addedAt).toISOString()) : null,
      addedBy: data.addedBy || ""
    };
  });

  const testsReq = await db.collection("tests").get();
  const tests = testsReq.docs.map(doc => {
    const data = doc.data();
    return {
      testId: doc.id,
      title: data.title || "",
      subject: data.subject || "General",
      formUrl: data.formUrl || "",
      totalMarks: data.totalMarks || 0,
      isActive: !!data.isActive,
      createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : null,
    };
  });

  return (
    <main className="bg-mesh min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Osteon Admin
              </h1>
            </div>
            <p className="text-[var(--text-muted)] font-medium mt-2 ml-12">Manage student access and test configurations</p>
          </div>
          <form action={async () => { "use server"; await signOut(); }}>
            <button
              type="submit"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-400 transition-colors border border-[var(--border)] rounded-lg px-4 py-2 hover:border-red-500/30"
            >
              Sign Out
            </button>
          </form>
        </header>

        <AdminTabs initialStudents={students} initialTests={tests} />
      </div>
    </main>
  );
}
