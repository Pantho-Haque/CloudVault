import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ensureStorageDir, removeFromManifest, addToManifest } from "@/lib/storage";
import { broadcastFileChange } from "@/lib/sse";

export async function POST(request: Request) {
  await ensureStorageDir();

  try {
    const { source, destination } = await request.json();

    if (!source || !destination) {
      return NextResponse.json(
        { message: "source and destination are required" },
        { status: 400 }
      );
    }

    const sourcePath = path.join(config.storageDir, source);
    const destPath = path.join(config.storageDir, destination);

    try {
      await fs.access(sourcePath);
    } catch {
      return NextResponse.json({ message: "Source not found" }, { status: 404 });
    }

    // Prevent moving to own subtree
    if (destPath.startsWith(sourcePath + path.sep) || destPath === sourcePath) {
      return NextResponse.json(
        { message: "Cannot move a folder into itself" },
        { status: 400 }
      );
    }

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.rename(sourcePath, destPath);

    removeFromManifest(source);
    const stats = await fs.stat(destPath);
    const isDir = stats.isDirectory();

    addToManifest({
      name: path.basename(destPath),
      path: destination,
      size: isDir ? 0 : stats.size,
      modified: stats.mtime.toISOString(),
      isDirectory: isDir,
    });

    broadcastFileChange("moved", destination);

    return NextResponse.json({
      message: "File moved successfully",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Move error:", error);
    return NextResponse.json({ message: "Error moving file" }, { status: 500 });
  }
}
