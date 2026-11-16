import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Auth session as an external store for useSyncExternalStore — the same
 * pattern as the draft and profiles. No setState-in-effect anywhere.
 * A module-level "auth-changed" window event lets other stores (profiles,
 * invoices) react to sign-in/out without circular imports.
 */
let cached: Session | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
  window.dispatchEvent(new Event("auth-changed"));
}

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (cached !== data.session) {
      cached = data.session;
      notify();
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cached = session;
    notify();
  });
}

export function subscribeAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getAuthSnapshot(): Session | null {
  return cached;
}

export function getServerAuthSnapshot(): Session | null {
  return null;
}

/** The signed-in user's id, or null when logged out / unconfigured. */
export function currentUserId(): string | null {
  return cached?.user?.id ?? null;
}

/**
 * Sends the browser to Google and back to the site root (never a stray
 * Supabase or localhost URL). Pre-flights the authorize endpoint so a
 * disabled provider surfaces as a readable message instead of a raw JSON
 * page. Returns false when Supabase isn't configured at all.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) return false;

  // Pre-flight: the provider check happens server-side before the redirect,
  // and a bare browser navigation would otherwise land on a raw JSON body.
  const authUrl = new URL("/auth/v1/authorize", supabase.supabaseUrl);
  authUrl.searchParams.set("provider", "google");
  const preflight = await fetch(authUrl.toString(), { redirect: "manual" });
  if (preflight.status >= 400) {
    throw new Error("Google sign-in isn't enabled on the Supabase project yet.");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    if (/provider/i.test(error.message)) {
      throw new Error("Google sign-in isn't enabled on the Supabase project yet.");
    }
    throw error;
  }
  return true;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
