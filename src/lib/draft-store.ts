import type { InvoiceData } from "./types";
import { defaultInvoice } from "./defaults";
import { applyProfileToInvoice, defaultProfile } from "./profiles-store";

/**
 * The invoice draft lives in localStorage and React reads it through
 * useSyncExternalStore — no setState-in-effect needed, and hydration is
 * safe because the server snapshot is always null.
 */
const DRAFT_KEY = "invoice-draft-v1";

// Cache so repeated getSnapshot calls return a stable identity.
let cache: { raw: string | null; value: InvoiceData | null } | null = null;

/** A truly fresh invoice: blank, with the default profile applied if one exists. */
export function freshInvoice(): InvoiceData {
  const fresh = defaultInvoice();
  const dp = defaultProfile();
  return dp ? { ...fresh, ...applyProfileToInvoice(dp) } : fresh;
}

function readDraft(): InvoiceData | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DRAFT_KEY);
  } catch {
    // Storage blocked (private browsing): run with a fresh draft.
    raw = null;
  }
  if (cache && cache.raw === raw) return cache.value;

  let value: InvoiceData | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as InvoiceData;
      if (parsed && Array.isArray(parsed.items)) {
        value = { ...defaultInvoice(), ...parsed };
      }
    } catch {
      // Corrupt draft: fall through to a fresh one.
      value = null;
    }
  } else {
    // No stored draft: start fresh, with the default profile if one exists.
    value = freshInvoice();
  }
  cache = { raw, value };
  return value;
}

const listeners = new Set<() => void>();

export function subscribeDraft(callback: () => void): () => void {
  window.addEventListener("storage", callback); // other tabs
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", callback);
    listeners.delete(callback);
  };
}

export function getDraftSnapshot(): InvoiceData | null {
  return readDraft();
}

export function getServerDraftSnapshot(): InvoiceData | null {
  return null; // nothing stored server-side
}

export function saveDraft(data: InvoiceData): void {
  cache = { raw: JSON.stringify(data), value: data };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
  listeners.forEach((callback) => callback());
}
