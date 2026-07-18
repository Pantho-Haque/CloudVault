import { NextResponse } from "next/server";
import { requireAdmin, listUsers, createUserAccount, updateUserAccess, removeUser, forceLogout, fetchAdminStats, fetchActiveSessions } from "@/lib/auth";

function handleError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
  }
  return NextResponse.json({ message: "Internal error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");

    if (resource === "stats") {
      const stats = await fetchAdminStats();
      return NextResponse.json({ stats, storageUsed: stats.totalStorage, storageQuota: 21474836480 });
    }

    if (resource === "storage-breakdown") {
      const { getStorageBreakdown } = await import("@/lib/db");
      const breakdown = await getStorageBreakdown();
      return NextResponse.json({ breakdown });
    }

    if (resource === "sessions") {
      const sessions = await fetchActiveSessions();
      return NextResponse.json({ sessions });
    }

    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await createUserAccount(username, password, role || "read");
    return NextResponse.json({
      message: "User created",
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { message: "userId and role are required" },
        { status: 400 }
      );
    }

    await updateUserAccess(userId, role);
    return NextResponse.json({ message: "User updated" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get("userId") || "0", 10);
    const action = searchParams.get("action");
    const sessionId = searchParams.get("sessionId");

    if (action === "logout" && userId) {
      await forceLogout(userId);
      return NextResponse.json({ message: "User sessions revoked" });
    }

    if (action === "revokeSession" && sessionId) {
      const { deleteSession } = await import("@/lib/db");
      await deleteSession(sessionId);
      return NextResponse.json({ message: "Session revoked" });
    }

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await removeUser(userId);
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return handleError(error);
  }
}
