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
 * Supabase or localhost URL). Throws with a readable message when the
 * provider isn't set up. Returns false when Supabase isn't configured.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) return false;
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
