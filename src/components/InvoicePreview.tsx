"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { InvoiceData } from "@/lib/types";
import { computeTotals, formatDate, formatMoney } from "@/lib/format";
import { buildUpiLink, canGenerateUpiQr, generateQrDataUrl } from "@/lib/upi";

const PAPER_WIDTH = 559; // A5 width at 96dpi = 148mm

interface PreviewProps {
  data: InvoiceData;
}

/** Shows a true A5 sheet: fixed width, A5 min-height, scaled to fit the
 *  column, with the surrounding layout height compensated for the scale. */
function PaperViewport({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const wrap = wrapRef.current;
    if (!outer || !wrap) return;
    const update = () => {
      const width = outer.clientWidth;
      setScale(width > 0 && width < PAPER_WIDTH ? width / PAPER_WIDTH : 1);
      setContentHeight(wrap.offsetHeight);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="paper-viewport"
      style={scale < 1 && contentHeight ? { height: contentHeight * scale } : undefined}
    >
      <div
        ref={wrapRef}
        className="paper-scale-wrap origin-top-left"
        style={{ transform: `scale(${scale})`, width: PAPER_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}

/** The white paper itself. Theme colors never leak in here except the accent. */
function Paper({ data, qrDataUrl }: PreviewProps & { qrDataUrl: string }) {
  const totals = computeTotals(data);
  const accent = data.accentColor || "var(--accent)";

  return (
    <article
      id="invoice-paper"
      style={{ ["--paper-accent" as string]: accent, minHeight: 794 }} // 794px = 210mm A5 height
      className="hard-shadow bg-paper text-[12px] leading-snug text-[#101216]"
    >
      {data.template === "brutal" && <BrutalTemplate data={data} totals={totals} qrDataUrl={qrDataUrl} />}
      {data.template === "plain" && <PlainTemplate data={data} totals={totals} qrDataUrl={qrDataUrl} />}
      {data.template === "classic" && <ClassicTemplate data={data} totals={totals} qrDataUrl={qrDataUrl} />}
    </article>
  );
}

/* ------------------------------- shared bits ------------------------------ */

interface TemplateProps {
  data: InvoiceData;
  totals: ReturnType<typeof computeTotals>;
  qrDataUrl: string;
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="opacity-60">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value || "—"}</span>
    </div>
  );
}

function TotalsTable({ data, totals, paper }: TemplateProps & { paper: "brutal" | "plain" | "classic" }) {
  const money = (n: number) => formatMoney(n, data.currency);
  const border = paper === "brutal" ? "2px solid var(--paper-accent)" : "1px solid #d8dbe2";
  return (
    <div className="ml-auto w-64">
      <div className="flex justify-between py-1" style={{ borderBottom: border }}>
        <span>Subtotal</span>
        <span className="font-mono">{money(totals.subtotal)}</span>
      </div>
      {data.taxEnabled && (
        <div className="flex justify-between py-1" style={{ borderBottom: border }}>
          <span>
            {data.taxName || "Tax"} · {data.taxRate}%
          </span>
          <span className="font-mono">{money(totals.taxAmount)}</span>
        </div>
      )}
      <div
        className="flex justify-between py-2 text-base font-bold"
        style={{ borderBottom: paper === "brutal" ? "2px solid var(--paper-accent)" : "2px solid #101216" }}
      >
        <span>Total</span>
        <span className="font-mono">{money(totals.total)}</span>
      </div>
      {totals.payables.map((p) => (
        <div key={p.methodId} className="pt-2">
          <div className="flex justify-between font-mono text-[13px]">
            <span className="opacity-60">Payable via {p.label}</span>
            <span>{money(p.payable)}</span>
          </div>
          <div className="text-right text-[11px] opacity-60">includes {p.feePercent}% payment fee</div>
        </div>
      ))}
    </div>
  );
}

function PaymentDetails({ data, totals }: TemplateProps) {
  const money = (n: number) => formatMoney(n, data.currency);
  const active = data.template === "brutal" ? "brutal" : "plain";
  return (
    <section style={active === "brutal" ? { border: "2px solid var(--paper-accent)" } : undefined} className="p-3">
      <h3 className="mb-1 text-[11px] font-bold uppercase tracking-widest">Payment</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
        {data.methods.upi.enabled && data.upiId && (
          <div>
            <div className="font-bold">UPI</div>
            <div className="font-mono">{data.upiId}</div>
          </div>
        )}
        {data.methods.bank.enabled && (data.bankAccountNumber || data.bankName) && (
          <div>
            <div className="font-bold">Bank transfer</div>
            <div>{data.bankAccountName}</div>
            <div>{data.bankName}</div>
            <div className="font-mono">
              {data.bankAccountNumber}
              {data.bankIfsc ? ` · ${data.bankIfsc}` : ""}
            </div>
          </div>
        )}
        {PAYMENT_IDS.filter((id) => id !== "upi" && id !== "bank").map((id) => {
          if (!data.methods[id].enabled) return null;
          const label = { paypal: "PayPal", stripe: "Stripe", razorpay: "Razorpay" }[id] as string;
          const detail = {
            paypal: data.paypalEmail,
            stripe: data.stripeLink,
            razorpay: data.razorpayLink,
          }[id] as string;
          const m = data.methods[id];
          const payable = totals.payables.find((p) => p.methodId === id);
          return (
            <div key={id}>
              <div className="font-bold">{label}</div>
              {detail && <div className="break-all font-mono text-[11px]">{detail}</div>}
              {payable ? (
                <div className="font-mono">
                  {money(payable.payable)}{" "}
                  <span className="font-sans text-[11px] opacity-60">
                    includes {m.feePercent}% payment fee
                  </span>
                </div>
              ) : (
                <div className="opacity-60">Accepted</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PAYMENT_IDS = ["upi", "bank", "paypal", "stripe", "razorpay"] as const;

function NotesAndQr({ data, qrDataUrl }: TemplateProps) {
  if (!data.notes && !qrDataUrl) return null;
  return (
    <section className="mt-4 flex items-start gap-4">
      {qrDataUrl && (
        <Image src={qrDataUrl} alt="Payment QR code" width={96} height={96} unoptimized />
      )}
      {data.notes && <p className="text-[12px] opacity-70">{data.notes}</p>}
    </section>
  );
}

/* -------------------------------- templates ------------------------------- */

function BrutalTemplate(props: TemplateProps) {
  const { data } = props;
  return (
    <div className="p-7">
      <header
        className="mb-6 flex items-start justify-between gap-6 p-4"
        style={{ border: "2px solid var(--paper-accent)", background: "var(--paper-accent)", color: pickContrast(data.accentColor) }}
      >
        <div>
          {data.logoDataUrl && (
            <Image
              src={data.logoDataUrl}
              alt="Business logo"
              width={220}
              height={56}
              unoptimized
              className="mb-2 h-auto max-h-14 w-auto object-contain"
            />
          )}
          <h1 className="text-lg font-extrabold uppercase tracking-wide">{data.businessName || "Your business"}</h1>
          {data.businessAddress && <p className="text-[12px]">{data.businessAddress}</p>}
          {data.businessEmail && <p className="text-[12px]">{data.businessEmail}</p>}
          {data.businessTaxId && <p className="text-[12px] font-mono">{data.businessTaxId}</p>}
        </div>
        <h2 className="text-2xl font-black tracking-tight">INVOICE</h2>
      </header>

      <div className="mb-6 flex flex-wrap justify-between gap-6">
        <div className="min-w-40">
          <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-60">Bill to</h3>
          <p className="font-bold">{data.clientName || "Client name"}</p>
          {data.clientBusinessName && <p>{data.clientBusinessName}</p>}
          {data.clientAddress && <p>{data.clientAddress}</p>}
          {data.clientEmail && <p>{data.clientEmail}</p>}
        </div>
        <div className="min-w-48 font-mono text-[12px]">
          <Line label="Invoice #" value={data.invoiceNumber || "—"} mono />
          <Line label="Issued" value={formatDate(data.issueDate)} mono />
          <Line label="Due" value={formatDate(data.dueDate)} mono />
        </div>
      </div>

      <ItemsTable {...props} variant="brutal" />
      <div className="mt-4">
        <TotalsTable {...props} paper="brutal" />
      </div>
      <div className="mt-6">
        <PaymentDetails {...props} />
      </div>
      <NotesAndQr {...props} />
    </div>
  );
}

function PlainTemplate(props: TemplateProps) {
  const { data } = props;
  return (
    <div className="p-7">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          {data.logoDataUrl && (
            <Image
              src={data.logoDataUrl}
              alt="Business logo"
              width={220}
              height={56}
              unoptimized
              className="mb-2 h-auto max-h-14 w-auto object-contain"
            />
          )}
          <h1 className="text-lg font-extrabold">{data.businessName || "Your business"}</h1>
          {data.businessAddress && <p className="text-[12px] opacity-60">{data.businessAddress}</p>}
          {data.businessEmail && <p className="text-[12px] opacity-60">{data.businessEmail}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">INVOICE</h2>
          <p className="font-mono text-[12px]">{data.invoiceNumber}</p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap justify-between gap-6 text-[12px]">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-60">Bill to</h3>
          <p className="font-bold">{data.clientName || "Client name"}</p>
          {data.clientBusinessName && <p>{data.clientBusinessName}</p>}
          {data.clientAddress && <p className="opacity-70">{data.clientAddress}</p>}
          {data.clientEmail && <p className="opacity-70">{data.clientEmail}</p>}
        </div>
        <div className="font-mono">
          <Line label="Issued" value={formatDate(data.issueDate)} mono />
          <Line label="Due" value={formatDate(data.dueDate)} mono />
        </div>
      </div>

      <ItemsTable {...props} variant="plain" />
      <div className="mt-4">
        <TotalsTable {...props} paper="plain" />
      </div>
      <div className="mt-6">
        <PaymentDetails {...props} />
      </div>
      <NotesAndQr {...props} />
    </div>
  );
}

function ClassicTemplate(props: TemplateProps) {
  const { data } = props;
  return (
    <div className="p-7">
      <header className="mb-6 text-center">
        {data.logoDataUrl && (
          <Image
            src={data.logoDataUrl}
            alt="Business logo"
            width={220}
            height={56}
            unoptimized
            className="mx-auto mb-3 h-auto max-h-16 w-auto object-contain"
          />
        )}
        <h1 className="text-lg font-bold tracking-[0.2em] uppercase">{data.businessName || "Your business"}</h1>
        {(data.businessAddress || data.businessEmail || data.businessTaxId) && (
          <p className="text-[12px] opacity-60">
            {[data.businessAddress, data.businessEmail, data.businessTaxId].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="mx-auto mt-3 h-[3px] w-24" style={{ background: "var(--paper-accent)" }} />
        <h2 className="mt-3 text-sm font-bold uppercase tracking-[0.3em]">Invoice</h2>
      </header>

      <div className="mb-6 flex flex-wrap justify-between gap-6 text-[12px]">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-60">Bill to</h3>
          <p className="font-bold">{data.clientName || "Client name"}</p>
          {data.clientBusinessName && <p>{data.clientBusinessName}</p>}
          {data.clientAddress && <p className="opacity-70">{data.clientAddress}</p>}
          {data.clientEmail && <p className="opacity-70">{data.clientEmail}</p>}
        </div>
        <div className="font-mono">
          <Line label="Invoice #" value={data.invoiceNumber || "—"} mono />
          <Line label="Issued" value={formatDate(data.issueDate)} mono />
          <Line label="Due" value={formatDate(data.dueDate)} mono />
        </div>
      </div>

      <ItemsTable {...props} variant="classic" />
      <div className="mt-4">
        <TotalsTable {...props} paper="classic" />
      </div>
      <div className="mt-6">
        <PaymentDetails {...props} />
      </div>
      <NotesAndQr {...props} />
    </div>
  );
}

function ItemsTable({ data, variant }: TemplateProps & { variant: "brutal" | "plain" | "classic" }) {
  const money = (n: number) => formatMoney(n, data.currency);
  const cell = "py-1.5";
  const head =
    variant === "brutal"
      ? { border: "2px solid var(--paper-accent)", background: "var(--paper-accent)", color: pickContrast(data.accentColor) }
      : { borderBottom: "2px solid #101216" };
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr style={head} className="text-left">
          <th className={`${cell} pr-2 font-bold`}>Description</th>
          <th className={`${cell} pr-2 text-right font-bold`}>Qty</th>
          <th className={`${cell} pr-2 text-right font-bold`}>Rate</th>
          <th className={`${cell} text-right font-bold`}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item) => (
          <tr key={item.id} style={{ borderBottom: variant === "plain" ? "1px solid #e2e4ea" : "1px solid #d8dbe2" }}>
            <td className={`${cell} pr-2`}>{item.description || "—"}</td>
            <td className={`${cell} pr-2 text-right font-mono`}>{item.quantity}</td>
            <td className={`${cell} pr-2 text-right font-mono`}>{money(item.rate)}</td>
            <td className={`${cell} text-right font-mono`}>{money(item.quantity * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** White text on a saturated custom accent, dark ink on a pale one (dark theme accent). */
function pickContrast(customAccent: string): string {
  if (!customAccent) return "var(--accent-contrast)";
  // Rough luminance check on the hex value.
  const hex = customAccent.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#101216" : "#ffffff";
}

/* --------------------------------- wrapper -------------------------------- */

export default function InvoicePreview({ data }: PreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Compute the QR asynchronously so state updates never happen
    // synchronously inside the effect body.
    const compute: () => Promise<string> = async () => {
      if (data.qrDataUrl) return data.qrDataUrl;
      if (
        canGenerateUpiQr({
          currency: data.currency,
          upiEnabled: data.methods.upi.enabled,
          upiId: data.upiId,
          uploadedQr: "",
        })
      ) {
        const totals = computeTotals(data);
        const payableForUpi = totals.payables.find((p) => p.methodId === "upi");
        const amount = payableForUpi ? payableForUpi.payable : totals.total;
        return generateQrDataUrl(
          buildUpiLink({
            upiId: data.upiId.trim(),
            payeeName: data.businessName || "Merchant",
            amount,
            invoiceNumber: data.invoiceNumber || "—",
          }),
        );
      }
      return "";
    };

    compute()
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <PaperViewport>
      <Paper data={data} qrDataUrl={qrDataUrl} />
    </PaperViewport>
  );
}
