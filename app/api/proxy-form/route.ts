import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Validate session
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center">
          <h2>⚠️ Session Expired</h2>
          <p>Please <a href="/" style="color:#6366f1">sign in</a> again.</p>
        </div>
      </body></html>`,
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 2. Get testId from query
  const testId = req.nextUrl.searchParams.get("testId");
  if (!testId) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center"><h2>❌ Missing test ID</h2></div>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 3. Fetch test from Firestore
  const testDoc = await db.collection("tests").doc(testId).get();
  if (!testDoc.exists) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center"><h2>❌ Test not found</h2></div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const testData = testDoc.data();
  if (!testData?.isActive) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center"><h2>🔒 Test Inactive</h2><p>This test is no longer available.</p></div>
      </body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const formUrl = testData.formUrl;
  if (!formUrl) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center"><h2>❌ No form URL configured</h2></div>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 4. Fetch the Google Form HTML server-side
  try {
    const response = await fetch(formUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Forms returned ${response.status}`);
    }

    let html = await response.text();

    // Inject a base tag so all relative Google resources resolve correctly
    const baseUrl = new URL(formUrl);
    const baseHref = `${baseUrl.protocol}//${baseUrl.host}`;
    html = html.replace(
      "<head>",
      `<head><base href="${baseHref}">`
    );

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Form proxy error:", error);
    return new NextResponse(
      `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e1a;color:#f1f5f9">
        <div style="text-align:center">
          <h2>⚠️ Unable to load form</h2>
          <p style="color:#94a3b8;font-size:14px">Please try refreshing the page.</p>
        </div>
      </body></html>`,
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
