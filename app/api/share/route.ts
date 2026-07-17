import { NextResponse } from "next/server";
import { accessShareLink } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("id");
  const password = searchParams.get("password");

  if (!linkId) {
    return NextResponse.json({ message: "Link ID required" }, { status: 400 });
  }

  const result = await accessShareLink(linkId, password || undefined);

  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 403 });
  }

  // Serve the file
  try {
    const filePath = path.join(config.storageDir, result.filePath);
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(result.filePath);
    const extension = path.extname(fileName).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".txt": "text/plain", ".html": "text/html", ".css": "text/css",
      ".js": "text/javascript", ".json": "application/json", ".pdf": "application/pdf",
      ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4",
      ".mp3": "audio/mpeg", ".webp": "image/webp",
    };
    const contentType = contentTypeMap[extension] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const { linkId, password } = await request.json();
  if (!linkId) return NextResponse.json({ message: "linkId required" }, { status: 400 });

  const result = await accessShareLink(linkId, password);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 403 });
  }

  return NextResponse.json({ filePath: result.filePath, fileName: path.basename(result.filePath) });
}
