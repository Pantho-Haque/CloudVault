"use client";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] py-8 mt-auto border-t border-[var(--color-border)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <span className="font-semibold text-lg text-[var(--color-text-primary)]">CloudVault</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Simple, fast, and secure file management.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} CloudVault. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
