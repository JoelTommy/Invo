"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import InvoicePreview from "@/components/InvoicePreview";
import { getAuthSnapshot } from "@/lib/auth";
import { formatMoney, nextInvoiceNumber } from "@/lib/format";
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
import {
  getProfilesSnapshot,
  getServerProfilesSnapshot,
  subscribeProfiles,
} from "@/lib/profiles-store";
import { saveDraft } from "@/lib/draft-store";
import { authConfigured } from "@/lib/supabase";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

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
        {busy ? "Making PDF…" : "PDF"}
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

  async function copyInvoice(record: InvoiceRecord) {
    const number = nextInvoiceNumber(record.invoiceNumber);
    const copy: InvoiceRecord = {
      ...record,
      id: crypto.randomUUID(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      invoiceNumber: number,
      data: { ...record.data, invoiceNumber: number },
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
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h2 className="text-xl font-bold">Past invoices</h2>

      {!authConfigured && (
        <p className="mt-2 text-sm text-muted">
          Syncing starts once the Supabase keys are set (README checklist). Records saved in this
          browser show below.
        </p>
      )}
      {authConfigured && !signedIn && (
        <p className="mt-2 text-sm text-muted">
          Sign in to sync this history across devices.
        </p>
      )}

      <div className="no-print mt-4 grid gap-2.5 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="input"
          placeholder="Search by client, number or business"
          aria-label="Search invoices"
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

      <div className="mt-4 grid gap-3">
        {invoices.length === 0 && (
          <div className="modal-card" style={{ maxWidth: "none" }}>
            <h3 className="text-xl font-bold">No invoices yet</h3>
            <p className="text-sm text-muted">
              Make one on the Create tab and press Save invoice.
            </p>
            <button type="button" className="btn btn-primary self-start" onClick={() => router.push("/")}>
              Create an invoice
            </button>
          </div>
        )}
        {invoices.length > 0 && visible.length === 0 && (
          <p className="text-sm text-muted">Nothing matches that search or filter.</p>
        )}
        {visible.map((r) => {
          const profile = profiles.find((p) => p.id === r.profileId);
          return (
            <div key={r.id} className="row-card">
              <div className="min-w-0">
                <b className="font-mono">#{r.invoiceNumber || "—"}</b>{" "}
                <span className="text-sm">{r.data.clientName || "Unnamed client"}</span>
                <small>
                  {profile ? profile.name : "One-timer"} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  <select
                    className="status-select border-2 border-ink bg-panel px-1 font-mono text-[11px] uppercase"
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
                </small>
              </div>
              <b className="font-mono">{formatMoney(r.total, r.currency)}</b>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" className="btn btn-small" onClick={() => openInvoice(r)}>
                  Open
                </button>
                <button type="button" className="btn btn-small" onClick={() => copyInvoice(r)}>
                  Copy
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
          );
        })}
      </div>
    </div>
  );
}
