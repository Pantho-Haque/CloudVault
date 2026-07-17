import { NextResponse } from "next/server";
import { login, getSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await login(username, password, request);

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error, locked: result.locked },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: "Login successful",
      sessionId: result.sessionId,
      mustChangePassword: result.mustChangePassword,
    });

    response.headers.set("Set-Cookie", getSessionCookie(result.sessionId));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
