/**
 * بررسی تنظیمات SendBox و اتصال API — اجرا:  node scripts/check-sendbox.js
 * این اسکریپت فقط روی سیستم خودت اجرا می‌شود و هیچ چیزی را منتشر نمی‌کند.
 */
const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.log("فایل .env.local پیدا نشد. اول آن را از .env.example بساز.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const apiKey = env.BOXAPI_API_KEY || "";
const loginToken = env.BOXAPI_LOGIN_TOKEN || "";
const base = (env.BOXAPI_BASE_URL || "https://api.sendbox.chat/api/v1").replace(/\/+$/, "");
const appUrl = (env.APP_URL || "").replace(/\/+$/, "");

console.log("APP_URL          :", appUrl || "(تنظیم نشده)");
console.log("API key          :", apiKey ? `${apiKey.slice(0, 8)}… (${apiKey.length} کاراکتر)` : "خالی!");
console.log("Login token      :", loginToken ? `${loginToken.slice(0, 8)}… (${loginToken.length} کاراکتر)` : "خالی!");
console.log("Webhook secret   :", env.BOXAPI_WEBHOOK_SECRET ? "تنظیم شده" : "خالی");
console.log("Base URL         :", base);
console.log();

if (!apiKey) {
  console.log("⛔ BOXAPI_API_KEY خالی است. آن را از پنل SendBox بگیر.");
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${base}/service/info`, { headers: { "X-Api-Key": apiKey } });
    const json = await res.json();
    if (!json.success) {
      console.log("⛔ خطا:", json.message);
      process.exit(1);
    }
    const d = json.data || {};
    console.log("✅ اتصال به SendBox برقرار است.");
    console.log();
    console.log("پلن             :", d.plan?.name, "| فعال:", d.plan?.is_active, "| اعتبار تا:", d.plan?.expired_time);
    console.log("دامنه‌ی ثبت‌شده   :", d.domain);
    console.log("Login Redirect   :", d.login_redirect_url);
    console.log("لینک ورود         :", d.instagram_oauth_url);
    console.log("اکانت‌های متصل   :", Array.isArray(d.accounts) ? d.accounts.length : 0);
    console.log();
    const expected = `${appUrl}/api/boxapi/callback`;
    console.log(
      d.login_redirect_url === expected
        ? "✅ Login Redirect با APP_URL یکی است."
        : `⚠️ Login Redirect باید ${expected} باشد (الان: ${d.login_redirect_url})`
    );
    if (d.instagram_oauth_url && loginToken) {
      const ok = d.instagram_oauth_url.includes(loginToken);
      console.log(ok ? "✅ توکن ورود در لینک ورود وجود دارد." : "⚠️ توکن ورود با لینک ورود پنل یکی نیست.");
    }
    if (!loginToken) {
      console.log("⚠️ BOXAPI_LOGIN_TOKEN خالی است → صفحه‌ی ورود خطای Invalid Instagram login token می‌دهد.");
      console.log("   توکن ورود را از همان «لینک ورود اینستاگرام» بردار و در BOXAPI_LOGIN_TOKEN بگذار.");
    }
  } catch (e) {
    console.log("⛔ خطا در ارتباط:", e.message);
  }
})();
