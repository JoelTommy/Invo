"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { InvoiceData, PaymentMethodId } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { computeTotals, formatDate, formatMoney } from "@/lib/format";
import { buildUpiLink, canGenerateUpiQr, generateQrDataUrl } from "@/lib/upi";
import { BankLogo, PayPalLogo, RazorpayLogo, StripeLogo, UpiLogo } from "./PaymentLogos";

const PAPER_WIDTH = 559; // A5 width at 96dpi = 148mm

const METHOD_LOGOS: Record<PaymentMethodId, React.ReactNode> = {
  upi: <UpiLogo />,
  bank: <BankLogo />,
  paypal: <PayPalLogo />,
  stripe: <StripeLogo />,
  razorpay: <RazorpayLogo />,
};

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

/** Per-method detail lines on the paper. */
function DetailLines({ data, id }: { data: InvoiceData; id: PaymentMethodId }) {
  switch (id) {
    case "upi":
      return data.upiId ? (
        <div>
          UPI: <b>{data.upiId}</b>
        </div>
      ) : null;
    case "bank":
      return (
        <>
          {data.bankAccountName && (
            <div>
              Account name: <b>{data.bankAccountName}</b>
            </div>
          )}
          {data.bankName && (
            <div>
              Bank: <b>{data.bankName}</b>
            </div>
          )}
          {data.bankAccountNumber && (
            <div>
              Account number: <b>{data.bankAccountNumber}</b>
            </div>
          )}
          {data.bankIfsc && (
            <div>
              IFSC / SWIFT: <b>{data.bankIfsc}</b>
            </div>
          )}
        </>
      );
    case "paypal":
      return data.paypalEmail ? (
        <div>
          Email: <b>{data.paypalEmail}</b>
        </div>
      ) : null;
    case "stripe":
      return data.stripeLink ? (
        <div>
          Link: <b>{data.stripeLink}</b>
        </div>
      ) : null;
    case "razorpay":
      return data.razorpayLink ? (
        <div>
          Link: <b>{data.razorpayLink}</b>
        </div>
      ) : null;
  }
}

/** The white paper itself — one unified structure, templates are CSS classes.
 *  Theme colors never leak in; the accent defaults to the light accent. */
function Paper({ data, qrDataUrl }: { data: InvoiceData; qrDataUrl: string }) {
  const totals = computeTotals(data);
  const money = (n: number) => formatMoney(n, data.currency);
  const accent = data.accentColor || "#3347ff";
  const enabledMethods = PAYMENT_METHODS.filter(({ id }) => data.methods[id].enabled);

  return (
    <article
      id="invoice-paper"
      className={`paper paper-${data.template}`}
      style={{ ["--paper-ac" as string]: accent }} // sheet size locked by .paper CSS (one A5 page)
    >
      <div className="h">
        <div>
          {data.logoDataUrl && (
            <Image
              src={data.logoDataUrl}
              alt="Business logo"
              width={160}
              height={56}
              unoptimized
              className="lg"
            />
          )}
          <b>{data.businessName || "Your business"}</b>
          {data.businessEmail && <small>{data.businessEmail}</small>}
          {data.businessAddress && <small>{data.businessAddress}</small>}
          {data.businessTaxId && <small>Tax ID: {data.businessTaxId}</small>}
        </div>
        <div>
          <div className="ti">INVOICE</div>
          <div className="no">#{data.invoiceNumber || "—"}</div>
        </div>
      </div>

      <div className="g">
        <div>
          <small>Billed to</small>
          <b>{data.clientName || "Client name"}</b>
          {data.clientBusinessName && <small>{data.clientBusinessName}</small>}
          {data.clientEmail && <small>{data.clientEmail}</small>}
          {data.clientAddress && <small>{data.clientAddress}</small>}
        </div>
        <div>
          <small>Issued</small>
          {formatDate(data.issueDate)}
          <small style={{ marginTop: 6 }}>Due</small>
          {formatDate(data.dueDate)}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th className="n">Qty</th>
            <th className="n">Rate</th>
            <th className="n">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>{item.description || "—"}</td>
              <td className="n">{item.quantity}</td>
              <td className="n">{money(item.rate)}</td>
              <td className="n">{money(item.quantity * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tot">
        <div>
          <span>Subtotal</span>
          <span className="n">{money(totals.subtotal)}</span>
        </div>
        {data.taxEnabled && (
          <div>
            <span>
              {data.taxName || "Tax"} ({data.taxRate}%)
            </span>
            <span className="n">{money(totals.taxAmount)}</span>
          </div>
        )}
        <div className="gt">
          <span>Total due</span>
          <span className="n">{money(totals.total)}</span>
        </div>
      </div>

      {enabledMethods.length > 0 && (
        <div className="pay">
          <h4>How to pay</h4>
          {enabledMethods.map(({ id, label }) => {
            const m = data.methods[id];
            const payable = totals.payables.find((p) => p.methodId === id);
            return (
              <div className="pm2" key={id}>
                <div>
                  <span className="logo-row">
                    {METHOD_LOGOS[id]}
                    <b>{label}</b>
                  </span>
                  <DetailLines data={data} id={id} />
                  {payable && (
                    <div>
                      Amount via {label}: <b>{money(payable.payable)}</b>{" "}
                      <small>
                        includes {m.feePercent}% payment fee (
                        {money(payable.payable - totals.total)})
                      </small>
                    </div>
                  )}
                </div>
                {id === "upi" && qrDataUrl && (
                  <Image
                    src={qrDataUrl}
                    alt="UPI QR code"
                    width={76}
                    height={76}
                    unoptimized
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {data.notes && <p className="pnotes">{data.notes}</p>}
    </article>
  );
}

/* --------------------------------- wrapper -------------------------------- */

export default function InvoicePreview({ data }: { data: InvoiceData }) {
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
