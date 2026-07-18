import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import {
  ensureStorageDir,
  refreshManifest,
  getFiles,
  addToManifest,
  removeFromManifest,
} from "@/lib/storage";
import { addClient, removeClient, broadcastFileChange, startKeepAlive } from "@/lib/sse";

startKeepAlive();

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await ensureStorageDir();
    await refreshManifest();
    initialized = true;
  }
}

export async function GET(request: Request) {
  await ensureInitialized();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  const subpath = searchParams.get("path") || "";
  const format = searchParams.get("format");
  const resource = searchParams.get("resource");

  // Storage stats for any authenticated user
  if (resource === "storage") {
    try {
      const { requireAuth } = await import("@/lib/auth");
      await requireAuth(request);
      const { getAllEntries } = await import("@/lib/storage");
      const { statfsSync } = await import("fs");
      const entries = getAllEntries();
      const totalUsed = entries.reduce((sum, f) => sum + (f.size || 0), 0);
      const disk = statfsSync(config.storageDir);
      const diskTotal = disk.blocks * disk.bsize;
      const diskAvail = disk.bavail * disk.bsize;
      return NextResponse.json({ storageUsed: totalUsed, storageQuota: diskTotal, storageAvailable: diskAvail });
    } catch {
      return NextResponse.json({ storageUsed: 0, storageQuota: 0, storageAvailable: 0 });
    }
  }

  // Storage breakdown for any authenticated user
  if (resource === "storage-breakdown") {
    try {
      const { requireAuth } = await import("@/lib/auth");
      await requireAuth(request);
      const { getAllEntries } = await import("@/lib/storage");
      const entries = getAllEntries();
      const extMap = new Map<string, number>();
      for (const f of entries) {
        if (f.isDirectory || f.size <= 0) continue;
        const dotIdx = f.name.lastIndexOf(".");
        const ext = dotIdx > 0 ? f.name.slice(dotIdx + 1).toLowerCase() : "other";
        extMap.set(ext, (extMap.get(ext) || 0) + f.size);
      }
      const breakdown = Array.from(extMap.entries())
        .map(([ext, size]) => ({ ext, size }))
        .sort((a, b) => b.size - a.size);
      return NextResponse.json({ breakdown });
    } catch {
      return NextResponse.json({ breakdown: [] });
    }
  }

  // SSE stream for real-time updates
  if (searchParams.has("stream")) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));
        const client = addClient(controller);
        request.signal.addEventListener("abort", () => {
          removeClient(client);
          try { controller.close(); } catch { /* already closed */ }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // File download
  if (fileName) {
    try {
      const filePath = path.join(config.storageDir, fileName);
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json({ message: "File not found" }, { status: 404 });
      }

      const fileBuffer = await fs.readFile(filePath);
      const extension = path.extname(fileName).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".txt": "text/plain",
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
        ".webp": "image/webp",
        ".webm": "video/webm",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };

      const contentType = contentTypeMap[extension] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } catch {
      return NextResponse.json(
        { message: "Error downloading file" },
        { status: 500 }
      );
    }
  }

  // ZIP download not implemented to avoid native dependencies.
  if (format === "zip" && searchParams.has("files")) {
    return NextResponse.json(
      { message: "Batch zip download not available. Use batch download instead." },
      { status: 501 }
    );
  }

  // List files in directory
  try {
    await ensureStorageDir();
    const allFiles = getFiles(subpath);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const total = allFiles.length;

    if (limit > 0) {
      const files = allFiles.slice(offset, offset + limit);
      return NextResponse.json({
        files,
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
        timestamp: Date.now(),
        path: subpath,
      });
    }

    return NextResponse.json({
      files: allFiles,
      total,
      offset: 0,
      limit: 0,
      hasMore: false,
      timestamp: Date.now(),
      path: subpath,
    });
  } catch {
    return NextResponse.json(
      { message: "Error listing files" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await ensureInitialized();

  try {
    const { searchParams } = new URL(request.url);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetDir = (formData.get("path") as string) || "";

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > config.maxUploadSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { message: `File exceeds maximum upload size of ${config.maxUploadSizeMB}MB` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^\w\s.\-()]/gi, "");
    const filePath = targetDir
      ? path.join(config.storageDir, targetDir, sanitizedName)
      : path.join(config.storageDir, sanitizedName);

    const conflict = searchParams.get("conflict");
    if (conflict !== "overwrite") {
      try {
        await fs.access(filePath);
        return NextResponse.json(
          { message: "File already exists", conflict: true, fileName: sanitizedName },
          { status: 409 }
        );
      } catch {
        // File doesn't exist, proceed
      }
    }

    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const relativePath = path.relative(config.storageDir, filePath);
    const stats = await fs.stat(filePath);

    addToManifest({
      name: sanitizedName,
      path: relativePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      isDirectory: false,
    });

    broadcastFileChange("created", relativePath);

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        name: sanitizedName,
        path: relativePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Error uploading file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await ensureInitialized();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  const subpath = searchParams.get("path") || "";

  // Delete folder
  if (searchParams.has("folder")) {
    const folderName = searchParams.get("folder")!;
    const folderPath = subpath
      ? path.join(config.storageDir, subpath, folderName)
      : path.join(config.storageDir, folderName);

    try {
      await fs.access(folderPath);
    } catch {
      return NextResponse.json({ message: "Folder not found" }, { status: 404 });
    }

    try {
      const trashDir = path.join(config.storageDir, ".trash");
      await fs.mkdir(trashDir, { recursive: true });
      const trashPath = path.join(trashDir, `${Date.now()}_${folderName.replace(/[\/\\]/g, "_")}`);
      await fs.rename(folderPath, trashPath);

      const relativePath = subpath ? `${subpath}/${folderName}` : folderName;
      removeFromManifest(relativePath);
      broadcastFileChange("deleted", relativePath);
      return NextResponse.json({ message: "Folder moved to trash", timestamp: Date.now() });
    } catch {
      return NextResponse.json({ message: "Error deleting folder" }, { status: 500 });
    }
  }

  if (!fileName) {
    return NextResponse.json(
      { message: "No filename provided" },
      { status: 400 }
    );
  }

  const filePath = subpath
    ? path.join(config.storageDir, subpath, fileName)
    : path.join(config.storageDir, fileName);

  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  try {
    // Move to trash instead of permanent delete
    const trashDir = path.join(config.storageDir, ".trash");
    await fs.mkdir(trashDir, { recursive: true });

    const relativePath = subpath ? `${subpath}/${fileName}` : fileName;
    const trashPath = path.join(trashDir, `${Date.now()}_${fileName.replace(/[\/\\]/g, "_")}`);
    await fs.rename(filePath, trashPath);

    removeFromManifest(relativePath);
    broadcastFileChange("deleted", relativePath);

    return NextResponse.json({
      message: "File deleted successfully",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { message: "Error deleting file" },
      { status: 500 }
    );
  }
}
