"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components";
import { FileUploader } from "@/components";

interface HeaderProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onUpload: () => void;
}

export default function Header({ currentPath, setCurrentPath, onUpload }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [showUploader, setShowUploader] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [showBreadcrumbsMenu, setShowBreadcrumbsMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = () => {
    setShowUploader(false);
    onUpload();
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const response = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName.trim(), parentPath: currentPath }),
      });
      if (response.ok) {
        setFolderName("");
        setShowNewFolder(false);
        onUpload();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const breadcrumbs = currentPath ? currentPath.split("/").filter(Boolean) : [];

  return (
    <header className="bg-[var(--color-surface)] shadow-md py-3 md:py-4 sticky top-0 z-20 border-b border-[var(--color-border)]">
      <div className="px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 md:space-x-3 mb-3 sm:mb-0">
            <div
              className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 md:p-3 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
              onClick={() => setCurrentPath("")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1
                className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight cursor-pointer"
                onClick={() => setCurrentPath("")}
              >
                CloudVault
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] font-semibold tracking-wide hidden sm:block">
                Secure Cloud Storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user?.role === "admin" && (
              <a
                href="/admin"
                className="p-2 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
                title="Admin panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="p-2 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}

            <button
              onClick={() => setShowNewFolder(true)}
              className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg shadow-sm hover:bg-[var(--color-surface-raised)] transition-all text-sm font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">New Folder</span>
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              onClick={() => setShowUploader(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-sm">Upload</span>
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mt-3 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <ol className="flex items-center flex-wrap gap-y-1">
              <li>
                <button
                  className="hover:text-[var(--color-primary)] transition-colors font-medium"
                  onClick={() => setCurrentPath("")}
                >
                  Home
                </button>
              </li>
              {breadcrumbs.length <= 3 ? (
                breadcrumbs.map((segment, index) => {
                  const segmentPath = breadcrumbs.slice(0, index + 1).join("/");
                  return (
                    <li key={segmentPath} className="flex items-center">
                      <span className="mx-1.5 text-[var(--color-icon-muted)]">/</span>
                      <button
                        className="hover:text-[var(--color-primary)] transition-colors font-medium"
                        onClick={() => setCurrentPath(segmentPath)}
                      >
                        {segment}
                      </button>
                    </li>
                  );
                })
              ) : (
                <>
                  <li className="flex items-center">
                    <span className="mx-1.5 text-[var(--color-icon-muted)]">/</span>
                    <button
                      className="hover:text-[var(--color-primary)] transition-colors font-medium"
                      onClick={() => setCurrentPath(breadcrumbs[0])}
                    >
                      {breadcrumbs[0]}
                    </button>
                  </li>
                  <li className="flex items-center relative">
                    <span className="mx-1.5 text-[var(--color-icon-muted)]">/</span>
                    <button
                      className="px-1.5 py-0.5 rounded hover:bg-[var(--color-surface-sunken)] transition-colors text-[var(--color-text-muted)] font-medium"
                      onClick={() => setShowBreadcrumbsMenu(!showBreadcrumbsMenu)}
                    >
                      ...
                    </button>
                    {showBreadcrumbsMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                        {breadcrumbs.slice(1, -1).map((segment, index) => {
                          const segmentPath = breadcrumbs.slice(0, index + 2).join("/");
                          return (
                            <button
                              key={segmentPath}
                              className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                              onClick={() => {
                                setCurrentPath(segmentPath);
                                setShowBreadcrumbsMenu(false);
                              }}
                            >
                              {segment}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                  <li className="flex items-center">
                    <span className="mx-1.5 text-[var(--color-icon-muted)]">/</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {breadcrumbs[breadcrumbs.length - 1]}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>
        )}
      </div>

      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Create New Folder</h2>
            <input
              type="text"
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-focus-ring)] outline-none"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowNewFolder(false); setFolderName(""); }}
                className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-surface-sunken)] rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                className="px-4 py-2 text-[var(--color-text-on-primary)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-0">
          <div className="bg-[var(--color-surface)] rounded-lg p-4 md:p-6 max-w-2xl w-full mx-2 md:m-4 shadow-xl border border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Upload Files</h2>
              <button onClick={() => setShowUploader(false)} className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FileUploader onFileUpload={handleFileUpload} currentPath={currentPath} />
          </div>
        </div>
      )}
    </header>
  );
}
