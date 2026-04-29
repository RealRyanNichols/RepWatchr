"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/officials", label: "Officials" },
  { href: "/school-boards", label: "School Boards" },
  { href: "/attorneys", label: "Attorneys" },
  { href: "/media", label: "Media" },
  { href: "/scorecards", label: "Scorecards" },
  { href: "/votes", label: "Votes" },
  { href: "/funding", label: "Funding" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/news", label: "News" },
  { href: "/faretta-ai", label: "AI Search" },
  { href: "/buildout", label: "Buildout" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#06172f]/95 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 lg:px-8">
        {/* Logo mark */}
        <Link href="/" className="grid shrink-0 place-items-center transition hover:opacity-90" aria-label="RepWatchr home">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#d6b35a] bg-blue-950 shadow-lg shadow-black/30 sm:h-14 sm:w-14 md:h-16 md:w-16">
            <Image
              src="/images/icon.png"
              alt="RepWatchr logo"
              fill
              sizes="64px"
              priority
              className="object-cover"
            />
          </span>
        </Link>

        {/* Site Name */}
        <Link href="/" className="min-w-0 text-center leading-none transition hover:opacity-90" aria-label="RepWatchr home">
          <span className="block text-2xl font-black tracking-normal text-white sm:text-4xl md:text-5xl">
            RepWatchr
          </span>
          <span className="mt-1 block text-[10px] font-black uppercase leading-tight tracking-wide text-[#d6b35a] sm:text-sm md:text-base">
            God. Family. Country. Justice.
          </span>
        </Link>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <UserMenu />
          </div>
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 p-2.5 text-white shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d6b35a] xl:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <svg
                className="h-5 w-5"
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
                className="h-5 w-5"
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

      {/* Desktop Navigation */}
      <nav className="hidden border-t border-white/10 bg-[#0b2a55]/90 px-3 py-1.5 xl:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/8 px-1.5 py-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2 py-1.5 text-[11px] font-black text-slate-100 transition-colors hover:bg-white hover:text-red-700 2xl:px-2.5 2xl:text-[12px]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#06172f] px-4 pb-4 pt-2 xl:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-black text-slate-100 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/methodology"
              className="rounded-xl px-3 py-3 text-base font-black text-slate-300 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
              onClick={() => setMenuOpen(false)}
            >
              Methodology
            </Link>
            <div className="mt-2 border-t border-white/10 pt-2 md:hidden">
              <UserMenu />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
