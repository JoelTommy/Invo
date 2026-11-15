import QRCode from "qrcode";
import type { Currency } from "./types";

/**
 * Builds a UPI payment link. The amount, currency and invoice number travel
 * in the link so the payer's UPI app pre-fills them.
 */
export function buildUpiLink(opts: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}): string {
  const params = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.payeeName,
    am: opts.amount.toFixed(2),
    cu: "INR",
    tn: `Invoice ${opts.invoiceNumber}`,
  });
  return `upi://pay?${params.toString()}`;
}

/** Renders a UPI link (or any string) into a PNG data URL for the paper. */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 240, errorCorrectionLevel: "M" });
}

/** True when we can generate a UPI QR for this invoice. */
export function canGenerateUpiQr(opts: {
  currency: Currency;
  upiEnabled: boolean;
  upiId: string;
  uploadedQr: string;
}): boolean {
  return (
    opts.currency === "INR" && opts.upiEnabled && opts.upiId.trim() !== "" && !opts.uploadedQr
  );
}
