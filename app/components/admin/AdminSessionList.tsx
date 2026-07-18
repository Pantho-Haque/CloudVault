"use client";

interface Session {
  id: string;
  user_id: number;
  username: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface AdminSessionListProps {
  sessions: Session[];
  onRevoke: (sessionId: string) => void;
  loading: boolean;
}

export default function AdminSessionList({ sessions, onRevoke, loading }: AdminSessionListProps) {
  return (
    <div>
      <div className="px-4 py-3 border-b border-[var(--color-divider)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Active Sessions ({sessions.length})
        </h3>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-surface-raised)] rounded-lg animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-[var(--color-border-subtle)] rounded" />
                <div className="h-3 w-40 bg-[var(--color-border-subtle)] rounded" />
              </div>
              <div className="h-6 w-16 bg-[var(--color-border-subtle)] rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No active sessions</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-divider)]">
          {sessions.map((session) => (
            <div key={session.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-raised)] transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--color-text-primary)]">{session.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    session.role === "admin"
                      ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                      : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]"
                  }`}>
                    {session.role}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Created {new Date(session.created_at).toLocaleString()}
                  {" \u00b7 "}Expires {new Date(session.expires_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onRevoke(session.id)}
                className="px-3 py-2 text-xs text-[var(--color-danger-text)] bg-[var(--color-danger-subtle)] rounded-lg hover:opacity-80 transition-colors shrink-0 min-h-[44px]"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
