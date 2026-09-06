import path from "path";
import { config } from "./config";

/**
 * Validates that a resolved file path is within the storage directory.
 * Returns the relative path if valid, or null if path traversal is detected.
 */
export function validatePath(userInput: string): string | null {
  // Normalize the input path
  const normalized = path.normalize(userInput);

  // Reject paths that could traverse outside storage
  if (normalized.startsWith("..") || normalized.includes("/..") || normalized.includes("\\..")) {
    return null;
  }

  // Create the full path
  const fullPath = path.join(config.storageDir, normalized);

  // Resolve to absolute path and verify it's within storage
  const absolutePath = path.resolve(fullPath);
  const absoluteStorage = path.resolve(config.storageDir);

  // Ensure the resolved path is within storage directory
  if (!absolutePath.startsWith(absoluteStorage + path.sep) && absolutePath !== absoluteStorage) {
    return null;
  }

  return normalized;
}

/**
 * Validates that a file path (with subdirectory) is within storage.
 */
export function validateFilePath(fileName: string, subpath: string = ""): string | null {
  // Sanitize the filename
  const sanitized = fileName.replace(/[^\w\s.\-()]/gi, "");

  if (!sanitized || sanitized !== fileName) {
    return null; // Sanitization changed something - potential injection attempt
  }

  const userPath = subpath ? `${subpath}/${fileName}` : fileName;
  return validatePath(userPath);
}

/**
 * Validates folder name - rejects traversal attempts
 */
export function validateFolderName(name: string): boolean {
  if (!name || name.trim() === "") return false;
  if (name.includes("/") || name.includes("\\")) return false;
  if (name === "." || name === "..") return false;
  if (name.includes("..")) return false;
  return true;
}

/**
 * Checks if a path is a system directory
 */
export function isSystemPath(filePath: string): boolean {
  const parts = filePath.split(/[\/\\]/);
  const systemDirs = [".trash", ".thumbs", ".versions"];
  return parts.some(part => systemDirs.includes(part));
}
