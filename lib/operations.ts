export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const handleDownload = (fileName: string, e: React.MouseEvent): void => {
  e.stopPropagation();
  window.open(`/api/files?fileName=${encodeURIComponent(fileName)}`, "_blank");
};

export const handleDelete = async (fileName: string, e: React.MouseEvent): Promise<void> => {
  e.stopPropagation();
  if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

  try {
    const response = await fetch(`/api/files?fileName=${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete file");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};
