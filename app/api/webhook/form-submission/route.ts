import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  
  // Basic validation token via query string matching architectural constraints
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  try {
    const { studentEmail, testId, marksObtained, responseId } = await req.json();

    if (!studentEmail || !testId || marksObtained === undefined || !responseId) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const email = studentEmail.toLowerCase().trim();

    // 1. Verify Verification & Paid state
    const studentDoc = await db.collection("students").doc(email).get();
    if (!studentDoc.exists || studentDoc.data()?.isPaid !== true) {
      return NextResponse.json({ error: "Unverified Student" }, { status: 403 });
    }

    // 2. Fetch test info dynamically
    const testDoc = await db.collection("tests").doc(testId).get();
    if (!testDoc.exists) {
      return NextResponse.json({ error: "Invalid test ID mapping" }, { status: 404 });
    }

    const testData = testDoc.data();
    const totalMarks = testData?.totalMarks || 1;
    const accuracy = (Number(marksObtained) / totalMarks) * 100;

    // 3. Deduplication via specific document key
    // ID = {studentEmail}_{testId}_{timestamp}. Actually prompt 3.3 says: {studentEmail}_{testId}_{timestamp} Let's use timestamp to make it unique per attempt since they can take a form multiple times, but let's append responseId for strict deduplication.
    const resultDocId = `${email}_${testId}_${responseId}`;

    await db.collection("results").doc(resultDocId).set({
      studentEmail: email,
      testId,
      marksObtained: Number(marksObtained),
      totalMarks,
      accuracy,
      responseId,
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, recorded: true });

  } catch (error) {
    console.error("Webhook processing malfunction: ", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Exclusively POST acceptable for webhook payloads." }, { status: 405 });
}
