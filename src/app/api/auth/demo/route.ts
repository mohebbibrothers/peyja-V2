import { redirect } from "next/navigation";
import { createSession, savePost, upsertAccount } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

/**
 * Demo mode: seeds a fake account + one fake post so the whole product can be
 * viewed without real BoxAPI credentials.
 */
export async function GET() {
  if (process.env.DEMO_MODE !== "true") redirect("/");

  const now = Date.now();
  const accountId = "demo-account";

  upsertAccount({ id: accountId, username: "demo.creator", source: "demo" });

  savePost({
    id: "demo-post-1",
    account_id: accountId,
    caption:
      "این یک پست نمونه است. در حالت واقعی، آخرین پست اینستاگرام شما با تمام جزئیات اینجا ذخیره می‌شود.",
    media_type: "IMAGE",
    media_url: null,
    permalink: "https://www.instagram.com/p/demo/",
    thumbnail_url: null,
    timestamp: new Date(now).toISOString(),
    like_count: 42,
    comments_count: 7,
  });

  const token = createSession(accountId);
  await setSessionCookie(token);
  redirect("/dashboard");
}
