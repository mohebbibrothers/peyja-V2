import crypto from "node:crypto";

/**
 * SendBox — Instagram messaging API built on Meta's official Instagram API.
 * Docs: https://sendbox.chat/api
 * Base:  https://api.sendbox.chat/api/v1
 * Auth:  header X-Api-Key  (the API key from the SendBox panel, NOT the login-link token)
 *
 * Note: the env vars keep the BOXAPI_* prefix for backwards compatibility.
 */

export const BOXAPI_BASE = (
  process.env.BOXAPI_BASE_URL || "https://api.sendbox.chat/api/v1"
).replace(/\/+$/, "");

export interface BoxapiConfig {
  apiKey: string;
  loginUrl: string;
  domain: string;
  webhookSecret: string;
  appUrl: string;
  redirectUri: string;
  webhookUrl: string;
  configured: boolean;
}

export function boxapiConfig(): BoxapiConfig {
  const apiKey = process.env.BOXAPI_API_KEY || "";
  const loginUrl = (process.env.BOXAPI_LOGIN_URL || "https://api.sendbox.chat").replace(/\/+$/, "");
  const domain = (process.env.BOXAPI_DOMAIN || "").trim();
  const webhookSecret = process.env.BOXAPI_WEBHOOK_SECRET || "";
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return {
    apiKey,
    loginUrl,
    domain,
    webhookSecret,
    appUrl,
    redirectUri: `${appUrl}/api/boxapi/callback`,
    webhookUrl: `${appUrl}/api/boxapi/webhook`,
    configured: Boolean(apiKey),
  };
}

/** Build the official Instagram login URL SendBox provides. */
export function buildLoginUrl(requestId: string): string {
  const { loginUrl, apiKey } = boxapiConfig();
  const params = new URLSearchParams({ token: apiKey, id: requestId });
  return `${loginUrl}/instagram-oauth?${params.toString()}`;
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const { apiKey } = boxapiConfig();
  const res = await fetch(`${BOXAPI_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || json?.error || `SendBox HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

/** Async action: result is delivered via Webhook (event_type = action.list_posts). */
export async function listPosts(
  accountId: string,
  limit = 1,
  fields = [
    "id",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "caption",
    "timestamp",
    "like_count",
    "comments_count",
    "username",
  ]
): Promise<any> {
  return request("/service/actions/list_posts", {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, limit, fields }),
  });
}

export async function getAccounts(): Promise<any> {
  return request("/service/accounts", { method: "GET" });
}

export async function replyComment(
  accountId: string,
  commentId: string,
  message: string
): Promise<any> {
  return request("/service/actions/reply_comment", {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, comment_id: commentId, message }),
  });
}

export async function sendMessage(
  accountId: string,
  recipientId: string,
  message: string
): Promise<any> {
  return request("/service/actions/send_message", {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, recipient_id: recipientId, message }),
  });
}

/** HMAC-SHA256 webhook signature check (timing-safe). */
export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true; // no secret configured → SendBox sends no signature
  if (!/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * SendBox delivers list_posts results asynchronously:
 *   { event_id, event_type: "action.list_posts", account_id,
 *     data: { request, success, result, error } }
 * `result` shape is not fixed, so we try the common shapes.
 */
export function extractPosts(payload: any): any[] {
  const roots = [
    payload?.data?.result,
    payload?.result,
    payload?.data,
    payload?.data?.data,
    payload?.posts,
    payload?.items,
    payload,
  ];
  for (const r of roots) {
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.posts)) return r.posts;
    if (r && Array.isArray(r.items)) return r.items;
    if (r && Array.isArray(r.data)) return r.data;
    if (r && Array.isArray(r.media)) return r.media;
  }
  return [];
}
