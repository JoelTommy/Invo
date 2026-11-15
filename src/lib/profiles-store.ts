import type { BusinessProfile, Currency, PaymentMethodId, TemplateId } from "./types";
import { STANDARD_FEES } from "./types";
import { uid } from "./format";

/**
 * Business profiles live in localStorage and are read through
 * useSyncExternalStore (same pattern as the draft). Stage 4 syncs them to
 * Supabase once the user signs in.
 */
const PROFILES_KEY = "profiles-v1";

let cache: { raw: string | null; value: BusinessProfile[] } | null = null;
const listeners = new Set<() => void>();

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
  listeners.forEach((cb) => cb());
}

export function subscribeProfiles(callback: () => void): () => void {
  window.addEventListener("storage", callback); // other tabs
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", callback);
    listeners.delete(callback);
  };
}

export function getProfilesSnapshot(): BusinessProfile[] {
  return readProfiles();
}

export function getServerProfilesSnapshot(): BusinessProfile[] {
  return [];
}

export function getProfile(id: string): BusinessProfile | undefined {
  return readProfiles().find((p) => p.id === id);
}

/** A blank profile with sensible Indian-freelancer defaults. */
export function blankProfile(): BusinessProfile {
  return {
    id: uid(),
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

export function saveProfile(profile: BusinessProfile) {
  const profiles = readProfiles();
  const exists = profiles.some((p) => p.id === profile.id);
  let next = exists
    ? profiles.map((p) => (p.id === profile.id ? profile : p))
    : [...profiles, profile];

  // Only one default at a time.
  if (profile.isDefault) {
    next = next.map((p) => (p.id === profile.id ? p : { ...p, isDefault: false }));
  }
  persist(next);
}

export function deleteProfile(id: string) {
  persist(readProfiles().filter((p) => p.id !== id));
}

export function duplicateProfile(id: string): BusinessProfile | undefined {
  const source = getProfile(id);
  if (!source) return undefined;
  const copy: BusinessProfile = {
    ...source,
    id: uid(),
    name: `${source.name || "Profile"} copy`,
    isDefault: false,
  };
  saveProfile(copy);
  return copy;
}

export function defaultProfile(): BusinessProfile | undefined {
  const profiles = readProfiles();
  return profiles.find((p) => p.isDefault) ?? profiles[0];
}

/** Everything a profile decides about an invoice, as a patch for the draft. */
export function applyProfileToInvoice(p: BusinessProfile): Partial<import("./types").InvoiceData> {
  const methods = Object.fromEntries(
    (Object.keys(STANDARD_FEES) as PaymentMethodId[]).map((id) => [
      id,
      {
        enabled: p.methods[id]?.enabled ?? false,
        clientPays: p.methods[id]?.clientPays ?? false,
        feePercent: STANDARD_FEES[id],
      },
    ]),
  ) as import("./types").InvoiceData["methods"];

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
