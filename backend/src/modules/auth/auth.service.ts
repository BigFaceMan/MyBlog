import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { getDatabase } from "../../lib/database.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";

const SESSION_COOKIE_NAME = "sspblog_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const database = getDatabase();

export type UserRole = "root" | "user";
export type UserStatus = "active" | "disabled";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

interface UserSessionRow {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  expires_at: string;
}

export interface AuthUser {
  username: string;
  role: UserRole;
  isRoot: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  isRoot: boolean;
}

export interface AdminUserMutationInput {
  username: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export interface AdminUserUpdateInput {
  role?: UserRole;
  status?: UserStatus;
}

export class AuthHttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || "sspblog-local-session-secret";
}

function getRootUsername() {
  return process.env.ROOT_USERNAME || process.env.ADMIN_USERNAME || "root";
}

function getRootPasswordHash() {
  return process.env.ROOT_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH || "";
}

function getRootPassword() {
  return process.env.ROOT_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

function toAuthUser(row: Pick<UserRow, "username" | "role">): AuthUser {
  return {
    username: row.username,
    role: row.role,
    isRoot: row.role === "root"
  };
}

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isRoot: row.role === "root"
  };
}

function parseCookies(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    const value = rawValueParts.join("=");

    if (!rawName || !value) {
      continue;
    }

    try {
      cookies.set(rawName, decodeURIComponent(value));
    } catch {
      cookies.set(rawName, value);
    }
  }

  return cookies;
}

function getCookie(request: FastifyRequest, name: string) {
  return parseCookies(request.headers.cookie).get(name) ?? "";
}

function getCookieBaseOptions(maxAge: number) {
  const options = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];

  if (process.env.NODE_ENV === "production") {
    options.push("Secure");
  }

  return options.join("; ");
}

function findUserByUsername(username: string) {
  return database
    .prepare(
      `
        SELECT id, username, password_hash, role, status, created_at, updated_at
        FROM users
        WHERE username = ?
        LIMIT 1
      `
    )
    .get(normalizeUsername(username)) as UserRow | undefined;
}

function findUserById(userId: string) {
  return database
    .prepare(
      `
        SELECT id, username, password_hash, role, status, created_at, updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(userId) as UserRow | undefined;
}

function countActiveRootUsers() {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'root' AND status = 'active'")
    .get() as { count: number };

  return Number(row.count);
}

function ensureCanModifyUser(user: UserRow, currentUsername: string, next?: AdminUserUpdateInput) {
  if (user.username === normalizeUsername(currentUsername)) {
    throw new AuthHttpError("Cannot modify your own account", 400);
  }

  const nextRole = next?.role ?? user.role;
  const nextStatus = next?.status ?? user.status;

  if (user.role === "root" && user.status === "active" && (nextRole !== "root" || nextStatus !== "active") && countActiveRootUsers() <= 1) {
    throw new AuthHttpError("Cannot remove the last active root user", 400);
  }
}

function ensureUserExists(userId: string) {
  const user = findUserById(userId);

  if (!user) {
    throw new AuthHttpError("User not found", 404);
  }

  return user;
}

async function resolveConfiguredRootPasswordHash() {
  const configuredHash = getRootPasswordHash();

  if (configuredHash) {
    return configuredHash;
  }

  const configuredPassword = getRootPassword();

  return configuredPassword ? hashPassword(configuredPassword) : "";
}

export async function ensureRootUser() {
  const username = normalizeUsername(getRootUsername());
  const passwordHash = await resolveConfiguredRootPasswordHash();
  const existing = findUserByUsername(username);

  if (existing) {
    const nextPasswordHash = passwordHash || existing.password_hash;

    database
      .prepare(
        `
          UPDATE users
          SET role = 'root', status = 'active', password_hash = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(nextPasswordHash, new Date().toISOString(), existing.id);

    return true;
  }

  if (!passwordHash) {
    return false;
  }

  const now = new Date().toISOString();

  database
    .prepare(
      `
        INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'root', 'active', ?, ?)
      `
    )
    .run(randomUUID(), username, passwordHash, now, now);

  return true;
}

export async function registerUser(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  const rootUsername = normalizeUsername(getRootUsername());

  if (normalizedUsername === rootUsername) {
    throw new AuthHttpError("Root user is reserved", 409);
  }

  if (findUserByUsername(normalizedUsername)) {
    throw new AuthHttpError("Username already exists", 409);
  }

  const now = new Date().toISOString();
  const user: UserRow = {
    id: randomUUID(),
    username: normalizedUsername,
    password_hash: await hashPassword(password),
    role: "user",
    status: "active",
    created_at: now,
    updated_at: now
  };

  database
    .prepare(
      `
        INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(user.id, user.username, user.password_hash, user.role, user.status, user.created_at, user.updated_at);

  return toAuthUser(user);
}

export async function verifyUserCredentials(username: string, password: string) {
  const user = findUserByUsername(username);

  if (!user) {
    return null;
  }

  if (user.status !== "active") {
    return null;
  }

  const valid = await verifyPassword(password, user.password_hash);

  return valid ? user : null;
}

export function createUserSession(username: string) {
  const user = findUserByUsername(username);

  if (!user) {
    throw new AuthHttpError("User not found", 404);
  }

  if (user.status !== "active") {
    throw new AuthHttpError("User is disabled", 403);
  }

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  database
    .prepare(
      `
        INSERT INTO user_sessions (id, token_hash, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(randomUUID(), hashSessionToken(token), user.id, now.toISOString(), expiresAt.toISOString());

  return token;
}

export function deleteExpiredUserSessions() {
  database.prepare("DELETE FROM user_sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

export function deleteUserSessionByToken(token: string) {
  if (!token) {
    return;
  }

  database.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function buildSessionCookie(token: string) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${getCookieBaseOptions(SESSION_TTL_SECONDS)}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; ${getCookieBaseOptions(0)}`;
}

export function getUserSessionFromRequest(request: FastifyRequest): AuthUser | null {
  const token = getCookie(request, SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  const row = database
    .prepare(
      `
        SELECT user_sessions.id, user_sessions.user_id, users.username, users.role, users.status, user_sessions.expires_at
        FROM user_sessions
        INNER JOIN users ON users.id = user_sessions.user_id
        WHERE user_sessions.token_hash = ?
        LIMIT 1
      `
    )
    .get(hashSessionToken(token)) as UserSessionRow | undefined;

  if (!row) {
    return null;
  }

  if (row.status !== "active") {
    database.prepare("DELETE FROM user_sessions WHERE id = ?").run(row.id);
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    database.prepare("DELETE FROM user_sessions WHERE id = ?").run(row.id);
    return null;
  }

  return toAuthUser(row);
}

export function getUserSessionTokenFromRequest(request: FastifyRequest) {
  return getCookie(request, SESSION_COOKIE_NAME);
}

export function listAdminUsers() {
  const rows = database
    .prepare(
      `
        SELECT id, username, password_hash, role, status, created_at, updated_at
        FROM users
        ORDER BY role ASC, created_at DESC
      `
    )
    .all() as unknown as UserRow[];

  return rows.map(toAdminUser);
}

export async function createAdminUser(input: AdminUserMutationInput) {
  const username = normalizeUsername(input.username);

  if (!username) {
    throw new AuthHttpError("Username is required", 400);
  }

  if (findUserByUsername(username)) {
    throw new AuthHttpError("Username already exists", 409);
  }

  const now = new Date().toISOString();
  const user: UserRow = {
    id: randomUUID(),
    username,
    password_hash: await hashPassword(input.password),
    role: input.role,
    status: input.status ?? "active",
    created_at: now,
    updated_at: now
  };

  database
    .prepare(
      `
        INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(user.id, user.username, user.password_hash, user.role, user.status, user.created_at, user.updated_at);

  return toAdminUser(user);
}

export function updateAdminUser(userId: string, input: AdminUserUpdateInput, currentUsername: string) {
  const user = ensureUserExists(userId);

  ensureCanModifyUser(user, currentUsername, input);

  const role = input.role ?? user.role;
  const status = input.status ?? user.status;
  const updatedAt = new Date().toISOString();

  database
    .prepare(
      `
        UPDATE users
        SET role = ?, status = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(role, status, updatedAt, user.id);

  if (status !== "active" || role !== user.role) {
    database.prepare("DELETE FROM user_sessions WHERE user_id = ?").run(user.id);
  }

  return toAdminUser({
    ...user,
    role,
    status,
    updated_at: updatedAt
  });
}

export async function updateAdminUserPassword(userId: string, password: string) {
  const user = ensureUserExists(userId);
  const updatedAt = new Date().toISOString();

  database
    .prepare(
      `
        UPDATE users
        SET password_hash = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(await hashPassword(password), updatedAt, user.id);
  database.prepare("DELETE FROM user_sessions WHERE user_id = ?").run(user.id);

  return toAdminUser({
    ...user,
    updated_at: updatedAt
  });
}

export function deleteAdminUser(userId: string, currentUsername: string) {
  const user = ensureUserExists(userId);

  ensureCanModifyUser(user, currentUsername, {
    status: "disabled",
    role: "user"
  });

  database.prepare("DELETE FROM users WHERE id = ?").run(user.id);

  return {
    id: user.id
  };
}
