import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ensureStorageDir } from "@/lib/storage";

async function getVersionDir(): Promise<string> {
  const versionsDir = path.join(config.storageDir, ".versions");
  await fs.mkdir(versionsDir, { recursive: true });
  return versionsDir;
}

// List versions of a file
export async function GET(request: Request) {
  await ensureStorageDir();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");

  if (!fileName) {
    return NextResponse.json({ message: "fileName is required" }, { status: 400 });
  }

  try {
    const versionsDir = await getVersionDir();
    const safeDirName = fileName.replace(/[\/\\]/g, "_");
    const fileVersionDir = path.join(versionsDir, safeDirName);

    try {
      await fs.access(fileVersionDir);
    } catch {
      return NextResponse.json({ versions: [], timestamp: Date.now() });
    }

    const items = await fs.readdir(fileVersionDir);
    const versions = [];

    for (const item of items) {
      const itemPath = path.join(fileVersionDir, item);
      try {
        const stats = await fs.stat(itemPath);
        // Format: timestamp_originalName
        const underscoreIdx = item.indexOf("_");
        const versionNumber = underscoreIdx >= 0 ? item.slice(0, underscoreIdx) : item;
        versions.push({
          versionId: item,
          versionNumber: parseInt(versionNumber, 10) || 0,
          name: underscoreIdx >= 0 ? item.slice(underscoreIdx + 1) : item,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      } catch {
        // skip
      }
    }

    versions.sort((a, b) => b.versionNumber - a.versionNumber);
    return NextResponse.json({ versions, timestamp: Date.now() });
  } catch (error) {
    console.error("Error listing versions:", error);
    return NextResponse.json({ versions: [], timestamp: Date.now() });
  }
}

// Save a new version (called before overwrite)
export async function POST(request: Request) {
  await ensureStorageDir();

  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ message: "fileName is required" }, { status: 400 });
    }

    const filePath = path.join(config.storageDir, fileName);
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const versionsDir = await getVersionDir();
    const safeDirName = fileName.replace(/[\/\\]/g, "_");
    const fileVersionDir = path.join(versionsDir, safeDirName);
    await fs.mkdir(fileVersionDir, { recursive: true });

    // Find next version number
    let maxVersion = 0;
    try {
      const existing = await fs.readdir(fileVersionDir);
      for (const item of existing) {
        const num = parseInt(item.split("_")[0], 10);
        if (!isNaN(num) && num > maxVersion) maxVersion = num;
      }
    } catch {
      // no existing versions
    }

    const nextVersion = maxVersion + 1;
    const versionFileName = `${nextVersion}_${path.basename(fileName)}`;
    const versionPath = path.join(fileVersionDir, versionFileName);

    await fs.copyFile(filePath, versionPath);

    // Enforce max versions
    const allVersions = await fs.readdir(fileVersionDir);
    if (allVersions.length > config.maxVersions) {
      allVersions.sort((a, b) => parseInt(a.split("_")[0], 10) - parseInt(b.split("_")[0], 10));
      const toDelete = allVersions.slice(0, allVersions.length - config.maxVersions);
      for (const old of toDelete) {
        await fs.unlink(path.join(fileVersionDir, old)).catch(() => {});
      }
    }

    return NextResponse.json({
      message: "Version saved",
      version: { versionNumber: nextVersion, fileName: versionFileName },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error saving version:", error);
    return NextResponse.json({ message: "Error saving version" }, { status: 500 });
  }
}

// Restore a version
export async function PATCH(request: Request) {
  await ensureStorageDir();

  try {
    const { fileName, versionId } = await request.json();

    if (!fileName || !versionId) {
      return NextResponse.json({ message: "fileName and versionId are required" }, { status: 400 });
    }

    const versionsDir = await getVersionDir();
    const safeDirName = fileName.replace(/[\/\\]/g, "_");
    const versionPath = path.join(versionsDir, safeDirName, versionId);

    try {
      await fs.access(versionPath);
    } catch {
      return NextResponse.json({ message: "Version not found" }, { status: 404 });
    }

    const filePath = path.join(config.storageDir, fileName);

    // Save current as a version before restoring
    try {
      await fs.access(filePath);
      const fileVersionDir = path.join(versionsDir, safeDirName);
      await fs.mkdir(fileVersionDir, { recursive: true });

      let maxVersion = 0;
      const existing = await fs.readdir(fileVersionDir);
      for (const item of existing) {
        const num = parseInt(item.split("_")[0], 10);
        if (!isNaN(num) && num > maxVersion) maxVersion = num;
      }

      const backupVersion = `${maxVersion + 1}_${path.basename(fileName)}`;
      await fs.copyFile(filePath, path.join(fileVersionDir, backupVersion));
    } catch {
      // File doesn't exist yet, no need to backup
    }

    await fs.copyFile(versionPath, filePath);

    return NextResponse.json({
      message: "Version restored",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json({ message: "Error restoring version" }, { status: 500 });
  }
}
