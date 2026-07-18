import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

async function verifyShareLink(linkId: string, password?: string) {
  const database = await getDb();
  const link = database.prepare("SELECT * FROM share_links WHERE id = ?").get(linkId) as {
    id: string;
    file_path: string;
    password_hash: Buffer | null;
    password_salt: Buffer | null;
    expires_at: string | null;
    download_count: number;
    max_downloads: number | null;
  } | undefined;

  if (!link) return { success: false, error: "Share link not found" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { success: false, error: "Share link has expired" };
  if (link.max_downloads && link.download_count >= link.max_downloads) return { success: false, error: "Download limit reached" };

  if (link.password_hash && link.password_salt) {
    if (!password) return { success: false, error: "Password required" };
    const { verifyPassword } = await import("@/lib/auth");
    const valid = await verifyPassword(password, link.password_hash, link.password_salt);
    if (!valid) return { success: false, error: "Invalid password" };
  }

  return { success: true, filePath: link.file_path };
}

async function serveFile(filePath: string) {
  const fullPath = path.join(config.storageDir, filePath);
  try {
    await fs.access(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(fullPath);
  const fileName = path.basename(filePath);
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("id");
  const password = searchParams.get("password");

  if (!linkId) return NextResponse.json({ message: "Link ID required" }, { status: 400 });

  const result = await verifyShareLink(linkId, password || undefined);
  if (!result.success) return NextResponse.json({ message: result.error }, { status: 403 });

  const database = await getDb();
  database.prepare("UPDATE share_links SET download_count = download_count + 1 WHERE id = ?").run(linkId);

  return serveFile(result.filePath!);
}

export async function POST(request: Request) {
  const { linkId, password } = await request.json();
  if (!linkId) return NextResponse.json({ message: "linkId required" }, { status: 400 });

  const result = await verifyShareLink(linkId, password);
  if (!result.success) return NextResponse.json({ message: result.error }, { status: 403 });

  return NextResponse.json({ filePath: result.filePath, fileName: path.basename(result.filePath!) });
}
