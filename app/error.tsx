"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-4 w-full">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-md text-center w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-slate-600 mb-8">Something went wrong. Please go back to the dashboard.</p>
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
