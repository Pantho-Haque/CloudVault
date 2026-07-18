"use client";

import { getFileExtension } from "@/lib/fileIcons";
import { formatFileSize } from "@/lib/operations";
import { useState, useRef } from "react";
import FileDetailsModal from "./FileDetailsModal";
import ShareLinkModal from "./ShareLinkModal";
import LazyThumbnail from "./LazyThumbnail";

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

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);

function GridFileIcon({ filename, filePath, isDirectory }: { filename: string; filePath: string; isDirectory: boolean }) {
  if (isDirectory) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    );
  }

  const ext = getFileExtension(filename).toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    return (
      <LazyThumbnail filename={filename} filePath={filePath} className="w-12 h-12 rounded-xl shrink-0" />
    );
  }

  const extColors: Record<string, { color: string; bg: string }> = {
    pdf: { color: "text-red-400", bg: "bg-red-500/10" },
    doc: { color: "text-blue-400", bg: "bg-blue-500/10" },
    docx: { color: "text-blue-400", bg: "bg-blue-500/10" },
    xls: { color: "text-green-400", bg: "bg-green-500/10" },
    xlsx: { color: "text-green-400", bg: "bg-green-500/10" },
    mp4: { color: "text-pink-400", bg: "bg-pink-500/10" },
    mp3: { color: "text-orange-400", bg: "bg-orange-500/10" },
    zip: { color: "text-amber-400", bg: "bg-amber-500/10" },
    rar: { color: "text-amber-400", bg: "bg-amber-500/10" },
    txt: { color: "text-gray-400", bg: "bg-gray-500/10" },
    csv: { color: "text-green-400", bg: "bg-green-500/10" },
    js: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
    ts: { color: "text-blue-400", bg: "bg-blue-500/10" },
    json: { color: "text-yellow-300", bg: "bg-yellow-400/10" },
    md: { color: "text-gray-400", bg: "bg-gray-500/10" },
    svg: { color: "text-orange-400", bg: "bg-orange-500/10" },
    html: { color: "text-orange-400", bg: "bg-orange-500/10" },
    css: { color: "text-blue-400", bg: "bg-blue-500/10" },
  };

  const info = extColors[ext] || { color: "text-gray-400", bg: "bg-gray-500/10" };

  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.bg}`}>
      <span className={`text-[10px] font-bold ${info.color}`}>{ext.toUpperCase() || "FILE"}</span>
    </div>
  );
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

  return (
    <>
      <FileDetailsModal
        file={showDetails}
        files={sortedFiles}
        onNavigate={(idx) => setShowDetails(sortedFiles[idx])}
        onClose={() => setShowDetails(null)}
        onDelete={onDelete}
      />
      {shareFile && <ShareLinkModal filePath={shareFile.path} onClose={() => setShareFile(null)} />}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedFiles.map((file: FileEntry) => {
          const isSelected = selectedPaths.includes(file.path);
          return (
            <div
              key={file.path}
              className={`rounded-xl p-4 transition-all cursor-pointer border group relative ${
                isSelected
                  ? "bg-[var(--color-primary-subtle)] border-[var(--color-primary)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:shadow-sm"
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
              <div className="flex justify-center mb-3">
                <GridFileIcon filename={file.name} filePath={file.path} isDirectory={file.isDirectory} />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] text-center truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-1">
                {formatFileSize(file.size)}
              </p>
              {!selectionMode && (
                <div className="flex justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!file.isDirectory && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank");
                        }}
                        className="p-1.5 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] rounded-lg hover:opacity-80 transition-colors"
                        title="Download"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareFile(file);
                        }}
                        className="p-1.5 bg-[var(--color-surface-raised)] text-[var(--color-icon-interactive)] rounded-lg hover:opacity-80 transition-colors"
                        title="Share"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => handleDelete(file.path, file.isDirectory, e)}
                    className="p-1.5 bg-[var(--color-danger-subtle)] text-[var(--color-danger)] rounded-lg hover:opacity-80 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
