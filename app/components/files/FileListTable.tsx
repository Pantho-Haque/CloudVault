"use client";

import { getFileTypeIcon } from "@/lib/fileIcons";
import { formatDate, formatFileSize } from "@/lib/operations";
import { useState, useRef } from "react";
import FileDetailsModal from "./FileDetailsModal";
import ShareLinkModal from "./ShareLinkModal";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

interface FileListTableProps {
  sortedFiles: FileEntry[];
  onDelete: () => void;
  onFolderClick: (folder: FileEntry) => void;
  selectionMode: boolean;
  selectedPaths: string[];
  onToggleSelection: (path: string) => void;
  onLongPress: (path: string) => void;
}

export default function FileListTable({
  sortedFiles,
  onDelete,
  onFolderClick,
  selectionMode,
  selectedPaths,
  onToggleSelection,
  onLongPress,
}: FileListTableProps) {
  const [showDetails, setShowDetails] = useState<FileEntry | null>(null);
  const [shareFile, setShareFile] = useState<FileEntry | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (path: string) => {
    longPressTimer.current = setTimeout(() => {
      onLongPress(path);
      longPressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/files?fileName=${encodeURIComponent(fileName)}`, { method: "DELETE" });
      onDelete();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleDeleteFolder = async (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await fetch(`/api/files?folder=${encodeURIComponent(folderPath)}`, { method: "DELETE" });
      onDelete();
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );

  return (
    <div className="overflow-x-auto">
      <FileDetailsModal file={showDetails} onClose={() => setShowDetails(null)} />
      {shareFile && <ShareLinkModal filePath={shareFile.path} onClose={() => setShareFile(null)} />}
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-[var(--color-divider)]">
            {selectionMode && <th className="w-10"></th>}
            <th className="py-2 px-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Name</th>
            <th className="hidden sm:table-cell py-2 px-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Size</th>
            <th className="hidden md:table-cell py-2 px-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Modified</th>
            <th className="py-2 px-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-divider)]">
          {sortedFiles.map((file: FileEntry) => {
            const isSelected = selectedPaths.includes(file.path);
            return (
              <tr
                key={file.path}
                className={`transition-colors cursor-pointer min-h-[48px] ${
                  isSelected
                    ? "bg-[var(--color-primary-subtle)]"
                    : "hover:bg-[var(--color-surface-raised)]"
                }`}
                onClick={() => {
                  if (selectionMode) {
                    onToggleSelection(file.path);
                  } else if (file.isDirectory) {
                    onFolderClick(file);
                  } else {
                    setShowDetails(file);
                  }
                }}
                onPointerDown={() => handlePointerDown(file.path)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {selectionMode && (
                  <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-focus-ring)]"
                      checked={isSelected}
                      onChange={() => onToggleSelection(file.path)}
                    />
                  </td>
                )}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">
                      {file.isDirectory ? <FolderIcon /> : getFileTypeIcon(file.name)}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="hidden sm:table-cell py-2.5 px-3 text-sm text-[var(--color-text-muted)]">
                  {file.isDirectory ? "\u2014" : formatFileSize(file.size)}
                </td>
                <td className="hidden md:table-cell py-2.5 px-3 text-sm text-[var(--color-text-muted)]">
                  {formatDate(file.modified)}
                </td>
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {!file.isDirectory && (
                      <>
                        <button
                          onClick={() => setShowDetails(file)}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                          title="Details"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank");
                          }}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-subtle)] transition-colors"
                          title="Download"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareFile(file);
                          }}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                          title="Share"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 2.684a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) =>
                        file.isDirectory
                          ? handleDeleteFolder(file.path, e)
                          : handleDeleteFile(file.path, e)
                      }
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                      title={file.isDirectory ? "Delete folder" : "Delete"}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
