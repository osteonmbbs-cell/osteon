import { auth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import Link from "next/link";
import AccuracyChart from "./AccuracyChart";
import { signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const email = session.user.email;

  // If the user is an admin, redirect them to the admin panel instead
  if (isAdmin(email)) {
    redirect("/admin");
  }

  // 1. Fetch student record
  const studentDoc = await db.collection("students").doc(email).get();
  const studentName = studentDoc.data()?.name || session.user.name || "Student";
  const userImage = session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=6366f1&color=fff`;

  // 2. Fetch tests and mapping
  const allTestsSnapshot = await db.collection("tests").get();
  const titleMap: Record<string, string> = {};
  
  const activeTests: { testId: string; title: string; subject: string }[] = [];

  allTestsSnapshot.forEach((doc) => {
    const data = doc.data();
    titleMap[doc.id] = data.title;
    if (data.isActive) {
      activeTests.push({
        testId: doc.id,
        title: data.title,
        subject: data.subject || "General",
      });
    }
  });

  // 3. Fetch results (wrapped in try-catch for missing Firestore index)
  let results: { id: string; testTitle: string; marksObtained: number; totalMarks: number; accuracy: number; date: string }[] = [];
  try {
    const resultsSnapshot = await db
      .collection("results")
      .where("studentEmail", "==", email)
      .orderBy("submittedAt", "desc")
      .get();

    results = resultsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        testTitle: titleMap[data.testId] || "Unknown Test",
        marksObtained: data.marksObtained || 0,
        totalMarks: data.totalMarks || 0,
        accuracy: data.accuracy || 0,
        date: data.submittedAt ? new Date(data.submittedAt.toMillis()).toLocaleDateString() : "N/A",
      };
    });
  } catch (error) {
    console.error("Results query error (composite index may be needed):", error);
  }

  return (
    <main className="bg-mesh min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <header className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 animate-fade-in-up">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-[var(--bg-primary)]">
            <img src={userImage} alt={studentName} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back, {studentName}</h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">{email}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Available Tests */}
            <section className="glass-card p-6 md:p-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📝</span>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Available Tests</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTests.length === 0 ? (
                  <div className="col-span-full text-center py-10">
                    <span className="text-4xl mb-3 block">📭</span>
                    <p className="text-[var(--text-muted)] text-sm italic">No active tests available right now.</p>
                  </div>
                ) : (
                  activeTests.map((test, i) => (
                    <div key={test.testId} className="card-3d">
                      <div className="card-3d-inner glass-card p-5 flex flex-col justify-between h-full hover:border-indigo-500/30" style={{animationDelay: `${i * 0.1}s`}}>
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider badge-success mb-3">
                            {test.subject}
                          </span>
                          <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 leading-snug">{test.title}</h3>
                        </div>
                        <Link
                          href={`/test/${test.testId}`}
                          className="btn-glow text-center text-xs py-2.5"
                        >
                          🚀 Start Test
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Accuracy Chart */}
            <section className="glass-card p-6 md:p-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Performance Accuracy</h2>
              </div>
              <AccuracyChart data={results} />
            </section>
          </div>

          {/* Sidebar: Results */}
          <div className="lg:col-span-1 glass-card overflow-hidden flex flex-col h-fit animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">My Results</h2>
              </div>
            </div>

            <div className="p-0 overflow-x-auto flex-grow">
              {results.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-3xl mb-3 block">📋</span>
                  <p className="text-[var(--text-muted)] italic text-sm">No past results found.</p>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Test</th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Marks</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Acc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[var(--text-primary)] text-sm line-clamp-1 max-w-[140px]" title={r.testTitle}>{r.testTitle}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{r.date}</div>
                        </td>
                        <td className="px-3 py-4 text-right text-[var(--text-secondary)] font-medium text-sm whitespace-nowrap">
                          {r.marksObtained}/{r.totalMarks}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`inline-flex font-bold items-center px-2 py-0.5 rounded-full text-[10px] ${r.accuracy >= 80 ? 'badge-success' : r.accuracy >= 50 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'badge-danger'}`}>
                            {r.accuracy.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
