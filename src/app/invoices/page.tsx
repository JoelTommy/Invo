"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import InvoicePreview from "@/components/InvoicePreview";
import { getAuthSnapshot } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";
import {
  deleteInvoice,
  getInvoicesSnapshot,
  getServerInvoicesSnapshot,
  saveInvoice,
  subscribeInvoices,
  toDraftData,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/lib/invoices-store";
import { getProfilesSnapshot, getServerProfilesSnapshot, subscribeProfiles } from "@/lib/profiles-store";
import { saveDraft } from "@/lib/draft-store";
import { nextInvoiceNumber } from "@/lib/format";
import { authConfigured } from "@/lib/supabase";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-panel text-muted",
  sent: "bg-accent text-accent-contrast",
  paid: "bg-ink text-bg",
};

/** Renders the paper off-screen so a list row can export a PDF on demand. */
function ListPdfButton({ record }: { record: InvoiceRecord }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const paper = hostRef.current?.querySelector("#invoice-paper");
      if (!(paper instanceof HTMLElement)) throw new Error("paper not rendered");
      await new Promise((r) => setTimeout(r, 400)); // let the QR render
      await downloadPdf(paper, `Invoice-${record.invoiceNumber || "draft"}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-small" disabled={busy} onClick={download}>
        {busy ? "Building…" : "Download PDF"}
      </button>
      <div ref={hostRef} style={{ position: "fixed", left: -10000, top: 0 }} aria-hidden>
        <InvoicePreview data={record.data} />
      </div>
      {error && <span className="text-xs text-muted">PDF failed — open the invoice and try there.</span>}
    </>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const invoices = useSyncExternalStore(
    subscribeInvoices,
    getInvoicesSnapshot,
    getServerInvoicesSnapshot,
  );
  const profiles = useSyncExternalStore(
    subscribeProfiles,
    getProfilesSnapshot,
    getServerProfilesSnapshot,
  );

  const [query, setQuery] = useState("");
  const [businessFilter, setBusinessFilter] = useState<"all" | string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "total">("newest");
  const signedIn = getAuthSnapshot() !== null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = invoices.filter((r) => {
      if (businessFilter !== "all" && r.profileId !== businessFilter) return false;
      if (!q) return true;
      return [r.invoiceNumber, r.data.clientName, r.data.clientBusinessName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return filtered.sort((a, b) => {
      if (sort === "total") return b.total - a.total;
      const aT = a.updatedAt ?? "";
      const bT = b.updatedAt ?? "";
      return sort === "newest" ? bT.localeCompare(aT) : aT.localeCompare(bT);
    });
  }, [invoices, query, businessFilter, sort]);

  function openInvoice(record: InvoiceRecord) {
    saveDraft(toDraftData(record));
    router.push("/");
  }

  async function duplicateInvoice(record: InvoiceRecord) {
    const copy: InvoiceRecord = {
      ...record,
      id: crypto.randomUUID(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        ...record.data,
        invoiceNumber: nextInvoiceNumber(record.invoiceNumber),
      },
      invoiceNumber: nextInvoiceNumber(record.invoiceNumber),
    };
    await saveInvoice(copy);
    saveDraft(toDraftData(copy));
    router.push("/");
  }

  async function handleDelete(record: InvoiceRecord) {
    if (window.confirm(`Delete invoice ${record.invoiceNumber || ""}? This can't be undone.`)) {
      await deleteInvoice(record.id);
    }
  }

  async function setStatus(record: InvoiceRecord, status: InvoiceStatus) {
    await saveInvoice({ ...record, status });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {!authConfigured ? (
        <p className="mt-3 border-2 border-ink bg-panel p-3 text-sm">
          Saved history syncs once the Supabase project keys are set (see the README checklist).
          Anything you saved in this browser still shows below.
        </p>
      ) : !signedIn ? (
        <p className="mt-3 border-2 border-ink bg-panel p-3 text-sm">
          Sign in to save invoices here and sync them across devices. Records saved in this
          browser still show below.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Signed in — history syncs to your account automatically.
        </p>
      )}

      {invoices.length > 0 && (
        <div className="no-print mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            className="input"
            placeholder="Search by client or invoice number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="select"
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            aria-label="Filter by business"
          >
            <option value="all">All businesses</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || "Untitled profile"}
              </option>
            ))}
            <option value="">One-timer</option>
          </select>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total">Highest total</option>
          </select>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="section-card mt-6 p-6">
          <p className="font-bold">No saved invoices yet.</p>
          <p className="mt-2 text-sm text-muted">
            Fill the form on the Create tab and press <strong>Save invoice</strong> — it lands
            here with full details, and stays exactly as it was even if you edit the profile
            later.
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => router.push("/")}>
            Create an invoice
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {visible.length === 0 && (
            <p className="text-sm text-muted">Nothing matches that search or filter.</p>
          )}
          {visible.map((r) => {
            const profile = profiles.find((p) => p.id === r.profileId);
            return (
              <div key={r.id} className="section-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {r.invoiceNumber || "—"}
                      </span>
                      <select
                        className={`status-select border-2 border-ink px-1 py-0.5 font-mono text-[11px] uppercase ${STATUS_COLORS[r.status]}`}
                        value={r.status}
                        onChange={(e) => setStatus(r, e.target.value as InvoiceStatus)}
                        aria-label="Status"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-sm">
                      <strong>{r.data.clientName || "Unnamed client"}</strong>
                      {r.data.clientBusinessName ? ` · ${r.data.clientBusinessName}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {profile ? profile.name : "One-timer"} · saved{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold">{formatMoney(r.total, r.currency)}</p>
                    <div className="mt-1 flex flex-wrap justify-end gap-1">
                      <button type="button" className="btn btn-small" onClick={() => openInvoice(r)}>
                        Open
                      </button>
                      <button type="button" className="btn btn-small" onClick={() => duplicateInvoice(r)}>
                        Duplicate
                      </button>
                      <ListPdfButton record={r} />
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => handleDelete(r)}
                        aria-label={`Delete ${r.invoiceNumber || "invoice"}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
