"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <div className="bg-mesh flex flex-col h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="glass-card p-10 max-w-md text-center w-full animate-scale-in">
        <span className="text-5xl mb-4 block">💀</span>
        <h2 className="text-xl font-bold text-red-400 mb-3">Something Went Wrong</h2>
        <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try going back to the dashboard.
        </p>
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
