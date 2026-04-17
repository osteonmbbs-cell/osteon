"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  email: string;
  name?: string;
  isPaid: boolean;
  addedAt: string | null;
  addedBy?: string;
}

interface TestRecord {
  testId: string;
  title: string;
  subject: string;
  formUrl: string;
  totalMarks: number;
  isActive: boolean;
  createdAt: string | null;
}

type BulkState = "idle" | "loading" | "success" | "error";

export default function AdminTabs({
  initialStudents,
  initialTests
}: {
  initialStudents: Student[];
  initialTests: TestRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"students" | "tests">("students");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // Bulk add state
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [bulkState, setBulkState] = useState<BulkState>("idle");
  const [bulkResult, setBulkResult] = useState<{ added: number; failed: number; errors: string[] } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ----- Student Handlers -----
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const formData = new FormData(form);
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name"),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      form.reset();
      showMessage('success', 'Student added successfully!');
      router.refresh();
    } catch (err) {
      showMessage('error', `Failed to add student: ${err}`);
    }
    setLoading(false);
  };

  const togglePaid = async (email: string, current: boolean) => {
    setLoading(true);
    await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, isPaid: !current }),
    });
    router.refresh();
    setLoading(false);
  };

  const deleteStudent = async (email: string) => {
    if (!confirm(`Remove access for ${email}?`)) return;
    setLoading(true);
    await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    showMessage('success', 'Student removed.');
    router.refresh();
    setLoading(false);
  };

  // ----- Bulk Add Handler -----
  const handleBulkAdd = async () => {
    const emails = bulkEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const names = bulkNames
      .split("\n")
      .map((n) => n.trim());

    if (emails.length === 0) {
      showMessage("error", "Please paste at least one email address.");
      return;
    }

    const students = emails.map((email, i) => ({
      email,
      name: names[i] || "",
    }));

    setBulkState("loading");

    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || "Failed to add students");
      }

      const result = await res.json();
      setBulkResult(result);
      setBulkState("success");
      setBulkEmails("");
      setBulkNames("");
      router.refresh();
    } catch (err) {
      setBulkResult(null);
      setBulkState("error");
      showMessage("error", `Bulk add failed: ${err}`);
      // Reset after a moment so they can retry
      setTimeout(() => setBulkState("idle"), 3000);
    }
  };

  const closeBulkOverlay = () => {
    setBulkState("idle");
    setBulkResult(null);
  };

  // Count parsed emails for preview
  const parsedEmailCount = bulkEmails
    .split("\n")
    .filter((e) => e.trim().length > 0).length;

  // ----- Test Handlers -----
  const handleAddTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const formData = new FormData(form);
      const payload = {
        title: formData.get("title") as string,
        subject: (formData.get("subject") as string) || "General",
        formUrl: formData.get("formUrl") as string,
        totalMarks: Number(formData.get("totalMarks")),
      };

      if (!payload.title || !payload.formUrl || !payload.totalMarks) {
        showMessage('error', 'Please fill all required fields.');
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || 'Server error');
      }

      form.reset();
      showMessage('success', 'Test created successfully!');
      router.refresh();
    } catch (err) {
      showMessage('error', `Failed to add test: ${err}`);
    }
    setLoading(false);
  };

  const toggleTestActive = async (testId: string, current: boolean) => {
    setLoading(true);
    await fetch("/api/admin/tests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId, isActive: !current }),
    });
    router.refresh();
    setLoading(false);
  };

  const deleteTest = async (testId: string) => {
    if (!confirm(`Delete this test permanently?`)) return;
    setLoading(true);
    await fetch("/api/admin/tests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId }),
    });
    showMessage('success', 'Test deleted.');
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{animationDelay: '0.15s'}}>

      {/* ===== BULK ADD OVERLAY ===== */}
      {(bulkState === "loading" || bulkState === "success") && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10, 14, 26, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            animation: "fade-in-up 0.4s ease-out forwards",
          }}
        >
          {bulkState === "loading" && (
            <div style={{ textAlign: "center" }}>
              {/* Animated spinner */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 28px",
                  borderRadius: "50%",
                  border: "4px solid rgba(99, 102, 241, 0.15)",
                  borderTopColor: "#6366f1",
                  animation: "bulk-spin 0.8s linear infinite",
                }}
              />
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 10,
                }}
              >
                Adding Students...
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                Please wait while we register all students to Osteon
              </p>
            </div>
          )}

          {bulkState === "success" && bulkResult && (
            <div style={{ textAlign: "center", animation: "scale-in 0.4s ease-out forwards" }}>
              {/* Success checkmark */}
              <div
                style={{
                  width: 88,
                  height: 88,
                  margin: "0 auto 24px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "3px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  boxShadow: "0 0 40px rgba(16, 185, 129, 0.2)",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#34d399",
                  marginBottom: 8,
                }}
              >
                All Students Added!
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.95rem",
                  marginBottom: 6,
                  maxWidth: 380,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{bulkResult.added}</span> student{bulkResult.added !== 1 ? "s" : ""} registered
                successfully. They can now access Osteon.
              </p>
              {bulkResult.failed > 0 && (
                <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 6 }}>
                  ⚠ {bulkResult.failed} failed — {bulkResult.errors.slice(0, 3).join(", ")}
                </p>
              )}
              <button
                onClick={closeBulkOverlay}
                className="btn-glow"
                style={{ marginTop: 24, fontSize: "0.85rem", padding: "0.7rem 2.5rem" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spinner keyframe (injected inline) */}
      <style>{`
        @keyframes bulk-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Toast Message */}
      {message && (
        <div className={`animate-scale-in fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/40 text-red-300'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Tab Selectors */}
      <div className="glass-card p-1.5 flex gap-1.5 w-fit">
        <button
          onClick={() => setActiveTab("students")}
          className={`py-2.5 px-6 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "students"
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
          }`}
        >
          👥 Students
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`py-2.5 px-6 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "tests"
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
          }`}
        >
          📝 Tests
        </button>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 w-full rounded-full overflow-hidden bg-white/5">
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* STUDENT TAB */}
      {activeTab === "students" && (
        <div className="glass-card p-6 md:p-8 space-y-6">
          {/* Single Student Add */}
          <form onSubmit={handleAddStudent} className="space-y-4 p-5 rounded-xl border border-[var(--border)] bg-white/[0.02]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <span>➕</span> Add New Student
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Student Email *</label>
                <input name="email" type="email" required className="input-dark" placeholder="student@gmail.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Name (Optional)</label>
                <input name="name" type="text" className="input-dark" placeholder="Student Name" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-glow text-xs py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              Add Verified Student
            </button>
          </form>

          {/* ===== BULK ADD SECTION ===== */}
          <div className="space-y-4 p-5 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.03]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Bulk Add Students
              </h3>
              {parsedEmailCount > 0 && (
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  {parsedEmailCount} student{parsedEmailCount !== 1 ? "s" : ""} detected
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Paste a full column of student emails and names below — one per line. Copy directly from Excel, Google Sheets, or any list.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                  Student Emails * <span className="text-[var(--text-muted)] font-normal normal-case">(one per line)</span>
                </label>
                <textarea
                  id="bulk-emails-input"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  className="input-dark"
                  rows={8}
                  placeholder={"ahmed@gmail.com\nsara@gmail.com\nali@gmail.com"}
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: "1.7" }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                  Student Names <span className="text-[var(--text-muted)] font-normal normal-case">(one per line, optional)</span>
                </label>
                <textarea
                  id="bulk-names-input"
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  className="input-dark"
                  rows={8}
                  placeholder={"Ahmed Khan\nSara Ali\nAli Hassan"}
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: "1.7" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={parsedEmailCount === 0 || bulkState === "loading"}
                className="btn-glow text-xs py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Add {parsedEmailCount > 0 ? `${parsedEmailCount} Students` : "Students"}
              </button>
              {parsedEmailCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setBulkEmails(""); setBulkNames(""); }}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Access</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {initialStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <span className="text-3xl block mb-2">👤</span>
                      <span className="text-[var(--text-muted)] italic text-sm">No students registered yet.</span>
                    </td>
                  </tr>
                )}
                {initialStudents.map((s) => (
                  <tr key={s.email} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[var(--text-primary)]">{s.email}</div>
                      {s.name && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.name}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${s.isPaid ? 'badge-success' : 'badge-danger'}`}>
                        {s.isPaid ? '✓ ENABLED' : '✗ REVOKED'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-muted)] font-medium text-xs hidden sm:table-cell">
                      {s.addedAt ? new Date(s.addedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button onClick={() => togglePaid(s.email, s.isPaid)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors">
                        Toggle
                      </button>
                      <button onClick={() => deleteStudent(s.email)} className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TESTS TAB */}
      {activeTab === "tests" && (
        <div className="glass-card p-6 md:p-8 space-y-6">
          <form onSubmit={handleAddTest} className="space-y-4 p-5 rounded-xl border border-[var(--border)] bg-white/[0.02]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <span>➕</span> Add New Test
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Test Title *</label>
                <input name="title" required className="input-dark" placeholder="Anatomy 101 Finals" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Subject</label>
                <input name="subject" className="input-dark" placeholder="Pre-Clinical" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Total Marks *</label>
                <input name="totalMarks" type="number" min="1" step="1" required className="input-dark" placeholder="100" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Google Form URL *</label>
              <input name="formUrl" type="url" required className="input-dark" placeholder="https://docs.google.com/forms/d/e/.../viewform" />
            </div>
            <button type="submit" disabled={loading} className="btn-glow text-xs py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              Save Test
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Test</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Marks</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {initialTests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <span className="text-3xl block mb-2">📝</span>
                      <span className="text-[var(--text-muted)] italic text-sm">No tests registered yet.</span>
                    </td>
                  </tr>
                )}
                {initialTests.map((t) => (
                  <tr key={t.testId} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[var(--text-primary)]">{t.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.subject}</div>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)] font-bold">
                      {t.totalMarks}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${t.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {t.isActive ? '👁 VISIBLE' : '🙈 HIDDEN'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button onClick={() => toggleTestActive(t.testId, t.isActive)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors">
                        Toggle
                      </button>
                      <button onClick={() => deleteTest(t.testId)} className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
