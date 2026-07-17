import { NextResponse } from "next/server";
import { requireAuth, getFolderStats } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get("path") || "";
    const stats = await getFolderStats(folderPath);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHORIZED") return NextResponse.json({ message: "Auth required" }, { status: 401 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
