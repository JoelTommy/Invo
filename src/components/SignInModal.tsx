"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

/** Prompted when a logged-out visitor presses "Save invoice" or "Sign in". */
export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [note, setNote] = useState<"" | "unconfigured" | "redirecting" | "error">("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleGoogle() {
    setNote("");
    setErrorMsg("");
    try {
      const started = await signInWithGoogle();
      // Supabase redirects the browser on success; false means not configured.
      setNote(started ? "redirecting" : "unconfigured");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong starting sign-in.");
      setNote("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Save your invoices</h2>
        <p className="mt-2 text-sm text-muted">
          Sign in with Google to keep an invoice history and reuse business profiles — one per
          brand, so you never type the same details twice. One-timer invoices never need an
          account.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          onClick={handleGoogle}
        >
          Continue with Google
        </button>
        {note === "unconfigured" && (
          <p className="mt-2 border-2 border-ink p-2 text-sm" role="status">
            Google sign-in isn&apos;t connected yet — the Supabase project keys are missing from
            this deployment (see the README setup checklist). Your draft is already saved in this
            browser.
          </p>
        )}
        {note === "redirecting" && (
          <p className="mt-2 border-2 border-ink p-2 text-sm" role="status">
            Taking you to Google… finish there and you&apos;ll come right back.
          </p>
        )}
        {note === "error" && (
          <p className="mt-2 border-2 border-ink bg-panel p-2 text-sm" role="alert">
            {errorMsg} Check Supabase → Authentication → Providers → Google, and that the OAuth
            redirect URL matches this site.
          </p>
        )}
        <button type="button" className="btn mt-3 w-full" onClick={onClose}>
          Not now
        </button>
      </div>
    </div>
  );
}
