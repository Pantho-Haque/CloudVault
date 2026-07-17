"use client";

import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import FileListTable from "./FileListTable";
import FileGridView from "./FileGridView";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

interface FileListProps {
  files: FileEntry[];
  isLoading: boolean;
  onDelete: () => void;
  setCurrentPath: (path: string) => void;
}

interface TrashFile {
  trashName: string;
  name: string;
  size: number;
  modified: string;
  deletedAt: string;
}

export default function FileList({ files, isLoading, onDelete, setCurrentPath }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({ key: "name", direction: "ascending" });
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showTrash, setShowTrash] = useState(false);
  const [trashFiles, setTrashFiles] = useState<TrashFile[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("viewMode") as "list" | "grid" | null;
    if (saved) setViewMode(saved);
  }, []);

  // Exit selection mode when files change (navigation)
  useEffect(() => {
    setSelectionMode(false);
    setSelectedPaths([]);
  }, [files]);

  const handleSearch = (term: string) => setSearchTerm(term);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
    setShowSortMenu(false);
  };

  const filteredFiles = files.filter((file: FileEntry) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a: FileEntry, b: FileEntry) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    if (sortConfig.key === "size") {
      return sortConfig.direction === "ascending" ? a.size - b.size : b.size - a.size;
    } else if (sortConfig.key === "modified") {
      return sortConfig.direction === "ascending"
        ? new Date(a.modified).getTime() - new Date(b.modified).getTime()
        : new Date(b.modified).getTime() - new Date(a.modified).getTime();
    }
    return sortConfig.direction === "ascending" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  const handleFolderClick = (folder: FileEntry) => setCurrentPath(folder.path);

  const toggleView = () => {
    const next = viewMode === "list" ? "grid" : "list";
    setViewMode(next);
    localStorage.setItem("viewMode", next);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedPaths([]);
  };

  const toggleFileSelection = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleLongPress = (path: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedPaths([path]);
    }
  };

  const openTrash = async () => {
    try {
      const res = await fetch("/api/files/trash");
      const data = await res.json();
      setTrashFiles(data.files || []);
      setShowTrash(true);
    } catch (error) {
      console.error("Error loading trash:", error);
    }
  };

  const restoreFromTrash = async (trashName: string) => {
    await fetch("/api/files/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashName }),
    });
    openTrash();
    onDelete();
  };

  const emptyTrash = async () => {
    await fetch("/api/files/trash", { method: "DELETE" });
    setTrashFiles([]);
    onDelete();
  };

  const sortLabels: Record<string, string> = { name: "Name", size: "Size", modified: "Date modified" };

  return (
    <section className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] shadow-md relative">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[var(--color-divider)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] shrink-0">
              {selectionMode ? `${selectedPaths.length} selected` : "Files"}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort button */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="p-2 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
                title="Sort"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                  {(["name", "size", "modified"] as const).map((key) => (
                    <button
                      key={key}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                        sortConfig.key === key
                          ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                          : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)]"
                      }`}
                      onClick={() => requestSort(key)}
                    >
                      <span>{sortLabels[key]}</span>
                      {sortConfig.key === key && (
                        <span className="text-xs">{sortConfig.direction === "ascending" ? "\u2191" : "\u2193"}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <button
              onClick={toggleView}
              className="p-2 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
              title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
            >
              {viewMode === "list" ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Select mode toggle */}
            <button
              onClick={toggleSelectionMode}
              className={`p-2 rounded-lg transition-colors ${
                selectionMode
                  ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)]"
                  : "text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)]"
              }`}
              title={selectionMode ? "Exit selection mode" : "Enter selection mode"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>

            {/* Trash */}
            <button
              onClick={openTrash}
              className="p-2 text-[var(--color-icon-interactive)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
              title="Trash"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        {!isLoading && files.length > 0 && (
          <div className="mt-3">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <span className="text-sm text-[var(--color-text-muted)]">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
              <svg className="h-8 w-8 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">This folder is empty</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Upload files or create a folder to get started</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
              <svg className="h-8 w-8 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">No files match &ldquo;{searchTerm}&rdquo;</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Try a different search term</p>
          </div>
        ) : viewMode === "grid" ? (
          <FileGridView
            sortedFiles={sortedFiles}
            onFolderClick={handleFolderClick}
            onDelete={onDelete}
            selectionMode={selectionMode}
            selectedPaths={selectedPaths}
            onToggleSelection={toggleFileSelection}
            onLongPress={handleLongPress}
          />
        ) : (
          <FileListTable
            sortedFiles={sortedFiles}
            onDelete={onDelete}
            onFolderClick={handleFolderClick}
            selectionMode={selectionMode}
            selectedPaths={selectedPaths}
            onToggleSelection={toggleFileSelection}
            onLongPress={handleLongPress}
          />
        )}
      </div>

      {/* Mobile selection action bar */}
      {selectionMode && selectedPaths.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] p-3 flex items-center justify-around z-40 sm:hidden shadow-lg">
          <button
            onClick={() => {
              selectedPaths.forEach((p) => window.open(`/api/files?fileName=${encodeURIComponent(p.split("/").pop() || "")}`, "_blank"));
            }}
            className="flex flex-col items-center gap-1 text-[var(--color-primary)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs">Download</span>
          </button>
          <button
            onClick={async () => {
              for (const p of selectedPaths) {
                const name = p.split("/").pop() || "";
                await fetch(`/api/files?fileName=${encodeURIComponent(name)}`, { method: "DELETE" });
              }
              setSelectedPaths([]);
              setSelectionMode(false);
              onDelete();
            }}
            className="flex flex-col items-center gap-1 text-[var(--color-danger)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs">Delete</span>
          </button>
          <button
            onClick={() => { setSelectedPaths([]); setSelectionMode(false); }}
            className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs">Cancel</span>
          </button>
        </div>
      )}

      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-lg max-w-lg w-full max-h-[70vh] overflow-hidden shadow-xl border border-[var(--color-border)]">
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-divider)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Trash</h3>
              <button onClick={() => setShowTrash(false)} className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {trashFiles.length === 0 ? (
                <p className="text-center text-[var(--color-text-muted)] py-8">Trash is empty</p>
              ) : (
                <div className="space-y-2">
                  {trashFiles.map((file: TrashFile) => (
                    <div key={file.trashName} className="flex items-center justify-between p-3 bg-[var(--color-surface-raised)] rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{new Date(file.deletedAt).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => restoreFromTrash(file.trashName)}
                        className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium shrink-0 ml-3"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {trashFiles.length > 0 && (
              <div className="p-4 border-t border-[var(--color-divider)]">
                <button
                  onClick={emptyTrash}
                  className="w-full px-4 py-2 bg-[var(--color-danger)] text-[var(--color-text-on-primary)] rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                  Empty Trash
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
