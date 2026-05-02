"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/officials", label: "Officials" },
  { href: "/school-boards", label: "Schools" },
  { href: "/attorneys", label: "Attorneys" },
  { href: "/media", label: "Media" },
  { href: "/public-safety", label: "Safety" },
  { href: "/news", label: "News" },
];

const moreLinks = [
  { href: "/scorecards", label: "Scorecards" },
  { href: "/votes", label: "Votes" },
  { href: "/funding", label: "Funding" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/buildout", label: "Buildout" },
  { href: "/methodology", label: "Methodology" },
  { href: "/faretta-ai", label: "Faretta AI" },
  { href: "/uap", label: "UAP" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  function closeMenus() {
    setMenuOpen(false);
    setMoreOpen(false);
  }

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
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 p-2.5 text-white shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d6b35a] lg:hidden"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setMoreOpen(false);
            }}
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
      <nav className="hidden border-t border-white/10 bg-[#0b2a55]/90 px-3 py-1.5 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1.5">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs font-black text-slate-100 transition-colors hover:bg-white hover:text-red-700 xl:px-4"
            >
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-xs font-black text-slate-100 transition-colors hover:bg-white hover:text-red-700 xl:px-4"
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              More
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#06172f] p-2 shadow-2xl shadow-black/30" role="menu">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2 text-sm font-black text-slate-100 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
                    onClick={() => setMoreOpen(false)}
                    role="menuitem"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#06172f] px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-black text-slate-100 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}
            <p className="mt-2 border-t border-white/10 px-3 pt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#d6b35a]">
              More records
            </p>
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-black text-slate-300 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2 md:hidden">
              <UserMenu />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
