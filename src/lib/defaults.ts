import type { InvoiceData, PaymentMethodId, PaymentMethodState } from "./types";
import { todayISO, uid } from "./format";

const METHODS: Record<PaymentMethodId, PaymentMethodState> = {
  upi: { enabled: true, clientPays: false, feePercent: 0 },
  bank: { enabled: true, clientPays: false, feePercent: 0 },
  paypal: { enabled: false, clientPays: true, feePercent: 4.4 },
  stripe: { enabled: false, clientPays: true, feePercent: 2.9 },
  razorpay: { enabled: false, clientPays: true, feePercent: 2 },
};

/** A blank invoice as it opens: guest mode (One-timer), client box first. */
export function defaultInvoice(): InvoiceData {
  return {
    profileId: null,
    businessName: "",
    businessEmail: "",
    businessAddress: "",
    businessTaxId: "",
    clientName: "",
    clientBusinessName: "",
    clientEmail: "",
    clientAddress: "",
    invoiceNumber: "INV-001",
    issueDate: todayISO(),
    dueDate: todayISO(14),
    currency: "INR",
    items: [{ id: uid(), description: "", quantity: 1, rate: 0 }],
    taxEnabled: false,
    taxName: "GST",
    taxRate: 18,
    methods: { ...METHODS },
    upiId: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    logoDataUrl: "",
    qrDataUrl: "",
    template: "brutal",
    accentColor: "",
    notes: "",
  };
}
