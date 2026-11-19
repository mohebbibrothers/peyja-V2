import { NextResponse } from "next/server";
import { listEvents } from "@/lib/db";
import { currentSessionToken, validSession } from "@/lib/session";
import { testEnabled } from "@/lib/test";

/** Recent webhook events (raw payloads) — the async results land here. */
export async function GET() {
  if (!testEnabled()) {
    return NextResponse.json({ error: "test page disabled" }, { status: 404 });
  }
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "no connected account" }, { status: 401 });
  }
  const events = listEvents(session.account_id, 100).map((e) => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(e.raw_json);
    } catch {
      parsed = null;
    }
    return {
      event_id: e.event_id,
      event_type: e.event_type,
      account_id: e.account_id,
      created_at: e.created_at,
      data: parsed,
    };
  });
  return NextResponse.json({ events });
}
