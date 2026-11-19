import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccount } from "@/lib/db";
import { currentSessionToken, validSession } from "@/lib/session";
import TestConsole from "@/components/TestConsole";

export const metadata = { title: "تست قابلیت‌ها · Peyja" };

export default async function TestPage() {
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) redirect("/");

  const account = getAccount(session.account_id);
  if (!account) redirect("/");

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-20">
      <header className="flex items-center justify-between py-6">
        <div>
          <p className="text-lg font-extrabold">صفحه‌ی تست قابلیت‌ها</p>
          <p className="text-xs text-slate-400">
            همه‌ی قابلیت‌های موردنیاز پروژه، یک‌به‌یک روی اکانت واقعی
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost !px-4 !py-2 text-sm">
            داشبورد
          </Link>
          <Link href="/" className="btn-ghost !px-4 !py-2 text-sm">
            صفحه اصلی
          </Link>
        </div>
      </header>

      <TestConsole username={account.username} accountId={account.id} />
    </main>
  );
}
