import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { redirect } from "next/navigation";
import Link from "next/link";
import TestGuard from "./TestGuard";

export default async function TestViewerPage({ params }: { params: { testId: string } }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const { testId } = params;
  const testDoc = await db.collection("tests").doc(testId).get();

  if (!testDoc.exists) {
    return <ErrorPage message="Test not found." />;
  }

  const testData = testDoc.data();
  if (testData?.isActive !== true) {
    return <ErrorPage message="This test is inactive or no longer available." />;
  }

  // Use the proxy endpoint — the actual Google Form URL never reaches the client
  const proxyUrl = `/api/proxy-form?testId=${encodeURIComponent(testId)}`;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-primary)]">
      <header className="flex-shrink-0 glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[var(--text-muted)] hover:text-indigo-400 transition-colors flex items-center gap-2"
          >
            ← Back
          </Link>
          <div className="h-5 w-px bg-[var(--border)]"></div>
          <h1 className="text-sm font-bold text-[var(--text-primary)]">{testData.title || "Untitled Test"}</h1>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest badge-success px-2 py-0.5 rounded-full">
          Live
        </span>
      </header>

      <main className="flex-1 relative w-full h-full bg-white">
        <TestGuard
          studentEmail={session.user.email}
          testId={testId}
          totalMarks={testData.totalMarks || 0}
          testTitle={testData.title || "Test"}
        >
          <iframe
            src={proxyUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Test Document"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
          />
        </TestGuard>
      </main>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="bg-mesh flex flex-col h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="glass-card p-10 max-w-md text-center w-full animate-scale-in">
        <span className="text-5xl mb-4 block">😵</span>
        <h2 className="text-xl font-bold text-red-400 mb-3">Access Issue</h2>
        <p className="text-[var(--text-muted)] mb-8 text-sm">{message}</p>
        <Link
          href="/dashboard"
          className="btn-glow w-full inline-block text-center text-sm py-3"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
