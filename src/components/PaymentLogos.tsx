/**
 * Payment-brand marks (inline SVG, paths from the approved design ref).
 */

export function UpiLogo() {
  return (
    <svg viewBox="0 0 56 24" role="img" aria-label="UPI">
      <path fill="#F58220" d="M44 3h5l-6 18h-5z" />
      <path fill="#097939" d="M50 3h5l-6 18h-5z" />
      <text
        x="0"
        y="19"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="18"
        fill="#3D3D3D"
      >
        UPI
      </text>
    </svg>
  );
}

export function BankLogo() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Bank transfer">
      <path
        fill="#1F2937"
        d="M12 2 2 7v2h20V7L12 2zM4 11v7h3v-7H4zm6.5 0v7h3v-7h-3zM17 11v7h3v-7h-3zM2 20v2h20v-2H2z"
      />
    </svg>
  );
}

export function PayPalLogo() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="PayPal">
      <path
        fill="#003087"
        d="M7.016 19.198h-4.2a.562.562 0 0 1-.555-.65L5.093.584A.692.692 0 0 1 5.776 0h7.222c3.417 0 5.904 2.488 5.846 5.5-.006.25-.027.5-.066.747A6.794 6.794 0 0 1 12.071 12H8.743a.69.69 0 0 0-.682.583l-.325 2.056-.013.083-.692 4.39-.015.087zM19.79 6.142c-.01.087-.01.175-.023.261a7.76 7.76 0 0 1-7.695 6.598H9.007l-.283 1.795-.013.083-.692 4.39-.134.843-.014.088H6.86l-.497 3.15a.562.562 0 0 0 .555.65h3.612c.34 0 .63-.249.683-.585l.952-6.031a.692.692 0 0 1 .683-.584h2.126a6.793 6.793 0 0 0 6.707-5.752c.306-1.95-.466-3.744-1.89-4.906z"
      />
    </svg>
  );
}

export function StripeLogo() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Stripe">
      <path
        fill="#635BFF"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
      />
    </svg>
  );
}

export function RazorpayLogo() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Razorpay">
      <path
        fill="#0C2451"
        d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24zM14.26 10.098L3.389 17.166 1.564 24h9.008l3.688-13.902Z"
      />
    </svg>
  );
}
