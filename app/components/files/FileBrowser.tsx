"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../layout/Sidebar";
import TopBar from "../layout/TopBar";
import FileList from "./FileList";
import FileUploader from "./FileUploader";
import ShareLinksView from "./ShareLinksView";
import TrashView from "./TrashView";
import StoragePanel from "./StoragePanel";
import UploadProgressPopover from "./UploadProgressPopover";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

interface FileBrowserProps {
  initialPath: string;
}

const PAGE_SIZE = 50;

export default function FileBrowser({ initialPath }: FileBrowserProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [activeView, setActiveView] = useState("files");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showUploader, setShowUploader] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [storageVersion, setStorageVersion] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchIdRef = useRef(0);
  const currentPathRef = useRef(currentPath);
  const activeViewRef = useRef(activeView);

  currentPathRef.current = currentPath;
  activeViewRef.current = activeView;

  useEffect(() => {
    const saved = localStorage.getItem("viewMode") as "list" | "grid" | null;
    if (saved) setViewMode(saved);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentPath(initialPath);
    if (initialPath) setActiveView("files");
  }, [initialPath]);

  const navigateTo = useCallback(
    (newPath: string) => {
      setActiveView("files");
      if (newPath) {
        router.push(`/files/${newPath}`, { scroll: false });
      } else {
        router.push("/files", { scroll: false });
      }
    },
    [router]
  );

  const handleViewChange = useCallback(
    (view: string) => {
      if (view === "admin") {
        window.location.href = "/admin";
        return;
      }
      setActiveView(view);
      if (view === "files") {
        router.push("/files", { scroll: false });
      }
    },
    [router]
  );

  const fetchFiles = useCallback(
    async (subpath?: string) => {
      const path = subpath !== undefined ? subpath : currentPathRef.current;
      const id = ++fetchIdRef.current;
      try {
        const url = path
          ? `/api/files?path=${encodeURIComponent(path)}&offset=0&limit=${PAGE_SIZE}`
          : `/api/files?offset=0&limit=${PAGE_SIZE}`;
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch files");
        }
        const data = await response.json();
        if (id === fetchIdRef.current) {
          setFiles(data.files || []);
          setHasMore(data.hasMore || false);
          setTotalCount(data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        if (id === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const offset = files.length;
      const url = currentPath
        ? `/api/files?path=${encodeURIComponent(currentPath)}&offset=${offset}&limit=${PAGE_SIZE}`
        : `/api/files?offset=${offset}&limit=${PAGE_SIZE}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFiles((prev) => [...prev, ...(data.files || [])]);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more files:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPath, files.length, hasMore, isLoadingMore]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;

      if (e.key === "Escape") {
        if (showUploader) { setShowUploader(false); return; }
        if (showNewFolder) { setShowNewFolder(false); setFolderName(""); return; }
        return;
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        setShowUploader(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("cv:focus-search"));
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowNewFolder(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showUploader, showNewFolder]);

  useEffect(() => {
    if (activeView === "files") {
      setIsLoading(true);
      fetchFiles(currentPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, activeView]);

  useEffect(() => {
    const eventSource = new EventSource("/api/files?stream=1");
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("file-change", () => {
      if (activeViewRef.current === "files") {
        fetchFiles(currentPathRef.current);
      }
      setStorageVersion((v) => v + 1);
    });

    eventSource.onerror = () => {};

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSearch = useCallback((term: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!term.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/files/search?q=${encodeURIComponent(term.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.files || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
    if (!term.trim()) {
      setSearchResults(null);
      setIsLoading(true);
      fetchFiles();
    }
  }, [debouncedSearch, fetchFiles]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const response = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName.trim(),
          parentPath: currentPath,
        }),
      });
      if (response.ok) {
        setFolderName("");
        setShowNewFolder(false);
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleUpload = () => {
    setShowUploader(false);
    fetchFiles(currentPath);
  };

  const breadcrumbs = currentPath
    ? currentPath.split("/").filter(Boolean)
    : [];

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-background)]">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} storageVersion={storageVersion} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
        {activeView === "files" && (
          <TopBar
            breadcrumbs={breadcrumbs}
            onNavigate={navigateTo}
            onSearch={handleSearchChange}
            viewMode={viewMode}
            onToggleView={() => {
              const next = viewMode === "list" ? "grid" : "list";
              setViewMode(next);
              localStorage.setItem("viewMode", next);
            }}
            onUpload={() => setShowUploader(true)}
            onNewFolder={() => setShowNewFolder(true)}
          />
        )}

        <main className="flex-1 overflow-auto">
          {activeView === "files" && (
            <FileList
              files={files}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              onLoadMore={loadMore}
              onDelete={() => fetchFiles(currentPath)}
              setCurrentPath={navigateTo}
              viewMode={viewMode}
              searchTerm={searchTerm}
              searchResults={searchResults}
              isSearching={isSearching}
            />
          )}
          {activeView === "shared" && <ShareLinksView />}
          {activeView === "trash" && <TrashView onRestore={() => fetchFiles(currentPath)} />}
          {activeView === "storage" && (
            <div className="p-6 max-w-3xl mx-auto">
              <StoragePanel storageVersion={storageVersion} />
            </div>
          )}
        </main>
      </div>

      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Upload Files</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FileUploader onFileUpload={handleUpload} currentPath={currentPath} />
          </div>
        </div>
      )}

      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Create New Folder</h2>
            <input
              type="text"
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] rounded-xl focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-focus-ring)] outline-none"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowNewFolder(false); setFolderName(""); }}
                className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                className="px-4 py-2 text-white bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadProgressPopover />

      {activeView === "files" && (
        <button
          onClick={() => setShowUploader(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
    </div>
  );
}
