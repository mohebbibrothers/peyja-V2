import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSession } from "./db";

export const SESSION_COOKIE = "ig_session";

export async function currentSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export function newSession(accountId: string): string {
  return createSession(accountId);
}

export function validSession(token: string) {
  return getSession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function randomState(): string {
  return crypto.randomBytes(16).toString("hex");
}
