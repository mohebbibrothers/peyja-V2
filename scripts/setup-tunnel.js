/**
 * به‌روزرسانی خودکار .env.local با آدرس تونل و چاپ مقادیری که باید در پنل SendBox بگذارید.
 *
 * اجرا (از پوشه‌ی پروژه):
 *   node scripts/setup-tunnel.js https://abcd1234.ngrok-free.app
 * یا روی دابل‌کلیک فایل setup-tunnel.bat و بعد آدرس تونل را بچسبان.
 */
const fs = require("node:fs");
const path = require("node:path");

const tunnel = (process.argv[2] || "").trim().replace(/\/+$/, "");

if (!tunnel.startsWith("http")) {
  console.log("لطفاً آدرس تونل را با http/https بفرستید. مثال:");
  console.log("  node scripts/setup-tunnel.js https://abcd1234.ngrok-free.app");
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  fs.copyFileSync(path.join(process.cwd(), ".env.example"), envPath);
  console.log("فایل .env.local از .env.example ساخته شد.");
}

const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
const set = (key, value) => {
  const idx = lines.findIndex((l) => l.startsWith(key + "="));
  if (idx >= 0) lines[idx] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
};
set("BOXAPI_DOMAIN", tunnel);
set("APP_URL", tunnel);

fs.writeFileSync(envPath, lines.join("\n"), "utf8");

console.log("\n.env.local به‌روز شد به آدرس:", tunnel);
console.log("\nاین سه مقدار را در پنل SendBox بگذار (دقیقاً همین‌ها):");
console.log("  دامنه (Domain)              :", tunnel);
console.log("  Login Redirect URL          :", tunnel + "/api/boxapi/callback");
console.log("  Webhook URL                 :", tunnel + "/api/boxapi/webhook");
console.log("\nبعد از این کار، اپ را ری‌استارت کن:  Ctrl+C  و بعد  npm run dev");
