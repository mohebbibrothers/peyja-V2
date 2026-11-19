import { NextResponse } from "next/server";
import { countComments, countEvents, countPosts, getAccount } from "@/lib/db";
import { currentSessionToken, validSession } from "@/lib/session";

export async function GET() {
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) {
    return NextResponse.json({ connected: false });
  }
  const account = getAccount(session.account_id);
  if (!account) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected: true,
    account: {
      id: account.id,
      username: account.username,
      source: account.source,
      connected_at: account.connected_at,
      updated_at: account.updated_at,
    },
    stats: {
      posts: countPosts(account.id),
      comments: countComments(account.id),
      events: countEvents(),
    },
  });
}
