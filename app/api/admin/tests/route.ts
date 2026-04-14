import { NextRequest, NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await db.collection("tests").get();
  const tests = snapshot.docs.map(doc => ({
    testId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || null,
  }));
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, subject, formUrl, totalMarks } = await req.json();
  if (!title || !formUrl || !totalMarks) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ref = await db.collection("tests").add({
    title,
    subject: subject || "General",
    formUrl,
    totalMarks: Number(totalMarks),
    isActive: true,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, testId: ref.id });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { testId } = await req.json();
  if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

  await db.collection("tests").doc(testId).delete();
  return NextResponse.json({ success: true });
}
