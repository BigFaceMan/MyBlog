import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { getDatabase } from "../../lib/database.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";

const SESSION_COOKIE_NAME = "sspblog_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const database = getDatabase();

export type UserRole = "root" | "user";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface UserSessionRow {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  expires_at: string;
}

export interface AuthUser {
  username: string;
  role: UserRole;
  isRoot: boolean;
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
        SELECT id, username, password_hash, role, created_at, updated_at
        FROM users
        WHERE username = ?
        LIMIT 1
      `
    )
    .get(normalizeUsername(username)) as UserRow | undefined;
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
          SET role = 'root', password_hash = ?, updated_at = ?
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
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, 'root', ?, ?)
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
    created_at: now,
    updated_at: now
  };

  database
    .prepare(
      `
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(user.id, user.username, user.password_hash, user.role, user.created_at, user.updated_at);

  return toAuthUser(user);
}

export async function verifyUserCredentials(username: string, password: string) {
  const user = findUserByUsername(username);

  if (!user) {
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
        SELECT user_sessions.id, user_sessions.user_id, users.username, users.role, user_sessions.expires_at
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

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    database.prepare("DELETE FROM user_sessions WHERE id = ?").run(row.id);
    return null;
  }

  return toAuthUser(row);
}

export function getUserSessionTokenFromRequest(request: FastifyRequest) {
  return getCookie(request, SESSION_COOKIE_NAME);
}
