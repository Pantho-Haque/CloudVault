import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Define the upload directory path
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Helper function to get file stats with name
async function getFileStats(fileName) {
  const filePath = path.join(uploadDir, fileName);
  const stats = await fs.stat(filePath);
  return {
    name: fileName,
    size: stats.size,
    modified: stats.mtime,
    stats:stats
  };
}

// GET handler for file listing and file download
export async function GET(request) {
  await ensureUploadDir();
  
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');
  
  // If fileName is provided, handle file download
  if (fileName) {
    try {
      const filePath = path.join(uploadDir, fileName);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return NextResponse.json(
          { message: 'File not found' },
          { status: 404 }
        );
      }
      
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine content type (basic implementation)
      let contentType = 'application/octet-stream';
      const extension = path.extname(fileName).toLowerCase();
      const contentTypeMap = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      
      if (contentTypeMap[extension]) {
        contentType = contentTypeMap[extension];
      }
      
      // Create response with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } catch (error) {
      console.error('Download error:', error);
      return NextResponse.json(
        { message: 'Error downloading file' },
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
        } catch (error) {
          console.error(`Error getting stats for ${fileName}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null values (files that had errors)
    const validFiles = fileStats.filter(Boolean);
    
    return NextResponse.json({ files: validFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { message: 'Error listing files' },
      { status: 500 }
    );
  }
}

// POST handler for file upload
export async function POST(request) {
  await ensureUploadDir();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get the file data
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/[^\w\s.-]/gi, ''); // Sanitize filename
    const filepath = path.join(uploadDir, filename);
    
    // Write the file to the upload directory
    await fs.writeFile(filepath, buffer);
    
    // Get file stats for the response
    const fileStats = await getFileStats(filename);
    
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: fileStats,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Error uploading file' },
      { status: 500 }
    );
  }
}

// DELETE handler for file deletion
export async function DELETE(request) {
  await ensureUploadDir();
  
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');
  
  if (!fileName) {
    return NextResponse.json(
      { message: 'No filename provided' },
      { status: 400 }
    );
  }
  
  try {
    const filePath = path.join(uploadDir, fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    return NextResponse.json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { message: 'Error deleting file' },
      { status: 500 }
    );
  }
}

