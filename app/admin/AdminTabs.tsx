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
