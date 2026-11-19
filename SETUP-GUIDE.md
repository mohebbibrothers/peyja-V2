# راهنمای گام‌به‌گام: تست «گرفتن آخرین پست پیج» با SendBox

> این پروژه به‌جای اتصال مستقیم به متا، از **API رسمی اینستاگرام از طریق SendBox** استفاده می‌کند.
> هدف تست: اتصال پیج → دریافت آخرین پست → ذخیره در دیتابیس.

---

## فاز ۰ — ثبت‌نام و اشتراک رایگان SendBox

1. برو به [sendbox.chat](https://sendbox.chat) → **ورود / ثبت‌نام** → با شماره/ایمیل و کد تایید وارد شو.
2. برو به `app.sendbox.chat`.
3. دکمه‌ی **«دریافت ۷ روز اشتراک رایگان»** را بزن.
4. در بخش **«تنظیمات API رسمی اینستاگرام»**، **توکن دسترسی** را کپی کن.

---

## فاز ۱ — آدرس عمومی (HTTPS) برای اپ بگیر

وبهوک SendBox باید بتواند به اپ شما درخواست بزند، پس اپ باید آدرس عمومی داشته باشد.

- اگر روی سرور واقعی است: دامنه (مثلاً `https://ig.yourdomain.com`).
- اگر روی لپ‌تاپ تست می‌کنی: یک تونل عمومی بزن:
  ```bash
  ngrok http 3000
  # یا
  cloudflared tunnel --url http://localhost:3000
  ```
  آدرسی مثل `https://xxxx.ngrok-free.dev` را بگیر.

---

## فاز ۲ — تنظیم ۴ فیلد در پنل SendBox

در پنل SendBox (همان‌جا که عکس را دیدی):

| فیلد | مقدار برای این پروژه |
|---|---|
| **رمز عبور خود را وارد کنید** | رمز حساب SendBox خودت (تأیید هویت) |
| **دامنه (Domain)** | `https://xxxx.ngrok-free.dev` (یا دامنه‌ی واقعی) |
| **آدرس بازگشت پس از ورود (Login Redirect URL)** | `https://xxxx.ngrok-free.dev/api/boxapi/callback` |
| **آدرس Webhook** | `https://xxxx.ngrok-free.dev/api/boxapi/webhook` |

اگر گزینه‌ی **Webhook Secret** را می‌بینی و مقدار می‌گیری، همان را در فاز ۳ بگذار.

---

## فاز ۳ — تنظیم `.env.local` پروژه

مسیر: `/home/user/instagram-connect/.env.local`

```env
BOXAPI_API_KEY=<توکن فاز ۰>
BOXAPI_LOGIN_URL=https://api.sendbox.chat
BOXAPI_DOMAIN=https://xxxx.ngrok-free.dev
BOXAPI_WEBHOOK_SECRET=<اگر گرفتی>
BOXAPI_BASE_URL=https://api.sendbox.chat/api/v1
APP_URL=https://xxxx.ngrok-free.dev
DEMO_MODE=false
DB_PATH=./data/app.db
```

⚠️ `APP_URL` باید **دقیقاً** همان دامنه‌ی فاز ۲ باشد.

---

## فاز ۴ — اجرای اپ

```bash
cd /home/user/instagram-connect
npm install
npm run dev
```

آدرس‌ها:
- صفحه اصلی: `http://localhost:3000`
- وبهوک (عمومی): `https://xxxx.ngrok-free.dev/api/boxapi/webhook`
- بازگشت لاگین (عمومی): `https://xxxx.ngrok-free.dev/api/boxapi/callback`

---

## فاز ۵ — تست کامل

1. در `localhost:3000` دکمه‌ی **«اتصال با اینستاگرام»** را بزن.
2. به صفحه‌ی ورود رسمی اینستاگرام (میزبانی‌شده توسط SendBox) برده می‌شوی → با پیج خودت لاگین و
   **اجازه (Authorize)** بده.
3. به داشبورد برمی‌گردی و کارت اکانت (یوزرنیم + account_id) را می‌بینی.
4. دکمه‌ی **«دریافت آخرین پست»** را بزن. اپ درخواست `list_posts` را می‌فرستد.
5. SendBox نتیجه را **از طریق وبهوک** می‌فرستد → اپ پست را در دیتابیس ذخیره می‌کند → در داشبورد
   کارت «آخرین پست ذخیره‌شده» ظاهر می‌شود. چند لحظه صبر کن و صفحه را تازه‌سازی (Refresh) کن.

---

## فاز ۶ — بررسی دیتابیس

```bash
node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.log(db.prepare('select id,username,source from accounts').all());console.log(db.prepare('select id,caption,permalink from posts').all());console.log('events:',db.prepare('select count(*) n from webhook_events').get().n);"
```

---

## عیب‌یابی

| مشکل | علت / راه‌حل |
|---|---|
| `?error=config` | `BOXAPI_API_KEY` خالی است یا `DEMO_MODE=false` فراموش شده. |
| بعد از لاگین به داشبورد نمی‌رسی | `Login Redirect URL` در پنل با `APP_URL/api/boxapi/callback` یکی نیست. |
| پست نمی‌آید | وبهوک به اپ نمی‌رسد: `APP_URL` باید عمومی/HTTPS باشد و Webhook URL درست ثبت شود. |
| خطای ۴۰۱ در وبهوک | `BOXAPI_WEBHOOK_SECRET` را اشتباه گذاشته‌ای یا هدر امضا چک نمی‌شود. |
| «در انتظار کلید» | توکن را در `.env.local` نگذاشته‌ای. |
| تونل بسته می‌شود | ngrok/cloudflared را در یک ترمینال جدا باز نگه دار. |

---

## استقرار دائمی (بعد از تست)

- `docker compose up -d --build` روی سرور (فایل‌های Docker آماده‌اند)، یا
- از workflowی `.github/workflows/deploy.yml` با secrets زیر استفاده کن:
  `SSH_HOST`، `SSH_USER`، `SSH_KEY`، `APP_DIR`.
- `APP_URL` را برابر دامنه‌ی نهایی بگذار و همان آدرس‌ها را در پنل SendBox به‌روز کن.
