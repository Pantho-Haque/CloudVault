"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminSessionList from "@/components/admin/AdminSessionList";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
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
    } catch {}
  };

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/auth/admin?resource=sessions");
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch {}
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
      message: `This will force ${user?.username ?? "this user"} to log out on all devices.`,
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
      message: `Are you sure you want to delete "${user?.username}"? This action cannot be undone.`,
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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
              className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-subtle)] transition-colors"
            >
              Back to Files
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-[var(--color-danger)] bg-[var(--color-danger-subtle)] rounded-xl hover:opacity-80 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminDashboard stats={stats} loading={loading} />

        <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)] mb-6">
          <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Users</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-1.5"
            >
              {showCreate ? (
                <>Cancel</>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add User
                </>
              )}
            </button>
          </div>

          {showCreate && (
            <div className="p-5 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
              <form onSubmit={handleCreateUser} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                  >
                    <option value="read">Read Only</option>
                    <option value="write">Read + Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-success)] text-white text-sm rounded-xl hover:opacity-90 transition-colors"
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

        <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)] mb-6">
          <AdminSessionList
            sessions={sessions}
            onRevoke={handleRevokeSession}
            loading={loading}
          />
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
          <div className="p-5 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Audit Log</h2>
          </div>
          <div className="p-5">
            <AdminAuditLog />
          </div>
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
