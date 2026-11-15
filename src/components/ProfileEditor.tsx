"use client";

import { useRef, useState } from "react";
import type { BusinessProfile, Currency, PaymentMethodId, TemplateId } from "@/lib/types";
import { CURRENCIES, PAYMENT_METHODS, STANDARD_FEES } from "@/lib/types";
import { deleteProfile, saveProfile } from "@/lib/profiles-store";
import { readAsDataURL } from "@/lib/file";
import { BankLogo, PayPalLogo, RazorpayLogo, StripeLogo, UpiLogo } from "./PaymentLogos";

interface Props {
  profile: BusinessProfile; // blank from blankProfile() for a new one
  onDone: () => void;
}

const METHOD_LOGOS: Record<PaymentMethodId, React.ReactNode> = {
  upi: <UpiLogo />,
  bank: <BankLogo />,
  paypal: <PayPalLogo />,
  stripe: <StripeLogo />,
  razorpay: <RazorpayLogo />,
};

export default function ProfileEditor({ profile, onDone }: Props) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [error, setError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  function set(patch: Partial<BusinessProfile>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function setMethod(id: PaymentMethodId, patch: Partial<BusinessProfile["methods"][PaymentMethodId]>) {
    setForm((f) => ({
      ...f,
      methods: { ...f.methods, [id]: { ...f.methods[id], ...patch } },
    }));
  }

  function save() {
    if (!form.name.trim()) {
      setError("Give the profile a business name — it appears at the top of invoices.");
      return;
    }
    saveProfile(form);
    onDone();
  }

  function handleDelete() {
    // Invoice history arrives in stage 5; until then a simple confirm.
    if (window.confirm(`Delete “${form.name || "this profile"}”? This can't be undone.`)) {
      deleteProfile(form.id);
      onDone();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          {profile.name ? `Edit: ${profile.name}` : "New business profile"}
        </h1>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onDone}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Save profile
          </button>
        </div>
      </div>
      {error && (
        <p className="border-2 border-ink bg-panel p-2 text-sm" role="alert">
          {error}
        </p>
      )}

      <section className="section-card p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Business</h2>
        <div className="grid gap-3">
          <div>
            <label className="label" htmlFor="p-name">
              Business name
            </label>
            <input id="p-name" className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-email">
                Email
              </label>
              <input id="p-email" type="email" className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-taxid">
                Tax ID (GSTIN / VAT)
              </label>
              <input id="p-taxid" className="input font-mono" value={form.taxId} onChange={(e) => set({ taxId: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-address">
              Address
            </label>
            <input id="p-address" className="input" value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set({ isDefault: e.target.checked })}
            />
            Use this profile by default for new invoices
          </label>
        </div>
      </section>

      <section className="section-card p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Logo &amp; QR</h2>
        <p className="mb-3 text-xs text-muted">These appear on invoices created with this profile.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="label">Logo</span>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) set({ logoDataUrl: await readAsDataURL(f) });
              }}
            />
            {form.logoDataUrl && (
              <button
                type="button"
                className="btn btn-small mt-2"
                onClick={() => {
                  set({ logoDataUrl: "" });
                  if (logoRef.current) logoRef.current.value = "";
                }}
              >
                Remove logo
              </button>
            )}
          </div>
          <div>
            <span className="label">UPI QR image (optional)</span>
            <input
              ref={qrRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) set({ upiQrDataUrl: await readAsDataURL(f) });
              }}
            />
            <p className="mt-1 text-xs text-muted">
              Leave empty and a QR is generated from the UPI ID on INR invoices.
            </p>
            {form.upiQrDataUrl && (
              <button
                type="button"
                className="btn btn-small mt-2"
                onClick={() => {
                  set({ upiQrDataUrl: "" });
                  if (qrRef.current) qrRef.current.value = "";
                }}
              >
                Remove QR
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section-card p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Payment details</h2>
        <p className="mb-3 text-xs text-muted">
          Fill what you use. On invoices you just tick the method — details come from here.
        </p>
        <div className="grid gap-3">
          <div>
            <label className="label" htmlFor="p-upi">
              UPI ID
            </label>
            <input id="p-upi" className="input font-mono" placeholder="name@bank" value={form.upiId} onChange={(e) => set({ upiId: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-acname">
                Bank — account name
              </label>
              <input id="p-acname" className="input" value={form.bankAccountName} onChange={(e) => set({ bankAccountName: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-bank">
                Bank
              </label>
              <input id="p-bank" className="input" value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-acno">
                Account number
              </label>
              <input id="p-acno" className="input font-mono" value={form.bankAccountNumber} onChange={(e) => set({ bankAccountNumber: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-ifsc">
                IFSC / SWIFT
              </label>
              <input id="p-ifsc" className="input font-mono" value={form.bankIfsc} onChange={(e) => set({ bankIfsc: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="p-paypal">
                PayPal email
              </label>
              <input id="p-paypal" type="email" className="input" value={form.paypalEmail} onChange={(e) => set({ paypalEmail: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-stripe">
                Stripe payment link
              </label>
              <input id="p-stripe" className="input font-mono" placeholder="buy.stripe.com/…" value={form.stripeLink} onChange={(e) => set({ stripeLink: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-rzp">
                Razorpay payment link
              </label>
              <input id="p-rzp" className="input font-mono" placeholder="rzp.io/…" value={form.razorpayLink} onChange={(e) => set({ razorpayLink: e.target.value })} />
            </div>
          </div>

          <div className="border-2 border-ink p-3">
            <span className="label">Payment methods on by default</span>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map(({ id, label }) => (
                <div key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.methods[id].enabled}
                      onChange={(e) => setMethod(id, { enabled: e.target.checked })}
                    />
                    <span className="flex items-center">{METHOD_LOGOS[id]}</span>
                    {label}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.methods[id].clientPays}
                      onChange={(e) => setMethod(id, { clientPays: e.target.checked })}
                    />
                    Client pays the fee ({STANDARD_FEES[id]}%, standard)
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-card p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Invoice defaults</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-currency">
              Default currency
            </label>
            <select
              id="p-currency"
              className="select"
              value={form.currency}
              onChange={(e) => set({ currency: e.target.value as Currency })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.taxEnabled}
                onChange={(e) => set({ taxEnabled: e.target.checked })}
              />
              Add tax by default
            </label>
          </div>
          {form.taxEnabled && (
            <>
              <div>
                <label className="label" htmlFor="p-taxname">
                  Tax name
                </label>
                <input id="p-taxname" className="input" placeholder="GST" value={form.taxName} onChange={(e) => set({ taxName: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="p-taxrate">
                  Tax rate %
                </label>
                <input id="p-taxrate" className="input font-mono" type="number" min={0} max={100} step="any" value={form.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) })} />
              </div>
            </>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="label">Default template</span>
            <div className="flex gap-2">
              {(["brutal", "plain", "classic"] as TemplateId[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-small ${form.template === t ? "btn-primary" : ""}`}
                  aria-pressed={form.template === t}
                  onClick={() => set({ template: t })}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-accent">
              Default accent color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="p-accent"
                type="color"
                className="h-9 w-14 border-2 border-ink bg-panel"
                value={form.accentColor || "#3347ff"}
                onChange={(e) => set({ accentColor: e.target.value })}
              />
              {form.accentColor && (
                <button type="button" className="btn btn-small" onClick={() => set({ accentColor: "" })}>
                  Use theme accent
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="label" htmlFor="p-notes">
            Default notes
          </label>
          <textarea id="p-notes" className="input" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn" onClick={handleDelete}>
          Delete profile
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onDone}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}
