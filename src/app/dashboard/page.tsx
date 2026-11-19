import Link from "next/link";
import { redirect } from "next/navigation";
import { countComments, countEvents, countPosts, getAccount, listPosts } from "@/lib/db";
import { boxapiConfig } from "@/lib/boxapi";
import { currentSessionToken, validSession } from "@/lib/session";
import MediaImage from "@/components/MediaImage";
import DisconnectButton from "@/components/DisconnectButton";

const fmt = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function toDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  return fmt.format(new Date(ms));
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const requested = sp.requested === "1";
  const syncError = sp.sync_error === "1";

  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) redirect("/");

  const account = getAccount(session.account_id);
  if (!account) redirect("/");

  const posts = listPosts(account.id, 20);
  const latest = posts[0] ?? null;
  const demo = account.source === "demo";
  const cfg = boxapiConfig();

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
            <p className="text-lg font-extrabold leading-tight">داشبورد</p>
            <p className="text-xs text-slate-400">آخرین پست ذخیره‌شده در دیتابیس</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-ghost !px-4 !py-2 text-sm">
            صفحه اصلی
          </Link>
          <DisconnectButton />
        </div>
      </header>

      {demo && (
        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-3.5 text-sm text-sky-200">
          🧪 <b>حالت دمو</b> فعال است؛ داده‌ها واقعی نیستند. برای اتصال واقعی، کلید BoxAPI را در{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> بگذارید و{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">DEMO_MODE=false</code> کنید.
        </div>
      )}
      {requested && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-200">
          ✅ درخواست «آخرین پست» ثبت شد. نتیجه از طریق وبهوک به دیتابیس می‌رسد — چند لحظه صبر کنید و
          صفحه را تازه کنید.
        </div>
      )}
      {syncError && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-200">
          ⚠️ ثبت درخواست ناموفق بود. کلید BoxAPI و اتصال را بررسی کنید.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account card */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange text-2xl font-black text-white">
              {(account.username || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold" dir="ltr">
                @{account.username}
              </p>
              <span className="chip mt-1">{account.source}</span>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">شناسه اکانت (account_id)</dt>
              <dd className="font-mono text-[11px] text-slate-200" dir="ltr">
                {account.id}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">زمان اتصال</dt>
              <dd>{toDate(account.connected_at)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">پست‌های ذخیره‌شده</dt>
              <dd className="font-bold text-brand-yellow">{countPosts(account.id)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">کامنت‌های دریافتی</dt>
              <dd className="font-bold text-brand-yellow">{countComments(account.id)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">رویدادهای وبهوک</dt>
              <dd>{countEvents()}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] leading-5 text-slate-400" dir="ltr">
            <p className="font-semibold text-slate-300">Webhook URL (set in BoxAPI panel)</p>
            <p className="break-all">{cfg.webhookUrl}</p>
            <p className="mt-2 font-semibold text-slate-300">Login Redirect URL</p>
            <p className="break-all">{cfg.redirectUri}</p>
          </div>

          <form action="/api/account/sync" method="post" className="mt-6">
            <button type="submit" className="btn-primary w-full !py-3 text-sm">
              🔄 دریافت آخرین پست
            </button>
          </form>
        </section>

        {/* Latest post */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">آخرین پست ذخیره‌شده</h2>
            <span className="chip">از دیتابیس</span>
          </div>

          {latest ? (
            <article className="glass overflow-hidden rounded-3xl">
              <div className="grid md:grid-cols-2">
                <div className="aspect-square md:aspect-auto md:min-h-[22rem]">
                  <MediaImage
                    src={latest.media_url || latest.thumbnail_url}
                    alt={latest.caption || "پست اینستاگرام"}
                  />
                </div>
                <div className="flex flex-col p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="chip">{latest.media_type || "—"}</span>
                    <span className="chip">❤️ {latest.like_count ?? "—"}</span>
                    <span className="chip">💬 {latest.comments_count ?? "—"}</span>
                  </div>
                  <p className="mt-5 flex-1 text-sm leading-8 text-slate-200">
                    {latest.caption || "— بدون کپشن —"}
                  </p>
                  <dl className="mt-6 space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <dt>زمان پست</dt>
                      <dd>{toDate(latest.timestamp ? Date.parse(latest.timestamp) : null)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>زمان ذخیره در دیتابیس</dt>
                      <dd>{toDate(latest.saved_at)}</dd>
                    </div>
                  </dl>
                  {latest.permalink && (
                    <a
                      href={latest.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost mt-5 !py-2.5 text-sm"
                    >
                      مشاهده در اینستاگرام ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="glass rounded-3xl p-10 text-center text-slate-300">
              هنوز پستی ذخیره نشده است. دکمه‌ی «دریافت آخرین پست» را بزنید.
            </div>
          )}
        </section>
      </div>

      {/* All saved posts */}
      {posts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-extrabold">همه پست‌های ذخیره‌شده</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.id} className="glass card-hover overflow-hidden rounded-3xl">
                <div className="aspect-square">
                  <MediaImage src={p.media_url || p.thumbnail_url} alt={p.caption || "پست"} />
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-6 text-slate-200">
                    {p.caption || "—"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>❤️ {p.like_count ?? "—"} · 💬 {p.comments_count ?? "—"}</span>
                    <span>{toDate(p.timestamp ? Date.parse(p.timestamp) : null)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
