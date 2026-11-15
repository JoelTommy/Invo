"use client";

import Link from "next/link";

export default function ProfilesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold">Profiles</h1>
      <div className="section-card p-6">
        <p className="font-bold">One profile for now: Quick invoice.</p>
        <p className="mt-2 text-sm text-muted">
          Business profiles (name, logo, UPI ID, bank details, defaults) live in this browser and
          arrive in the next stage. These details appear on invoices you create.
        </p>
        <p className="mt-2 text-sm text-muted">
          Meanwhile, your business details for each invoice live on the{" "}
          <Link href="/" className="underline">Create</Link> tab.
        </p>
      </div>
    </div>
  );
}
