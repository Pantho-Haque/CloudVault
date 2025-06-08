import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Define the upload directory path
const uploadDir = path.join(process.cwd(), "uploads");
// Track file changes to support long polling
let lastFileChange = Date.now();
let clients: { resolveFunction: () => void }[] = [];

// Ensure the upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Helper function to get file stats with name
async function getFileStats(fileName: string) {
  const filePath = path.join(uploadDir, fileName);
  const stats = await fs.stat(filePath);
  return {
    name: fileName,
    size: stats.size,
    modified: stats.mtime,
    stats: stats,
  };
}

// Notify all waiting clients about changes
function notifyClients() {
  lastFileChange = Date.now();
  const currentClients = [...clients];
  clients = [];
  currentClients.forEach((client) => client.resolveFunction());
}

// Long polling wait function
async function waitForChanges(since: number): Promise<boolean> {
  if (since < lastFileChange) {
    return true;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clients = clients.filter((c) => c.resolveFunction !== resolve);
      resolve(false);
    }, 30000); // 30 seconds timeout

    clients.push({
      resolveFunction: () => {
        clearTimeout(timeout);
        resolve(true);
      },
    });
  });
}

// GET handler for file listing and file download
export async function GET(request: Request) {
  await ensureUploadDir();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  const since = parseInt(searchParams.get("since") || "0", 10);

  // Handle long polling for file list changes
  if (searchParams.has("poll") && !fileName) {
    const hasChanges = await waitForChanges(since);
    return NextResponse.json({
      changes: hasChanges,
      timestamp: lastFileChange,
    });
  }

  // If fileName is provided, handle file download
  if (fileName) {
    try {
      const filePath = path.join(uploadDir, fileName);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json(
          { message: "File not found" },
          { status: 404 }
        );
      }

      // Read the file
      const fileBuffer = await fs.readFile(filePath);

      // Determine content type (basic implementation)
      let contentType = "application/octet-stream";
      const extension = path.extname(fileName).toLowerCase();
      const contentTypeMap = {
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
      };

      if (contentTypeMap[extension as keyof typeof contentTypeMap]) {
        contentType = contentTypeMap[extension as keyof typeof contentTypeMap];
      }

      // Create response with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } catch {
      console.error("Download error:");
      return NextResponse.json(
        { message: "Error downloading file" },
        { status: 500 }
      );
    }
  }

  // Otherwise, list all files
  try {
    const files = await fs.readdir(uploadDir);
    const fileStats = await Promise.all(
      files.map(async (fileName) => {
        try {
          return await getFileStats(fileName);
        } catch {
          console.error(`Error getting stats for ${fileName}:`);
          return null;
        }
      })
    );

    // Filter out any null values (files that had errors)
    const validFiles = fileStats.filter(Boolean);

    return NextResponse.json({
      files: validFiles,
      timestamp: lastFileChange,
    });
  } catch {
    console.error("Error listing files:");
    return NextResponse.json(
      { message: "Error listing files" },
      { status: 500 }
    );
  }
}

// POST handler for file upload
export async function POST(request: Request) {
  await ensureUploadDir();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Get the file data
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/[^\w\s.-]/gi, ""); // Sanitize filename
    const filepath = path.join(uploadDir, filename);

    // Write the file to the upload directory
    await fs.writeFile(filepath, buffer);

    // Get file stats for the response
    const fileStats = await getFileStats(filename);

    // Notify clients about the change
    notifyClients();

    return NextResponse.json({
      message: "File uploaded successfully",
      file: fileStats,
      timestamp: lastFileChange,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Error uploading file" },
      { status: 500 }
    );
  }
}

// DELETE handler for file deletion
export async function DELETE(request: Request) {
  await ensureUploadDir();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");

  if (!fileName) {
    return NextResponse.json(
      { message: "No filename provided" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(uploadDir, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    // Delete the file
    await fs.unlink(filePath);

    // Notify clients about the change
    notifyClients();

    return NextResponse.json({
      message: "File deleted successfully",
      timestamp: lastFileChange,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { message: "Error deleting file" },
      { status: 500 }
    );
  }
}
