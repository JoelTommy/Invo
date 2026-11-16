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
  // The editor works on a copy; Save writes it to the store (and cloud).
  const [editing, setEditing] = useState<BusinessProfile | null>(null);

  function handleNew() {
    const blank = blankProfile();
    const base = defaultProfile();
    if (base) {
      Object.assign(blank, { ...base, id: blank.id, name: "", isDefault: false, logoDataUrl: "", upiQrDataUrl: "" });
    }
    setEditing(blank);
  }

  function handleSelect(p: BusinessProfile) {
    setEditing({ ...p });
  }

  async function handleSave(p: BusinessProfile) {
    await saveProfile(p);
    setEditing({ ...p });
  }

  function handleDuplicate(p: BusinessProfile) {
    const copy = duplicateProfile(p.id);
    if (copy) setEditing({ ...copy });
  }

  async function handleDelete(p: BusinessProfile) {
    // Saved invoices keep their own copy of the profile's details.
    if (window.confirm(`Delete “${p.name || "this business"}”? Saved invoices keep their own copy of its details.`)) {
      await deleteProfile(p.id);
      setEditing(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-xl font-bold">Businesses</h2>
        <p className="mt-1 text-sm text-muted">These details appear on invoices you create.</p>
        {!authConfigured && (
          <p className="mt-2 text-xs text-muted">
            Profiles live in this browser — sign in to sync them across devices.
          </p>
        )}
        <div className="chips mt-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn chip ${editing?.id === p.id ? "on" : ""}`}
              aria-pressed={editing?.id === p.id}
              onClick={() => handleSelect(p)}
            >
              {p.name || "Untitled profile"}
            </button>
          ))}
          <button type="button" className="btn chip" onClick={handleNew}>
            + New business
          </button>
        </div>
      </div>

      <div>
        {editing ? (
          <ProfileEditor
            key={editing.id}
            profile={editing}
            onSave={handleSave}
            onDuplicate={() => handleDuplicate(editing)}
            onDelete={() => handleDelete(editing)}
          />
        ) : (
          <p className="text-sm text-muted">
            Pick a business, or create a new one for a different logo and bank details.
          </p>
        )}
      </div>
    </div>
  );
}
