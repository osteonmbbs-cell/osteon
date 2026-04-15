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

      {/* Trigger Button at Bottom */}
      <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg-primary)] relative z-50">
        <button
          onClick={() => setShowPanel(true)}
          className="w-full py-4 px-6 text-sm font-bold text-[var(--text-secondary)] hover:text-indigo-400 transition-all flex items-center justify-center gap-2 hover:bg-white/[0.03]"
        >
          <span>📊</span> Finished with the test? Click here to submit your marks
        </button>
      </div>

      {/* Popup Modal */}
      {(showPanel || submitted) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full shadow-2xl relative animate-scale-in">
            {submitted ? (
              /* Success state */
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Score Recorded!</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  <span className="font-bold text-[var(--text-primary)] text-lg">{marks}/{totalMarks}</span> <br/> Accuracy: <span className="font-bold text-indigo-400">{accuracy}%</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Redirecting to dashboard...</p>
              </div>
            ) : (
              /* Input state */
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 leading-tight">
                    <span>📝</span> Enter Your Marks
                  </h3>
                  <button
                    onClick={() => { setShowPanel(false); setError(""); }}
                    className="text-sm font-bold text-[var(--text-muted)] hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    For the test <strong>&ldquo;{testTitle}&rdquo;</strong>
                  </p>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                        Your Marks (out of {totalMarks})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalMarks}
                        step="0.5"
                        value={marks}
                        onChange={(e) => { setMarks(e.target.value); setError(""); }}
                        className="input-dark w-full text-lg py-3"
                        placeholder={`0 — ${totalMarks}`}
                        disabled={submitting}
                      />
                    </div>
                    <button
                      onClick={handleSubmitScore}
                      disabled={submitting || !marks}
                      className="btn-glow w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          Saving Result...
                        </span>
                      ) : (
                        "✅ Submit Marks"
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-semibold animate-scale-in mt-3 text-center">⚠ {error}</p>
                  )}

                  <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-[var(--text-secondary)] leading-relaxed relative overflow-hidden text-left">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    <p className="font-semibold text-indigo-300 mb-1">Important Note:</p>
                    <p>
                      These analytics are for your ease and are to be made purely by you, THE USERS. Every time you enter marks, the number of tests registered in your dashboard analytics increases.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
