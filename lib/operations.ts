export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Function to format date
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Function to handle file download
export const handleDownload = (fileName: string, e: React.MouseEvent) => {
  e.stopPropagation();
  window.open(`/api/files?fileName=${encodeURIComponent(fileName)}`, "_blank");
};

// Function to handle file deletion
export const handleDelete = async (
  fileName: string,
  e: React.MouseEvent,
  onStatusChange: (status: { type: string; message: string }) => void
) => {
  e.stopPropagation();
  if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
    return;
  }

  try {
    const response = await fetch(
      `/api/files?fileName=${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete file");
    }

    onStatusChange({
      type: "success",
      message: "File deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    onStatusChange({
      type: "error",
      message: "Failed to delete file. Please try again.",
    });
  }
};
