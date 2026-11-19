"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DisconnectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm("مطمئن هستید؟ اتصال قطع و داده‌های ذخیره‌شده حذف می‌شود.")) return;
    setLoading(true);
    await fetch("/api/account/disconnect", { method: "POST" });
    router.push("/?disconnected=1");
    router.refresh();
  }

  return (
    <button onClick={handle} disabled={loading} className="btn-ghost text-sm disabled:opacity-50">
      {loading ? "در حال قطع اتصال..." : "قطع اتصال و حذف داده‌ها"}
    </button>
  );
}
