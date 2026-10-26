import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { authMode, env, sessionSecret } from "@/lib/env";

const COOKIE = "rw_session";
const MAX_AGE = 60 * 60 * 24 * 180;

function sign(v: string) {
  return createHmac("sha256", sessionSecret()).update(v).digest("base64url");
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

async function supabaseServer() {
  const { createServerClient } = await import("@supabase/ssr");
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component: cookies are read-only there; middleware refreshes them
        }
      },
    },
  });
}

/** The signed-in user id, or null. */
export async function getSessionUserId(): Promise<string | null> {
  if (authMode() === "supabase") {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}

/** Local mode only: sign the browser in as this user id. */
export async function setLocalSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/**
 * Start an anonymous worker session (FR-001: no email needed).
 * Returns the new auth user id; caller creates the profile.
 */
export async function startAnonymousSession(): Promise<{ userId: string; createdAuthUser: boolean }> {
  if (authMode() === "supabase") {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInAnonymously();
    if (error || !data.user) throw new Error(error?.message ?? "anonymous sign-in failed");
    return { userId: data.user.id, createdAuthUser: true };
  }
  const userId = randomUUID();
  await setLocalSession(userId);
  return { userId, createdAuthUser: false };
}

export async function sendMagicLink(email: string, redirectTo: string) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
  if (error) throw new Error(error.message);
}

export async function exchangeAuthCode(code: string) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (authMode() === "supabase") {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  const store = await cookies();
  store.delete(COOKIE);
}

/** Supabase mode: remove the auth user after the worker deletes their data (FR-006). */
export async function deleteSupabaseAuthUser(userId: string) {
  if (authMode() !== "supabase" || !env.supabaseServiceKey) return;
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
  await admin.auth.admin.deleteUser(userId);
}
