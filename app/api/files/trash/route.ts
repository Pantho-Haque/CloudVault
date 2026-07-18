import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ensureStorageDir, addToManifest } from "@/lib/storage";
import { broadcastFileChange } from "@/lib/sse";

export async function GET() {
  await ensureStorageDir();

  const trashDir = path.join(config.storageDir, ".trash");
  try {
    await fs.access(trashDir);
  } catch {
    return NextResponse.json({ files: [], timestamp: Date.now() });
  }

  try {
    const items = await fs.readdir(trashDir);
    const files = [];

    for (const item of items) {
      const itemPath = path.join(trashDir, item);
      try {
        const stats = await fs.stat(itemPath);
        const underscoreIdx = item.indexOf("_");
        const originalName = underscoreIdx >= 0 ? item.slice(underscoreIdx + 1) : item;
        files.push({
          trashName: item,
          name: originalName,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          deletedAt: stats.birthtime.toISOString(),
        });
      } catch {
        // skip
      }
    }

    return NextResponse.json({ files, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ files: [], timestamp: Date.now() });
  }
}

export async function POST(request: Request) {
  await ensureStorageDir();

  try {
    const { trashName } = await request.json();

    if (!trashName) {
      return NextResponse.json({ message: "trashName is required" }, { status: 400 });
    }

    const trashPath = path.join(config.storageDir, ".trash", trashName);
    try {
      await fs.access(trashPath);
    } catch {
      return NextResponse.json({ message: "File not found in trash" }, { status: 404 });
    }

    const underscoreIdx = trashName.indexOf("_");
    const originalName = underscoreIdx >= 0 ? trashName.slice(underscoreIdx + 1) : trashName;

    let restorePath = path.join(config.storageDir, originalName);
    let counter = 1;
    while (true) {
      try {
        await fs.access(restorePath);
        const ext = path.extname(originalName);
        const base = path.basename(originalName, ext);
        restorePath = path.join(config.storageDir, `${base} (${counter})${ext}`);
        counter++;
      } catch {
        break;
      }
    }

    await fs.rename(trashPath, restorePath);
    const relativePath = path.relative(config.storageDir, restorePath);
    const stats = await fs.stat(restorePath);

    addToManifest({
      name: path.basename(restorePath),
      path: relativePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      isDirectory: false,
    });

    broadcastFileChange("created", relativePath);

    return NextResponse.json({
      message: "File restored successfully",
      file: { name: path.basename(restorePath), path: relativePath },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ message: "Error restoring file" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureStorageDir();

  let trashName: string | null = null;

  const { searchParams } = new URL(request.url);
  trashName = searchParams.get("trashName");

  if (!trashName) {
    try {
      const body = await request.json();
      trashName = body.trashName;
    } catch {}
  }

  if (!trashName) {
    try {
      const trashDir = path.join(config.storageDir, ".trash");
      await fs.rm(trashDir, { recursive: true, force: true });
      await fs.mkdir(trashDir, { recursive: true });
      return NextResponse.json({ message: "Trash emptied", timestamp: Date.now() });
    } catch {
      return NextResponse.json({ message: "Error emptying trash" }, { status: 500 });
    }
  }

  const trashPath = path.join(config.storageDir, ".trash", trashName);
  try {
    await fs.access(trashPath);
  } catch {
    return NextResponse.json({ message: "File not found in trash" }, { status: 404 });
  }

  try {
    await fs.rm(trashPath, { recursive: true, force: true });
    return NextResponse.json({ message: "File permanently deleted", timestamp: Date.now() });
  } catch {
    return NextResponse.json({ message: "Error deleting file" }, { status: 500 });
  }
}
