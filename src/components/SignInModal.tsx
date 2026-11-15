"use client";

import { useState } from "react";

/** Prompted when a logged-out visitor presses "Save invoice" or "Sign in".
 *  The real Google OAuth lands in stage 4 (Supabase); this round the flow
 *  exists and says so plainly instead of faking a login. */
export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [explained, setExplained] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={onClose}
    >
      <div className="section-card w-full max-w-md bg-panel p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Save your invoices</h2>
        <p className="mt-2 text-sm text-muted">
          Sign in with Google to keep an invoice history and reuse business profiles — one per
          brand, so you never type the same details twice. One-timer invoices never need an
          account.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          onClick={() => setExplained(true)}
        >
          Continue with Google
        </button>
        {explained && (
          <p className="mt-2 border-2 border-ink p-2 text-sm" role="status">
            Google sign-in connects in stage 4 (Supabase). Nothing to set up right now — your
            draft is already saved in this browser.
          </p>
        )}
        <button type="button" className="btn mt-3 w-full" onClick={onClose}>
          Not now
        </button>
      </div>
    </div>
  );
}
