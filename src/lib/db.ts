import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

export interface Account {
  id: string; // BoxAPI account_id (UUID)
  username: string;
  source: string; // 'boxapi' | 'demo'
  connected_at: number;
  updated_at: number;
}

export interface Post {
  id: string;
  account_id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  timestamp: string | null;
  like_count: number | null;
  comments_count: number | null;
  saved_at: number;
}

export interface Comment {
  id: string;
  account_id: string;
  media_id: string | null;
  username: string | null;
  text: string | null;
  timestamp: string | null;
  raw_json: string | null;
  saved_at: number;
}

export interface OAuthRequest {
  id: string;
  status: string; // pending | completed | failed
  account_id: string | null;
  username: string | null;
  created_at: number;
  completed_at: number | null;
}

export interface WebhookEvent {
  event_id: string;
  event_type: string;
  account_id: string | null;
  raw_json: string;
  created_at: number;
}

export interface Session {
  token: string;
  account_id: string;
  created_at: number;
  expires_at: number;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          TEXT PRIMARY KEY,
      username    TEXT NOT NULL,
      source      TEXT NOT NULL DEFAULT 'boxapi',
      connected_at INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id            TEXT PRIMARY KEY,
      account_id    TEXT NOT NULL,
      caption       TEXT,
      media_type    TEXT,
      media_url     TEXT,
      permalink     TEXT,
      thumbnail_url TEXT,
      timestamp     TEXT,
      like_count    INTEGER,
      comments_count INTEGER,
      saved_at      INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_posts_account ON posts(account_id, timestamp);

    CREATE TABLE IF NOT EXISTS comments (
      id         TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      media_id   TEXT,
      username   TEXT,
      text       TEXT,
      timestamp  TEXT,
      raw_json   TEXT,
      saved_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_comments_account ON comments(account_id, saved_at);

    CREATE TABLE IF NOT EXISTS oauth_requests (
      id           TEXT PRIMARY KEY,
      status       TEXT NOT NULL DEFAULT 'pending',
      account_id   TEXT,
      username     TEXT,
      created_at   INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id   TEXT PRIMARY KEY,
      event_type TEXT,
      account_id TEXT,
      raw_json   TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // ── مهاجرت‌های سبک (برای دیتابیس‌های ساخته‌شده با نسخه‌های قبلی) ─────────
  const accountColumns = new Set(
    (_db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[]).map((c) => c.name)
  );
  if (!accountColumns.has("source")) {
    _db.exec("ALTER TABLE accounts ADD COLUMN source TEXT NOT NULL DEFAULT 'boxapi'");
  }

  return _db;
}

export function upsertAccount(input: {
  id: string;
  username: string;
  source?: string;
}): Account {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT INTO accounts (id, username, source, connected_at, updated_at)
     VALUES (@id, @username, @source, @now, @now)
     ON CONFLICT(id) DO UPDATE SET username = excluded.username, updated_at = excluded.updated_at`
  ).run({ id: input.id, username: input.username, source: input.source || "boxapi", now });
  return db.prepare("SELECT * FROM accounts WHERE id = ?").get(input.id) as Account;
}

export function getAccount(id: string): Account | null {
  return (getDb().prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account) ?? null;
}

export function savePost(input: {
  id: string;
  account_id: string;
  caption?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  permalink?: string | null;
  thumbnail_url?: string | null;
  timestamp?: string | null;
  like_count?: number | null;
  comments_count?: number | null;
}): Post {
  const db = getDb();
  db.prepare(
    `INSERT INTO posts (id, account_id, caption, media_type, media_url, permalink, thumbnail_url, timestamp, like_count, comments_count, saved_at)
     VALUES (@id, @account_id, @caption, @media_type, @media_url, @permalink, @thumbnail_url, @timestamp, @like_count, @comments_count, @saved_at)
     ON CONFLICT(id) DO UPDATE SET
       caption = excluded.caption,
       media_type = excluded.media_type,
       media_url = excluded.media_url,
       permalink = excluded.permalink,
       thumbnail_url = excluded.thumbnail_url,
       timestamp = excluded.timestamp,
       like_count = excluded.like_count,
       comments_count = excluded.comments_count,
       saved_at = excluded.saved_at`
  ).run({
    id: input.id,
    account_id: input.account_id,
    caption: input.caption ?? null,
    media_type: input.media_type ?? null,
    media_url: input.media_url ?? null,
    permalink: input.permalink ?? null,
    thumbnail_url: input.thumbnail_url ?? null,
    timestamp: input.timestamp ?? null,
    like_count: input.like_count ?? null,
    comments_count: input.comments_count ?? null,
    saved_at: Date.now(),
  });
  return db.prepare("SELECT * FROM posts WHERE id = ?").get(input.id) as Post;
}

export function listPosts(accountId: string, limit = 20): Post[] {
  return getDb()
    .prepare("SELECT * FROM posts WHERE account_id = ? ORDER BY timestamp DESC LIMIT ?")
    .all(accountId, limit) as Post[];
}

export function getLatestPost(accountId: string): Post | null {
  return (
    (getDb()
      .prepare("SELECT * FROM posts WHERE account_id = ? ORDER BY timestamp DESC LIMIT 1")
      .get(accountId) as Post) ?? null
  );
}

export function countPosts(accountId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM posts WHERE account_id = ?")
    .get(accountId) as { n: number };
  return row.n;
}

export function saveComment(input: {
  id: string;
  account_id: string;
  media_id?: string | null;
  username?: string | null;
  text?: string | null;
  timestamp?: string | null;
  raw_json?: string | null;
}): Comment {
  const db = getDb();
  db.prepare(
    `INSERT INTO comments (id, account_id, media_id, username, text, timestamp, raw_json, saved_at)
     VALUES (@id, @account_id, @media_id, @username, @text, @timestamp, @raw_json, @saved_at)
     ON CONFLICT(id) DO UPDATE SET text = excluded.text, saved_at = excluded.saved_at`
  ).run({
    id: input.id,
    account_id: input.account_id,
    media_id: input.media_id ?? null,
    username: input.username ?? null,
    text: input.text ?? null,
    timestamp: input.timestamp ?? null,
    raw_json: input.raw_json ?? null,
    saved_at: Date.now(),
  });
  return db.prepare("SELECT * FROM comments WHERE id = ?").get(input.id) as Comment;
}

export function countComments(accountId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM comments WHERE account_id = ?")
    .get(accountId) as { n: number };
  return row.n;
}

export function createOAuthRequest(id: string): void {
  getDb()
    .prepare("INSERT INTO oauth_requests (id, status, created_at) VALUES (?, 'pending', ?)")
    .run(id, Date.now());
}

export function getOAuthRequest(id: string): OAuthRequest | null {
  return (
    (getDb().prepare("SELECT * FROM oauth_requests WHERE id = ?").get(id) as OAuthRequest) ?? null
  );
}

export function completeOAuthRequest(id: string, accountId: string, username: string): void {
  getDb()
    .prepare("UPDATE oauth_requests SET status='completed', account_id=?, username=?, completed_at=? WHERE id=?")
    .run(accountId, username, Date.now(), id);
}

export function eventExists(eventId: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM webhook_events WHERE event_id = ?").get(eventId));
}

export function insertEvent(event: {
  event_id: string;
  event_type: string | null;
  account_id: string | null;
  raw_json: string;
}): void {
  getDb()
    .prepare("INSERT OR IGNORE INTO webhook_events (event_id, event_type, account_id, raw_json, created_at) VALUES (?,?,?,?,?)")
    .run(event.event_id, event.event_type, event.account_id, event.raw_json, Date.now());
}

export function countEvents(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM webhook_events").get() as { n: number };
  return row.n;
}

export function deleteAccount(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM posts WHERE account_id = ?").run(id);
  db.prepare("DELETE FROM comments WHERE account_id = ?").run(id);
  db.prepare("DELETE FROM sessions WHERE account_id = ?").run(id);
  db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
}

export function createSession(accountId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare(
    "INSERT INTO sessions (token, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(token, accountId, now, now + 30 * 24 * 60 * 60 * 1000);
  return token;
}

export function getSession(token: string): Session | null {
  return (
    (getDb()
      .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > ?")
      .get(token, Date.now()) as Session) ?? null
  );
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
