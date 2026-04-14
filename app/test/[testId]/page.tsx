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

  const formUrl = testData.formUrl;

  // IMPORTANT: formUrl is ONLY evaluated here server-side.
  // It is rendered directly into the HTML node and not passed as data props.
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-300"></div>
          <h1 className="text-base font-bold text-slate-900">{testData.title || "Untitled Test"}</h1>
        </div>
      </header>
      
      <main className="flex-1 relative w-full h-full bg-white">
        <TestGuard studentEmail={session.user.email}>
          <iframe 
            src={formUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Test Document" 
          />
        </TestGuard>
      </main>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-md text-center w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Access Issue</h2>
        <p className="text-slate-600 mb-8">{message}</p>
        <Link 
          href="/dashboard"
          className="inline-flex justify-center w-full py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
