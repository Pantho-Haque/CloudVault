import { NextResponse } from "next/server";
import { requireAuth, createFileShareLink, removeShareLink } from "@/lib/auth";
import { getDb } from "@/lib/db";

function handleAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "UNAUTHORIZED") return NextResponse.json({ message: "Auth required" }, { status: 401 });
  return NextResponse.json({ message: "Error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    const database = await getDb();

    let rows;
    if (filePath) {
      rows = database.prepare(
        "SELECT id, file_path, created_by, (CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END) as has_password, expires_at, download_count, max_downloads, created_at FROM share_links WHERE file_path = ? AND created_by = ? ORDER BY created_at DESC"
      ).all(filePath, user.userId);
    } else {
      rows = database.prepare(
        "SELECT id, file_path, created_by, (CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END) as has_password, expires_at, download_count, max_downloads, created_at FROM share_links WHERE created_by = ? ORDER BY created_at DESC"
      ).all(user.userId);
    }

    return NextResponse.json({ links: rows });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { filePath, password, expiresInHours, maxDownloads } = await request.json();
    if (!filePath) return NextResponse.json({ message: "filePath required" }, { status: 400 });
    const linkId = await createFileShareLink(filePath, user.userId, password, expiresInHours, maxDownloads);
    return NextResponse.json({ linkId, url: `/shared/${linkId}` });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuth(request);

    let linkId: string | null = null;

    const { searchParams } = new URL(request.url);
    linkId = searchParams.get("id");

    if (!linkId) {
      try {
        const body = await request.json();
        linkId = body.linkId || body.id;
      } catch {}
    }

    if (!linkId) return NextResponse.json({ message: "id required" }, { status: 400 });
    await removeShareLink(linkId);
    return NextResponse.json({ message: "Link deleted" });
  } catch (error) {
    return handleAuthError(error);
  }
}
