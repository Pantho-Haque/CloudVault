import { NextResponse } from "next/server";
import { extractSessionId, logout, getClearCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const sessionId = extractSessionId(request);
    if (sessionId) {
      await logout(sessionId);
    }

    const response = NextResponse.json({ message: "Logged out" });
    response.headers.set("Set-Cookie", getClearCookie());
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
