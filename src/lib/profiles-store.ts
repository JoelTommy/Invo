import type { BusinessProfile, Currency, InvoiceData, PaymentMethodId, TemplateId } from "./types";
import { STANDARD_FEES } from "./types";
import { supabase } from "./supabase";
import { currentUserId } from "./auth";

/**
 * Business profiles live in localStorage and are read through
 * useSyncExternalStore. When the user is signed in, every change mirrors to
 * the Supabase `businesses` table (RLS limits each user to their own rows),
 * and a pull-merge runs on sign-in so other devices catch up.
 * Last write wins, compared by updatedAt.
 */
const PROFILES_KEY = "profiles-v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cache: { raw: string | null; value: BusinessProfile[] } | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function readProfiles(): BusinessProfile[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PROFILES_KEY);
  } catch {
    raw = null;
  }
  if (cache && cache.raw === raw) return cache.value;

  let value: BusinessProfile[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) value = parsed;
    } catch {
      value = [];
    }
  }

  // One-time migration: profiles created before cloud sync used short ids.
  // The cloud `businesses.id` column is a UUID, so give legacy profiles real
  // UUIDs now and let the draft remap its reference via "profiles-remapped".
  const remap: Record<string, string> = {};
  for (const p of value) {
    if (!UUID_RE.test(p.id)) {
      remap[p.id] = crypto.randomUUID();
    }
  }
  if (Object.keys(remap).length > 0) {
    value = value.map((p) => (remap[p.id] ? { ...p, id: remap[p.id] } : p));
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(value));
    } catch {
      // Storage blocked: remap stays in memory for this visit.
    }
    window.dispatchEvent(new CustomEvent("profiles-remapped", { detail: remap }));
  }

  cache = { raw, value };
  return value;
}

function persist(profiles: BusinessProfile[]) {
  cache = { raw: JSON.stringify(profiles), value: profiles };
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // Storage blocked (private browsing): keep working in memory.
  }
  notify();
}

export function subscribeProfiles(callback: () => void): () => void {
  window.addEventListener("storage", callback); // other tabs
  window.addEventListener("profiles-synced", callback);
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("profiles-synced", callback);
    listeners.delete(callback);
  };
}

export function getProfilesSnapshot(): BusinessProfile[] {
  return readProfiles();
}

// Shared empty snapshot: React requires getServerSnapshot to return the SAME
// cached reference every call — a fresh [] each time loops and crashes.
const EMPTY_PROFILES: BusinessProfile[] = [];

export function getServerProfilesSnapshot(): BusinessProfile[] {
  return EMPTY_PROFILES;
}

export function getProfile(id: string): BusinessProfile | undefined {
  return readProfiles().find((p) => p.id === id);
}

/** A blank profile with sensible Indian-freelancer defaults. */
export function blankProfile(): BusinessProfile {
  return {
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    name: "",
    email: "",
    address: "",
    taxId: "",
    logoDataUrl: "",
    upiId: "",
    upiQrDataUrl: "",
    paypalEmail: "",
    stripeLink: "",
    razorpayLink: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    methods: {
      upi: { enabled: true, clientPays: false },
      bank: { enabled: true, clientPays: false },
      paypal: { enabled: false, clientPays: true },
      stripe: { enabled: false, clientPays: true },
      razorpay: { enabled: false, clientPays: true },
    },
    currency: "INR" as Currency,
    taxEnabled: true,
    taxName: "GST",
    taxRate: 18,
    template: "brutal" as TemplateId,
    accentColor: "",
    notes: "",
    isDefault: false,
  };
}

export async function saveProfile(profile: BusinessProfile) {
  const withTimestamp: BusinessProfile = { ...profile, updatedAt: new Date().toISOString() };
  const profiles = readProfiles();
  const exists = profiles.some((p) => p.id === profile.id);
  let next = exists
    ? profiles.map((p) => (p.id === profile.id ? withTimestamp : p))
    : [...profiles, withTimestamp];

  // Only one default at a time.
  if (withTimestamp.isDefault) {
    next = next.map((p) => (p.id === withTimestamp.id ? p : { ...p, isDefault: false }));
  }
  persist(next);
  await cloudUpsert(withTimestamp);
}

export async function deleteProfile(id: string) {
  persist(readProfiles().filter((p) => p.id !== id));
  await cloudDelete(id);
}

export function duplicateProfile(id: string): BusinessProfile | undefined {
  const source = getProfile(id);
  if (!source) return undefined;
  const copy: BusinessProfile = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name || "Profile"} copy`,
    isDefault: false,
    updatedAt: new Date().toISOString(),
  };
  saveProfile(copy);
  return copy;
}

export function defaultProfile(): BusinessProfile | undefined {
  const profiles = readProfiles();
  return profiles.find((p) => p.isDefault) ?? profiles[0];
}

/** Everything a profile decides about an invoice, as a patch for the draft. */
export function applyProfileToInvoice(p: BusinessProfile): Partial<InvoiceData> {
  const methods = Object.fromEntries(
    (Object.keys(STANDARD_FEES) as PaymentMethodId[]).map((id) => [
      id,
      {
        enabled: p.methods[id]?.enabled ?? false,
        clientPays: p.methods[id]?.clientPays ?? false,
        feePercent: STANDARD_FEES[id],
      },
    ]),
  ) as InvoiceData["methods"];

  return {
    profileId: p.id,
    businessName: p.name,
    businessEmail: p.email,
    businessAddress: p.address,
    businessTaxId: p.taxId,
    logoDataUrl: p.logoDataUrl,
    qrDataUrl: p.upiQrDataUrl,
    upiId: p.upiId,
    paypalEmail: p.paypalEmail,
    stripeLink: p.stripeLink,
    razorpayLink: p.razorpayLink,
    bankAccountName: p.bankAccountName,
    bankName: p.bankName,
    bankAccountNumber: p.bankAccountNumber,
    bankIfsc: p.bankIfsc,
    methods,
    currency: p.currency,
    taxEnabled: p.taxEnabled,
    taxName: p.taxName,
    taxRate: p.taxRate,
    template: p.template,
    accentColor: p.accentColor,
    notes: p.notes,
  };
}

/* ------------------------------ cloud mirror ------------------------------ */

async function cloudUpsert(p: BusinessProfile) {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;
  await supabase.from("businesses").upsert({
    id: p.id,
    user_id: userId,
    data: p as unknown as Record<string, unknown>,
    is_default: p.isDefault,
    updated_at: p.updatedAt,
  });
}

async function cloudDelete(id: string) {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;
  await supabase.from("businesses").delete().eq("id", id).eq("user_id", userId);
}

/**
 * Pull cloud rows and merge (newer updatedAt wins both ways), then push any
 * local profiles the cloud is missing or that are newer locally.
 */
export async function syncProfiles(): Promise<void> {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;

  const { data: rows, error } = await supabase
    .from("businesses")
    .select("id, data, is_default, updated_at")
    .eq("user_id", userId);
  if (error) return;

  const remote = (rows ?? []).map((r) => ({
    ...(r.data as BusinessProfile),
    id: r.id as string,
    isDefault: r.is_default as boolean,
    updatedAt: r.updated_at as string,
  }));

  const byId = new Map<string, BusinessProfile>();
  for (const p of readProfiles()) byId.set(p.id, p);

  let changed = false;
  const toPush: BusinessProfile[] = [];

  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l) {
      byId.set(r.id, r); // exists only on the cloud → bring down
      changed = true;
    } else if ((r.updatedAt ?? "") > (l.updatedAt ?? "")) {
      byId.set(r.id, r); // cloud is newer → cloud wins
      changed = true;
    }
  }
  for (const l of byId.values()) {
    const r = remote.find((x) => x.id === l.id);
    if (!r || (l.updatedAt ?? "") > (r.updatedAt ?? "")) toPush.push(l);
  }

  if (changed) persist([...byId.values()]);
  await Promise.all(toPush.map(cloudUpsert));

  // Keep the "is default" flag consistent in the cloud too.
  const dflt = [...byId.values()].find((p) => p.isDefault);
  if (dflt) {
    await supabase
      .from("businesses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .neq("id", dflt.id);
  }

  window.dispatchEvent(new Event("profiles-synced"));
}

// Re-sync whenever auth changes (sign-in, token refresh) in this tab.
if (typeof window !== "undefined") {
  window.addEventListener("auth-changed", () => {
    if (currentUserId()) syncProfiles();
  });
}
