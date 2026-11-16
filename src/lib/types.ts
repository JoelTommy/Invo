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

  // One-timer payment details (a signed-in profile supplies these instead;
  // UPI also has a per-invoice override because VPAs change often)
  upiId: string;
  paypalEmail: string;
  stripeLink: string;
  razorpayLink: string;
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

/** Standard per-app fees. Locked in the UI; may become region-aware later. */
export const STANDARD_FEES: Record<PaymentMethodId, number> = {
  upi: 0,
  bank: 0,
  paypal: 4.4,
  stripe: 2.9,
  razorpay: 2,
};

/** Payment settings a business profile can default per method. */
export interface ProfileMethodState {
  enabled: boolean;
  clientPays: boolean;
}

/** A business profile: fill once, reuse on every invoice. */
export interface BusinessProfile {
  id: string; // UUID: local and cloud ids are the same
  updatedAt: string; // ISO — last-write-wins during cloud sync
  name: string;
  email: string;
  address: string;
  taxId: string;

  logoDataUrl: string;
  upiId: string;
  upiQrDataUrl: string;

  paypalEmail: string;
  stripeLink: string;
  razorpayLink: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;

  methods: Record<PaymentMethodId, ProfileMethodState>;

  currency: Currency;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  template: TemplateId;
  accentColor: string;
  notes: string;
  isDefault: boolean;
}
