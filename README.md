# Peyja · اتصال اینستاگرام با SendBox (API رسمی)

وب‌اپلیکیشنی که پیج اینستاگرام را از طریق **API رسمی اینستاگرام (SendBox / Meta Verified)** متصل می‌کند
و **آخرین پست** را با جزئیات کامل در دیتابیس ذخیره می‌کند. رمز عبور کاربر هرگز به اپ نمی‌رسد.

> تکنولوژی: Next.js 15 · React 19 · Tailwind · SQLite (better-sqlite3)
> مسیر: SendBox → Official Instagram API (base: `https://api.sendbox.chat/api/v1`، هدر `X-Api-Key`)

> **نیازمندی:** Node.js **۲۲ یا بالاتر** (تست‌شده روی ۲۶). به‌دلیل استفاده از باینری آماده‌ی
> `better-sqlite3`، **بدون هیچ Visual Studio / build tools** اجرا می‌شود.

---

## اجرای سریع (حالت دمو)

```bash
npm install
npm run dev
```

`http://localhost:3000` → دکمه‌ی **«اجرای حالت دمو»**. یک اکانت و پست نمونه ساخته و در دیتابیس ذخیره می‌شود.

---

## اتصال واقعی با SendBox (مراحل کامل)

### ۱) ثبت‌نام و ۷ روز رایگان
1. در [sendbox.chat](https://sendbox.chat) ثبت‌نام و ورود کنید.
2. برو به `app.sendbox.chat` و دکمه‌ی **«دریافت ۷ روز اشتراک رایگان»** را بزن.
3. توکن دسترسی را از بخش **«تنظیمات API رسمی اینستاگرام»** کپی کن.

### ۲) در پنل SendBox این ۴ فیلد را پر کنید
| فیلد در پنل | مقدار |
|---|---|
| **رمز عبور** | رمز حساب SendBox خود را وارد کن (تأیید هویت) |
| **دامنه (Domain)** | آدرس عمومی اپ شما، مثلاً `https://app.yourdomain.com` |
| **آدرس بازگشت پس از ورود (Login Redirect URL)** | `{APP_URL}/api/boxapi/callback` |
| **آدرس Webhook** | `{APP_URL}/api/boxapi/webhook` |

> `{APP_URL}` را با آدرس عمومی و **HTTPS** اپ خود جایگزین کن. برای تست محلی باید یک تونل عمومی
> (مثل ngrok / Cloudflare Tunnel) داشته باشی، چون SendBox باید وبهوک را صدا بزند.

### ۳) تنظیم `.env.local`
```env
BOXAPI_API_KEY=<توکن از مرحله ۱>
BOXAPI_LOGIN_TOKEN=<توکن لینک ورود اینستاگرام>
BOXAPI_LOGIN_URL=https://api.sendbox.chat
BOXAPI_DOMAIN=<دامنه‌ی مرحله ۲>
BOXAPI_WEBHOOK_SECRET=<اگر در پنل گرفتید، همین جا>
BOXAPI_BASE_URL=https://api.sendbox.chat/api/v1
APP_URL=https://app.yourdomain.com
DEMO_MODE=false
DB_PATH=./data/app.db
```

> ⚠️ **دو توکن متفاوت دارید:**
> ۱) **کلید API** (`BOXAPI_API_KEY`): برای صدا زدن API (لیست پست‌ها، کامنت، ارسال پیام). در پنل
> SendBox جایی مثل «API Key / توکن دسترسی» نوشته می‌شود.
> ۲) **توکن لینک ورود** (`BOXAPI_LOGIN_TOKEN`): توکنی که در «لینک ورود اینستاگرام» می‌آید
> (`https://api.sendbox.chat/instagram-oauth?token=...`). این فقط برای صفحه‌ی ورود است و
> **کلید API نیست**. اگر کلید API را در پارامتر `token` بگذارید، SendBox خطای
> `Invalid Instagram login token.` می‌دهد.
>
> می‌توانی همان لینک کامل را از `/service/info` هم بگیری (`instagram_oauth_url`).

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
│     ├─ boxapi/{start,callback,webhook}/   # فلوی اصلی SendBox
│     ├─ auth/demo/                         # حالت دمو
│     ├─ posts/                             # لیست پست‌ها (JSON)
│     └─ account/{sync,disconnect}          # دریافت پست / قطع اتصال
└─ lib/
   ├─ boxapi.ts        # کلاینت SendBox + HMAC webhook + استخراج پست‌ها
   ├─ db.ts            # SQLite: accounts, posts, comments, oauth_requests, webhook_events, sessions
   └─ session.ts       # سشن بر پایه‌ی کوکی httpOnly
```

## وبهوک

SendBox تا ۳ بار (فاصله‌ی ۶۰ ثانیه) retry می‌کند؛ اپ با `event_id` تکراری را حذف می‌کند و در صورت
تنظیم `BOXAPI_WEBHOOK_SECRET`، امضای HMAC را با هدرهای `X-BoxApi-Signature` / `X-BoxApi-Timestamp`
بررسی می‌کند. برای موفقیت، سریع `2xx` برگردان.

## استقرار (Deploy)

- **Docker**: `docker compose up -d --build` (فایل‌های `Dockerfile` و `docker-compose.yml` آماده‌اند).
- **GitHub Actions**: workflowهای `CI` (بیلد) و `Deploy` (استقرار SSH) در پوشه‌ی `.github/workflows` هست.
  برای استفاده از Deploy: secrets زیر را در مخزن اضافه کن: `SSH_HOST`، `SSH_USER`، `SSH_KEY`، `APP_DIR`.
- **Vercel/Railway/Render**: به‌صورت Node اجرا کن و `APP_URL` را برابر دامنه‌ی نهایی بگذار.

## نکات امنیتی

- توکن SendBox فقط در سرور (`.env`) می‌ماند، در فرانت‌اند نیست.
- وبهوک با HMAC قابل احراز است.
- ذخیره‌ی رمز عبور کاربر معنایی ندارد (لاگین در صفحه‌ی خود اینستاگرام است).
