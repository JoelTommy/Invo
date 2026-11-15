"use client";

import { useEffect, useRef, useState } from "react";
import InvoiceForm from "@/components/InvoiceForm";
import InvoicePreview from "@/components/InvoicePreview";
import { defaultInvoice } from "@/lib/defaults";
import { nextInvoiceNumber } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";
import type { InvoiceData } from "@/lib/types";

const DRAFT_KEY = "invoice-draft-v1";

export default function CreateInvoicePage() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit"); // mobile only
  const [pdfError, setPdfError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);

  // Load the draft once on mount. Reading localStorage synchronously during
  // render would mismatch server HTML, so this is the hydration-safe pattern.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InvoiceData;
        if (parsed && Array.isArray(parsed.items)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setData({ ...defaultInvoice(), ...parsed });
          return;
        }
      }
    } catch {
      // Corrupt draft: fall through to a fresh one.
    }
    setData(defaultInvoice());
  }, []);

  // Persist the draft on every change so a refresh never loses work.
  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (e.g. huge logo). The app keeps working.
    }
  }, [data]);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted sm:px-6">Loading…</div>
    );
  }

  function update(patch: Partial<InvoiceData>) {
    setData((d) => (d ? { ...d, ...patch } : d));
  }

  function clearForm() {
    setData((d) => {
      const fresh = defaultInvoice();
      // Keep the suggested number moving forward so numbers stay unique.
      fresh.invoiceNumber = d ? nextInvoiceNumber(d.invoiceNumber) : fresh.invoiceNumber;
      return fresh;
    });
    setSavedNote("");
    setPdfError("");
  }

  async function handleDownloadPdf() {
    if (!data) return;
    const paper = paperRef.current?.querySelector("#invoice-paper");
    if (!(paper instanceof HTMLElement)) return;
    setPdfError("");
    try {
      await downloadPdf(paper, `Invoice-${data.invoiceNumber || "draft"}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      setPdfError("Could not build the PDF. Try again, or use Print and choose “Save as PDF”.");
    }
  }

  function handleSaveInvoice() {
    // Invoice history (Supabase + history tab) arrives in stages 4–5.
    setSavedNote("Saving to history arrives in a later stage. Your draft is saved in this browser automatically.");
    setTimeout(() => setSavedNote(""), 5000);
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
          {savedNote && (
            <p className="no-print mb-3 border-2 border-ink bg-panel p-2 text-sm" role="status">
              {savedNote}
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
