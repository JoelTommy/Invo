"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import InvoiceForm from "@/components/InvoiceForm";
import InvoicePreview from "@/components/InvoicePreview";
import { defaultInvoice } from "@/lib/defaults";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  saveDraft,
  subscribeDraft,
} from "@/lib/draft-store";
import { nextInvoiceNumber } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";
import type { InvoiceData } from "@/lib/types";

export default function CreateInvoicePage() {
  // The draft is an external store (localStorage) read through
  // useSyncExternalStore: null on the server, the saved draft after
  // hydration, with no setState-in-effect anywhere.
  const data = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  const [mode, setMode] = useState<"edit" | "preview">("edit"); // mobile only
  const [pdfError, setPdfError] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);

  const update = useCallback((patch: Partial<InvoiceData>) => {
    const current = getDraftSnapshot();
    if (!current) return;
    saveDraft({ ...current, ...patch });
  }, []);

  const clearForm = useCallback(() => {
    const current = getDraftSnapshot();
    const fresh = defaultInvoice();
    // Keep the suggested number moving forward so numbers stay unique.
    if (current) fresh.invoiceNumber = nextInvoiceNumber(current.invoiceNumber);
    saveDraft(fresh);
    setPdfError("");
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const current = getDraftSnapshot();
    if (!current) return;
    const paper = paperRef.current?.querySelector("#invoice-paper");
    if (!(paper instanceof HTMLElement)) return;
    setPdfError("");
    try {
      await downloadPdf(paper, `Invoice-${current.invoiceNumber || "draft"}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      setPdfError("Could not build the PDF. Try again, or use Print and choose “Save as PDF”.");
    }
  }, []);

  const handleSaveInvoice = useCallback(() => {
    // Logged-out: pressing "Save invoice" prompts the sign-in flow
    // (Google OAuth itself connects in stage 4).
    window.dispatchEvent(new Event("open-signin"));
  }, []);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted sm:px-6">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Mobile: Edit / Preview toggle */}
      <div className="no-print mb-4 grid grid-cols-2 gap-2 lg:hidden" role="tablist" aria-label="Form or preview">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "edit"}
          className={`btn ${mode === "edit" ? "btn-primary" : ""}`}
          onClick={() => setMode("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          className={`btn ${mode === "preview" ? "btn-primary" : ""}`}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)]">
        {/* Left column: the form */}
        <div className={mode === "edit" ? "block" : "hidden lg:block"}>
          <InvoiceForm data={data} update={update} onClear={clearForm} />
        </div>

        {/* Right column: sticky live preview */}
        <div className={mode === "preview" ? "block" : "hidden lg:block"}>
          <div className="no-print mb-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={handleDownloadPdf}>
              Download PDF
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" className="btn" onClick={handleSaveInvoice} title="Sign in to save invoices (coming soon)">
              Save invoice
            </button>
          </div>
          {pdfError && (
            <p className="no-print mb-3 border-2 border-ink bg-panel p-2 text-sm" role="alert">
              {pdfError}
            </p>
          )}
          <div ref={paperRef} className="lg:sticky lg:top-6">
            <InvoicePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
