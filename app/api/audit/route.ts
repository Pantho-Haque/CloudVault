import { NextResponse } from "next/server";
import { requireAdmin, getAuditEntries } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const result = await getAuditEntries(limit, offset);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") return NextResponse.json({ message: "Auth required" }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ message: "Admin required" }, { status: 403 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
