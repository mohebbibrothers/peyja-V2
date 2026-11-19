"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type EventsResponse = {
  events: {
    event_id: string;
    event_type: string | null;
    account_id: string | null;
    created_at: number;
    data: any;
  }[];
};

type RunResult = { ok: boolean; action: string; response?: any; error?: string };

const ACTIONS: {
  key: string;
  title: string;
  desc: string;
  fields: { name: string; label: string; placeholder?: string }[];
  submitLabel: string;
  danger?: boolean;
}[] = [
  {
    key: "info",
    title: "۱) اطلاعات سرویس و پلن",
    desc: "GET /service/info — پلن، دامنه، آدرس بازگشت و لیست اکانت‌های متصل",
    fields: [],
    submitLabel: "اجرا",
  },
  {
    key: "list_posts",
    title: "۲) لیست پست‌های پیج",
    desc: "POST /service/actions/list_posts — نتیجه به‌صورت آسنکرون در وبهوک می‌آید",
    fields: [{ name: "limit", label: "تعداد", placeholder: "5" }],
    submitLabel: "گرفتن پست‌ها",
  },
  {
    key: "comments",
    title: "۳) کامنت‌های یک پست",
    desc: "POST /service/actions/comment_comments — نتیجه در وبهوک",
    fields: [
      { name: "media_id", label: "media_id پست", placeholder: "شناسه پست" },
      { name: "limit", label: "تعداد", placeholder: "25" },
    ],
    submitLabel: "گرفتن کامنت‌ها",
  },
  {
    key: "reply_comment",
    title: "۴) پاسخ عمومی به کامنت",
    desc: "POST /service/actions/reply_comment — روی همان پست کامنت می‌نویسد",
    fields: [
      { name: "comment_id", label: "comment_id", placeholder: "شناسه کامنت" },
      { name: "message", label: "متن پاسخ", placeholder: "سلام! ممنون از کامنت شما" },
    ],
    submitLabel: "ارسال پاسخ",
    danger: true,
  },
  {
    key: "private_reply",
    title: "۵) پاسخ خصوصی (دایرکت) به کامنت‌گذار",
    desc: "POST /service/actions/private_reply — پیام خصوصی به کاربر",
    fields: [
      { name: "comment_id", label: "comment_id", placeholder: "شناسه کامنت" },
      { name: "message", label: "متن پیام", placeholder: "سلام! پاسخ شما در دایرکت ارسال شد" },
    ],
    submitLabel: "ارسال پاسخ خصوصی",
    danger: true,
  },
  {
    key: "send_message",
    title: "۶) ارسال دایرکت",
    desc: "POST /service/actions/send_message — recipient_id را از وبهوک messaging بگیر",
    fields: [
      { name: "recipient_id", label: "recipient_id", placeholder: "sender.id از وبهوک" },
      { name: "message", label: "متن پیام", placeholder: "سلام!" },
    ],
    submitLabel: "ارسال پیام",
    danger: true,
  },
  {
    key: "follow_status",
    title: "۷) بررسی فالو بودن کاربر",
    desc: "POST /service/actions/follow_status — نتیجه در وبهوک",
    fields: [{ name: "customer_id", label: "customer_id", placeholder: "sender.id از وبهوک" }],
    submitLabel: "بررسی",
  },
  {
    key: "show_profile",
    title: "۸) پروفایل کاربر اینستاگرام",
    desc: "POST /service/actions/show_profile — نتیجه در وبهوک",
    fields: [{ name: "customer_id", label: "customer_id", placeholder: "sender.id از وبهوک" }],
    submitLabel: "گرفتن پروفایل",
  },
];

const fmt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "medium" });

export default function TestConsole({
  username,
  accountId,
}: {
  username: string;
  accountId: string;
}) {
  const [events, setEvents] = useState<EventsResponse["events"]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [values, setValues] = useState<{ [action: string]: { [field: string]: string } }>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<{ [action: string]: RunResult }>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/test/events", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as EventsResponse;
      setEvents(json.events);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSavedPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/test/posts", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setSavedPosts(json.posts ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadSavedPosts();
    timer.current = setInterval(() => {
      loadEvents();
      loadSavedPosts();
    }, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [loadEvents, loadSavedPosts]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  const run = async (key: string, fields: string[]) => {
    setBusy(key);
    const payload: Record<string, string> = {};
    for (const f of fields) payload[f] = values[key]?.[f] ?? "";
    try {
      const res = await fetch("/api/test/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: key, ...payload }),
      });
      const json = (await res.json()) as RunResult;
      setResults((prev) => ({ ...prev, [key]: json }));
    } catch (e: any) {
      setResults((prev) => ({
        ...prev,
        [key]: { ok: false, action: key, error: e?.message ?? "network error" },
      }));
    } finally {
      setBusy(null);
      setTimeout(loadEvents, 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account + plan summary */}
      <section className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">اکانت متصل</p>
            <p className="mt-1 text-lg font-extrabold" dir="ltr">
              @{username}
            </p>
            <p className="font-mono text-[11px] text-slate-500" dir="ltr">
              {accountId}
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-400">رویدادهای وبهوک</p>
            <p className="mt-1 text-2xl font-black text-brand-yellow">{events.length}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[11px] leading-5 text-amber-200">
          این صفحه فقط برای تست است. در محیط تولید باید <code dir="ltr">ENABLE_TEST_PAGE=false</code> شود.
          هر اکشنی که اجرا می‌کنی واقعاً به اینستاگرام ارسال می‌شود.
        </p>
      </section>

      {/* Saved posts — the source of media_id */}
      <section className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold">پست‌های ذخیره‌شده در دیتابیس (منبع media_id)</h3>
          <span className="chip">{savedPosts.length} پست</span>
        </div>
        <p className="mb-3 text-[11px] leading-5 text-slate-400">
          بعد از زدن کارت «۲) لیست پست‌های پیج» و چند لحظه صبر، پست‌ها اینجا ذخیره می‌شوند. مقدار
          <code dir="ltr"> id </code> همان <code dir="ltr">media_id</code> است که برای کارت ۳ لازم است.
        </p>
        {savedPosts.length === 0 ? (
          <p className="text-sm text-slate-400">
            هنوز پستی ذخیره نشده. کارت ۲ را اجرا کن و چند لحظه صبر کن.
          </p>
        ) : (
          <div className="space-y-2">
            {savedPosts.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{p.caption || "—"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {p.media_type || "—"} · ❤️ {p.like_count ?? "—"} · 💬 {p.comments_count ?? "—"}
                  </p>
                </div>
                <code
                  dir="ltr"
                  className="hidden max-w-[10rem] truncate rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-300 sm:block"
                >
                  {p.id}
                </code>
                <button
                  type="button"
                  onClick={() => copy(p.id)}
                  className="shrink-0 rounded-xl bg-brand-purple/20 px-3 py-2 text-[11px] font-bold text-brand-purple hover:bg-brand-purple/30"
                >
                  {copied === p.id ? "کپی شد ✓" : "کپی media_id"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Capability cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {ACTIONS.map((a) => {
          const res = results[a.key];
          return (
            <section key={a.key} className="glass rounded-3xl p-5">
              <h3 className="text-base font-extrabold">{a.title}</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-400" dir="ltr">
                {a.desc}
              </p>

              {a.fields.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {a.fields.map((f) => (
                    <label key={f.name} className="block">
                      <span className="mb-1 block text-[11px] text-slate-400">{f.label}</span>
                      <input
                        dir="ltr"
                        defaultValue={values[a.key]?.[f.name] ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [a.key]: { ...prev[a.key], [f.name]: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-purple"
                      />
                    </label>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => run(a.key, a.fields.map((f) => f.name))}
                disabled={busy === a.key}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                  a.danger
                    ? "bg-gradient-to-l from-brand-pink to-brand-orange text-white"
                    : "bg-gradient-to-l from-brand-purple to-brand-pink text-white"
                }`}
              >
                {busy === a.key ? "در حال اجرا…" : a.submitLabel}
              </button>

              {res && (
                <pre
                  dir="ltr"
                  className={`mt-3 max-h-44 overflow-auto rounded-xl border p-3 text-left text-[11px] leading-5 ${
                    res.ok
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                      : "border-red-500/30 bg-red-500/5 text-red-200"
                  }`}
                >
                  {JSON.stringify(res, null, 2)}
                </pre>
              )}
            </section>
          );
        })}
      </div>

      {/* Webhook event log */}
      <section className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold">رویدادهای وبهوک (نتایج آسنکرون)</h3>
          <span className="chip">هر ۳ ثانیه تازه می‌شود</span>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-slate-400">
            هنوز رویدادی نیامده. یک اکشن اجرا کن یا به پیج پیام/کامنت بفرست.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => {
              const isAction = e.event_type?.startsWith("action.");
              return (
                <div
                  key={e.event_id}
                  className={`rounded-2xl border p-3 ${
                    isAction
                      ? "border-brand-purple/40 bg-brand-purple/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200" dir="ltr">
                      {e.event_type || "(بدون نوع)"}
                    </span>
                    <span className="text-[11px] text-slate-500">{fmt.format(e.created_at)}</span>
                  </div>
                  <pre
                    dir="ltr"
                    className="mt-2 max-h-56 overflow-auto text-left text-[11px] leading-5 text-slate-300"
                  >
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
