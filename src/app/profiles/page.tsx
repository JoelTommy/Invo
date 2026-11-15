"use client";

import { useState, useSyncExternalStore } from "react";
import ProfileEditor from "@/components/ProfileEditor";
import {
  blankProfile,
  defaultProfile,
  deleteProfile,
  duplicateProfile,
  getProfilesSnapshot,
  getServerProfilesSnapshot,
  saveProfile,
  subscribeProfiles,
} from "@/lib/profiles-store";
import type { BusinessProfile } from "@/lib/types";
import { authConfigured } from "@/lib/supabase";

export default function ProfilesPage() {
  const profiles = useSyncExternalStore(
    subscribeProfiles,
    getProfilesSnapshot,
    getServerProfilesSnapshot,
  );
  // null = list view; a BusinessProfile = editing (or creating) one.
  const [editing, setEditing] = useState<BusinessProfile | null>(null);

  if (editing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <ProfileEditor profile={editing} onDone={() => setEditing(null)} />
      </div>
    );
  }

  function handleNew() {
    const blank = blankProfile();
    // Copy defaults from the default profile so setup is fast.
    const base = defaultProfile();
    if (base) {
      Object.assign(blank, { ...base, id: blank.id, name: "", isDefault: false, logoDataUrl: "", upiQrDataUrl: "" });
    }
    setEditing(blank);
  }

  function handleDuplicate(id: string) {
    const copy = duplicateProfile(id);
    if (copy) setEditing(copy);
  }

  function handleDelete(p: BusinessProfile) {
    // Invoice history (stage 5) will warn when a profile has invoices; until
    // then a plain confirm is enough.
    if (window.confirm(`Delete “${p.name || "this profile"}”? This can't be undone.`)) {
      deleteProfile(p.id);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Profiles</h1>
        <button type="button" className="btn btn-primary" onClick={handleNew}>
          + New profile
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        One profile per brand. These details appear on invoices you create — pick a profile on the
        Create tab and everything fills itself in.
        {!authConfigured && " They live in this browser; sign in (stage 4 setup) to sync them across devices."}
      </p>

      {profiles.length === 0 ? (
        <div className="section-card mt-6 p-6">
          <p className="font-bold">No business profiles yet.</p>
          <p className="mt-2 text-sm text-muted">
            Add one — name, UPI ID or bank details, tax defaults — and stop typing them on every
            invoice.
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={handleNew}>
            + New profile
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="section-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {p.name || "Untitled profile"}
                    {p.isDefault && (
                      <span className="ml-2 border-2 border-ink bg-accent px-1 font-mono text-[10px] uppercase text-accent-contrast">
                        default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {[p.email, p.upiId || null, p.bankName || null].filter(Boolean).join(" · ") ||
                      "No contact or payment details yet"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-small" onClick={() => setEditing(p)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => handleDuplicate(p.id)}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => handleDelete(p)}
                    aria-label={`Delete ${p.name || "profile"}`}
                  >
                    Delete
                  </button>
                  {!p.isDefault && (
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => saveProfile({ ...p, isDefault: true })}
                    >
                      Make default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
