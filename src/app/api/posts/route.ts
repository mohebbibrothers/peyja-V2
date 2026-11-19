import { NextResponse } from "next/server";
import { countComments, countPosts, listPosts } from "@/lib/db";
import { currentSessionToken, validSession } from "@/lib/session";

export async function GET() {
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    count: countPosts(session.account_id),
    comments: countComments(session.account_id),
    posts: listPosts(session.account_id),
  });
}
