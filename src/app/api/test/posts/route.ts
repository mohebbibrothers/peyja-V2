import { NextResponse } from "next/server";
import { listPosts } from "@/lib/db";
import { currentSessionToken, validSession } from "@/lib/session";
import { testEnabled } from "@/lib/test";

/** پست‌هایی که وبهوک در دیتابیس ذخیره کرده — برای گرفتن media_id */
export async function GET() {
  if (!testEnabled()) {
    return NextResponse.json({ error: "test page disabled" }, { status: 404 });
  }
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "no connected account" }, { status: 401 });
  }
  const posts = listPosts(session.account_id, 50).map((p) => ({
    id: p.id,
    caption: p.caption,
    media_type: p.media_type,
    media_url: p.media_url,
    permalink: p.permalink,
    like_count: p.like_count,
    comments_count: p.comments_count,
    timestamp: p.timestamp,
    saved_at: p.saved_at,
  }));
  return NextResponse.json({ posts });
}
