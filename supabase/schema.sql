-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Tables for synced business profiles and (stage 5) invoice history.
-- Every row carries user_id and Row Level Security locks each user to
-- their own rows. Profile/logo files go in a private storage bucket.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,                -- full profile snapshot (name, UPI, bank, defaults)
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_user_idx on public.businesses (user_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  invoice_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  total numeric(14, 2) not null default 0,
  currency text not null default 'INR',
  data jsonb not null,                -- full invoice snapshot (items, tax, fees)
  share_slug text unique,             -- stage 6: optional read-only share link
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices (user_id);

-- Row Level Security: users can only read and write their own rows.
alter table public.businesses enable row level security;
alter table public.invoices enable row level security;

create policy "own rows: businesses"
  on public.businesses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own rows: invoices"
  on public.invoices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private storage bucket for logos and QR images, scoped per user.
insert into storage.buckets (id, name, public)
values ('profile-assets', 'profile-assets', false)
on conflict (id) do nothing;

create policy "own files: profile-assets"
  on storage.objects
  for all
  using (bucket_id = 'profile-assets' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'profile-assets' and auth.uid()::text = (storage.foldername(name))[1]);
