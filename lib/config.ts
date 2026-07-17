import path from "path";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envStr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  storageDir: path.resolve(envStr("STORAGE_DIR", path.join(process.cwd(), "uploads"))),
  port: envInt("PORT", 3000),
  maxUploadSizeMB: envInt("MAX_UPLOAD_SIZE_MB", 100),
  dbPath: path.resolve(envStr("DB_PATH", path.join(process.cwd(), "cloudvault.db"))),
  sessionSecret: envStr("SESSION_SECRET", ""),
  trashRetentionDays: envInt("TRASH_RETENTION_DAYS", 30),
  maxVersions: envInt("MAX_FILE_VERSIONS", 5),
} as const;

export function validateConfig(): string[] {
  const errors: string[] = [];
  if (!config.sessionSecret) {
    errors.push("SESSION_SECRET is required. Generate one with: openssl rand -hex 32");
  }
  return errors;
}
