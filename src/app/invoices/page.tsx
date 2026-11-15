"use client";

import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold">Invoices</h1>
      <div className="section-card p-6">
        <p className="font-bold">No saved invoices yet.</p>
        <p className="mt-2 text-sm text-muted">
          Create one on the <Link href="/" className="underline">Create</Link> tab — it downloads
          instantly, no account needed. Saving a history of invoices arrives when sign-in lands
          in a later stage.
        </p>
      </div>
    </div>
  );
}
