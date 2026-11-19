/**
 * نمایش وضعیت دیتابیس (بدون نیاز به استارت اپ)
 * اجرا:  node scripts/check-db.js
 */
const path = require("node:path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

let db;
try {
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
} catch {
  console.log("دیتابیس هنوز ساخته نشده است:", dbPath);
  process.exit(0);
}

const accounts = db.prepare("SELECT id, username, source, connected_at FROM accounts").all();
const posts = db
  .prepare("SELECT id, caption, permalink, timestamp FROM posts ORDER BY saved_at DESC")
  .all();
const comments = db.prepare("SELECT id, username, text FROM comments ORDER BY saved_at DESC").all();
const events = db.prepare("SELECT event_id, event_type FROM webhook_events").all();

console.log("=== اکانت‌ها ===");
console.log(accounts.length ? accounts : "خالی");

console.log("\n=== پست‌ها (از تازه‌ترین) ===");
console.log(posts.length ? posts : "خالی");

console.log("\n=== کامنت‌ها ===");
console.log(comments.length ? comments : "خالی");

console.log("\n=== رویدادهای وبهوک ===");
console.log(events.length ? events : "خالی");
