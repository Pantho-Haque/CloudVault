import { NextResponse } from "next/server";
import { requireAuth, changePassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = await changePassword(user.userId, oldPassword, newPassword);
    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Failed to change password" }, { status: 500 });
  }
}
