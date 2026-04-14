import { auth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import AdminTabs from "./AdminTabs";

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
      addedAt: data.addedAt ? data.addedAt.toDate().toISOString() : null,
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
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Osteon Admin Panel</h1>
          <p className="text-slate-500 font-medium mt-2">Manage student access and Google Forms test mappings</p>
        </header>

        <AdminTabs initialStudents={students} initialTests={tests} />
      </div>
    </div>
  );
}
