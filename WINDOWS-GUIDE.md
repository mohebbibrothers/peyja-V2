# راهنمای کامل اجرا روی ویندوز (Windows) — تست ۷ روزه‌ی BoxAPI

> این راهنما برای کسی است که پروژه را از GitHub به‌صورت ZIP دانلود کرده و روی ویندوز اجرا می‌کند.
> تمام دستورها برای **CMD** (خط فرمان ویندوز) نوشته شده‌اند.

---

## بخش ۰ — چرا دستورهای قبلی خطا داد؟

| دستور قبلی | چرا خطا داد |
|---|---|
| `cd /home/user/instagram-connect` | این مسیر مربوط به سرور لینوکس من است، روی ویندوز وجود ندارد |
| `ngrok http 3000` | برنامه‌ی ngrok روی سیستم شما نصب نیست |

پس دو کار لازم است: مسیر درست پوشه‌ی ویندوز را داشته باشی، و ngrok را نصب کنی.

---

## بخش ۱ — بررسی Node.js (الزامی)

در CMD این دو دستور را بزن:

```
node -v
npm -v
```

- اگر چیزی مثل `v20.x.x` و `10.x.x` داد → اوکی.
- اگر خطا داد (`not recognized`) → Node.js نصب نیست:
  1. برو به <https://nodejs.org>
  2. نسخه‌ی **LTS** (۲۰ یا ۲۲) را دانلود و نصب کن (تمام مراحل Next → Next → Finish).
  3. CMD را ببند و دوباره باز کن (تا PATH به‌روز شود).
  4. دوباره `node -v` را بزن.

---

## بخش ۲ — باز کردن پوشه‌ی پروژه در CMD

پوشه‌ی دانلودی اسمش `peyja-V2-main` است و در دسکتاپ:

```
cd C:\Users\amirm\Desktop\peyja-V2-main
```

راه سریع‌تر: در File Explorer وارد پوشه شو، روی نوار آدرس بالای پنجره کلیک کن، `cmd` بنویس و Enter بزن
(این‌طوری CMD مستقیم در همان پوشه باز می‌شود).

بررسی کن فایل‌ها را ببینی:

```
dir
```
باید `package.json` و `src` را ببینی.

---

## بخش ۳ — نصب وابستگی‌های پروژه

```
npm install
```

- این کار را **حتماً** انجام بده؛ چون ZIP دانلودی پوشه‌ی `node_modules` را ندارد.
- اگر کند بود: `npm install --no-audit --no-fund`
- اگر خطای `better-sqlite3` داد: `npm install --build-from-source` را بزن؛ و اگر باز هم خطا داد،
  «Visual Studio Build Tools» را نصب کن (گزینه‌ی Desktop development with C++).

---

## بخش ۴ — ساخت فایل `.env.local` (خیلی مهم)

این فایل **در مخزن نیست** (چون حاوی رمز است و در `.gitignore` قرار دارد)، پس در ZIP نیامده و باید
خودت بسازی.

راه سریع در CMD:

```
copy .env.example .env.local
```

بعد فایل `.env.local` را با **Notepad** یا **VS Code** باز کن و این محتوا را بگذار:

```
BOXAPI_API_KEY=توکن_کپی_شده_از_پنل_باکس‌API
BOXAPI_LOGIN_URL=https://boxapi.ir
BOXAPI_DOMAIN=https://xxxx.ngrok-free.app
BOXAPI_WEBHOOK_SECRET=
BOXAPI_BASE_URL=https://boxapi.ir/api/instagram
APP_URL=https://xxxx.ngrok-free.app
DEMO_MODE=false
DB_PATH=./data/app.db
```

- `xxxx.ngrok-free.app` را با آدرس تونلِ مرحله‌ی ۶ عوض کن.
- اگر پنل یک مقدار **Webhook Secret** می‌دهد، آن را در خط `BOXAPI_WEBHOOK_SECRET` بگذار؛ اگر نداد،
  خالی بگذار.
- ذخیره را با کدینگ **UTF-8** انجام بده.

---

## بخش ۵ — استارت اپ

```
npm run dev
```

تا ببینی:

```
▲ Next.js 15.5.29
- Local: http://localhost:3000
✓ Ready
```

مرورگر را باز کن: <http://localhost:3000>

- اگر `?error=config` دیدی → یعنی `BOXAPI_API_KEY` هنوز خالی است (مرحله‌ی ۷ را انجام بده).
- اگر پورت ۳۰۰۰ اشغال بود: در یک CMD دیگر `netstat -ano | findstr :3000` را بزن، شماره‌ی PID را بردار و
  `taskkill /PID <PID> /F` را بزن؛ یا سرور را با `npx next dev -p 3001` روی پورت ۳۰۰۱ اجرا کن (و در
  مرحله‌ی تونل هم `ngrok http 3001` بزن).

---

## بخش ۶ — نصب و راه‌اندازی ngrok (تونل عمومی)

وبهوک BoxAPI باید بتواند از اینترنت به اپ تو در لپ‌تاپ بزند، پس به یک آدرس عمومی نیاز داری.

### ۶.۱ نصب
یکی از سه راه:

- **راه اول (ساده):** از <https://ngrok.com/download> نسخه‌ی Windows را دانلود و آنزیپ کن؛ فایل
  `ngrok.exe` را بگیر و داخل پوشه‌ی پروژه (`C:\Users\amirm\Desktop\peyja-V2-main`) بگذار.
- **راه دوم (سریع‌تر):** اگر `winget` داری:
  ```
  winget install ngrok.ngrok
  ```
- **راه سوم:** `scoop install ngrok` یا `choco install ngrok`

### ۶.۲ ثبت‌نام و Authtoken
1. در <https://dashboard.ngrok.com/signup> ثبت‌نام کن.
2. برو به <https://dashboard.ngrok.com/get-started/your-authtoken> و توکن را کپی کن.
3. در CMD (یک بار کافی است):
   ```
   ngrok config add-authtoken توکن_خودت
   ```

### ۶.۳ اجرای تونل
در **یک CMD جدید** (اپ در ترمینال قبلی در حال اجراست، آن را نبند):

```
ngrok http 3000
```

خروجی چیزی مثل این می‌شود:

```
Forwarding  https://abcd1234.ngrok-free.app -> http://localhost:3000
```

همین `https://abcd1234.ngrok-free.app` را کپی کن. این آدرس را در **مرحله‌ی ۷** و در `.env.local`
استفاده می‌کنی.

> نکته‌ی مهم: در پلن رایگان، با هر بار بستن و اجرای دوباره‌ی ngrok، آدرس **عوض می‌شود**. وقتی عوض شد،
> هم پنل BoxAPI و هم فایل `.env.local` را با آدرس جدید به‌روز کن و اپ را دوباره استارت کن
> (`Ctrl+C` بعد `npm run dev`).
>
> نکته‌ی دوم: اولین بار که مرورگر لینک تونل را باز می‌کنی، صفحه‌ی هشدار ngrok می‌آید؛ دکمه‌ی
> **Visit Site** را بزن (فقط یک بار).

---

## بخش ۷ — ساخت اکانت تست ۷ روزه‌ی BoxAPI و پر کردن فیلدها

### ۷.۱ ثبت‌نام
1. برو به <https://boxapi.ir>
2. **ورود / ثبت‌نام** را بزن → شماره موبایل یا ایمیل → کد تایید → ساخت حساب.
3. یک **رمز عبور** برای حساب BoxAPI خودت انتخاب/ثبت کن و آن را یادداشت کن (همین را در مرحله‌ی ۷.۳
   در فیلد «رمز عبور» می‌زنی).

### ۷.۲ فعال‌سازی ۷ روز رایگان
1. وارد پنل شو.
2. برو به صفحه‌ی `boxapi.ir/dashboard/instagram-api-setting`
   (همان صفحه‌ای که چهار فیلد را دیدی).
3. دکمه‌ی **«دریافت ۷ روز اشتراک رایگان»** را بزن و مراحل را تکمیل کن.
   - اگر پلن می‌خواهد انتخاب کنی، کوچک‌ترین/رایگان‌ترین گزینه را بزن.
   - اگر از تو رمز عبور خودِ حساب را خواست، همان رمز مرحله‌ی ۷.۱ را بزن.

### ۷.۳ پر کردن چهار فیلد

| فیلد در پنل | چه چیزی بگذاری |
|---|---|
| **رمز عبور** | رمز عبور حساب BoxAPI خودت (همان مرحله‌ی ۷.۱) — فقط برای تأیید تغییرات است |
| **دامنه (Domain)** | آدرس عمومی تونل: `https://abcd1234.ngrok-free.app` |
| **آدرس بازگشت پس از ورود (Login Redirect URL)** | `https://abcd1234.ngrok-free.app/api/boxapi/callback` |
| **آدرس Webhook** | `https://abcd1234.ngrok-free.app/api/boxapi/webhook` |

اگر فیلدی با نام **Webhook Secret** دیدی و مقداری ساخت، آن را هم کپی کن و در `.env.local` خط
`BOXAPI_WEBHOOK_SECRET` بگذار.

### ۷.۴ گرفتن توکن API
در همان صفحه‌ی تنظیمات API رسمی اینستاگرام، بخش **توکن دسترسی / کلید API** را پیدا کن و آن را
کپی کن، بعد در `.env.local` خط `BOXAPI_API_KEY` بگذار.

> توکن را جایی منتشر نکن و در GitHub نگذار. اگر لو رفت، در پنل دوباره بساز.

### ۷.۵ هم‌خوانی را دو بار چک کن
- `BOXAPI_DOMAIN` در `.env.local` = همان دامنه‌ی پنل.
- `APP_URL` در `.env.local` = همان آدرس تونل.
- `Login Redirect URL` در پنل = `{APP_URL}/api/boxapi/callback`.
- `Webhook URL` در پنل = `{APP_URL}/api/boxapi/webhook`.

---

## بخش ۸ — تست کامل (گرفتن آخرین پست پیج)

1. در مرورگر <http://localhost:3000> دکمه‌ی **«اتصال با اینستاگرام»** را بزن.
2. به صفحه‌ی ورود رسمی اینستاگرام (که توسط BoxAPI میزبانی می‌شود) برده می‌شوی → با **پیج تست** خودت
   لاگین کن و دکمه‌ی **اجازه / Authorize** را بزن.
   - پیج باید **حرفه‌ای (Business/Creator)** باشد؛ اگر شخصی است، در اینستاگرام برو به
     Settings → Account type and tools → Switch to professional account.
3. به داشبورد برمی‌گردی؛ یوزرنیم و `account_id` را می‌بینی.
4. دکمه‌ی **«دریافت آخرین پست»** را بزن.
5. **چند لحظه صبر کن** (نتیجه به‌صورت هم‌زمان نمی‌آید؛ از طریق وبهوک می‌آید) و صفحه را رفرش کن.
6. کارت **«آخرین پست ذخیره‌شده»** باید با کپشن، لایک، کامنت و لینک پست پر شود.

---

## بخش ۹ — بررسی دیتابیس

در CMD (از پوشه‌ی پروژه):

```
node scripts/check-db.js
```

خروجی: لیست اکانت‌ها، پست‌ها (از تازه‌ترین)، کامنت‌ها و رویدادهای وبهوک.

---

## بخش ۱۰ — توقف و اجرای مجدد

- توقف هر ترمینال: `Ctrl+C` و بعد `Y` و Enter.
- اجرای مجدد:
  ```
  npm run dev
  ```
  و در ترمینال دوم:
  ```
  ngrok http 3000
  ```

---

## بخش ۱۱ — عیب‌یابی

| نشانه | علت و راه‌حل |
|---|---|
| `npm is not recognized` | Node.js نصب نیست یا PATH به‌روز نیست → CMD را ببند و دوباره باز کن |
| `ngrok is not recognized` | ngrok در PATH نیست → در همان پوشه‌ای که `ngrok.exe` هست اجرا کن: `.\ngrok.exe http 3000` |
| `?error=config` | `BOXAPI_API_KEY` خالی است یا `DEMO_MODE=false` ثبت نشده |
| بعد از لاگین به داشبورد نرسیدی | `Login Redirect URL` پنل باید دقیقاً `{APP_URL}/api/boxapi/callback` باشد |
| پست نیامد | تونل بسته است، یا `APP_URL`/Webhook URL با آدرس تونل یکی نیست، یا پنل ذخیره نشده |
| خطای ۴۰۱ در وبهوک | `BOXAPI_WEBHOOK_SECRET` اشتباه است |
| آدرس تونل عوض شد | پنل و `.env.local` را با آدرس جدید به‌روز کن و اپ را ری‌استارت کن |
| پورت ۳۰۰۰ اشغال است | `netstat -ano \| findstr :3000` و `taskkill /PID <PID> /F`، یا `-p 3001` |
| همیشه دکمه‌ی اتصال می‌روی دمو | `DEMO_MODE=true` است؛ آن را `false` کن |
| خطای `better-sqlite3` هنگام نصب | Visual Studio Build Tools (Desktop C++) را نصب کن و دوباره `npm install` بزن |
