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
  const router = useRouter();

  // ----- Student Handlers -----
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        name: formData.get("name"),
      }),
    });
    e.currentTarget.reset();
    router.refresh();
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
    if (!confirm(`Are you sure you want to remove access for ${email}?`)) return;
    setLoading(true);
    await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    router.refresh();
    setLoading(false);
  };

  // ----- Test Handlers -----
  const handleAddTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        subject: formData.get("subject"),
        formUrl: formData.get("formUrl"),
        totalMarks: Number(formData.get("totalMarks")),
      }),
    });
    e.currentTarget.reset();
    router.refresh();
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
    router.refresh();
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-300 focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none rounded-lg text-sm font-medium bg-white transition-colors";
  const labelClass = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("students")}
          className={`py-3 px-8 font-semibold text-sm border-b-2 transition-colors ${activeTab === "students" ? "border-[#0B1E40] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Manage Students
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`py-3 px-8 font-semibold text-sm border-b-2 transition-colors ${activeTab === "tests" ? "border-[#0B1E40] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Manage Tests
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
        </div>
      )}

      {/* STUDENT TAB */}
      {activeTab === "students" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          <form onSubmit={handleAddStudent} className="space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Student Email</label>
                <input name="email" type="email" required className={inputClass} placeholder="student@gmail.com" />
              </div>
              <div>
                <label className={labelClass}>Name (Optional)</label>
                <input name="name" type="text" className={inputClass} placeholder="Student Name" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full md:w-auto bg-[#0B1E40] text-white py-2.5 px-8 rounded-lg font-bold text-sm hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
              Add Verified Student
            </button>
          </form>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Paid Access</th>
                  <th className="py-4 px-6 hidden sm:table-cell">Date Verified</th>
                  <th className="py-4 px-6 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 bg-white">
                {initialStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">No students registered yet.</td>
                  </tr>
                )}
                {initialStudents.map((s) => (
                  <tr key={s.email} className="hover:bg-slate-50">
                    <td className="py-4 px-6 text-slate-900">
                      <div className="font-bold">{s.email}</div>
                      {s.name && <div className="text-xs text-slate-500 font-medium mt-0.5">{s.name}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${s.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.isPaid ? 'ENABLED' : 'REVOKED'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium hidden sm:table-cell">
                      {s.addedAt ? new Date(s.addedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-4 px-6 text-right space-x-3 text-xs font-bold uppercase">
                      <button onClick={() => togglePaid(s.email, s.isPaid)} className="text-blue-600 hover:text-blue-800 tracking-wide transition-colors">
                        Toggle
                      </button>
                      <button onClick={() => deleteStudent(s.email)} className="text-red-500 hover:text-red-700 tracking-wide transition-colors">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          <form onSubmit={handleAddTest} className="space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Test Title</label>
                <input name="title" required className={inputClass} placeholder="Anatomy 101 Finals" />
              </div>
              <div>
                <label className={labelClass}>Subject Group</label>
                <input name="subject" className={inputClass} placeholder="Pre-Clinical" />
              </div>
              <div>
                <label className={labelClass}>Total Marks</label>
                <input name="totalMarks" type="number" min="1" step="1" required className={inputClass} placeholder="100" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Google Form URL</label>
              <input name="formUrl" type="url" required className={inputClass} placeholder="https://docs.google.com/forms/d/e/.../viewform" />
            </div>
            <button type="submit" disabled={loading} className="w-full md:w-auto bg-[#0B1E40] text-white py-2.5 px-8 rounded-lg font-bold text-sm hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
              Save Test
            </button>
          </form>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Assigned Test</th>
                  <th className="py-4 px-6">Max Marks</th>
                  <th className="py-4 px-6">Visibility</th>
                  <th className="py-4 px-6 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 bg-white">
                {initialTests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">No tests registered yet.</td>
                  </tr>
                )}
                {initialTests.map((t) => (
                  <tr key={t.testId} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{t.subject}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-bold">
                      {t.totalMarks}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                        {t.isActive ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3 text-xs font-bold uppercase">
                      <button onClick={() => toggleTestActive(t.testId, t.isActive)} className="text-blue-600 hover:text-blue-800 tracking-wide transition-colors">
                        Toggle
                      </button>
                      <button onClick={() => deleteTest(t.testId)} className="text-red-500 hover:text-red-700 tracking-wide transition-colors">
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
