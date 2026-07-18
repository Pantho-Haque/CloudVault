"use client";

import { useState, useMemo } from "react";

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface AdminUserTableProps {
  users: User[];
  currentUser: { id: number; username: string; role: string } | null;
  onRoleChange: (userId: number, role: string) => void;
  onDelete: (userId: number) => void;
  onForceLogout: (userId: number) => void;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" },
  write: { label: "Read + Write", className: "bg-[var(--color-success-subtle)] text-[var(--color-success)]" },
  read: { label: "Read Only", className: "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]" },
};

export default function AdminUserTable({
  users,
  currentUser,
  onRoleChange,
  onDelete,
  onForceLogout,
}: AdminUserTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"username" | "role" | "created_at">("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const result = users.filter(
      (u) => u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)
    );
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [users, search, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-[var(--color-icon-muted)]">
      {sortKey === col ? (sortDir === "asc" ? "\u2191" : "\u2193") : "\u2195"}
    </span>
  );

  return (
    <div>
      <div className="px-4 py-3 border-b border-[var(--color-divider)]">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[var(--color-text-muted)]">
            {users.length === 0 ? "No users yet" : "No users match your search"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--color-surface-raised)]">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-border-subtle)]"
                  onClick={() => handleSort("username")}
                >
                  Username <SortIcon col="username" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-border-subtle)]"
                  onClick={() => handleSort("role")}
                >
                  Role <SortIcon col="role" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-border-subtle)] hidden sm:table-cell"
                  onClick={() => handleSort("created_at")}
                >
                  Created <SortIcon col="created_at" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider)]">
              {filtered.map((user) => {
                const isSelf = user.username === currentUser?.username;
                const roleStyle = roleConfig[user.role] || roleConfig.read;
                return (
                  <tr key={user.id} className="hover:bg-[var(--color-surface-raised)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--color-text-primary)]">{user.username}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleStyle.className}`}>
                        {roleStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => onRoleChange(user.id, e.target.value)}
                          disabled={isSelf}
                          className="px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] disabled:opacity-50 min-h-[44px]"
                        >
                          <option value="read">Read</option>
                          <option value="write">Write</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => onForceLogout(user.id)}
                          className="px-3 py-2 text-xs text-[var(--color-warning-text)] bg-[var(--color-warning-subtle)] rounded-lg hover:opacity-80 transition-colors min-h-[44px]"
                          title="Revoke all sessions"
                        >
                          Revoke
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => onDelete(user.id)}
                            className="px-3 py-2 text-xs text-[var(--color-danger-text)] bg-[var(--color-danger-subtle)] rounded-lg hover:opacity-80 transition-colors min-h-[44px]"
                            title="Delete user"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
