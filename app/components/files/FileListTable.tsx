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

interface FileListTableProps {
  sortedFiles: FileEntry[];
  onDelete: () => void;
  onFolderClick: (folder: FileEntry) => void;
  selectionMode: boolean;
  selectedPaths: string[];
  onToggleSelection: (path: string) => void;
  onLongPress: (path: string) => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "1 day ago";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth === 1) return "1 month ago";
  return `${diffMonth} months ago`;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);

function SmallFileIcon({ filename, filePath, isDirectory }: { filename: string; filePath: string; isDirectory: boolean }) {
  if (isDirectory) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    );
  }

  const ext = getFileExtension(filename).toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    return (
      <LazyThumbnail filename={filename} filePath={filePath} className="w-8 h-8 shrink-0" />
    );
  }

  const extColors: Record<string, { color: string; label: string }> = {
    pdf: { color: "text-red-400", label: "PDF" },
    doc: { color: "text-blue-400", label: "DOC" },
    docx: { color: "text-blue-400", label: "DOC" },
    xls: { color: "text-green-400", label: "XLS" },
    xlsx: { color: "text-green-400", label: "XLS" },
    mp4: { color: "text-pink-400", label: "VID" },
    mp3: { color: "text-orange-400", label: "MP3" },
    zip: { color: "text-amber-400", label: "ZIP" },
    rar: { color: "text-amber-400", label: "RAR" },
    txt: { color: "text-gray-400", label: "TXT" },
    csv: { color: "text-green-400", label: "CSV" },
    js: { color: "text-yellow-400", label: "JS" },
    ts: { color: "text-blue-400", label: "TS" },
    json: { color: "text-yellow-300", label: "JSON" },
    md: { color: "text-gray-400", label: "MD" },
    svg: { color: "text-orange-400", label: "SVG" },
    html: { color: "text-orange-400", label: "HTML" },
    css: { color: "text-blue-400", label: "CSS" },
  };

  const info = extColors[ext] || { color: "text-gray-400", label: ext.toUpperCase() || "FILE" };

  return (
    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border border-current/20 bg-current/5 ${info.color}`}>
      {info.label.slice(0, 4)}
    </div>
  );
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
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

  return (
    <div className="overflow-x-auto">
      <FileDetailsModal
        file={showDetails}
        files={sortedFiles}
        onNavigate={(idx) => setShowDetails(sortedFiles[idx])}
        onClose={() => setShowDetails(null)}
        onDelete={onDelete}
      />
      {shareFile && <ShareLinkModal filePath={shareFile.path} onClose={() => setShareFile(null)} />}

      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {selectionMode && <th className="w-10"></th>}
            <th className="text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider py-3 px-5">
              Name
            </th>
            <th className="text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider py-3 px-5 w-32">
              Size
            </th>
            <th className="text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider py-3 px-5 w-40">
              Modified
            </th>
            <th className="w-32"></th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map((file: FileEntry) => {
            const isSelected = selectedPaths.includes(file.path);
            const isHovered = hoveredRow === file.path;
            return (
              <tr
                key={file.path}
                className={`border-b border-[var(--color-border)] cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--color-primary-subtle)]"
                    : isHovered
                    ? "bg-[var(--color-surface-raised)]"
                    : ""
                }`}
                style={{ contain: "layout style" }}
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
                onMouseEnter={() => setHoveredRow(file.path)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {selectionMode && (
                  <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-focus-ring)]"
                      checked={isSelected}
                      onChange={() => onToggleSelection(file.path)}
                    />
                  </td>
                )}
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <SmallFileIcon filename={file.name} filePath={file.path} isDirectory={file.isDirectory} />
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-5 text-sm text-[var(--color-text-muted)]">
                  {formatFileSize(file.size)}
                </td>
                <td className="py-3 px-5 text-sm text-[var(--color-text-muted)]">
                  {timeAgo(file.modified)}
                </td>
                <td className="py-3 px-5" onClick={(e) => e.stopPropagation()}>
                  <div className={`flex items-center justify-end gap-0.5 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    {!file.isDirectory && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank");
                          }}
                          className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                          title="Download"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareFile(file);
                          }}
                          className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                          title="Share"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
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
                      className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                      title={file.isDirectory ? "Delete folder" : "Delete"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
