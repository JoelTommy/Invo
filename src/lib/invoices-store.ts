import type { Currency, InvoiceData } from "./types";
import { computeTotals } from "./format";
import { supabase } from "./supabase";
import { currentUserId } from "./auth";
import { getProfile } from "./profiles-store";

/**
 * Invoice history: the full record lives in localStorage as a mirror, and
 * every change mirrors to the Supabase `invoices` table when signed in
 * (RLS limits each user to their own rows). The `data` column keeps a full
 * snapshot, so editing a profile never changes a saved invoice.
 */
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceRecord {
  id: string; // UUID, same locally and in the cloud
  profileId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  currency: Currency;
  data: InvoiceData; // full snapshot of the business + invoice details
  createdAt: string;
  updatedAt: string;
}

const INVOICES_KEY = "invoices-v1";

let cache: { raw: string | null; value: InvoiceRecord[] } | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function readInvoices(): InvoiceRecord[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(INVOICES_KEY);
  } catch {
    raw = null;
  }
  if (cache && cache.raw === raw) return cache.value;

  let value: InvoiceRecord[] = [];
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

function persist(records: InvoiceRecord[]) {
  cache = { raw: JSON.stringify(records), value: records };
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(records));
  } catch {
    // Storage blocked: keep working in memory.
  }
  notify();
}

export function subscribeInvoices(callback: () => void): () => void {
  window.addEventListener("storage", callback); // other tabs
  window.addEventListener("invoices-synced", callback);
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("invoices-synced", callback);
    listeners.delete(callback);
  };
}

export function getInvoicesSnapshot(): InvoiceRecord[] {
  return readInvoices();
}

// Shared empty snapshot: React requires getServerSnapshot to return the SAME
// cached reference every call — a fresh [] each time loops and crashes.
const EMPTY_INVOICES: InvoiceRecord[] = [];

export function getServerInvoicesSnapshot(): InvoiceRecord[] {
  return EMPTY_INVOICES;
}

export function getInvoice(id: string): InvoiceRecord | undefined {
  return readInvoices().find((r) => r.id === id);
}

/** Builds a history record from the current draft. */
export function recordFromInvoiceData(data: InvoiceData): InvoiceRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    profileId: data.profileId,
    invoiceNumber: data.invoiceNumber,
    status: "draft",
    total: computeTotals(data).total,
    currency: data.currency,
    data,
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveInvoice(record: InvoiceRecord) {
  const invoices = readInvoices();
  const exists = invoices.some((r) => r.id === record.id);
  const withTimestamp: InvoiceRecord = { ...record, updatedAt: new Date().toISOString() };
  persist(
    exists
      ? invoices.map((r) => (r.id === record.id ? withTimestamp : r))
      : [withTimestamp, ...invoices],
  );
  await cloudUpsert(withTimestamp);
}

export async function deleteInvoice(id: string) {
  persist(readInvoices().filter((r) => r.id !== id));
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;
  await supabase.from("invoices").delete().eq("id", id).eq("user_id", userId);
}

/** Loads a saved invoice back into the editor. */
export function toDraftData(record: InvoiceRecord): InvoiceData {
  return { ...record.data, invoiceNumber: record.invoiceNumber };
}

/* ------------------------------ cloud mirror ------------------------------ */

async function cloudUpsert(record: InvoiceRecord) {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;
  // Only link to a business row that actually exists, or the FK rejects it.
  const businessId = record.profileId && getProfile(record.profileId) ? record.profileId : null;
  await supabase.from("invoices").upsert({
    id: record.id,
    user_id: userId,
    business_id: businessId,
    invoice_number: record.invoiceNumber,
    status: record.status,
    total: record.total,
    currency: record.currency,
    data: record.data as unknown as Record<string, unknown>,
    updated_at: record.updatedAt,
  });
}

/** Pull cloud rows and merge (newer updatedAt wins both ways). */
export async function syncInvoices(): Promise<void> {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;

  const { data: rows, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId);
  if (error) return;

  const remote = (rows ?? []).map((r) => ({
    id: r.id as string,
    profileId: (r.business_id as string | null) ?? null,
    invoiceNumber: (r.invoice_number as string) ?? "",
    status: (r.status as InvoiceStatus) ?? "draft",
    total: Number(r.total ?? 0),
    currency: (r.currency as Currency) ?? "INR",
    data: r.data as InvoiceData,
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
    updatedAt: r.updated_at as string,
  }));

  const byId = new Map<string, InvoiceRecord>();
  for (const r of readInvoices()) byId.set(r.id, r);

  let changed = false;
  const toPush: InvoiceRecord[] = [];

  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l || (r.updatedAt ?? "") > (l.updatedAt ?? "")) {
      byId.set(r.id, r);
      changed = true;
    }
  }
  for (const l of byId.values()) {
    const r = remote.find((x) => x.id === l.id);
    if (!r || (l.updatedAt ?? "") > (r.updatedAt ?? "")) toPush.push(l);
  }

  if (changed) persist([...byId.values()]);
  await Promise.all(toPush.map(cloudUpsert));
  window.dispatchEvent(new Event("invoices-synced"));
}

if (typeof window !== "undefined") {
  window.addEventListener("auth-changed", () => {
    if (currentUserId()) syncInvoices();
  });
}
