interface StatusMessageProps {
  status: {
    type: "success" | "error" | "info";
    message: string;
  } | null;
}

export default function StatusMessage({ status }: StatusMessageProps) {
  if (!status) return null;

  const styles =
    status.type === "success"
      ? "bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success-text)]"
      : status.type === "error"
      ? "bg-[var(--color-danger-subtle)] border-[var(--color-danger)] text-[var(--color-danger-text)]"
      : "bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--color-primary-text)]";

  return (
    <div className={`p-4 mb-4 rounded border ${styles}`}>
      {status.message}
    </div>
  );
}
