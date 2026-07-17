import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ensureStorageDir, addToManifest, removeFromManifest } from "@/lib/storage";
import { broadcastFileChange } from "@/lib/sse";

export async function POST(request: Request) {
  await ensureStorageDir();

  try {
    const { name, parentPath = "" } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ message: "Folder name is required" }, { status: 400 });
    }

    if (name.includes("/") || name.includes("\\") || name === "." || name === "..") {
      return NextResponse.json({ message: "Invalid folder name" }, { status: 400 });
    }

    const folderPath = parentPath
      ? path.join(config.storageDir, parentPath, name)
      : path.join(config.storageDir, name);

    try {
      await fs.access(folderPath);
      return NextResponse.json({ message: "Folder already exists" }, { status: 409 });
    } catch {
      // Folder doesn't exist, good
    }

    await fs.mkdir(folderPath, { recursive: true });
    const relativePath = path.relative(config.storageDir, folderPath);
    addToManifest({
      name,
      path: relativePath,
      size: 0,
      modified: new Date().toISOString(),
      isDirectory: true,
    });

    broadcastFileChange("created", relativePath);

    return NextResponse.json({
      message: "Folder created successfully",
      folder: { name, path: relativePath },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ message: "Error creating folder" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await ensureStorageDir();

  try {
    const { oldPath, newName } = await request.json();

    if (!oldPath || !newName) {
      return NextResponse.json({ message: "oldPath and newName are required" }, { status: 400 });
    }

    const oldFullPath = path.join(config.storageDir, oldPath);
    const parentDir = path.dirname(oldFullPath);
    const newFullPath = path.join(parentDir, newName);

    try {
      await fs.access(oldFullPath);
    } catch {
      return NextResponse.json({ message: "Folder not found" }, { status: 404 });
    }

    try {
      await fs.access(newFullPath);
      return NextResponse.json({ message: "A folder with that name already exists" }, { status: 409 });
    } catch {
      // Good, doesn't exist
    }

    await fs.rename(oldFullPath, newFullPath);
    removeFromManifest(oldPath);
    const newPath = path.relative(config.storageDir, newFullPath);
    addToManifest({
      name: newName,
      path: newPath,
      size: 0,
      modified: new Date().toISOString(),
      isDirectory: true,
    });

    broadcastFileChange("moved", newPath);

    return NextResponse.json({
      message: "Folder renamed successfully",
      folder: { name: newName, path: newPath },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Rename folder error:", error);
    return NextResponse.json({ message: "Error renaming folder" }, { status: 500 });
  }
}
