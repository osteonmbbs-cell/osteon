import { NextRequest, NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await db.collection("tests").get();
  const tests = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      testId: doc.id,
      title: data.title || "",
      subject: data.subject || "General",
      formUrl: data.formUrl || "",
      totalMarks: data.totalMarks || 0,
      isActive: !!data.isActive,
      createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null) : null,
    };
  });
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, subject, formUrl, totalMarks } = body;

    if (!title || !formUrl || !totalMarks) {
      return NextResponse.json({ error: "Missing required fields: title, formUrl, totalMarks" }, { status: 400 });
    }

    const ref = await db.collection("tests").add({
      title: String(title).trim(),
      subject: subject ? String(subject).trim() : "General",
      formUrl: String(formUrl).trim(),
      totalMarks: Number(totalMarks),
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, testId: ref.id });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { testId, isActive, title, subject, formUrl, totalMarks } = await req.json();
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (isActive !== undefined) updates.isActive = !!isActive;
    if (title !== undefined) updates.title = title;
    if (subject !== undefined) updates.subject = subject;
    if (formUrl !== undefined) updates.formUrl = formUrl;
    if (totalMarks !== undefined) updates.totalMarks = Number(totalMarks);

    await db.collection("tests").doc(testId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { testId } = await req.json();
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

    await db.collection("tests").doc(testId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
