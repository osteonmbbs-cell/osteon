import { NextRequest, NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await db.collection("students").get();
  const students = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      email: doc.id,
      name: data.name || "",
      isPaid: !!data.isPaid,
      addedAt: data.addedAt ? (typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : null) : null,
      addedBy: data.addedBy || ""
    };
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const targetEmail = email.toLowerCase().trim();
    await db.collection("students").doc(targetEmail).set({
      email: targetEmail,
      name: name || "",
      isPaid: true,
      addedAt: FieldValue.serverTimestamp(),
      addedBy: session?.user?.email
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const payload = await req.json();
    const { email, isPaid } = payload;

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await db.collection("students").doc(email.toLowerCase().trim()).update({
      isPaid: !!isPaid
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await db.collection("students").doc(email.toLowerCase().trim()).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
