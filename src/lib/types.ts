export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export type TemplateId = "brutal" | "plain" | "classic";

export type PaymentMethodId = "upi" | "bank" | "paypal" | "stripe" | "razorpay";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface PaymentMethodState {
  enabled: boolean;
  /** If true, the invoice shows the amount payable including this method's fee. */
  clientPays: boolean;
  feePercent: number;
}

export interface InvoiceData {
  // Which business this invoice is from. null = guest "One-timer".
  // Real profiles (Stickies, Littles, …) arrive with sign-in in stage 2+.
  profileId: string | null;

  // Business (only editable when the One-timer option is selected; comes
  // from the selected profile otherwise)
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  businessTaxId: string;

  // Client
  clientName: string;
  clientBusinessName: string;
  clientEmail: string;
  clientAddress: string;

  // Invoice
  invoiceNumber: string;
  issueDate: string; // ISO yyyy-mm-dd
  dueDate: string;
  currency: Currency;
  items: LineItem[];

  // Tax
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;

  // Payment options
  methods: Record<PaymentMethodId, PaymentMethodState>;

  // Payment details (live in Custom options; profiles override these in stage 2+)
  upiId: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;

  // Custom options
  logoDataUrl: string;
  qrDataUrl: string;
  template: TemplateId;
  accentColor: string; // "" = use the theme accent
  notes: string;
}

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "bank", label: "Bank transfer" },
  { id: "paypal", label: "PayPal" },
  { id: "stripe", label: "Stripe" },
  { id: "razorpay", label: "Razorpay" },
];

export const CURRENCIES: Currency[] = ["INR", "USD", "EUR", "GBP", "AED"];
