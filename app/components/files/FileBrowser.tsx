"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header, FileList, FileStatistics } from "@/components";
import { XMarkIcon } from "@heroicons/react/16/solid";

interface FolderStats {
  totalSize: number;
  fileCount: number;
  folderCount: number;
}

interface FileBrowserProps {
  initialPath: string;
}

export default function FileBrowser({ initialPath }: FileBrowserProps) {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [folderStats, setFolderStats] = useState<FolderStats | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    setCurrentPath(initialPath);
  }, [initialPath]);

  const navigateTo = useCallback((newPath: string) => {
    if (newPath) {
      router.push(`/files/${newPath}`, { scroll: false });
    } else {
      router.push("/files", { scroll: false });
    }
  }, [router]);

  const fetchFiles = useCallback(async (subpath: string = currentPath) => {
    const id = ++fetchIdRef.current;
    try {
      const url = subpath ? `/api/files?path=${encodeURIComponent(subpath)}` : "/api/files";
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
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      if (id === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPath]);

  const fetchFolderStats = useCallback(async (subpath: string = currentPath) => {
    try {
      const url = subpath ? `/api/files/folder-stats?path=${encodeURIComponent(subpath)}` : "/api/files/folder-stats";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFolderStats(data);
      }
    } catch {
      // non-critical
    }
  }, [currentPath]);

  useEffect(() => {
    setIsLoading(true);
    fetchFiles(currentPath);
    fetchFolderStats(currentPath);
  }, [currentPath, fetchFiles, fetchFolderStats]);

  useEffect(() => {
    const eventSource = new EventSource("/api/files?stream=1");
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("file-change", () => {
      fetchFiles(currentPath);
      fetchFolderStats(currentPath);
    });

    eventSource.onerror = () => {};

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [currentPath, fetchFiles, fetchFolderStats]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[var(--color-surface-sunken)] dark:to-[var(--color-surface)]">
      <Header currentPath={currentPath} setCurrentPath={navigateTo} onUpload={() => { fetchFiles(currentPath); fetchFolderStats(currentPath); }} />

      <div className="container mx-auto max-w-6xl px-4 flex-1">
        <div className="fixed right-0 bottom-10 z-50">
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] p-3 rounded-l-lg shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <div className={`fixed right-0 bottom-25 bg-[var(--color-surface)] rounded-l-lg shadow-xl transition-all duration-500 ease-in-out border border-[var(--color-border)] ${showStats ? "translate-x-0" : "translate-x-full"}`}>
            <div className="relative">
              <button
                onClick={() => setShowStats(false)}
                className="absolute top-2 left-2 bg-[var(--color-surface-sunken)] rounded-full p-1 hover:bg-[var(--color-border-subtle)] transition-all duration-200 z-10"
              >
                <XMarkIcon className="h-4 w-4 text-[var(--color-text-primary)]" />
              </button>
              <FileStatistics files={files} folderStats={folderStats} />
            </div>
          </div>
        </div>

        <div className="py-6">
          <FileList
            files={files}
            isLoading={isLoading}
            onDelete={() => { fetchFiles(currentPath); fetchFolderStats(currentPath); }}
            setCurrentPath={navigateTo}
          />
        </div>
      </div>
    </div>
  );
}
