import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Auth session as an external store for useSyncExternalStore — the same
 * pattern as the draft and profiles. No setState-in-effect anywhere.
 */
let cached: Session | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
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

/** Returns false when Supabase isn't configured yet (sign-in UI explains). */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) return false;
  await supabase.auth.signInWithOAuth({ provider: "google" });
  return true;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
