"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminSessionList from "@/components/admin/AdminSessionList";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ToastContainer from "@/components/admin/Toast";

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface Session {
  id: string;
  user_id: number;
  username: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalStorage: number; activeSessions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("read");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/auth/admin");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      addToast("Failed to load users", "error");
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/auth/admin?resource=stats");
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch {
      // stats are non-critical
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/auth/admin?resource=sessions");
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch {
      // sessions are non-critical
    }
  };

  const loadAll = useCallback(async () => {
    await Promise.all([loadUsers(), loadStats(), loadSessions()]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.user.role !== "admin") {
          router.replace("/login");
          return;
        }
        setCurrentUser(data.user);
        loadAll();
      })
      .catch(() => router.replace("/login"));
  }, [router, loadAll]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message, "error");
        return;
      }
      setNewUsername("");
      setNewPassword("");
      setNewRole("read");
      setShowCreate(false);
      addToast(`User "${newUsername}" created`);
      loadAll();
    } catch {
      addToast("Failed to create user", "error");
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await fetch("/api/auth/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      addToast("Role updated");
      loadAll();
    } catch {
      addToast("Failed to update role", "error");
    }
  };

  const handleForceLogout = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    setConfirmDialog({
      open: true,
      title: "Revoke Sessions",
      message: `This will force ${user?.username ?? "this user"} to log out on all devices. They can log back in.`,
      onConfirm: async () => {
        try {
          await fetch(`/api/auth/admin?userId=${userId}&action=logout`, { method: "DELETE" });
          addToast("Sessions revoked");
          loadSessions();
        } catch {
          addToast("Failed to revoke sessions", "error");
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleDeleteUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${user?.username}"? This action cannot be undone and will remove all their data.`,
      onConfirm: async () => {
        try {
          await fetch(`/api/auth/admin?userId=${userId}`, { method: "DELETE" });
          addToast(`User "${user?.username}" deleted`);
          loadAll();
        } catch {
          addToast("Failed to delete user", "error");
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    setConfirmDialog({
      open: true,
      title: "Revoke Session",
      message: "This will immediately terminate this session.",
      onConfirm: async () => {
        try {
          await fetch(`/api/auth/admin?sessionId=${sessionId}&action=revokeSession`, { method: "DELETE" });
          addToast("Session revoked");
          loadSessions();
        } catch {
          addToast("Failed to revoke session", "error");
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[var(--color-surface-sunken)] dark:to-[var(--color-surface)]">
      <header className="bg-[var(--color-surface)] shadow-sm border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Admin Panel</h1>
              <p className="text-xs text-[var(--color-text-muted)]">Logged in as {currentUser?.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/files")}
              className="px-3 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-sunken)] rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
            >
              Back to Files
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-[var(--color-text-on-primary)] bg-[var(--color-danger)] rounded-lg hover:opacity-90 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminDashboard stats={stats} loading={loading} />

        {/* Users Section */}
        <div className="bg-[var(--color-surface)] rounded-xl shadow-md overflow-hidden border border-[var(--color-border-subtle)] mb-6">
          <div className="p-4 border-b border-[var(--color-divider)] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Users</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-sm rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-1.5"
            >
              {showCreate ? (
                <>Cancel</>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </>
              )}
            </button>
          </div>

          {showCreate && (
            <div className="p-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-divider)]">
              <form onSubmit={handleCreateUser} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                  >
                    <option value="read">Read Only</option>
                    <option value="write">Read + Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-success)] text-[var(--color-text-on-primary)] text-sm rounded-lg hover:opacity-90 transition-colors"
                >
                  Create
                </button>
              </form>
            </div>
          )}

          <AdminUserTable
            users={users}
            currentUser={currentUser}
            onRoleChange={handleRoleChange}
            onDelete={handleDeleteUser}
            onForceLogout={handleForceLogout}
          />
        </div>

        {/* Sessions Section */}
        <div className="bg-[var(--color-surface)] rounded-xl shadow-md overflow-hidden border border-[var(--color-border-subtle)]">
          <AdminSessionList
            sessions={sessions}
            onRevoke={handleRevokeSession}
            loading={loading}
          />
        </div>
      </main>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
