import { redirect } from "next/navigation";
import { completeOAuthRequest, createSession, upsertAccount } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

/**
 * SendBox redirects the user back here after the official Instagram login.
 * The query string varies slightly between providers, so we accept the
 * common aliases for each value.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const status = (sp.get("status") || sp.get("result") || "").toLowerCase();
  const message = sp.get("message") || sp.get("error_description") || sp.get("error") || "";
  const username = sp.get("username") || sp.get("user_name") || sp.get("instagram_username") || null;

  const accountId =
    sp.get("account_id") ||
    sp.get("accountId") ||
    sp.get("instagram_account_id") ||
    sp.get("instagram_account") ||
    sp.get("user_id") ||
    null;

  // `id` is the passthrough request id we sent with the login link.
  const requestId = sp.get("id") || sp.get("request_id") || sp.get("state") || null;

  const ok = status === "success" || status === "ok" || status === "connected" || (!status && Boolean(accountId));

  if (!ok || !accountId) {
    redirect(`/?error=boxapi&message=${encodeURIComponent(message || "connection failed")}`);
  }

  if (requestId) completeOAuthRequest(requestId, accountId, username || "instagram");
  upsertAccount({ id: accountId, username: username || "instagram", source: "boxapi" });

  const token = createSession(accountId);
  await setSessionCookie(token);
  redirect("/dashboard");
}
