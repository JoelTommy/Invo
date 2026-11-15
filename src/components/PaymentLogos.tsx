/**
 * Simplified, self-contained payment-brand marks (inline SVG, no network).
 * Deliberately schematic — swap for official brand assets later if needed.
 */

export function UpiLogo() {
  return (
    <svg viewBox="0 0 48 20" className="h-5 w-auto" role="img" aria-label="UPI">
      <path d="M6 17 L12 3 h2.6 L8.6 17 Z" fill="#F7941E" />
      <path d="M11 17 L17 3 h2.6 L13.6 17 Z" fill="#5A6072" />
      <path d="M16 17 L22 3 h2.6 L18.6 17 Z" fill="#43B02A" />
      <text
        x="26"
        y="15.5"
        fontFamily="inherit"
        fontSize="14"
        fontWeight="800"
        fill="currentColor"
      >
        UPI
      </text>
    </svg>
  );
}

export function BankLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      role="img"
      aria-label="Bank transfer"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M3 9 L12 3 L21 9 Z" />
      <path d="M5 10 v7 M10 10 v7 M14 10 v7 M19 10 v7" />
      <path d="M3 20 h18" />
    </svg>
  );
}

export function PayPalLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-auto" role="img" aria-label="PayPal">
      <path
        d="M9.5 21l.7-4.2H7.4L9.2 4.8h6c2.9 0 4.7 1.6 4.2 4.4-.5 2.9-2.5 4.5-5.5 4.5h-1.8l-.7 4z"
        fill="#009CDE"
      />
      <path
        d="M7.3 19.2l.7-4.2H5.2L7 3h6c2.9 0 4.7 1.6 4.2 4.4-.5 2.9-2.5 4.5-5.5 4.5H9.9l-.7 4z"
        fill="#003087"
      />
    </svg>
  );
}

export function StripeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-label="Stripe">
      <rect x="2" y="2" width="20" height="20" fill="#635BFF" />
      <path
        d="M11.6 9.4c0-.7.6-1 1.4-1 1.2 0 2.8.4 4 1.1V6.1a10 10 0 0 0-4-.8c-3.2 0-5.4 1.7-5.4 4.5 0 4.4 6 3.7 6 5.6 0 .8-.7 1.1-1.6 1.1-1.3 0-3-.6-4.4-1.4v3.4c1.5.6 3 .9 4.4.9 3.3 0 5.6-1.6 5.6-4.5 0-4.7-6.1-3.9-6.1-5.5z"
        fill="#fff"
      />
    </svg>
  );
}

export function RazorpayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-label="Razorpay">
      <rect x="2" y="2" width="20" height="20" fill="#072F49" />
      <path d="M9 19 L13.2 5 h3.4 L14.4 10.4 h3 L9.8 19 Z" fill="#3395FF" />
      <path d="M10.2 19 L14.4 5 h1.6 L12.9 12 h2.6 L11.4 19 Z" fill="#fff" opacity="0.9" />
    </svg>
  );
}
