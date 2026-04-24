"use client";

import { useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/officials", label: "Officials" },
  { href: "/scorecards", label: "Scorecards" },
  { href: "/votes", label: "Votes" },
  { href: "/funding", label: "Funding" },
  { href: "/school-boards", label: "School Boards" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/news", label: "News" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-900/10 bg-white/95 shadow-sm backdrop-blur">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo / Site Name */}
        <Link href="/" className="flex shrink-0 items-center gap-3 py-1 transition hover:opacity-90">
          <span className="grid h-14 w-14 place-items-center overflow-hidden sm:h-16 sm:w-16">
            <img
              src="/images/logo.png"
              alt="RepWatchr"
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-xl font-black text-blue-950">RepWatchr</span>
            <span className="block text-[11px] font-black uppercase tracking-wide text-red-700">Texas. Faith. Family. Country.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-blue-100 bg-blue-50/80 px-2 py-2 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-black text-blue-950 transition-colors hover:bg-white hover:text-red-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <UserMenu />
          </div>
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-950 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="border-t border-blue-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-black text-blue-950 transition-colors hover:bg-red-50 hover:text-red-700"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/methodology"
              className="rounded-xl px-3 py-3 text-base font-black text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-950"
              onClick={() => setMenuOpen(false)}
            >
              Methodology
            </Link>
            <div className="mt-2 border-t border-gray-200 pt-2 md:hidden">
              <UserMenu />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
