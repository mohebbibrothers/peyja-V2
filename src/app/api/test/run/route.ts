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
      case "list_posts":
        result = await listPosts(accountId, Number(body.limit ?? 5));
        break;
      case "comments":
        result = await getPostComments(
          accountId,
          String(body.media_id ?? ""),
          Number(body.limit ?? 25),
          body.after ? String(body.after) : undefined
        );
        break;
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
