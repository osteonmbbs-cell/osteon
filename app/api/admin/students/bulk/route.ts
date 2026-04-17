import { NextRequest, NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "A non-empty array of students is required" },
        { status: 400 }
      );
    }

    if (students.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 students per batch" },
        { status: 400 }
      );
    }

    const results = { added: 0, failed: 0, errors: [] as string[] };

    // Process in batches of 20 to avoid Firestore write limits
    const BATCH_SIZE = 20;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const chunk = students.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const student of chunk) {
        const email = student.email?.toString().toLowerCase().trim();
        if (!email || !email.includes("@")) {
          results.failed++;
          results.errors.push(`Invalid email: "${student.email}"`);
          continue;
        }

        const ref = db.collection("students").doc(email);
        batch.set(ref, {
          email,
          name: student.name?.toString().trim() || "",
          isPaid: true,
          addedAt: FieldValue.serverTimestamp(),
          addedBy: session?.user?.email,
        });
        results.added++;
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      added: results.added,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Bulk add error:", error);
    return NextResponse.json(
      { error: "Failed to bulk add students" },
      { status: 500 }
    );
  }
}
