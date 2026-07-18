import path from "path";
import { config } from "./config";
import { promises as fs } from "fs";

// Dynamic import for node:sqlite — not available during Next.js static build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DatabaseSyncClass: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;

async function loadDb() {
  if (!DatabaseSyncClass) {
    const mod = await import("node:sqlite");
    DatabaseSyncClass = mod.DatabaseSync;
  }
  return DatabaseSyncClass;
}

let initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureSchema(database: any) {
  if (initialized) return;
  initialized = true;

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash BLOB NOT NULL,
      password_salt BLOB NOT NULL,
      role TEXT NOT NULL DEFAULT 'read',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      storage_quota INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migrate existing databases — add columns that may not exist
  const userColumns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const userColNames = new Set(userColumns.map((c) => c.name));
  if (!userColNames.has("must_change_password")) database.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
  if (!userColNames.has("failed_login_attempts")) database.exec("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0");
  if (!userColNames.has("locked_until")) database.exec("ALTER TABLE users ADD COLUMN locked_until TEXT");
  if (!userColNames.has("storage_quota")) database.exec("ALTER TABLE users ADD COLUMN storage_quota INTEGER NOT NULL DEFAULT 0");

  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      mime_type TEXT,
      owner_id INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      modified_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS file_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      target TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS share_links (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      created_by INTEGER,
      password_hash BLOB,
      password_salt BLOB,
      expires_at TEXT,
      download_count INTEGER NOT NULL DEFAULT 0,
      max_downloads INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  database.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_file_versions_path ON file_versions(file_path)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_share_links_path ON share_links(file_path)`);

  database.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export async function getDb() {
  if (!db) {
    const dbDir = path.dirname(config.dbPath);
    await fs.mkdir(dbDir, { recursive: true });

    const DatabaseSync = await loadDb();
    db = new DatabaseSync(config.dbPath);
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA synchronous=NORMAL");
    db.exec("PRAGMA foreign_keys=ON");

    await ensureSchema(db);
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}

export interface User {
  id: number;
  username: string;
  role: string;
  must_change_password: number;
  failed_login_attempts: number;
  locked_until: string | null;
  storage_quota: number;
  created_at: string;
}

export async function createUser(username: string, passwordHash: Buffer, passwordSalt: Buffer, role: string = "read"): Promise<User> {
  const database = await getDb();
  const stmt = database.prepare(
    "INSERT INTO users (username, password_hash, password_salt, role) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(username, passwordHash, passwordSalt, role);
  return {
    id: Number(result.lastInsertRowid),
    username,
    role,
    must_change_password: 0,
    failed_login_attempts: 0,
    locked_until: null,
    storage_quota: 0,
    created_at: new Date().toISOString(),
  };
}

export async function getUserByUsername(username: string): Promise<(User & { password_hash: Buffer; password_salt: Buffer }) | undefined> {
  const database = await getDb();
  const stmt = database.prepare("SELECT * FROM users WHERE username = ?");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return stmt.get(username) as any;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const database = await getDb();
  const stmt = database.prepare("SELECT id, username, role, created_at FROM users WHERE id = ?");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return stmt.get(id) as any;
}

export async function getAllUsers(): Promise<User[]> {
  const database = await getDb();
  const stmt = database.prepare("SELECT id, username, role, created_at FROM users");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return stmt.all() as any;
}

export async function updateUserPassword(userId: number, passwordHash: Buffer, passwordSalt: Buffer): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now') WHERE id = ?")
    .run(passwordHash, passwordSalt, userId);
}

export async function updateUserRole(userId: number, role: string): Promise<void> {
  const database = await getDb();
  const stmt = database.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?");
  stmt.run(role, userId);
}

export async function deleteUser(userId: number): Promise<void> {
  const database = await getDb();
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}

export async function createSession(sessionId: string, userId: number, expiresAt: Date): Promise<Session> {
  const database = await getDb();
  const stmt = database.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  );
  stmt.run(sessionId, userId, expiresAt.toISOString());
  return { id: sessionId, user_id: userId, expires_at: expiresAt.toISOString() };
}

export async function getSession(sessionId: string): Promise<(Session & { role: string; username: string }) | undefined> {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT s.*, u.role, u.username
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return stmt.get(sessionId) as any;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const database = await getDb();
  database.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export async function deleteUserSessions(userId: number): Promise<void> {
  const database = await getDb();
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export interface FileRecord {
  id: number;
  path: string;
  name: string;
  size: number;
  mime_type: string | null;
  owner_id: number | null;
  uploaded_at: string;
  modified_at: string;
}

export async function upsertFile(filePath: string, name: string, size: number, mimeType: string | null = null, ownerId: number | null = null): Promise<FileRecord> {
  const database = await getDb();
  const stmt = database.prepare(`
    INSERT INTO files (path, name, size, mime_type, owner_id, uploaded_at, modified_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(path) DO UPDATE SET
      name = excluded.name,
      size = excluded.size,
      mime_type = excluded.mime_type,
      modified_at = datetime('now')
  `);
  stmt.run(filePath, name, size, mimeType, ownerId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = database.prepare("SELECT * FROM files WHERE path = ?").get(filePath) as any;
  return record;
}

export async function getFile(filePath: string): Promise<FileRecord | undefined> {
  const database = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return database.prepare("SELECT * FROM files WHERE path = ?").get(filePath) as any;
}

export async function getFilesInDirectory(dirPath: string): Promise<FileRecord[]> {
  const database = await getDb();
  if (!dirPath) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return database.prepare("SELECT * FROM files WHERE path NOT LIKE '%/%'").all() as any;
  }
  return database.prepare("SELECT * FROM files WHERE path LIKE ? AND path NOT LIKE ?")
    .all(`${dirPath}/%`, `${dirPath}/%/%`) as FileRecord[];
}

export async function deleteFile(filePath: string): Promise<void> {
  const database = await getDb();
  database.prepare("DELETE FROM files WHERE path = ?").run(filePath);
}

export async function getAllFiles(): Promise<FileRecord[]> {
  const database = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return database.prepare("SELECT * FROM files").all() as any;
}

export async function addFileVersion(filePath: string, versionNumber: number, storagePath: string, size: number): Promise<void> {
  const database = await getDb();
  const stmt = database.prepare(
    "INSERT INTO file_versions (file_path, version_number, storage_path, size) VALUES (?, ?, ?, ?)"
  );
  stmt.run(filePath, versionNumber, storagePath, size);
}

export async function getFileVersions(filePath: string): Promise<{ version_number: number; storage_path: string; size: number; created_at: string }[]> {
  const database = await getDb();
  return database.prepare(
    "SELECT version_number, storage_path, size, created_at FROM file_versions WHERE file_path = ? ORDER BY version_number DESC"
  ).all(filePath) as { version_number: number; storage_path: string; size: number; created_at: string }[];
}

export async function cleanupExpiredSessions(): Promise<number> {
  const database = await getDb();
  const result = database.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  return result.changes;
}

export async function getStorageBreakdown(): Promise<{ ext: string; size: number }[]> {
  const database = await getDb();
  const rows = database.prepare(
    `SELECT LOWER(SUBSTR(path, INSTR(path, '.') + 1)) as ext, COALESCE(SUM(size), 0) as size
     FROM files WHERE path LIKE '%.%' AND size > 0
     GROUP BY ext ORDER BY size DESC`
  ).all() as { ext: string; size: number }[];
  return rows;
}

export async function getAdminStats(): Promise<{ totalUsers: number; totalStorage: number; activeSessions: number }> {
  const database = await getDb();
  const userCount = (database.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  const sessionCount = (database.prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime('now')").get() as { count: number }).count;
  const storageResult = database.prepare("SELECT COALESCE(SUM(size), 0) as total FROM files").get() as { total: number };
  return { totalUsers: userCount, totalStorage: storageResult.total, activeSessions: sessionCount };
}

export interface SessionWithUser {
  id: string;
  user_id: number;
  username: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export async function getActiveSessions(): Promise<SessionWithUser[]> {
  const database = await getDb();
  return database.prepare(`
    SELECT s.id, s.user_id, u.username, u.role, s.expires_at, s.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.expires_at > datetime('now')
    ORDER BY s.created_at DESC
  `).all() as SessionWithUser[];
}

// ── Brute-force protection ──────────────────

export async function recordFailedLogin(username: string): Promise<{ locked: boolean; attempts: number }> {
  const database = await getDb();
  const user = database.prepare("SELECT id, failed_login_attempts, locked_until FROM users WHERE username = ?").get(username) as { id: number; failed_login_attempts: number; locked_until: string | null } | undefined;
  if (!user) return { locked: false, attempts: 0 };

  const newAttempts = user.failed_login_attempts + 1;
  const LOCKOUT_THRESHOLD = 5;
  const LOCKOUT_DURATION_MINUTES = 15;

  if (newAttempts >= LOCKOUT_THRESHOLD) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    database.prepare("UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newAttempts, lockedUntil, user.id);
    return { locked: true, attempts: newAttempts };
  }

  database.prepare("UPDATE users SET failed_login_attempts = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newAttempts, user.id);
  return { locked: false, attempts: newAttempts };
}

export async function clearFailedLogin(username: string): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE username = ?")
    .run(username);
}

export async function isAccountLocked(username: string): Promise<boolean> {
  const database = await getDb();
  const user = database.prepare("SELECT locked_until FROM users WHERE username = ?").get(username) as { locked_until: string | null } | undefined;
  if (!user || !user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
}

// ── must_change_password ────────────────────

export async function getMustChangePassword(userId: number): Promise<boolean> {
  const database = await getDb();
  const user = database.prepare("SELECT must_change_password FROM users WHERE id = ?").get(userId) as { must_change_password: number } | undefined;
  return user ? user.must_change_password === 1 : false;
}

export async function clearMustChangePassword(userId: number): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE users SET must_change_password = 0, updated_at = datetime('now') WHERE id = ?").run(userId);
}

export async function setMustChangePassword(userId: number): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE users SET must_change_password = 1, updated_at = datetime('now') WHERE id = ?").run(userId);
}

// ── Audit log ───────────────────────────────

export interface AuditEntry {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export async function logAudit(userId: number | null, username: string | null, action: string, target?: string, details?: string, ipAddress?: string): Promise<void> {
  const database = await getDb();
  database.prepare(
    "INSERT INTO audit_log (user_id, username, action, target, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(userId, username, action, target || null, details || null, ipAddress || null);
}

export async function getAuditLog(limit: number = 100, offset: number = 0): Promise<AuditEntry[]> {
  const database = await getDb();
  return database.prepare(
    "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).all(limit, offset) as AuditEntry[];
}

export async function getAuditLogCount(): Promise<number> {
  const database = await getDb();
  return (database.prepare("SELECT COUNT(*) as count FROM audit_log").get() as { count: number }).count;
}

// ── Share links ─────────────────────────────

export interface ShareLink {
  id: string;
  file_path: string;
  created_by: number | null;
  has_password: boolean;
  expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
  created_at: string;
}

export async function createShareLink(id: string, filePath: string, createdBy: number, passwordHash: Buffer | null, passwordSalt: Buffer | null, expiresAt: string | null, maxDownloads: number | null): Promise<void> {
  const database = await getDb();
  database.prepare(
    "INSERT INTO share_links (id, file_path, created_by, password_hash, password_salt, expires_at, max_downloads) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, filePath, createdBy, passwordHash, passwordSalt, expiresAt, maxDownloads);
}

export async function getShareLink(id: string): Promise<(ShareLink & { password_hash: Buffer | null; password_salt: Buffer | null }) | undefined> {
  const database = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return database.prepare("SELECT id, file_path, created_by, password_hash, password_salt, expires_at, download_count, max_downloads, created_at FROM share_links WHERE id = ?").get(id) as any;
}

export async function incrementShareDownload(id: string): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE share_links SET download_count = download_count + 1 WHERE id = ?").run(id);
}

export async function getShareLinksForFile(filePath: string): Promise<ShareLink[]> {
  const database = await getDb();
  return database.prepare("SELECT id, file_path, created_by, (CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END) as has_password, expires_at, download_count, max_downloads, created_at FROM share_links WHERE file_path = ? ORDER BY created_at DESC").all(filePath) as ShareLink[];
}

export async function deleteShareLink(id: string): Promise<void> {
  const database = await getDb();
  database.prepare("DELETE FROM share_links WHERE id = ?").run(id);
}

// ── Storage quotas ──────────────────────────

export async function getUserStorageUsed(userId: number): Promise<number> {
  const database = await getDb();
  return (database.prepare("SELECT COALESCE(SUM(size), 0) as total FROM files WHERE owner_id = ?").get(userId) as { total: number }).total;
}

export async function getUserStorageQuota(userId: number): Promise<number> {
  const database = await getDb();
  const user = database.prepare("SELECT storage_quota FROM users WHERE id = ?").get(userId) as { storage_quota: number } | undefined;
  return user?.storage_quota ?? 0;
}

export async function updateUserStorageQuota(userId: number, quota: number): Promise<void> {
  const database = await getDb();
  database.prepare("UPDATE users SET storage_quota = ?, updated_at = datetime('now') WHERE id = ?").run(quota, userId);
}

// ── Recursive folder size ───────────────────

export async function getFolderSizeRecursive(folderPath: string): Promise<{ totalSize: number; fileCount: number; folderCount: number }> {
  const database = await getDb();
  const prefix = folderPath ? folderPath + "/" : "";
  const pattern = prefix ? prefix + "%" : "%";

  let fileCount: number;
  let totalSize: number;

  if (prefix) {
    fileCount = (database.prepare("SELECT COUNT(*) as count FROM files WHERE path LIKE ? AND path NOT LIKE ?").get(pattern, prefix + "%/%") as { count: number }).count;
    totalSize = (database.prepare("SELECT COALESCE(SUM(size), 0) as total FROM files WHERE path LIKE ? AND path NOT LIKE ?").get(pattern, prefix + "%/%") as { total: number }).total;
  } else {
    fileCount = (database.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number }).count;
    totalSize = (database.prepare("SELECT COALESCE(SUM(size), 0) as total FROM files").get() as { total: number }).total;
  }

  // Count subdirectories from manifest
  const allPaths = database.prepare("SELECT DISTINCT path FROM files WHERE path LIKE ?").all(pattern) as { path: string }[];
  const folderNames = new Set<string>();
  for (const row of allPaths) {
    const rest = prefix ? row.path.slice(prefix.length) : row.path;
    const segments = rest.split("/");
    if (segments.length > 1) {
      folderNames.add(segments[0]);
    }
  }

  return { totalSize, fileCount, folderCount: folderNames.size };
}
