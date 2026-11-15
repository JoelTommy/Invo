"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const TABS = [
  { href: "/", label: "Create" },
  { href: "/invoices", label: "Invoices" },
  { href: "/profiles", label: "Profiles" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="no-print border-b-2 border-ink bg-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Invo<span className="text-accent">.</span>
        </Link>

        <nav className="flex gap-1" aria-label="Main">
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`border-2 px-3 py-1 text-sm font-semibold ${
                  active
                    ? "border-ink bg-accent text-accent-contrast"
                    : "border-transparent hover:border-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
