import { promises as fs } from "fs";
import path from "path";
import { config } from "./config";

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

const manifest: Map<string, FileEntry> = new Map();
let manifestTimestamp = 0;

function entryKey(relativePath: string): string {
  return relativePath;
}

async function walkDir(dir: string, baseDir: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  let items: import("fs").Dirent[];
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const item of items) {
    if (SYSTEM_DIRS.has(item.name)) continue;
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (item.isDirectory()) {
      entries.push({
        name: item.name,
        path: relativePath,
        size: 0,
        modified: "",
        isDirectory: true,
      });
      const subEntries = await walkDir(fullPath, baseDir);
      entries.push(...subEntries);
    } else {
      try {
        const stats = await fs.stat(fullPath);
        entries.push({
          name: item.name,
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          isDirectory: false,
        });
      } catch {
        // skip inaccessible files
      }
    }
  }
  return entries;
}

export async function ensureStorageDir(): Promise<void> {
  try {
    await fs.access(config.storageDir);
  } catch {
    await fs.mkdir(config.storageDir, { recursive: true });
  }
}

export async function refreshManifest(): Promise<void> {
  await ensureStorageDir();
  const entries = await walkDir(config.storageDir, config.storageDir);
  manifest.clear();
  for (const entry of entries) {
    manifest.set(entryKey(entry.path), entry);
  }
  manifestTimestamp = Date.now();
}

export function getManifestTimestamp(): number {
  return manifestTimestamp;
}

const SYSTEM_DIRS = new Set([".trash", ".thumbs", ".versions"]);

function isSystemPath(entryPath: string): boolean {
  const parts = entryPath.split(path.sep);
  return SYSTEM_DIRS.has(parts[0]);
}

export function getFiles(subdir: string = ""): FileEntry[] {
  const prefix = subdir ? subdir + path.sep : "";

  // Precompute recursive sizes for all directories
  const dirSizes = new Map<string, number>();
  for (const entry of manifest.values()) {
    if (!entry.isDirectory && entry.size > 0 && !isSystemPath(entry.path)) {
      const parts = entry.path.split(path.sep);
      for (let i = 1; i <= parts.length; i++) {
        const dirPath = parts.slice(0, i).join(path.sep);
        dirSizes.set(dirPath, (dirSizes.get(dirPath) || 0) + entry.size);
      }
    }
  }

  if (prefix) {
    const directEntries: FileEntry[] = [];
    const childDirs: FileEntry[] = [];
    const seenDirs = new Set<string>();

    for (const entry of manifest.values()) {
      if (entry.path === subdir) continue;
      if (!entry.path.startsWith(prefix)) continue;
      if (isSystemPath(entry.path)) continue;

      const rest = entry.path.slice(prefix.length);
      const firstSegment = rest.split(path.sep)[0];

      if (!rest.includes(path.sep)) {
        directEntries.push(entry);
      } else if (!seenDirs.has(firstSegment)) {
        seenDirs.add(firstSegment);
        const dirEntry = manifest.get(path.join(subdir, firstSegment));
        if (dirEntry) {
          const dirPath = path.join(subdir, firstSegment);
          childDirs.push({ ...dirEntry, size: dirSizes.get(dirPath) || 0 });
        }
      }
    }
    return [...childDirs, ...directEntries];
  }

  const topLevel: FileEntry[] = [];
  const seenDirs = new Set<string>();
  for (const entry of manifest.values()) {
    if (isSystemPath(entry.path)) continue;
    const parts = entry.path.split(path.sep);
    if (parts.length === 1) {
      topLevel.push({ ...entry, size: entry.isDirectory ? (dirSizes.get(entry.path) || 0) : entry.size });
      seenDirs.add(parts[0]);
    } else {
      const dirName = parts[0];
      if (!seenDirs.has(dirName)) {
        seenDirs.add(dirName);
        const dirEntry = manifest.get(dirName);
        if (dirEntry) {
          topLevel.push({ ...dirEntry, size: dirSizes.get(dirName) || 0 });
        }
      }
    }
  }
  return topLevel;
}

export function getFilesRecursive(subdir: string = ""): FileEntry[] {
  if (!subdir) return Array.from(manifest.values());
  return Array.from(manifest.values()).filter((e) => e.path.startsWith(subdir + path.sep) || e.path === subdir);
}

export function getFileEntry(relativePath: string): FileEntry | undefined {
  return manifest.get(relativePath);
}

export function addToManifest(entry: FileEntry): void {
  manifest.set(entryKey(entry.path), entry);
}

export function removeFromManifest(relativePath: string): void {
  manifest.delete(relativePath);
  for (const key of manifest.keys()) {
    if (key.startsWith(relativePath + path.sep)) {
      manifest.delete(key);
    }
  }
}

export function getAllEntries(): FileEntry[] {
  return Array.from(manifest.values());
}
