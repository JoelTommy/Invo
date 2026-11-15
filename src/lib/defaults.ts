import type { InvoiceData, PaymentMethodId, PaymentMethodState } from "./types";
import { STANDARD_FEES } from "./types";
import { todayISO, uid } from "./format";

const METHODS: Record<PaymentMethodId, PaymentMethodState> = {
  upi: { enabled: true, clientPays: false, feePercent: STANDARD_FEES.upi },
  bank: { enabled: true, clientPays: false, feePercent: STANDARD_FEES.bank },
  paypal: { enabled: false, clientPays: true, feePercent: STANDARD_FEES.paypal },
  stripe: { enabled: false, clientPays: true, feePercent: STANDARD_FEES.stripe },
  razorpay: { enabled: false, clientPays: true, feePercent: STANDARD_FEES.razorpay },
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
    paypalEmail: "",
    stripeLink: "",
    razorpayLink: "",
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
