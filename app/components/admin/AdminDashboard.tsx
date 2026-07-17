"use client";

interface AdminStats {
  totalUsers: number;
  totalStorage: number;
  activeSessions: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface AdminDashboardProps {
  stats: AdminStats | null;
  loading: boolean;
}

export default function AdminDashboard({ stats, loading }: AdminDashboardProps) {
  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: "text-[var(--color-primary)]",
      bg: "bg-[var(--color-primary-subtle)]",
    },
    {
      label: "Storage Used",
      value: formatBytes(stats?.totalStorage ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: "text-[var(--color-success)]",
      bg: "bg-[var(--color-success-subtle)]",
    },
    {
      label: "Active Sessions",
      value: stats?.activeSessions ?? 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: "text-[var(--color-warning)]",
      bg: "bg-[var(--color-warning-subtle)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border-subtle)] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{card.label}</p>
              {loading ? (
                <div className="h-7 w-16 bg-[var(--color-surface-sunken)] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{card.value}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
