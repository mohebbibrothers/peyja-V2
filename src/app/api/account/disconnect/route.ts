import { redirect } from "next/navigation";
import { deleteAccount } from "@/lib/db";
import { clearSessionCookie, currentSessionToken, validSession } from "@/lib/session";

export async function POST() {
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (session) {
    deleteAccount(session.account_id);
  }
  await clearSessionCookie();
  redirect("/?disconnected=1");
}
