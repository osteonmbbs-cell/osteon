"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function TestGuard({
  children,
  studentEmail,
  testId,
  totalMarks,
  testTitle,
}: {
  children: ReactNode;
  studentEmail: string;
  testId: string;
  totalMarks: number;
  testTitle: string;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [marks, setMarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Disable ctrl+U, ctrl+S, F12, ctrl+shift+I
      if (
        (e.ctrlKey && key === 'u') ||
        (e.ctrlKey && key === 's') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && key === 'i') ||
        (e.ctrlKey && e.shiftKey && key === 'c') ||
        (e.ctrlKey && e.shiftKey && key === 'j')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSubmitScore = async () => {
    const numMarks = Number(marks);
    if (isNaN(numMarks) || numMarks < 0) {
      setError("Please enter a valid score.");
      return;
    }
    if (numMarks > totalMarks) {
      setError(`Score cannot exceed ${totalMarks}.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submit-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, marksObtained: numMarks }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setAccuracy(data.accuracy);
      setSubmitted(true);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate invisible grid of repeated student emails for watermark overlay
  const watermarks = Array.from({ length: 80 }).map((_, i) => (
    <div key={i} className="flex items-center justify-center text-center -rotate-45 p-6 break-words pointer-events-none">
      {studentEmail}
    </div>
  ));

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Form area */}
      <div className="relative flex-1 overflow-hidden">
        {children}
        {/* Absolute overlay layered on top capturing no pointer events */}
        <div
          className="pointer-events-none absolute inset-0 z-50 overflow-hidden grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-8 opacity-[0.08] text-slate-900 font-extrabold text-sm sm:text-base select-none leading-tight"
          aria-hidden="true"
        >
          {watermarks}
        </div>
      </div>

      {/* Score Submission Bottom Bar */}
      <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg-primary)] relative z-50">
        {!showPanel ? (
          <button
            onClick={() => setShowPanel(true)}
            className="w-full py-3 px-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-indigo-400 transition-all flex items-center justify-center gap-2 hover:bg-white/[0.03]"
          >
            <span>📊</span> Finished? Submit Your Score
          </button>
        ) : submitted ? (
          /* Success state */
          <div className="p-5 text-center animate-fade-in-up">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="text-base font-bold text-emerald-400 mb-1">Score Recorded!</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{marks}/{totalMarks}</span> — Accuracy: <span className="font-bold text-indigo-400">{accuracy}%</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-2">Redirecting to dashboard...</p>
          </div>
        ) : (
          /* Input state */
          <div className="p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>📝</span> Submit Score for &ldquo;{testTitle}&rdquo;
              </h3>
              <button
                onClick={() => { setShowPanel(false); setError(""); }}
                className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Your Marks (out of {totalMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalMarks}
                  step="0.5"
                  value={marks}
                  onChange={(e) => { setMarks(e.target.value); setError(""); }}
                  className="input-dark"
                  placeholder={`0 — ${totalMarks}`}
                  disabled={submitting}
                />
              </div>
              <button
                onClick={handleSubmitScore}
                disabled={submitting || !marks}
                className="btn-glow text-xs py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </span>
                ) : (
                  "✅ Submit"
                )}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-semibold animate-scale-in">⚠ {error}</p>
            )}

            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Enter the score shown on your Google Form submission confirmation. This will be recorded in your dashboard analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
