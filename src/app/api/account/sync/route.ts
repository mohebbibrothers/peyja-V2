import { redirect } from "next/navigation";
import { getAccount } from "@/lib/db";
import { listPosts } from "@/lib/boxapi";
import { currentSessionToken, validSession } from "@/lib/session";

/**
 * Requests the latest post from SendBox. SendBox answers asynchronously, so the
 * post arrives through the webhook and is stored in the database.
 */
export async function POST() {
  const token = await currentSessionToken();
  const session = token ? validSession(token) : null;
  if (!session) redirect("/");

  const account = getAccount(session.account_id);
  if (!account) redirect("/");

  try {
    await listPosts(account.id, 1);
    redirect("/dashboard?requested=1");
  } catch {
    redirect("/dashboard?sync_error=1");
  }
}
