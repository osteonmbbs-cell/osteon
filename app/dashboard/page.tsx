import { auth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import Link from "next/link";
import AccuracyChart from "./AccuracyChart";

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
  const userImage = session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}`;

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
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden border-2 border-slate-100">
            <img src={userImage} alt={studentName} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900">{studentName}</h1>
            <p className="text-slate-500 font-medium">{email}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Tests and Chart */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Available Tests */}
            <section className="bg-white rounded-xl flex flex-col shadow-sm border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Available Tests</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activeTests.length === 0 ? (
                  <p className="text-slate-500 italic col-span-full py-4 text-center">No active tests available right now.</p>
                ) : (
                  activeTests.map((test) => (
                    <div key={test.testId} className="border border-slate-100 rounded-lg p-5 hover:shadow-md transition-shadow bg-slate-50 hover:bg-white flex flex-col justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 mb-4">
                          {test.subject}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 leading-tight">{test.title}</h3>
                      </div>
                      <Link 
                        href={`/test/${test.testId}`}
                        className="inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#0B1E40] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1E40] transition-colors"
                      >
                        Start Test
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Accuracy Graph */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Performance Accuracy</h2>
              <AccuracyChart data={results} />
            </section>

          </div>

          {/* Sidebar: Results Table */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100">
               <h2 className="text-xl font-bold text-slate-900">My Results</h2>
            </div>
            
            <div className="p-0 overflow-x-auto flex-grow">
              {results.length === 0 ? (
                <div className="p-6 text-slate-500 italic text-center">No past results found.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Test/Date</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Marks</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Acc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 line-clamp-1 max-w-[140px]" title={r.testTitle}>{r.testTitle}</div>
                          <div className="text-xs text-slate-500 mt-1 font-medium">{r.date}</div>
                        </td>
                        <td className="px-3 py-4 text-right text-slate-600 font-medium whitespace-nowrap">
                          {r.marksObtained}/{r.totalMarks}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`inline-flex font-bold items-center px-2 py-0.5 rounded text-xs ${r.accuracy >= 80 ? 'bg-green-100 text-green-800' : r.accuracy >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
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
