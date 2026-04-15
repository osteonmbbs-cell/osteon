import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { testId, marksObtained } = await req.json();

    if (!testId || marksObtained === undefined || marksObtained === null) {
      return NextResponse.json({ error: "Missing testId or marksObtained" }, { status: 400 });
    }

    const marks = Number(marksObtained);
    if (isNaN(marks) || marks < 0) {
      return NextResponse.json({ error: "Invalid marks value" }, { status: 400 });
    }

    // Fetch test to get totalMarks
    const testDoc = await db.collection("tests").doc(testId).get();
    if (!testDoc.exists) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const testData = testDoc.data();
    const totalMarks = testData?.totalMarks || 1;

    if (marks > totalMarks) {
      return NextResponse.json({ error: `Marks cannot exceed total marks (${totalMarks})` }, { status: 400 });
    }

    const accuracy = (marks / totalMarks) * 100;
    const email = session.user.email.toLowerCase().trim();
    const timestamp = Date.now();

    // Unique document ID per attempt
    const resultDocId = `${email}_${testId}_${timestamp}`;

    await db.collection("results").doc(resultDocId).set({
      studentEmail: email,
      testId,
      marksObtained: marks,
      totalMarks,
      accuracy,
      submittedAt: new Date(),
      selfReported: true,
    });

    return NextResponse.json({ success: true, accuracy: accuracy.toFixed(1) });

  } catch (error) {
    console.error("Submit result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
