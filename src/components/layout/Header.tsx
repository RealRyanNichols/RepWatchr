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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-[#fffaf1]/95 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo / Site Name */}
        <Link href="/" className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:border-red-300">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gray-950 sm:h-14 sm:w-14">
            <img
              src="/images/logo.png"
              alt="RepWatchr"
              className="h-11 w-11 object-contain sm:h-12 sm:w-12"
            />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-black text-gray-950 dark:text-white">RepWatchr</span>
            <span className="block text-[11px] font-black uppercase tracking-wide text-red-700">Social media for politics</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-2 shadow-sm lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-black text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
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
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-3 text-gray-800 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
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
        <nav className="border-t border-gray-200 bg-[#fffaf1] px-4 pb-4 pt-2 lg:hidden dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-black text-gray-800 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/methodology"
              className="rounded-xl px-3 py-3 text-base font-black text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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
