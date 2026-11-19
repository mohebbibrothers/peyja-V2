import { NextResponse } from "next/server";
import {
  followStatus,
  getPostComments,
  getServiceInfo,
  listPosts,
  privateReply,
  replyComment,
  sendMessage,
  showProfile,
} from "@/lib/boxapi";
import { currentSessionToken, validSession } from "@/lib/session";
import { testEnabled } from "@/lib/test";

/** An empty number field means "use the default", never zero posts. */
function positiveLimit(value: unknown, fallback: number): number | null {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text) return fallback;
  const n = Number(text);
  return Number.isSafeInteger(n) && n >= 1 && n <= 100 ? n : null;
}

/**
 * Test harness: runs one SendBox capability and returns the provider's answer.
 * Every action is asynchronous at SendBox — the real result arrives via the
 * webhook, so the caller should also poll /api/test/events.
 */
export async function POST(request: Request) {
  if (!testEnabled()) {
    return NextResponse.json({ error: "test page disabled" }, { status: 404 });
  }

  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "no connected account" }, { status: 401 });
  }
  const accountId = session.account_id;

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  try {
    let result: any;
    switch (action) {
      case "info":
        result = await getServiceInfo();
        break;
      case "list_posts": {
        const limit = positiveLimit(body.limit, 10);
        if (limit === null) {
          return NextResponse.json(
            { ok: false, action, error: "تعداد باید یک عدد صحیح بین ۱ تا ۱۰۰ باشد." },
            { status: 400 }
          );
        }
        result = await listPosts(accountId, limit);
        break;
      }
      case "comments": {
        const limit = positiveLimit(body.limit, 25);
        if (limit === null) {
          return NextResponse.json(
            { ok: false, action, error: "تعداد باید یک عدد صحیح بین ۱ تا ۱۰۰ باشد." },
            { status: 400 }
          );
        }
        const mediaId = String(body.media_id ?? "").trim();
        if (!mediaId) {
          return NextResponse.json(
            { ok: false, action, error: "media_id پست را وارد کن." },
            { status: 400 }
          );
        }
        result = await getPostComments(
          accountId,
          mediaId,
          limit,
          body.after ? String(body.after) : undefined
        );
        break;
      }
      case "reply_comment":
        result = await replyComment(accountId, String(body.comment_id ?? ""), String(body.message ?? ""));
        break;
      case "private_reply":
        result = await privateReply(accountId, String(body.comment_id ?? ""), String(body.message ?? ""));
        break;
      case "send_message":
        result = await sendMessage(accountId, String(body.recipient_id ?? ""), String(body.message ?? ""));
        break;
      case "follow_status":
        result = await followStatus(accountId, String(body.customer_id ?? ""));
        break;
      case "show_profile":
        result = await showProfile(accountId, String(body.customer_id ?? ""));
        break;
      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action, response: result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, action, error: e?.message ?? "request failed" },
      { status: 502 }
    );
  }
}
