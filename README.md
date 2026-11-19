# Peyja · اتصال اینستاگرام با BoxAPI (API رسمی)

وب‌اپلیکیشنی که پیج اینستاگرام را از طریق **API رسمی اینستاگرام (BoxAPI / Meta Verified)** متصل می‌کند
و **آخرین پست** را با جزئیات کامل در دیتابیس ذخیره می‌کند. رمز عبور کاربر هرگز به اپ نمی‌رسد.

> تکنولوژی: Next.js 15 · React 19 · Tailwind · SQLite (better-sqlite3)
> مسیر: BoxAPI → Official Instagram API (base: `https://boxapi.ir/api/instagram`، هدر `X-Api-Key`)

---

## اجرای سریع (حالت دمو)

```bash
npm install
npm run dev
```

`http://localhost:3000` → دکمه‌ی **«اجرای حالت دمو»**. یک اکانت و پست نمونه ساخته و در دیتابیس ذخیره می‌شود.

---

## اتصال واقعی با BoxAPI (مراحل کامل)

### ۱) ثبت‌نام و ۷ روز رایگان
1. در [boxapi.ir](https://boxapi.ir) ثبت‌نام و ورود کنید.
2. برو به `boxapi.ir/dashboard/instagram-api-setting` و دکمه‌ی **«دریافت ۷ روز اشتراک رایگان»** را بزن.
3. توکن دسترسی را از بخش **«تنظیمات API رسمی اینستاگرام»** کپی کن.

### ۲) در پنل BoxAPI این ۴ فیلد را پر کنید
| فیلد در پنل | مقدار |
|---|---|
| **رمز عبور** | رمز حساب BoxAPI خود را وارد کن (تأیید هویت) |
| **دامنه (Domain)** | آدرس عمومی اپ شما، مثلاً `https://app.yourdomain.com` |
| **آدرس بازگشت پس از ورود (Login Redirect URL)** | `{APP_URL}/api/boxapi/callback` |
| **آدرس Webhook** | `{APP_URL}/api/boxapi/webhook` |

> `{APP_URL}` را با آدرس عمومی و **HTTPS** اپ خود جایگزین کن. برای تست محلی باید یک تونل عمومی
> (مثل ngrok / Cloudflare Tunnel) داشته باشی، چون BoxAPI باید وبهوک را صدا بزند.

### ۳) تنظیم `.env.local`
```env
BOXAPI_API_KEY=<توکن از مرحله ۱>
BOXAPI_LOGIN_URL=https://boxapi.ir
BOXAPI_DOMAIN=<دامنه‌ی مرحله ۲>
BOXAPI_WEBHOOK_SECRET=<اگر در پنل گرفتید، همین جا>
BOXAPI_BASE_URL=https://boxapi.ir/api/instagram
APP_URL=https://app.yourdomain.com
DEMO_MODE=false
DB_PATH=./data/app.db
```

### ۴) اجرا و تست
```bash
npm install
npm run dev
```
1. دکمه‌ی **«اتصال با اینستاگرام»** را بزن → در صفحه‌ی ورود رسمی اینستاگرام لاگین و اجازه ده.
2. به داشبورد برمی‌گردی؛ «دریافت آخرین پست» را بزن.
3. نتیجه‌ی `list_posts` از طریق **وبهوک** می‌رسد و در دیتابیس ذخیره می‌شود.

---

## ساختار پروژه

```
src/
├─ app/
│  ├─ page.tsx
│  ├─ dashboard/page.tsx
│  └─ api/
│     ├─ boxapi/{start,callback,webhook}/   # فلوی اصلی BoxAPI
│     ├─ auth/demo/                         # حالت دمو
│     ├─ posts/                             # لیست پست‌ها (JSON)
│     └─ account/{sync,disconnect}          # دریافت پست / قطع اتصال
└─ lib/
   ├─ boxapi.ts        # کلاینت BoxAPI + HMAC webhook + استخراج پست‌ها
   ├─ db.ts            # SQLite: accounts, posts, comments, oauth_requests, webhook_events, sessions
   └─ session.ts       # سشن بر پایه‌ی کوکی httpOnly
```

## وبهوک

BoxAPI تا ۳ بار (فاصله‌ی ۶۰ ثانیه) retry می‌کند؛ اپ با `event_id` تکراری را حذف می‌کند و در صورت
تنظیم `BOXAPI_WEBHOOK_SECRET`، امضای HMAC را با هدرهای `X-BoxApi-Signature` / `X-BoxApi-Timestamp`
بررسی می‌کند. برای موفقیت، سریع `2xx` برگردان.

## استقرار (Deploy)

- **Docker**: `docker compose up -d --build` (فایل‌های `Dockerfile` و `docker-compose.yml` آماده‌اند).
- **GitHub Actions**: workflowهای `CI` (بیلد) و `Deploy` (استقرار SSH) در پوشه‌ی `.github/workflows` هست.
  برای استفاده از Deploy: secrets زیر را در مخزن اضافه کن: `SSH_HOST`، `SSH_USER`، `SSH_KEY`، `APP_DIR`.
- **Vercel/Railway/Render**: به‌صورت Node اجرا کن و `APP_URL` را برابر دامنه‌ی نهایی بگذار.

## نکات امنیتی

- توکن BoxAPI فقط در سرور (`.env`) می‌ماند، در فرانت‌اند نیست.
- وبهوک با HMAC قابل احراز است.
- ذخیره‌ی رمز عبور کاربر معنایی ندارد (لاگین در صفحه‌ی خود اینستاگرام است).
