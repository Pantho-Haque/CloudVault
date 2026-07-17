import { NextResponse } from "next/server";
import { requireAuth, createFileShareLink, getFileShareLinks, removeShareLink } from "@/lib/auth";

function handleAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "UNAUTHORIZED") return NextResponse.json({ message: "Auth required" }, { status: 401 });
  return NextResponse.json({ message: "Error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    if (!filePath) return NextResponse.json({ message: "path required" }, { status: 400 });
    const links = await getFileShareLinks(filePath);
    return NextResponse.json({ links });
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
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("id");
    if (!linkId) return NextResponse.json({ message: "id required" }, { status: 400 });
    await removeShareLink(linkId);
    return NextResponse.json({ message: "Link deleted" });
  } catch (error) {
    return handleAuthError(error);
  }
}
