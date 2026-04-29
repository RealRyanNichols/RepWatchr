import Link from "next/link";
import Image from "next/image";

const quickLinks = [
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
  { href: "/methodology", label: "Methodology" },
  { href: "/feedback", label: "Report Incorrect Info" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06172f] text-slate-100">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Image
              src="/images/logo.png"
              alt="RepWatchr"
              width={220}
              height={60}
              className="mb-2 h-10 w-auto"
            />
            <h3 className="text-lg font-black text-white">
              RepWatchr
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Watch your reps. Hold them accountable.
            </p>
            <a
              href="https://www.RepWatchr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-black text-[#d6b35a] hover:text-white"
            >
              www.RepWatchr.com
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#d6b35a]">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#d6b35a]">
              Data Sources
            </h4>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-300">
              Data sourced from public records, official government sites,
              election sources, FEC, Texas Ethics Commission, Open States, and
              reviewed submissions where labeled.
            </p>
          </div>
        </div>

        {/* Legal + Copyright */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
            <Link
              href="/feedback"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Report an Issue
            </Link>
          </div>
          <p className="text-center text-sm font-semibold text-slate-400">
            &copy; {new Date().getFullYear()} RepWatchr. All rights
            reserved. A product of RealRyanNichols.
          </p>
        </div>
      </div>
    </footer>
  );
}
