import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".ogg"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ message: "path required" }, { status: 400 });
  }

  const fullPath = path.join(config.storageDir, filePath);

  try {
    await fs.access(fullPath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    const fileBuffer = await fs.readFile(fullPath);
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
    };
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeMap[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  if (VIDEO_EXTS.has(ext)) {
    const extIconMap: Record<string, { color: string; label: string }> = {
      ".mp4": { color: "db2777", label: "VID" },
      ".webm": { color: "db2777", label: "VID" },
      ".ogg": { color: "db2777", label: "VID" },
    };
    const info = extIconMap[ext] || { color: "6b7280", label: "VID" };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="12" fill="#${info.color}15"/>
      <rect x="1" y="1" width="78" height="78" rx="11" fill="none" stroke="#${info.color}30" stroke-width="1"/>
      <text x="40" y="46" text-anchor="middle" fill="#${info.color}" font-family="system-ui,sans-serif" font-size="14" font-weight="700">${info.label}</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }

  const extIconMap: Record<string, { color: string; label: string }> = {
    ".pdf": { color: "dc2626", label: "PDF" },
    ".doc": { color: "2563eb", label: "DOC" },
    ".docx": { color: "2563eb", label: "DOC" },
    ".xls": { color: "16a34a", label: "XLS" },
    ".xlsx": { color: "16a34a", label: "XLS" },
    ".csv": { color: "16a34a", label: "CSV" },
    ".txt": { color: "6b7280", label: "TXT" },
    ".md": { color: "6b7280", label: "MD" },
    ".json": { color: "eab308", label: "JSON" },
    ".js": { color: "eab308", label: "JS" },
    ".ts": { color: "2563eb", label: "TS" },
    ".html": { color: "ea580c", label: "HTML" },
    ".css": { color: "2563eb", label: "CSS" },
    ".zip": { color: "d97706", label: "ZIP" },
    ".rar": { color: "d97706", label: "RAR" },
    ".mp3": { color: "ea580c", label: "MP3" },
    ".wav": { color: "ea580c", label: "WAV" },
  };

  const info = extIconMap[ext] || { color: "6b7280", label: ext.replace(".", "").toUpperCase() || "FILE" };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="12" fill="#${info.color}15"/>
    <rect x="1" y="1" width="78" height="78" rx="11" fill="none" stroke="#${info.color}30" stroke-width="1"/>
    <text x="40" y="46" text-anchor="middle" fill="#${info.color}" font-family="system-ui,sans-serif" font-size="14" font-weight="700">${info.label}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
