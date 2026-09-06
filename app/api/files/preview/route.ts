import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { validatePath, isSystemPath } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ message: "path required" }, { status: 400 });
  }

  // Validate path to prevent path traversal attacks
  const relativePath = validatePath(filePath);
  if (!relativePath) {
    return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
  }

  // Check for system paths
  if (isSystemPath(relativePath)) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  const fullPath = path.join(config.storageDir, relativePath);

  try {
    await fs.access(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(fullPath);
  const ext = path.extname(relativePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
    ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm",
    ".ogg": "video/ogg", ".mp3": "audio/mpeg", ".wav": "audio/wav",
    ".pdf": "application/pdf",
  };

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": mimeMap[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
