import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// We keep this route to serve as a secure API pass-through map 
// in case legacy clients or future modules request the target blindly.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { testId } = await req.json();
    
    if (!testId) {
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    }

    // Return the internal application route representing the viewer wrapper
    // IMPORTANT: FormUrl is completely omitted from the JSON payload
    return NextResponse.json({ 
      redirectTo: `/test/${testId}` 
    });
    
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
