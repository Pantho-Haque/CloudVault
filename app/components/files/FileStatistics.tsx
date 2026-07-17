"use client";

import { formatFileSize } from "@/lib/operations";

interface FolderStats {
  totalSize: number;
  fileCount: number;
  folderCount: number;
}

interface FileEntry {
  name: string;
  size: number;
  isDirectory?: boolean;
}

interface FileStatisticsProps {
  files: FileEntry[];
  folderStats?: FolderStats | null;
}

export default function FileStatistics({ files, folderStats }: FileStatisticsProps) {
  const directFiles = files.filter((f) => !f.isDirectory);
  const directFolders = files.filter((f) => f.isDirectory);

  const totalSize = folderStats?.totalSize ?? directFiles.reduce((total, file) => total + file.size, 0);
  const totalFiles = folderStats?.fileCount ?? directFiles.length;
  const totalFolders = folderStats?.folderCount ?? directFolders.length;

  const getFileTypeCounts = () => {
    const typeCounts: Record<string, number> = {};
    directFiles.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "unknown";
      typeCounts[extension] = (typeCounts[extension] || 0) + 1;
    });
    return typeCounts;
  };

  const getMostCommonType = () => {
    const typeCounts = getFileTypeCounts();
    let mostCommonType = "";
    let highestCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > highestCount) {
        mostCommonType = type;
        highestCount = count;
      }
    });
    return { type: mostCommonType ? mostCommonType.toUpperCase() : "N/A", count: highestCount };
  };

  const typeCounts = getFileTypeCounts();
  const fileTypes = Object.keys(typeCounts).length;
  const mostCommon = getMostCommonType();

  const stats = [
    { label: "Total Files", value: totalFiles },
    { label: "Folders", value: totalFolders },
    { label: "Total Size", value: formatFileSize(totalSize) },
    { label: "File Types", value: fileTypes },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all w-80 border border-[var(--color-border-subtle)]">
      <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Statistics</h2>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="text-sm text-[var(--color-text-secondary)]">{stat.label}</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{stat.value}</span>
          </div>
        ))}
      </div>
      {directFiles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--color-divider)]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--color-text-secondary)]">Most common:</span>
            <span className="text-sm font-medium bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)] py-0.5 px-2 rounded-full">
              {mostCommon.type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
