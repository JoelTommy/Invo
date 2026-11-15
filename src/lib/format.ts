import type { Currency, InvoiceData, PaymentMethodId } from "./types";
import { PAYMENT_METHODS } from "./types";

/** Locale per currency; the spec asks for en-IN specifically for INR. */
const CURRENCY_LOCALES: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(amount);
}

export interface Totals {
  subtotal: number;
  taxAmount: number;
  total: number;
  /**
   * For each enabled method where the client pays the fee, the amount the
   * client should send so the business nets `total`:
   * payable = total / (1 - fee%). Never total * (1 + fee%).
   */
  payables: { methodId: PaymentMethodId; label: string; payable: number; feePercent: number }[];
}

export function computeTotals(data: InvoiceData): Totals {
  const subtotal = data.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0,
  );
  const taxAmount = data.taxEnabled ? subtotal * ((Number(data.taxRate) || 0) / 100) : 0;
  const total = subtotal + taxAmount;

  const payables = PAYMENT_METHODS.filter(({ id }) => {
    const m = data.methods[id];
    return m.enabled && m.clientPays && m.feePercent > 0 && m.feePercent < 100;
  }).map(({ id, label }) => {
    const m = data.methods[id];
    const payable = total / (1 - m.feePercent / 100);
    return { methodId: id, label, payable, feePercent: m.feePercent };
  });

  return { subtotal, taxAmount, total, payables };
}

/** "INV-0042" -> "INV-0043" (bumps the trailing number, keeps the prefix). */
export function nextInvoiceNumber(current: string): string {
  const match = current.match(/^(.*?)(\d+)(\s*)$/);
  if (!match) return "INV-001";
  const [, prefix, digits] = match;
  const width = digits.length;
  return `${prefix}${String(Number(digits) + 1).padStart(width, "0")}`;
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
