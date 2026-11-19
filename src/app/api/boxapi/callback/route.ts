import { redirect } from "next/navigation";
import { completeOAuthRequest, createSession, upsertAccount } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

/**
 * Step 2: BoxAPI redirects the user back here after a successful Instagram
 * login with: ?status=success&username=...&account_id=...&id=...#_
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const message = url.searchParams.get("message") || "";
  const username = url.searchParams.get("username");
  const accountId = url.searchParams.get("account_id");
  const id = url.searchParams.get("id");

  if (status !== "success" || !accountId) {
    redirect(`/?error=boxapi&message=${encodeURIComponent(message || "connection failed")}`);
  }

  if (id) completeOAuthRequest(id, accountId, username || "instagram");
  upsertAccount({ id: accountId, username: username || "instagram", source: "boxapi" });

  const token = createSession(accountId);
  await setSessionCookie(token);
  redirect("/dashboard");
}
