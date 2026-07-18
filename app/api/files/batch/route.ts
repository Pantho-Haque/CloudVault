import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ensureStorageDir, removeFromManifest, addToManifest } from "@/lib/storage";
import { broadcastFileChange } from "@/lib/sse";

export async function POST(request: Request) {
  await ensureStorageDir();

  try {
    const { action, files: filePaths, destination } = await request.json();

    if (!action || !filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json({ message: "action and files array are required" }, { status: 400 });
    }

    const results: { path: string; success: boolean; error?: string }[] = [];

    if (action === "delete") {
      for (const filePath of filePaths) {
        try {
          const fullPath = path.join(config.storageDir, filePath);
          await fs.access(fullPath);
          const stats = await fs.stat(fullPath);

          if (stats.isDirectory()) {
            const trashDir = path.join(config.storageDir, ".trash");
            await fs.mkdir(trashDir, { recursive: true });
            const trashPath = path.join(trashDir, `${Date.now()}_${path.basename(filePath).replace(/[\/\\]/g, "_")}`);
            await fs.rename(fullPath, trashPath);
          } else {
            const trashDir = path.join(config.storageDir, ".trash");
            await fs.mkdir(trashDir, { recursive: true });
            const trashPath = path.join(trashDir, `${Date.now()}_${path.basename(filePath).replace(/[\/\\]/g, "_")}`);
            await fs.rename(fullPath, trashPath);
          }

          removeFromManifest(filePath);
          broadcastFileChange("deleted", filePath);
          results.push({ path: filePath, success: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ path: filePath, success: false, error: msg });
        }
      }
    } else if (action === "move" && destination) {
      for (const filePath of filePaths) {
        try {
          const sourcePath = path.join(config.storageDir, filePath);
          const fileName = path.basename(filePath);
          const destPath = path.join(config.storageDir, destination, fileName);

          await fs.access(sourcePath);
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.rename(sourcePath, destPath);

          removeFromManifest(filePath);
          const newPath = path.relative(config.storageDir, destPath);
          const stats = await fs.stat(destPath);
          addToManifest({
            name: fileName,
            path: newPath,
            size: stats.isDirectory() ? 0 : stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
          });

          broadcastFileChange("moved", newPath);
          results.push({ path: filePath, success: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ path: filePath, success: false, error: msg });
        }
      }
    } else {
      return NextResponse.json({ message: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      message: `Batch ${action} completed`,
      results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Batch operation error:", error);
    return NextResponse.json({ message: "Batch operation failed" }, { status: 500 });
  }
}
