"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import SignInModal from "./SignInModal";
import ThemeToggle from "./ThemeToggle";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  signOut,
  subscribeAuth,
} from "@/lib/auth";

const TABS = [
  { href: "/", label: "Create" },
  { href: "/invoices", label: "Invoices" },
  { href: "/profiles", label: "Profiles" },
];

export default function Header() {
  const pathname = usePathname();
  const [signInOpen, setSignInOpen] = useState(false);
  const session = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const email = session?.user?.email ?? null;

  // "Save invoice" on the Create page opens this same modal.
  useEffect(() => {
    const open = () => setSignInOpen(true);
    window.addEventListener("open-signin", open);
    return () => window.removeEventListener("open-signin", open);
  }, []);

  return (
    <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-6 py-5">
      <div>
        <h1 className="text-2xl font-bold leading-none tracking-tight">Invoice maker</h1>
        <p className="mt-1 text-sm text-muted">Fill in the form. Your invoice updates as you type.</p>
      </div>

      <nav className="flex flex-wrap gap-2.5" aria-label="Main">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`btn ${active ? "btn-primary" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-2.5">
        {email ? (
          <>
            <span
              className="border-2 border-ink bg-panel px-2.5 py-1.5 font-mono text-xs"
              title={`Signed in as ${email}`}
            >
              {email}
            </span>
            <button type="button" className="btn" onClick={() => signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setSignInOpen(true)}>
            Sign in
          </button>
        )}
        <ThemeToggle />
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  );
}
