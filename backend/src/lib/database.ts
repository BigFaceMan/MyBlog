import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("../../storage/blog.sqlite", import.meta.url));

mkdirSync(dirname(databasePath), {
  recursive: true
});

const database = new DatabaseSync(databasePath);

database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    reading_minutes INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
    views INTEGER NOT NULL DEFAULT 0,
    category_id TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS article_tags (
    article_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    avatar TEXT NOT NULL,
    announcement TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('github', 'mail', 'rss', 'twitter')),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    site_config_id TEXT NOT NULL,
    FOREIGN KEY (site_config_id) REFERENCES site_configs (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('root', 'user')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_articles_status_created_at ON articles (status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);
  CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags (tag_id);
  CREATE INDEX IF NOT EXISTS idx_social_links_site_config_id ON social_links (site_config_id);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);
`);

export function getDatabase() {
  return database;
}

export function getDatabasePath() {
  return databasePath;
}

export function closeDatabase() {
  database.close();
}
