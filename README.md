# Invoice Generator

Make and download a clean invoice in under a minute — no login, no setup.
Login (Google via Supabase) is optional and unlocks saved business profiles
and invoice history.

Built with Next.js (App Router) + Tailwind CSS on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What works now (stage 1)

- Guest invoice page: business (Quick invoice), client, invoice details,
  line items, tax, payment options with per-method fee handling
- Live preview on white "paper" with three templates (Brutal, Plain, Classic)
- UPI QR auto-generated from the UPI ID (INR invoices), or upload your own
- Download PDF (multi-page), print-only-the-invoice stylesheet
- Light/dark theme: follows your system, header toggle, remembered
- Draft auto-saved in your browser

## Roadmap

- Stage 2: business profiles (browser-stored) + Profiles tab
- Stage 3: logos/QRs move out of the form
- Stage 4: Supabase Google login + synced profiles (RLS)
- Stage 5: invoice history (save, search, edit, duplicate, delete)
- Stage 6 (stretch): read-only share links

## Deploy

Push this folder to a GitHub repo and import it at https://vercel.com/new.
No environment variables are needed until stage 4 (Supabase).

## Scripts

```bash
npm run dev     # dev server with Turbopack
npm run build   # production build
npm run lint    # eslint
```
