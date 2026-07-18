"use client";

import { useState, useRef, useEffect } from "react";
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
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  onLoadMore: () => void;
  onDelete: () => void;
  setCurrentPath: (path: string) => void;
  viewMode: "list" | "grid";
  searchTerm: string;
  searchResults: FileEntry[] | null;
  isSearching: boolean;
}

export default function FileList({
  files, isLoading, isLoadingMore, hasMore, totalCount, onLoadMore,
  onDelete, setCurrentPath, viewMode, searchTerm, searchResults, isSearching,
}: FileListProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "name",
    direction: "ascending",
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filteredFiles = searchResults !== null ? searchResults : files;

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

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedPaths([]);
  };

  const allSelected = selectionMode && sortedFiles.length > 0 && sortedFiles.every((f) => selectedPaths.includes(f.path));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(sortedFiles.map((f) => f.path));
    }
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

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        <span className="ml-3 text-sm text-[var(--color-text-muted)]">Searching...</span>
      </div>
    );
  }

  if (files.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] font-medium">This folder is empty</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Upload files or create a folder to get started</p>
      </div>
    );
  }

  if (filteredFiles.length === 0 && (searchTerm || searchResults !== null)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] font-medium">No results for &ldquo;{searchTerm}&rdquo;</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {selectionMode
              ? `${selectedPaths.length} selected`
              : searchTerm
              ? `${filteredFiles.length} result${filteredFiles.length !== 1 ? "s" : ""}`
              : totalCount > 0
              ? `${filteredFiles.length}${hasMore ? "+" : ""} items`
              : `${filteredFiles.length} items`}
          </span>
          <div className="flex items-center gap-1">
            {(["name", "size", "modified"] as const).map((key) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  sortConfig.key === key
                    ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {key === "name" ? "Name" : key === "size" ? "Size" : "Date"}
                {sortConfig.key === key && (
                  <span className="ml-1">{sortConfig.direction === "ascending" ? "\u2191" : "\u2193"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {selectionMode && (
            <button
              onClick={toggleSelectAll}
              className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                allSelected
                  ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
              }`}
              title={allSelected ? "Deselect all" : "Select all"}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          )}
          <button
            onClick={toggleSelectionMode}
            className={`p-1.5 rounded-lg transition-colors ${
              selectionMode
                ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                : "text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
            }`}
            title={selectionMode ? "Exit selection" : "Select items"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        {viewMode === "grid" ? (
          <div className="p-5">
            <FileGridView
              sortedFiles={sortedFiles}
              onFolderClick={handleFolderClick}
              onDelete={onDelete}
              selectionMode={selectionMode}
              selectedPaths={selectedPaths}
              onToggleSelection={toggleFileSelection}
              onLongPress={handleLongPress}
            />
          </div>
        ) : (
          <FileListTable
            sortedFiles={sortedFiles}
            onDelete={onDelete}
            onFolderClick={handleFolderClick}
            selectionMode={selectionMode}
            selectedPaths={selectedPaths}
            onToggleSelection={toggleFileSelection}
            onLongPress={handleLongPress}
            searchTerm={searchTerm}
          />
        )}

        <div ref={sentinelRef} className="h-1" />

        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]" />
          </div>
        )}

        {!hasMore && files.length > 0 && !searchTerm && (
          <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">
            All {totalCount} items loaded
          </div>
        )}
      </div>

      {selectionMode && selectedPaths.length > 0 && (
        <div className="fixed bottom-0 left-60 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] p-3 flex items-center justify-center gap-4 z-40 shadow-lg">
          <button
            onClick={() => {
              selectedPaths.forEach((p) => window.open(`/api/files?fileName=${encodeURIComponent(p.split("/").pop() || "")}`, "_blank"));
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary-subtle)] rounded-lg hover:opacity-80 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download ({selectedPaths.length})
          </button>
          <button
            onClick={async () => {
              if (!confirm(`Delete ${selectedPaths.length} item(s)?`)) return;
              await fetch("/api/files/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", files: selectedPaths }),
              });
              setSelectedPaths([]);
              setSelectionMode(false);
              onDelete();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-danger)] bg-[var(--color-danger-subtle)] rounded-lg hover:opacity-80 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete ({selectedPaths.length})
          </button>
          <button
            onClick={() => { setSelectedPaths([]); setSelectionMode(false); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
