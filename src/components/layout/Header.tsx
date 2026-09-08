"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/elections/texas", label: "Texas Races" },
  { href: "/officials", label: "Officials" },
  { href: "/school-boards", label: "School Boards" },
  { href: "/votes", label: "Votes" },
  { href: "/blog", label: "Blog" },
  { href: "/services", label: "Services" },
  { href: "/elections/texas/contribute", label: "Free Packet" },
];

const moreLinks = [
  { href: "/elections", label: "All Elections" },
  { href: "/submit-source", label: "Submit Source" },
  { href: "/tools/public-records-response", label: "Records Response" },
  { href: "/authority-watch", label: "Authority Watch" },
  { href: "/public-safety", label: "Public Safety" },
  { href: "/funding", label: "Funding" },
  { href: "/money", label: "Money Trail" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/scorecards", label: "Scorecards" },
  { href: "/issues", label: "Issues" },
  { href: "/news", label: "Story Archive" },
  { href: "/feed", label: "Social Feed" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen && !moreOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setMoreOpen(false);
      if (menuOpen) menuButtonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, moreOpen]);

  function closeMenus() {
    setMenuOpen(false);
    setMoreOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#06172f]/95 shadow-sm backdrop-blur lg:shadow-xl">
      <div className="h-1 w-full lg:h-1.5 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-5 lg:px-8">
        {/* Logo mark */}
        <Link href="/" className="grid shrink-0 place-items-center transition hover:opacity-90" aria-label="RepWatchr home">
          <span className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#d6b35a] bg-blue-950 shadow-lg shadow-black/30 lg:h-16 lg:w-16">
            <Image
              src="/images/repwatchr-logo-america-first.png"
              alt="RepWatchr logo"
              fill
              sizes="64px"
              priority
              className="bg-white object-contain"
            />
          </span>
        </Link>

        {/* Site Name */}
        <Link href="/" className="flex min-w-0 flex-col justify-center text-left leading-none lg:text-center transition hover:opacity-90" aria-label="RepWatchr home">
          <span className="block text-[25px] font-black tracking-tight text-white lg:text-5xl">
            RepWatchr
          </span>
          <span className="mt-1 hidden font-black uppercase leading-tight tracking-wide text-[#d6b35a] lg:block lg:text-base">
            Search. Grade. Source. Share.
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
            ref={menuButtonRef}
            aria-controls="mobile-navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg p-2.5 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d6b35a] lg:hidden"
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
        <nav id="mobile-navigation" aria-label="Main navigation" className="max-h-[calc(100dvh-136px)] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#06172f] px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}
            <p className="mt-2 border-t border-white/10 px-3 pt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#d6b35a]">
              More from RepWatchr
            </p>
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-[#d6b35a]"
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
