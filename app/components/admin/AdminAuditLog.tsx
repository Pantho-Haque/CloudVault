"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditEntry {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  login_success: "text-emerald-500 bg-emerald-500/10",
  login_failed: "text-red-500 bg-red-500/10",
  logout: "text-gray-400 bg-gray-400/10",
  server_start: "text-blue-500 bg-blue-500/10",
  password_changed: "text-amber-500 bg-amber-500/10",
  admin_password_reset: "text-amber-500 bg-amber-500/10",
  share_link_created: "text-purple-500 bg-purple-500/10",
  file_uploaded: "text-blue-500 bg-blue-500/10",
  file_deleted: "text-red-500 bg-red-500/10",
  file_moved: "text-cyan-500 bg-cyan-500/10",
};

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const pageSize = 50;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?limit=${pageSize}&offset=${page * pageSize}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filtered = entries.filter((e) => {
    if (filterAction && e.action !== filterAction) return false;
    if (filterUser && !e.username.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  const uniqueActions = [...new Set(entries.map((e) => e.action))].sort();
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
        >
          <option value="">All actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by user..."
          value={filterUser}
          onChange={(e) => { setFilterUser(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
        />
        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
          {total} total entries
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">No audit entries found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">Time</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">User</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">Action</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">Resource</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">Details</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-muted)]">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors">
                  <td className="py-2 px-3 text-[var(--color-text-muted)] whitespace-nowrap" title={entry.created_at}>
                    {timeAgo(entry.created_at)}
                  </td>
                  <td className="py-2 px-3 font-medium text-[var(--color-text-primary)]">{entry.username}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${ACTION_COLORS[entry.action] || "text-gray-400 bg-gray-400/10"}`}>
                      {formatAction(entry.action)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--color-text-secondary)] max-w-[200px] truncate">{entry.resource || "—"}</td>
                  <td className="py-2 px-3 text-[var(--color-text-muted)] max-w-[200px] truncate">{entry.details || "—"}</td>
                  <td className="py-2 px-3 text-[var(--color-text-muted)] font-mono">{entry.ip_address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs border border-[var(--color-border)] rounded-lg disabled:opacity-30 hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs border border-[var(--color-border)] rounded-lg disabled:opacity-30 hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
