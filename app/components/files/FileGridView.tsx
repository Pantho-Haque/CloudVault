"use client";

import { getFileTypeIcon } from "@/lib/fileIcons";
import { formatFileSize } from "@/lib/operations";
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

interface FileGridViewProps {
  sortedFiles: FileEntry[];
  onFolderClick: (folder: FileEntry) => void;
  onDelete: () => void;
  selectionMode: boolean;
  selectedPaths: string[];
  onToggleSelection: (path: string) => void;
  onLongPress: (path: string) => void;
}

export default function FileGridView({
  sortedFiles,
  onFolderClick,
  onDelete,
  selectionMode,
  selectedPaths,
  onToggleSelection,
  onLongPress,
}: FileGridViewProps) {
  const [showDetails, setShowDetails] = useState<FileEntry | null>(null);
  const [shareFile, setShareFile] = useState<FileEntry | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = async (filePath: string, isDir: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
      if (!confirm("Delete this folder and all its contents?")) return;
    }
    try {
      const url = isDir
        ? `/api/files?folder=${encodeURIComponent(filePath)}`
        : `/api/files?fileName=${encodeURIComponent(filePath)}`;
      await fetch(url, { method: "DELETE" });
      onDelete();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

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

  const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );

  return (
    <>
      <FileDetailsModal file={showDetails} onClose={() => setShowDetails(null)} />
      {shareFile && <ShareLinkModal filePath={shareFile.path} onClose={() => setShareFile(null)} />}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedFiles.map((file: FileEntry) => {
          const isSelected = selectedPaths.includes(file.path);
          return (
            <div
              key={file.path}
              className={`rounded-lg p-3 transition-all cursor-pointer border group relative ${
                isSelected
                  ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)]"
                  : "bg-[var(--color-surface-raised)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm"
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
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-focus-ring)]"
                    checked={isSelected}
                    onChange={() => onToggleSelection(file.path)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="flex justify-center mb-2 pt-1">
                {file.isDirectory ? <FolderIcon /> : getFileTypeIcon(file.name)}
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] text-center truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-0.5">
                {file.isDirectory ? "Folder" : formatFileSize(file.size)}
              </p>
              {!selectionMode && (
                <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!file.isDirectory && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank");
                        }}
                        className="p-1 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded hover:opacity-80 transition-colors"
                        title="Download"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareFile(file);
                        }}
                        className="p-1 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] rounded hover:opacity-80 transition-colors"
                        title="Share"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 2.684a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => handleDelete(file.path, file.isDirectory, e)}
                    className="p-1 bg-[var(--color-danger-subtle)] text-[var(--color-danger)] rounded hover:opacity-80 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
