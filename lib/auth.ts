import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import {
  getUserByUsername,
  getUserById,
  createUser,
  createSession,
  getSession,
  deleteSession,
  getAllUsers,
  updateUserRole,
  updateUserPassword,
  deleteUser,
  deleteUserSessions,
  getAdminStats,
  getActiveSessions,
  recordFailedLogin,
  clearFailedLogin,
  isAccountLocked,
  getMustChangePassword,
  clearMustChangePassword,
  setMustChangePassword,
  logAudit,
  getUserStorageUsed,
  getUserStorageQuota,
  updateUserStorageQuota,
  createShareLink,
  getShareLink,
  incrementShareDownload,
  getShareLinksForFile,
  deleteShareLink,
  getFolderSizeRecursive,
} from "./db";

export type { SessionWithUser, ShareLink, AuditEntry } from "./db";

const scryptAsync = promisify(scrypt);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function hashPassword(password: string): Promise<{ hash: Buffer; salt: Buffer }> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return { hash, salt };
}

export async function verifyPassword(password: string, storedHash: Buffer, storedSalt: Buffer): Promise<boolean> {
  const hash = (await scryptAsync(password, storedSalt, 64)) as Buffer;
  return timingSafeEqual(hash, storedHash);
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function login(username: string, password: string, request?: Request): Promise<{ sessionId: string; mustChangePassword: boolean } | { error: string; locked?: boolean; retryAfter?: number }> {
  // Check if account is locked
  if (await isAccountLocked(username)) {
    return { error: `Account locked due to too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, locked: true };
  }

  const user = await getUserByUsername(username);
  if (!user) {
    // Still record attempt against non-existent user to prevent user enumeration timing
    await hashPassword(password);
    return { error: "Invalid username or password" };
  }

  const valid = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!valid) {
    const result = await recordFailedLogin(username);
    const ip = request ? getClientIp(request) : undefined;
    await logAudit(user.id, username, "login_failed", undefined, `Attempt ${result.attempts}/${MAX_LOGIN_ATTEMPTS}`, ip);
    if (result.locked) {
      return { error: `Account locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, locked: true };
    }
    const remaining = MAX_LOGIN_ATTEMPTS - result.attempts;
    return { error: `Invalid username or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` };
  }

  // Success — clear failed attempts
  await clearFailedLogin(username);

  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await createSession(sessionId, user.id, expiresAt);

  const ip = request ? getClientIp(request) : undefined;
  await logAudit(user.id, username, "login_success", undefined, undefined, ip);

  return { sessionId, mustChangePassword: user.must_change_password === 1 };
}

export async function validateSession(sessionId: string): Promise<{ userId: number; username: string; role: string; mustChangePassword: boolean } | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const mustChangePassword = await getMustChangePassword(session.user_id);
  return { userId: session.user_id, username: session.username, role: session.role, mustChangePassword };
}

export async function logout(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}

export function getSessionCookie(sessionId: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return `session=${sessionId}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`;
}

export function getClearCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  return `session=; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`;
}

export function extractSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

export async function getCurrentUser(request: Request): Promise<{ userId: number; username: string; role: string; mustChangePassword: boolean } | null> {
  const sessionId = extractSessionId(request);
  if (!sessionId) return null;
  return validateSession(sessionId);
}

export async function requireAuth(request: Request): Promise<{ userId: number; username: string; role: string; mustChangePassword: boolean }> {
  const user = await getCurrentUser(request);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireWrite(request: Request): Promise<{ userId: number; username: string; role: string; mustChangePassword: boolean }> {
  const user = await requireAuth(request);
  if (user.role === "read") throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin(request: Request): Promise<{ userId: number; username: string; role: string; mustChangePassword: boolean }> {
  const user = await requireAuth(request);
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const userInfo = await getUserById(userId);
  if (!userInfo) return { success: false, error: "User not found" };

  const user = await getUserByUsername(userInfo.username);
  if (!user) return { success: false, error: "User not found" };

  const valid = await verifyPassword(oldPassword, user.password_hash, user.password_salt);
  if (!valid) return { success: false, error: "Current password is incorrect" };

  if (newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters" };

  const { hash, salt } = await hashPassword(newPassword);
  await updateUserPassword(userId, hash, salt);
  await clearMustChangePassword(userId);
  await logAudit(userId, user.username, "password_changed");
  return { success: true };
}

export async function adminResetPassword(userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters" };

  const { hash, salt } = await hashPassword(newPassword);
  await updateUserPassword(userId, hash, salt);
  await clearMustChangePassword(userId);

  const db = await (await import("./db")).getDb();
  const u = db.prepare("SELECT username FROM users WHERE id = ?").get(userId) as { username: string } | undefined;
  await logAudit(userId, u?.username || "unknown", "admin_password_reset");
  return { success: true };
}

export async function createUserAccount(username: string, password: string, role: string = "read") {
  const { hash, salt } = await hashPassword(password);
  return createUser(username, hash, salt, role);
}

export async function listUsers() {
  return getAllUsers();
}

export async function updateUserAccess(userId: number, role: string) {
  await updateUserRole(userId, role);
}

export async function removeUser(userId: number) {
  await deleteUserSessions(userId);
  await deleteUser(userId);
}

export async function forceLogout(userId: number) {
  await deleteUserSessions(userId);
}

export async function fetchAdminStats() {
  return getAdminStats();
}

export async function fetchActiveSessions() {
  return getActiveSessions();
}

export async function resetAdminPassword(): Promise<{ username: string; password: string }> {
  const adminUsername = "admin";
  const password = randomBytes(12).toString("base64url").slice(0, 16);
  const { hash, salt } = await hashPassword(password);

  const existing = await getUserByUsername(adminUsername);
  if (existing) {
    await updateUserPassword(existing.id, hash, salt);
    await setMustChangePassword(existing.id);
  } else {
    const user = await createUser(adminUsername, hash, salt, "admin");
    await setMustChangePassword(user.id);
  }

  return { username: adminUsername, password };
}

// ── Share links ─────────────────────────────

export async function createFileShareLink(filePath: string, createdBy: number, password?: string, expiresInHours?: number, maxDownloads?: number): Promise<string> {
  const linkId = randomBytes(16).toString("base64url").slice(0, 24);
  let passwordHash: Buffer | null = null;
  let passwordSalt: Buffer | null = null;

  if (password) {
    const { hash, salt } = await hashPassword(password);
    passwordHash = hash;
    passwordSalt = salt;
  }

  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600000).toISOString() : null;
  await createShareLink(linkId, filePath, createdBy, passwordHash, passwordSalt, expiresAt, maxDownloads || null);
  await logAudit(createdBy, null, "share_link_created", filePath);
  return linkId;
}

export async function accessShareLink(linkId: string, password?: string): Promise<{ filePath: string; success: boolean; error?: string }> {
  const link = await getShareLink(linkId);
  if (!link) return { filePath: "", success: false, error: "Share link not found" };

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { filePath: "", success: false, error: "Share link has expired" };
  }

  if (link.max_downloads && link.download_count >= link.max_downloads) {
    return { filePath: "", success: false, error: "Download limit reached" };
  }

  if (link.password_hash && link.password_salt) {
    if (!password) return { filePath: "", success: false, error: "Password required" };
    const valid = await verifyPassword(password, link.password_hash, link.password_salt);
    if (!valid) return { filePath: "", success: false, error: "Invalid password" };
  }

  await incrementShareDownload(linkId);
  return { filePath: link.file_path, success: true };
}

export async function getFileShareLinks(filePath: string) {
  return getShareLinksForFile(filePath);
}

export async function removeShareLink(linkId: string) {
  await deleteShareLink(linkId);
}

// ── Audit log ───────────────────────────────

export async function getAuditEntries(limit: number = 100, offset: number = 0) {
  const { getAuditLog, getAuditLogCount } = await import("./db");
  const entries = await getAuditLog(limit, offset);
  const total = await getAuditLogCount();
  return { entries, total };
}

// ── Storage ─────────────────────────────────

export async function getUserStorage(userId: number) {
  const used = await getUserStorageUsed(userId);
  const quota = await getUserStorageQuota(userId);
  return { used, quota };
}

export async function setUserStorageQuota(userId: number, quota: number) {
  await updateUserStorageQuota(userId, quota);
}

// ── Folder stats ────────────────────────────

export async function getFolderStats(folderPath: string) {
  return getFolderSizeRecursive(folderPath);
}

// ── Health check ────────────────────────────

export async function healthCheck(): Promise<{ status: string; db: string; uptime: number; version: string }> {
  try {
    const db = await (await import("./db")).getDb();
    db.prepare("SELECT 1").get();
    return { status: "ok", db: "connected", uptime: process.uptime(), version: "1.0.0" };
  } catch {
    return { status: "error", db: "disconnected", uptime: process.uptime(), version: "1.0.0" };
  }
}

// ── LAN detection ───────────────────────────

export function getLanUrl(port: number): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const os = require("os") as typeof import("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          return `http://${iface.address}:${port}`;
        }
      }
    }
  } catch {
    // ignore
  }
  return `http://localhost:${port}`;
}

// ── Credentials file ────────────────────────

export async function writeCredentialsFile(username: string, password: string, lanUrl: string): Promise<string> {
  const credentialsPath = path.join(process.cwd(), ".cloudvault-initial-credentials");
  const content = [
    "CloudVault Initial Credentials",
    "==============================",
    "",
    `Username: ${username}`,
    `Password: ${password}`,
    "",
    `Login at: ${lanUrl}/login`,
    "",
    "IMPORTANT: Delete this file after noting the credentials.",
    `Generated: ${new Date().toISOString()}`,
    "",
  ].join("\n");

  await fs.writeFile(credentialsPath, content, { mode: 0o600 });
  return credentialsPath;
}

// ── Session cleanup ─────────────────────────

export async function cleanupSessions(): Promise<number> {
  const { cleanupExpiredSessions } = await import("./db");
  return cleanupExpiredSessions();
}
