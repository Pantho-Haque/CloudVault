"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TopBarProps {
  breadcrumbs: string[];
  onNavigate: (path: string) => void;
  onSearch: (term: string) => void;
  viewMode: "list" | "grid";
  onToggleView: () => void;
  onUpload: () => void;
  onNewFolder: () => void;
}

export default function TopBar({
  breadcrumbs,
  onNavigate,
  onSearch,
  viewMode,
  onToggleView,
  onUpload,
  onNewFolder,
}: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchTerm("");
    onSearch("");
  }, [onSearch]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onFocusSearch = () => setSearchOpen(true);
    window.addEventListener("cv:focus-search", onFocusSearch);
    return () => window.removeEventListener("cv:focus-search", onFocusSearch);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleCloseSearch(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen, handleCloseSearch]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const Breadcrumbs = ({ collapsed }: { collapsed?: boolean }) => (
    <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
      <button onClick={() => onNavigate("")} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-medium shrink-0">
        Home
      </button>
      {breadcrumbs.map((segment, index) => {
        const segmentPath = breadcrumbs.slice(0, index + 1).join("/");
        const isLast = index === breadcrumbs.length - 1;
        const isHidden = collapsed && breadcrumbs.length > 2 && index > 0 && index < breadcrumbs.length - 1;
        if (isHidden) {
          if (index === 1) {
            return (
              <span key="ellipsis" className="flex items-center gap-1.5 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[var(--color-icon-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-[var(--color-text-muted)] font-medium">...</span>
              </span>
            );
          }
          return null;
        }
        return (
          <span key={segmentPath} className="flex items-center gap-1.5 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[var(--color-icon-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {isLast ? (
              <span className="font-semibold text-[var(--color-text-primary)] truncate">{segment}</span>
            ) : (
              <button onClick={() => onNavigate(segmentPath)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-medium truncate">{segment}</button>
            )}
          </span>
        );
      })}
    </nav>
  );

  if (searchOpen) {
    return (
      <header className="h-14 shrink-0 flex items-center px-3 gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]" role="search">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search files..."
          className="flex-1 px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none"
          aria-label="Search files"
          autoFocus
        />
        <button
          onClick={handleCloseSearch}
          className="p-2.5 text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>
    );
  }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-3 md:px-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1 md:flex-none">
          <div className="hidden md:block"><Breadcrumbs /></div>
          <div className="md:hidden"><Breadcrumbs collapsed /></div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2.5 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-raised)] rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Search"
          aria-label="Open search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        <button
          onClick={onToggleView}
          className="p-2.5 text-[var(--color-icon-interactive)] hover:bg-[var(--color-surface-raised)] rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          aria-label={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
        >
          {viewMode === "list" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNewFolder}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl transition-colors min-h-[44px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden lg:inline">New folder</span>
        </button>

        <button
          onClick={onUpload}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors min-h-[44px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Upload
        </button>
      </div>
    </header>
  );
}
