"use client";

import { useRef, useState } from "react";
import type { InvoiceData, LineItem, PaymentMethodId, TemplateId } from "@/lib/types";
import { CURRENCIES, PAYMENT_METHODS } from "@/lib/types";
import { BankLogo, PayPalLogo, RazorpayLogo, StripeLogo, UpiLogo } from "./PaymentLogos";

interface Props {
  data: InvoiceData;
  update: (patch: Partial<InvoiceData>) => void;
  onClear: () => void;
}

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "brutal", label: "Brutal" },
  { id: "plain", label: "Plain" },
  { id: "classic", label: "Classic" },
];

const METHOD_LOGOS: Record<PaymentMethodId, React.ReactNode> = {
  upi: <UpiLogo />,
  bank: <BankLogo />,
  paypal: <PayPalLogo />,
  stripe: <StripeLogo />,
  razorpay: <RazorpayLogo />,
};

const METHOD_HINTS: Record<PaymentMethodId, string> = {
  upi: "Your UPI ID — VPAs change often, so this one stays editable",
  bank: "One account per brand; one-timer invoices enter it here, profiles fill it automatically",
  paypal: "Clients pay your PayPal email directly",
  stripe: "Clients pay through your Stripe payment link",
  razorpay: "Clients pay through your Razorpay payment link",
};

export default function InvoiceForm({ data, update, onClear }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const oneTimer = data.profileId === null;

  function setItem(id: string, patch: Partial<LineItem>) {
    update({ items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  function readImage(file: File, apply: (dataUrl: string) => void) {
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Client -------------------------------------------------------- */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-client">
        <h2 id="s-client" className="mb-3 text-sm font-bold uppercase tracking-wide">
          1 · Client
        </h2>
        <div className="grid gap-3">
          <div>
            <label className="label" htmlFor="client-name">
              Client name
            </label>
            <input
              id="client-name"
              className="input"
              placeholder="Who is this for?"
              value={data.clientName}
              onChange={(e) => update({ clientName: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="client-business">
              Client&apos;s business (optional)
            </label>
            <input
              id="client-business"
              className="input"
              placeholder="Their company"
              value={data.clientBusinessName}
              onChange={(e) => update({ clientBusinessName: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="client-email">
                Email (optional)
              </label>
              <input
                id="client-email"
                type="email"
                className="input"
                placeholder="client@company.com"
                value={data.clientEmail}
                onChange={(e) => update({ clientEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="client-address">
                Address (optional)
              </label>
              <input
                id="client-address"
                className="input"
                placeholder="Street, city, PIN"
                value={data.clientAddress}
                onChange={(e) => update({ clientAddress: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Business ------------------------------------------------------ */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-business">
        <h2 id="s-business" className="mb-3 text-sm font-bold uppercase tracking-wide">
          2 · Business
        </h2>
        <p className="mb-3 text-sm text-muted">
          Who is sending this invoice? Saved brands appear here once you sign in — pick one and
          every detail fills itself in.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* One-timer: the guest option, next to the profiles */}
          <button
            type="button"
            className={`border-2 p-3 text-left ${
              oneTimer ? "border-ink bg-accent text-accent-contrast" : "border-ink bg-panel"
            }`}
            aria-pressed={oneTimer}
            onClick={() => update({ profileId: null })}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">One-timer</span>
              {oneTimer && <span className="font-mono text-xs">selected</span>}
            </div>
            <p className="mt-1 text-xs opacity-70">
              A custom invoice without signing in. Type your details once below.
            </p>
          </button>

          {/* Profiles: for signed-in users (Supabase lands in stage 4) */}
          <div className="border-2 border-ink bg-panel p-3 opacity-70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Business profiles</span>
              <span className="font-mono text-xs">sign in</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Brands like “Stickies” and “Littles” — one tap each. Arrives with Google sign-in.
            </p>
          </div>
        </div>

        {oneTimer && (
          <div className="mt-3 grid gap-3 border-2 border-ink p-3">
            <div>
              <label className="label" htmlFor="business-name">
                Your business name
              </label>
              <input
                id="business-name"
                className="input"
                placeholder="Appears at the top of the invoice"
                value={data.businessName}
                onChange={(e) => update({ businessName: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="business-email">
                  Email (optional)
                </label>
                <input
                  id="business-email"
                  type="email"
                  className="input"
                  placeholder="you@business.com"
                  value={data.businessEmail}
                  onChange={(e) => update({ businessEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="business-taxid">
                  Tax ID (optional)
                </label>
                <input
                  id="business-taxid"
                  className="input"
                  placeholder="GSTIN / VAT"
                  value={data.businessTaxId}
                  onChange={(e) => update({ businessTaxId: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="business-address">
                Address (optional)
              </label>
              <input
                id="business-address"
                className="input"
                placeholder="Street, city, PIN"
                value={data.businessAddress}
                onChange={(e) => update({ businessAddress: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. Invoice ------------------------------------------------------- */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-invoice">
        <h2 id="s-invoice" className="mb-3 text-sm font-bold uppercase tracking-wide">
          3 · Invoice
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="inv-number">
              Number
            </label>
            <input
              id="inv-number"
              className="input font-mono"
              value={data.invoiceNumber}
              onChange={(e) => update({ invoiceNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="inv-issue">
              Issue date
            </label>
            <input
              id="inv-issue"
              type="date"
              className="input"
              value={data.issueDate}
              onChange={(e) => update({ issueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="inv-due">
              Due date
            </label>
            <input
              id="inv-due"
              type="date"
              className="input"
              value={data.dueDate}
              onChange={(e) => update({ dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-3 sm:w-40">
          <label className="label" htmlFor="inv-currency">
            Currency
          </label>
          <select
            id="inv-currency"
            className="select"
            value={data.currency}
            onChange={(e) => update({ currency: e.target.value as InvoiceData["currency"] })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <span className="label">Line items</span>
          <div className="flex flex-col gap-2">
            {data.items.map((item, i) => (
              <div key={item.id} className="grid grid-cols-[1fr_5rem_6rem_auto] items-end gap-2">
                <div>
                  {i === 0 && <span className="label">Description</span>}
                  <input
                    className="input"
                    placeholder={i === 0 ? "What did you do?" : "Description"}
                    value={item.description}
                    onChange={(e) => setItem(item.id, { description: e.target.value })}
                  />
                </div>
                <div>
                  {i === 0 && <span className="label">Qty</span>}
                  <input
                    className="input font-mono"
                    type="number"
                    min={0}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => setItem(item.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  {i === 0 && <span className="label">Rate</span>}
                  <input
                    className="input font-mono"
                    type="number"
                    min={0}
                    step="any"
                    value={item.rate}
                    onChange={(e) => setItem(item.id, { rate: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-small"
                  style={{ height: "fit-content" }}
                  aria-label={`Remove line item ${i + 1}`}
                  onClick={() =>
                    update({
                      items:
                        data.items.length > 1
                          ? data.items.filter((it) => it.id !== item.id)
                          : [{ id: item.id, description: "", quantity: 1, rate: 0 }],
                    })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-small mt-2"
            onClick={() =>
              update({
                items: [
                  ...data.items,
                  { id: Math.random().toString(36).slice(2, 10), description: "", quantity: 1, rate: 0 },
                ],
              })
            }
          >
            + Add item
          </button>
        </div>
      </section>

      {/* 4. Tax ----------------------------------------------------------- */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-tax">
        <h2 id="s-tax" className="mb-3 text-sm font-bold uppercase tracking-wide">
          4 · Tax
        </h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={data.taxEnabled}
            onChange={(e) => update({ taxEnabled: e.target.checked })}
          />
          Add tax
        </label>
        {data.taxEnabled && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tax-name">
                Tax name
              </label>
              <input
                id="tax-name"
                className="input"
                placeholder="GST"
                value={data.taxName}
                onChange={(e) => update({ taxName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="tax-rate">
                Rate %
              </label>
              <input
                id="tax-rate"
                className="input font-mono"
                type="number"
                min={0}
                max={100}
                step="any"
                value={data.taxRate}
                onChange={(e) => update({ taxRate: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </section>

      {/* 5. Payment options ---------------------------------------------- */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-payment">
        <h2 id="s-payment" className="mb-1 text-sm font-bold uppercase tracking-wide">
          5 · Payment options
        </h2>
        <p className="mb-3 text-sm text-muted">
          Tick how this client can pay. The details behind each option come from your business
          profile — you never type them here.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map(({ id, label }) => {
            const m = data.methods[id];
            const chip = m.enabled
              ? "border-ink bg-accent text-accent-contrast"
              : "border-ink bg-panel";
            return (
              <div key={id} className="border-2 border-ink bg-panel">
                <label className={`flex cursor-pointer items-center gap-3 p-3 ${chip}`}>
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) =>
                      update({
                        methods: { ...data.methods, [id]: { ...m, enabled: e.target.checked } },
                      })
                    }
                  />
                  <span className="flex items-center">{METHOD_LOGOS[id]}</span>
                  <span className="text-sm font-semibold">
                    {id === "bank" ? "Bank transfer" : id === "upi" ? "UPI" : label}
                  </span>
                </label>

                {m.enabled && (
                  <div className="border-t-2 border-ink p-3">
                    <p className="text-xs text-muted">{METHOD_HINTS[id]}</p>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={m.clientPays}
                        onChange={(e) =>
                          update({
                            methods: {
                              ...data.methods,
                              [id]: { ...m, clientPays: e.target.checked },
                            },
                          })
                        }
                      />
                      Client pays the fee
                    </label>
                    {m.clientPays && (
                      <p className="mt-2 font-mono text-xs">
                        Standard fee: {m.feePercent}% — fixed per app, adjusts by region later
                      </p>
                    )}
                    {oneTimer && id === "upi" && (
                      <div className="mt-2">
                        <label className="label" htmlFor="upi-override">
                          UPI ID
                        </label>
                        <input
                          id="upi-override"
                          className="input font-mono"
                          placeholder="name@bank — VPAs change often"
                          value={data.upiId}
                          onChange={(e) => update({ upiId: e.target.value })}
                        />
                      </div>
                    )}
                    {oneTimer && id === "paypal" && (
                      <div className="mt-2">
                        <label className="label" htmlFor="paypal-email">
                          PayPal email
                        </label>
                        <input
                          id="paypal-email"
                          type="email"
                          className="input"
                          placeholder="you@business.com"
                          value={data.paypalEmail}
                          onChange={(e) => update({ paypalEmail: e.target.value })}
                        />
                      </div>
                    )}
                    {oneTimer && id === "stripe" && (
                      <div className="mt-2">
                        <label className="label" htmlFor="stripe-link">
                          Stripe payment link
                        </label>
                        <input
                          id="stripe-link"
                          className="input font-mono"
                          placeholder="buy.stripe.com/…"
                          value={data.stripeLink}
                          onChange={(e) => update({ stripeLink: e.target.value })}
                        />
                      </div>
                    )}
                    {oneTimer && id === "razorpay" && (
                      <div className="mt-2">
                        <label className="label" htmlFor="razorpay-link">
                          Razorpay payment link
                        </label>
                        <input
                          id="razorpay-link"
                          className="input font-mono"
                          placeholder="rzp.io/…"
                          value={data.razorpayLink}
                          onChange={(e) => update({ razorpayLink: e.target.value })}
                        />
                      </div>
                    )}
                    {oneTimer && id === "bank" && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="label" htmlFor="ov-acname">
                            Account name
                          </label>
                          <input
                            id="ov-acname"
                            className="input"
                            value={data.bankAccountName}
                            onChange={(e) => update({ bankAccountName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="ov-bank">
                            Bank
                          </label>
                          <input
                            id="ov-bank"
                            className="input"
                            value={data.bankName}
                            onChange={(e) => update({ bankName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="ov-acno">
                            Account number
                          </label>
                          <input
                            id="ov-acno"
                            className="input font-mono"
                            value={data.bankAccountNumber}
                            onChange={(e) => update({ bankAccountNumber: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="ov-ifsc">
                            IFSC / SWIFT
                          </label>
                          <input
                            id="ov-ifsc"
                            className="input font-mono"
                            value={data.bankIfsc}
                            onChange={(e) => update({ bankIfsc: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          Signed-in brands pull these details from their profile automatically — the boxes above
          only appear for one-timer invoices.
        </p>
      </section>

      {/* 6. Custom options (collapsed by default) ------------------------- */}
      <section className="section-card p-4 sm:p-5" aria-labelledby="s-custom">
        <div className="flex items-center justify-between gap-2">
          <h2 id="s-custom" className="text-sm font-bold uppercase tracking-wide">
            6 · Custom options
          </h2>
          <button
            type="button"
            className="btn btn-small"
            aria-expanded={customOpen}
            onClick={() => setCustomOpen((open) => !open)}
          >
            {customOpen ? "Close" : "Open"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Logos, QRs, one-off bank details and template choices. Most invoices don’t need these.
        </p>

        {customOpen && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Logo (this invoice only)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readImage(f, (url) => update({ logoDataUrl: url }));
                  }}
                />
                {data.logoDataUrl && (
                  <button
                    type="button"
                    className="btn btn-small mt-2"
                    onClick={() => {
                      update({ logoDataUrl: "" });
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Remove logo
                  </button>
                )}
              </div>
              <div>
                <span className="label">QR image (this invoice only)</span>
                <input
                  ref={qrFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readImage(f, (url) => update({ qrDataUrl: url }));
                  }}
                />
                <p className="mt-1 text-xs text-muted">
                  Leave empty to auto-generate a UPI QR (INR invoices with a UPI ID).
                </p>
                {data.qrDataUrl && (
                  <button
                    type="button"
                    className="btn btn-small mt-2"
                    onClick={() => {
                      update({ qrDataUrl: "" });
                      if (qrFileRef.current) qrFileRef.current.value = "";
                    }}
                  >
                    Remove QR
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Template</span>
                <div className="flex gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`btn btn-small ${data.template === t.id ? "btn-primary" : ""}`}
                      aria-pressed={data.template === t.id}
                      onClick={() => update({ template: t.id })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="accent-color">
                  Accent color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="accent-color"
                    type="color"
                    className="h-9 w-14 border-2 border-ink bg-panel"
                    value={data.accentColor || "#3347ff"}
                    onChange={(e) => update({ accentColor: e.target.value })}
                  />
                  {data.accentColor && (
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => update({ accentColor: "" })}
                    >
                      Use theme accent
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="input"
                rows={3}
                placeholder="Thanks for your business. Payment due within 14 days."
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      <button type="button" className="btn self-start" onClick={onClear}>
        Clear form
      </button>
    </div>
  );
}
