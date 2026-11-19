import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { boxapiConfig, buildLoginUrl } from "@/lib/boxapi";
import { createOAuthRequest } from "@/lib/db";

/**
 * Step 1 of the BoxAPI flow: create a unique request id and send the user to
 * the official Instagram login page hosted by BoxAPI.
 */
export async function GET() {
  if (!boxapiConfig().configured) redirect("/?error=config");

  const id = crypto.randomUUID();
  createOAuthRequest(id);
  redirect(buildLoginUrl(id));
}
