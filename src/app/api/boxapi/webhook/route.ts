import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { boxapiConfig, extractPosts, verifyWebhookSignature } from "@/lib/boxapi";
import { eventExists, insertEvent, saveComment, savePost } from "@/lib/db";

/**
 * Step 3 (real-time): BoxAPI pushes Instagram events here.
 *  - action.list_posts  → the result of the async list_posts request (our posts)
 *  - comments           → new comments
 *  - messaging          → new direct messages
 * Idempotent by event_id; optional HMAC signature verification.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const cfg = boxapiConfig();

  const timestamp = request.headers.get("x-boxapi-timestamp") || "";
  const signature = request.headers.get("x-boxapi-signature") || "";
  if (cfg.webhookSecret && !verifyWebhookSignature(raw, timestamp, signature, cfg.webhookSecret)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const eventId = payload.event_id || crypto.randomUUID();
  if (eventExists(eventId)) return new NextResponse("ok"); // retry / duplicate
  insertEvent({
    event_id: eventId,
    event_type: payload.event_type || null,
    account_id: payload.account_id || null,
    raw_json: raw,
  });

  const accountId = payload.account_id as string | null;

  // ── async result of list_posts ──────────────────────────────────────────
  if (payload.event_type === "action.list_posts" && accountId) {
    for (const p of extractPosts(payload)) {
      if (!p || !p.id) continue;
      savePost({
        id: String(p.id),
        account_id: accountId,
        caption: p.caption ?? null,
        media_type: p.media_type ?? null,
        media_url: p.media_url ?? null,
        permalink: p.permalink ?? null,
        thumbnail_url: p.thumbnail_url ?? null,
        timestamp: p.timestamp ?? null,
        like_count: p.like_count ?? null,
        comments_count: p.comments_count ?? null,
      });
    }
  }

  // ── new comment ─────────────────────────────────────────────────────────
  if (payload.event_type === "comments" && accountId) {
    const c = payload.data?.comment || payload.data || payload;
    if (c && c.id) {
      saveComment({
        id: String(c.id),
        account_id: accountId,
        media_id: c.media_id
          ? String(c.media_id)
          : payload.data?.media?.id
          ? String(payload.data.media.id)
          : null,
        username: c.username ?? c.from?.username ?? null,
        text: c.text ?? null,
        timestamp: c.timestamp ?? null,
        raw_json: JSON.stringify(c),
      });
    }
  }

  return new NextResponse("ok");
}
