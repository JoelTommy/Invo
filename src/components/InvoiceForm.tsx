"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { BusinessProfile, InvoiceData, LineItem, PaymentMethodId, TemplateId } from "@/lib/types";
import { CURRENCIES, PAYMENT_METHODS, STANDARD_FEES } from "@/lib/types";
import { BankLogo, PayPalLogo, RazorpayLogo, StripeLogo, UpiLogo } from "./PaymentLogos";

interface Props {
  data: InvoiceData;
  update: (patch: Partial<InvoiceData>) => void;
  profiles: BusinessProfile[];
  onSelectProfile: (profile: BusinessProfile | null) => void;
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

export default function InvoiceForm({ data, update, profiles, onSelectProfile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);
  const oneTimer = data.profileId === null;

  function setItem(id: string, patch: Partial<LineItem>) {
    update({ items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  async function readImage(file: File | undefined, apply: (dataUrl: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.readAsDataURL(file);
  }

  /* Per-method detail box: fields for one-timers, snapshot values for
     profiles (still editable — an invoice keeps its own copy). */
  const detailBox = (id: PaymentMethodId, label: string) => {
    const m = data.methods[id];
    const field = (key: keyof InvoiceData, text: string, mono = false) => (
      <label className="label">
        {text}
        <input
          className={`input ${mono ? "font-mono" : ""}`}
          value={String(data[key] ?? "")}
          onChange={(e) => update({ [key]: e.target.value } as Partial<InvoiceData>)}
        />
      </label>
    );
    const hasValues =
      (id === "upi" && data.upiId) ||
      (id === "paypal" && data.paypalEmail) ||
      (id === "stripe" && data.stripeLink) ||
      (id === "razorpay" && data.razorpayLink) ||
      (id === "bank" &&
        (data.bankAccountName || data.bankName || data.bankAccountNumber || data.bankIfsc));

    return (
      <div className="pm" key={id}>
        <div className="ph">{METHOD_LOGOS[id]}</div>
        {!oneTimer && !hasValues && (
          <p className="text-sm text-muted">
            No {label} details saved for this business yet. Add them on the Profiles tab.
          </p>
        )}
        {id === "upi" && field("upiId", "UPI ID", true)}
        {id === "paypal" && field("paypalEmail", "PayPal email")}
        {id === "stripe" && field("stripeLink", "Stripe payment link", true)}
        {id === "razorpay" && field("razorpayLink", "Razorpay payment link", true)}
        {id === "bank" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {field("bankAccountName", "Account name")}
            {field("bankName", "Bank name")}
            {field("bankAccountNumber", "Account number", true)}
            {field("bankIfsc", "IFSC or SWIFT code", true)}
          </div>
        )}
        <div className="fee">
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={m.clientPays}
              onChange={(e) =>
                update({
                  methods: { ...data.methods, [id]: { ...m, clientPays: e.target.checked } },
                })
              }
            />
            Client pays the fee
          </label>
          <span className="font-mono text-xs text-muted">{STANDARD_FEES[id]}% standard</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Business: chips at the very top, profiles first, One-timer beside */}
      <div className="chips" role="group" aria-label="Invoice for">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`btn chip ${data.profileId === p.id ? "on" : ""}`}
            aria-pressed={data.profileId === p.id}
            onClick={() => onSelectProfile(p)}
          >
            {p.name || "Untitled profile"}
          </button>
        ))}
        <button
          type="button"
          className={`btn chip ${oneTimer ? "on" : ""}`}
          aria-pressed={oneTimer}
          onClick={() => onSelectProfile(null)}
        >
          One-timer
        </button>
        <Link href="/profiles" className="btn chip ghost">
          + Add business
        </Link>
      </div>

      <details className="sec" open>
        <summary>Client and invoice</summary>
        <div className="b">
          <label className="label">
            Client name
            <input
              className="input"
              placeholder="Who is this for?"
              value={data.clientName}
              onChange={(e) => update({ clientName: e.target.value })}
            />
          </label>
          <label className="label">
            Client business name
            <input
              className="input"
              placeholder="Their company (optional)"
              value={data.clientBusinessName}
              onChange={(e) => update({ clientBusinessName: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">
              Invoice number
              <input
                className="input font-mono"
                value={data.invoiceNumber}
                onChange={(e) => update({ invoiceNumber: e.target.value })}
              />
            </label>
            <label className="label">
              Currency
              <select
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
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">
              Issue date
              <input
                type="date"
                className="input"
                value={data.issueDate}
                onChange={(e) => update({ issueDate: e.target.value })}
              />
            </label>
            <label className="label">
              Due date
              <input
                type="date"
                className="input"
                value={data.dueDate}
                onChange={(e) => update({ dueDate: e.target.value })}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            {data.items.map((item, i) => (
              <div key={item.id} className="grid grid-cols-[1fr_60px_90px_auto] gap-1.5 items-end">
                <label className="label">
                  {i === 0 ? "Item" : "Description"}
                  <input
                    className="input"
                    placeholder={i === 0 ? "What did you do?" : ""}
                    value={item.description}
                    onChange={(e) => setItem(item.id, { description: e.target.value })}
                  />
                </label>
                <label className="label">
                  {i === 0 ? "Qty" : ""}
                  <input
                    className="input font-mono"
                    type="number"
                    min={0}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => setItem(item.id, { quantity: Number(e.target.value) })}
                  />
                </label>
                <label className="label">
                  {i === 0 ? "Rate" : ""}
                  <input
                    className="input font-mono"
                    type="number"
                    min={0}
                    step="any"
                    value={item.rate}
                    onChange={(e) => setItem(item.id, { rate: Number(e.target.value) })}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-small"
                  style={{ height: "fit-content", marginBottom: 2 }}
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() =>
                    update({
                      items:
                        data.items.length > 1
                          ? data.items.filter((it) => it.id !== item.id)
                          : [{ id: item.id, description: "", quantity: 1, rate: 0 }],
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-small self-start"
            onClick={() =>
              update({
                items: [
                  ...data.items,
                  { id: Math.random().toString(36).slice(2, 10), description: "", quantity: 1, rate: 0 },
                ],
              })
            }
          >
            Add item
          </button>
        </div>
      </details>

      {/* Your details: only for a one-timer invoice — profiles fill this in */}
      {oneTimer && (
        <details className="sec" open>
          <summary>Your details</summary>
          <div className="b">
            <label className="label">
              Your name or business
              <input
                className="input"
                placeholder="Appears at the top of the invoice"
                value={data.businessName}
                onChange={(e) => update({ businessName: e.target.value })}
              />
            </label>
            <label className="label">
              Email
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={data.businessEmail}
                onChange={(e) => update({ businessEmail: e.target.value })}
              />
            </label>
            <label className="label">
              Address
              <input
                className="input"
                placeholder="Street, city, PIN"
                value={data.businessAddress}
                onChange={(e) => update({ businessAddress: e.target.value })}
              />
            </label>
            <label className="label">
              Business logo (optional)
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="text-sm"
                onChange={(e) => readImage(e.target.files?.[0], (url) => update({ logoDataUrl: url }))}
              />
            </label>
            {data.logoDataUrl && (
              <div className="flex items-center gap-3">
                <Image
                  src={data.logoDataUrl}
                  alt="Business logo preview"
                  width={120}
                  height={48}
                  unoptimized
                  className="h-auto max-h-12 w-auto border-2 border-ink bg-white p-1"
                />
                <button
                  type="button"
                  className="btn btn-small self-start"
                  onClick={() => {
                    update({ logoDataUrl: "" });
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Remove logo
                </button>
              </div>
            )}
            <label className="label">
              Your UPI QR image (optional — a UPI QR is generated from the UPI ID on INR invoices
              when you leave this empty)
              <input
                ref={qrFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="text-sm"
                onChange={(e) => readImage(e.target.files?.[0], (url) => update({ qrDataUrl: url }))}
              />
            </label>
            {data.qrDataUrl && (
              <div className="flex items-center gap-3">
                <Image
                  src={data.qrDataUrl}
                  alt="UPI QR preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="border-2 border-ink bg-white p-1"
                />
                <button
                  type="button"
                  className="btn btn-small self-start"
                  onClick={() => {
                    update({ qrDataUrl: "" });
                    if (qrFileRef.current) qrFileRef.current.value = "";
                  }}
                >
                  Remove QR
                </button>
              </div>
            )}
          </div>
        </details>
      )}

      <details className="sec">
        <summary>Tax</summary>
        <div className="b">
          <label className="flex items-center gap-2.5 text-base">
            <input
              type="checkbox"
              checked={data.taxEnabled}
              onChange={(e) => update({ taxEnabled: e.target.checked })}
            />
            Add tax to this invoice
          </label>
          {data.taxEnabled && (
            <div className="grid grid-cols-2 gap-2.5">
              <label className="label">
                Tax name
                <input
                  className="input"
                  placeholder="GST"
                  value={data.taxName}
                  onChange={(e) => update({ taxName: e.target.value })}
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
                  value={data.taxRate}
                  onChange={(e) => update({ taxRate: Number(e.target.value) })}
                />
              </label>
            </div>
          )}
        </div>
      </details>

      <details className="sec" open>
        <summary>Payment options</summary>
        <div className="b">
          <div className="tiles">
            {PAYMENT_METHODS.map(({ id, label }) => (
              <label className="tile" key={id} title={label}>
                <input
                  type="checkbox"
                  checked={data.methods[id].enabled}
                  onChange={(e) =>
                    update({
                      methods: { ...data.methods, [id]: { ...data.methods[id], enabled: e.target.checked } },
                    })
                  }
                  aria-label={label}
                />
                {METHOD_LOGOS[id]}
                <span className="tk">✓</span>
              </label>
            ))}
          </div>
          <div className="grid gap-3">
            {PAYMENT_METHODS.filter(({ id }) => data.methods[id].enabled).map(({ id, label }) =>
              detailBox(id, label),
            )}
          </div>
        </div>
      </details>

      <details className="sec">
        <summary>Custom options</summary>
        <div className="b">
          <label className="label">
            Client email
            <input
              type="email"
              className="input"
              placeholder="client@company.com"
              value={data.clientEmail}
              onChange={(e) => update({ clientEmail: e.target.value })}
            />
          </label>
          <label className="label">
            Client address
            <input
              className="input"
              placeholder="Street, city, PIN"
              value={data.clientAddress}
              onChange={(e) => update({ clientAddress: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">
              Template
              <select
                className="select"
                value={data.template}
                onChange={(e) => update({ template: e.target.value as TemplateId })}
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
                value={data.accentColor || "#3347ff"}
                onChange={(e) => update({ accentColor: e.target.value })}
              />
            </label>
          </div>
          <label className="label">
            Notes
            <textarea
              className="input"
              rows={3}
              placeholder="Thank you for your business. Payment is due by the date above."
              value={data.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </label>
        </div>
      </details>
    </div>
  );
}
