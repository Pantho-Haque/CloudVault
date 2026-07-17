import { NextResponse } from "next/server";
import { listUsers, createUserAccount, login, getSessionCookie } from "@/lib/auth";

export async function GET() {
  const users = await listUsers();
  return NextResponse.json({
    needsSetup: users.length === 0,
    userCount: users.length,
  });
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Only allow setup if no users exist
    const users = await listUsers();
    if (users.length > 0) {
      return NextResponse.json(
        { message: "Setup has already been completed" },
        { status: 403 }
      );
    }

    // Create the first admin user
    const user = await createUserAccount(username, password, "admin");

    // Auto-login
    const loginResult = await login(username, password);
    if ("error" in loginResult) {
      return NextResponse.json({
        message: "Admin account created. Please log in.",
        user: { id: user.id, username: user.username, role: user.role },
      });
    }

    const response = NextResponse.json({
      message: "Admin account created and logged in",
      user: { id: user.id, username: user.username, role: user.role },
    });

    response.headers.set("Set-Cookie", getSessionCookie(loginResult.sessionId));
    return response;
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { message: "Setup failed" },
      { status: 500 }
    );
  }
}
