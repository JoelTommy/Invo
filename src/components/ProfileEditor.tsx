"use client";

import { useRef, useState } from "react";
import type { BusinessProfile, Currency, PaymentMethodId, TemplateId } from "@/lib/types";
import { CURRENCIES, PAYMENT_METHODS, STANDARD_FEES } from "@/lib/types";
import { readAsDataURL } from "@/lib/file";
import { BankLogo, PayPalLogo, RazorpayLogo, StripeLogo, UpiLogo } from "./PaymentLogos";

interface Props {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const TEMPLATES: [TemplateId, string][] = [
  ["brutal", "Brutal"],
  ["plain", "Plain"],
  ["classic", "Classic"],
];

const METHOD_LOGOS: Record<PaymentMethodId, React.ReactNode> = {
  upi: <UpiLogo />,
  bank: <BankLogo />,
  paypal: <PayPalLogo />,
  stripe: <StripeLogo />,
  razorpay: <RazorpayLogo />,
};

export default function ProfileEditor({ profile, onSave, onDuplicate, onDelete }: Props) {
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
    setError("");
    onSave(form);
  }

  return (
    <div className="grid gap-3.5">
      {error && (
        <p className="border-2 border-ink bg-panel p-2.5 text-sm" role="alert">
          {error}
        </p>
      )}

      <details className="sec" open>
        <summary>Business</summary>
        <div className="b">
          <label className="label">
            Profile name
            <input
              className="input"
              placeholder="e.g. Stickies"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </label>
          <label className="label">
            Business name
            <input
              className="input"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </label>
          <label className="label">
            Email
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </label>
          <label className="label">
            Address
            <input
              className="input"
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </label>
          <label className="label">
            Tax ID (optional)
            <input
              className="input font-mono"
              value={form.taxId}
              onChange={(e) => set({ taxId: e.target.value })}
            />
          </label>
          <label className="label">
            Logo
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
          </label>
          {form.logoDataUrl && (
            <button
              type="button"
              className="btn btn-small self-start"
              onClick={() => {
                set({ logoDataUrl: "" });
                if (logoRef.current) logoRef.current.value = "";
              }}
            >
              Remove logo
            </button>
          )}
          <label className="flex items-center gap-2.5 text-base">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set({ isDefault: e.target.checked })}
            />
            Use by default for new invoices
          </label>
        </div>
      </details>

      <details className="sec" open>
        <summary>Payment details</summary>
        <div className="b">
          <p className="text-sm text-muted">
            Saved once, shown on every invoice. The UPI ID can still be changed per invoice.
          </p>
          {PAYMENT_METHODS.map(({ id, label }) => (
            <div className="pm" key={id}>
              <div className="ph">{METHOD_LOGOS[id]}</div>
              {id === "upi" && (
                <label className="label">
                  UPI ID
                  <input
                    className="input font-mono"
                    value={form.upiId}
                    onChange={(e) => set({ upiId: e.target.value })}
                  />
                </label>
              )}
              {id === "bank" && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <label className="label">
                    Account name
                    <input
                      className="input"
                      value={form.bankAccountName}
                      onChange={(e) => set({ bankAccountName: e.target.value })}
                    />
                  </label>
                  <label className="label">
                    Bank name
                    <input
                      className="input"
                      value={form.bankName}
                      onChange={(e) => set({ bankName: e.target.value })}
                    />
                  </label>
                  <label className="label">
                    Account number
                    <input
                      className="input font-mono"
                      value={form.bankAccountNumber}
                      onChange={(e) => set({ bankAccountNumber: e.target.value })}
                    />
                  </label>
                  <label className="label">
                    IFSC or SWIFT code
                    <input
                      className="input font-mono"
                      value={form.bankIfsc}
                      onChange={(e) => set({ bankIfsc: e.target.value })}
                    />
                  </label>
                </div>
              )}
              {id === "paypal" && (
                <label className="label">
                  PayPal email
                  <input
                    type="email"
                    className="input"
                    value={form.paypalEmail}
                    onChange={(e) => set({ paypalEmail: e.target.value })}
                  />
                </label>
              )}
              {id === "stripe" && (
                <label className="label">
                  Stripe payment link
                  <input
                    className="input font-mono"
                    placeholder="buy.stripe.com/…"
                    value={form.stripeLink}
                    onChange={(e) => set({ stripeLink: e.target.value })}
                  />
                </label>
              )}
              {id === "razorpay" && (
                <label className="label">
                  Razorpay payment link
                  <input
                    className="input font-mono"
                    placeholder="rzp.io/…"
                    value={form.razorpayLink}
                    onChange={(e) => set({ razorpayLink: e.target.value })}
                  />
                </label>
              )}
              <label className="label">
                QR image (optional — a UPI QR is generated from the UPI ID on INR invoices)
                <input
                  ref={id === "upi" ? qrRef : undefined}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="text-sm"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) set({ upiQrDataUrl: await readAsDataURL(f) });
                  }}
                />
              </label>
              {id === "upi" && form.upiQrDataUrl && (
                <button
                  type="button"
                  className="btn btn-small self-start"
                  onClick={() => {
                    set({ upiQrDataUrl: "" });
                    if (qrRef.current) qrRef.current.value = "";
                  }}
                >
                  Remove QR
                </button>
              )}
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.methods[id].enabled}
                  onChange={(e) => setMethod(id, { enabled: e.target.checked })}
                />
                On by default
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.methods[id].clientPays}
                  onChange={(e) => setMethod(id, { clientPays: e.target.checked })}
                />
                Client pays the fee
              </label>
              <span className="font-mono text-xs text-muted">{STANDARD_FEES[id]}% standard</span>
            </div>
          ))}
        </div>
      </details>

      <details className="sec">
        <summary>Defaults</summary>
        <div className="b">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">
              Currency
              <select
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
            </label>
            <label className="flex items-center gap-2.5 text-base">
              <input
                type="checkbox"
                checked={form.taxEnabled}
                onChange={(e) => set({ taxEnabled: e.target.checked })}
              />
              Add tax by default
            </label>
          </div>
          {form.taxEnabled && (
            <div className="grid grid-cols-2 gap-2.5">
              <label className="label">
                Tax name
                <input
                  className="input"
                  placeholder="GST"
                  value={form.taxName}
                  onChange={(e) => set({ taxName: e.target.value })}
                />
              </label>
              <label className="label">
                Rate (%)
                <input
                  className="input font-mono"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={form.taxRate}
                  onChange={(e) => set({ taxRate: Number(e.target.value) })}
                />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">
              Template
              <select
                className="select"
                value={form.template}
                onChange={(e) => set({ template: e.target.value as TemplateId })}
              >
                {TEMPLATES.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Accent colour
              <input
                type="color"
                className="w-full border-2 border-ink bg-panel"
                value={form.accentColor || "#3347ff"}
                onChange={(e) => set({ accentColor: e.target.value })}
              />
            </label>
          </div>
          <label className="label">
            Notes
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </label>
        </div>
      </details>

      <div className="flex flex-wrap gap-2.5">
        <button type="button" className="btn btn-primary" onClick={save}>
          Save business
        </button>
        <button type="button" className="btn" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="btn" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
