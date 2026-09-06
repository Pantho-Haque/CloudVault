import { NextResponse } from "next/server";
import { ensureStorageDir, getAllEntries } from "@/lib/storage";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  // Require authentication for search
  try {
    await requireAuth(request);
  } catch {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  await ensureStorageDir();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const minSize = parseInt(searchParams.get("minSize") || "0", 10);
  const maxSize = parseInt(searchParams.get("maxSize") || "0", 10);
  const modifiedAfter = searchParams.get("modifiedAfter") || "";
  const modifiedBefore = searchParams.get("modifiedBefore") || "";

  let results = getAllEntries().filter((e) => !e.isDirectory);

  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }

  if (type) {
    const lowerType = type.toLowerCase();
    results = results.filter((e) => {
      const ext = e.name.split(".").pop()?.toLowerCase() || "";
      return ext === lowerType;
    });
  }

  if (minSize > 0) {
    results = results.filter((e) => e.size >= minSize);
  }

  if (maxSize > 0) {
    results = results.filter((e) => e.size <= maxSize);
  }

  if (modifiedAfter) {
    const after = new Date(modifiedAfter).getTime();
    results = results.filter((e) => new Date(e.modified).getTime() >= after);
  }

  if (modifiedBefore) {
    const before = new Date(modifiedBefore).getTime();
    results = results.filter((e) => new Date(e.modified).getTime() <= before);
  }

  return NextResponse.json({
    files: results,
    count: results.length,
    timestamp: Date.now(),
  });
}
