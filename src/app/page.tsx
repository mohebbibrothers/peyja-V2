import Link from "next/link";
import { boxapiConfig } from "@/lib/boxapi";
import { currentSessionToken, validSession } from "@/lib/session";

const ERROR_TEXT: Record<string, string> = {
  config: "کلید BoxAPI (BOXAPI_API_KEY) تنظیم نشده است. راهنمای تنظیم در README است.",
  boxapi: "اتصال از طرف BoxAPI ناموفق بود.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const errorMessage = typeof sp.message === "string" ? sp.message : "";
  const disconnected = sp.disconnected === "1";

  const cfg = boxapiConfig();
  const demo = process.env.DEMO_MODE === "true";
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-20">
      {/* Nav */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-6 w-6">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="0.9" fill="white" stroke="none" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight">Peyja · Instagram Connect</p>
            <p className="text-xs text-slate-400">BoxAPI · Official Instagram API</p>
          </div>
        </div>
        {session ? (
          <Link href="/dashboard" className="btn-ghost !px-5 !py-2.5 text-sm">
            داشبورد ←
          </Link>
        ) : (
          <a
            href={cfg.configured ? "/api/boxapi/start" : demo ? "/api/auth/demo" : "#setup"}
            className="btn-primary !px-5 !py-2.5 text-sm"
          >
            اتصال با اینستاگرام
          </a>
        )}
      </header>

      {/* Banners */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {ERROR_TEXT[error] || "خطای ناشناخته"}
          {errorMessage ? ` — ${errorMessage}` : ""}
        </div>
      )}
      {disconnected && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          اتصال قطع شد و داده‌های ذخیره‌شده حذف شد.
        </div>
      )}

      {/* Hero */}
      <section className="mt-10 text-center">
        <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          BoxAPI · API رسمی اینستاگرام (Meta Verified)
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.25] animate-fade-up md:text-6xl">
          اتصال اینستاگرام و ذخیره‌ی <span className="text-gradient">خودکار</span> آخرین پست
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 animate-fade-up md:text-lg">
          با API رسمی اینستاگرام از طریق BoxAPI و بدون دریافت رمز عبور کاربر، پیج را متصل کنید؛
          آخرین پست با جزئیات کاملش در دیتابیس ذخیره می‌شود. لاگین رسمی، وبهوک لحظه‌ای، حداقل دسترسی.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4 animate-fade-up">
          {session ? (
            <Link href="/dashboard" className="btn-primary">
              مشاهده داشبورد
            </Link>
          ) : (
            <>
              <a
                href={cfg.configured ? "/api/boxapi/start" : demo ? "/api/auth/demo" : "#setup"}
                className="btn-primary"
              >
                {cfg.configured ? "اتصال با اینستاگرام" : demo ? "اجرای حالت دمو ←" : "راه‌اندازی اولیه"}
              </a>
              <a href="#setup" className="btn-ghost">
                راهنمای ۳ قدمه
              </a>
            </>
          )}
        </div>

        {/* Status cards */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="glass card-hover rounded-2xl p-5 text-right">
            <p className="text-xs text-slate-400">اتصال به BoxAPI</p>
            <p className={`mt-2 text-lg font-bold ${cfg.configured ? "text-emerald-300" : "text-amber-300"}`}>
              {cfg.configured ? "✅ تنظیم شده" : "⚠️ در انتظار کلید"}
            </p>
          </div>
          <div className="glass card-hover rounded-2xl p-5 text-right">
            <p className="text-xs text-slate-400">حالت دمو</p>
            <p className={`mt-2 text-lg font-bold ${demo ? "text-sky-300" : "text-slate-300"}`}>
              {demo ? "روشن" : "خاموش"}
            </p>
          </div>
          <div className="glass card-hover rounded-2xl p-5 text-right">
            <p className="text-xs text-slate-400">وبهوک</p>
            <p className="mt-2 truncate text-sm font-bold text-slate-200" dir="ltr">
              {cfg.webhookUrl}
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="setup" className="mt-24">
        <h2 className="text-center text-2xl font-extrabold md:text-3xl">
          سه قدم تا اولین پست در دیتابیس
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="glass card-hover rounded-3xl p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/20 text-xl font-black text-brand-purple">۱</div>
            <h3 className="mt-5 text-lg font-bold">در BoxAPI ثبت‌نام کنید</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              در <b>boxapi.ir</b> ثبت‌نام کنید و <b>۷ روز اشتراک رایگان</b> بگیرید. توکن دسترسی
              را از بخش «تنظیمات API رسمی اینستاگرام» کپی و در{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> بگذارید.
            </p>
          </div>
          <div className="glass card-hover rounded-3xl p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-pink/20 text-xl font-black text-brand-pink">۲</div>
            <h3 className="mt-5 text-lg bold">در پنل BoxAPI سه فیلد را پر کنید</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              <b>Domain</b>، <b>Login Redirect URL</b> و <b>Webhook URL</b> را با آدرس عمومی اپ
              پر کنید (همان‌هایی که در پنل می‌بینید). آدرس‌ها را از قسمت «تنظیمات» همین اپ بخوانید.
            </p>
          </div>
          <div className="glass card-hover rounded-3xl p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/20 text-xl font-black text-brand-orange">۳</div>
            <h3 className="mt-5 text-lg font-bold">متصل کنید و آخرین پست را بگیرید</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              دکمه‌ی «اتصال با اینستاگرام» را بزنید و در صفحه‌ی ورود رسمی اینستاگرام اجازه دهید.
              در داشبورد، «دریافت آخرین پست» را بزنید؛ نتیده از طریق وبهوک در دیتابیس ذخیره می‌شود.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-extrabold md:text-3xl">چرا این مسیر؟</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "بدون رمز عبور", d: "لاگین در صفحه‌ی رسمی اینستاگرام (از طریق BoxAPI) انجام می‌شود؛ اپ شما فقط account_id می‌گیرد.", c: "🔐" },
            { t: "وبهوک لحظه‌ای", d: "کامنت‌ها، دایرکت‌ها و نتیجه‌ی list_posts به‌صورت Real-Time به وبهوک شما می‌رسند.", c: "⚡" },
            { t: "ذخیره ساختاریافته", d: "پست‌ها با کپشن، لایک، کامنت و لینک در دیتابیس SQLite ذخیره می‌شوند.", c: "🗄️" },
            { t: "آماده توسعه", d: "پاسخ به کامنت (reply_comment) و ارسال دایرکت (send_message) با همان کلید.", c: "🚀" },
          ].map((f) => (
            <div key={f.t} className="glass card-hover rounded-3xl p-6">
              <div className="text-3xl">{f.c}</div>
              <h3 className="mt-4 text-base font-bold">{f.t}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
        <p>
          مسیر رسمی اینستاگرام از طریق BoxAPI · هیچ رمز عبوری ذخیره نمی‌شود · وبهوک با امضای HMAC
          قابل احراز است.
        </p>
      </footer>
    </main>
  );
}
