import Link from "next/link";
import Image from "next/image";

// The coverage column is the beat. Research and data work lives in its own
// column so it reads as something this desk also offers, not as the point of
// the site.
const coverageLinks = [
  { href: "/home-district", label: "HD-7 / TX-01" },
  { href: "/news", label: "Stories" },
  { href: "/elections/texas", label: "Texas Races" },
  { href: "/officials", label: "Officials" },
  { href: "/school-boards", label: "School Boards" },
  { href: "/votes", label: "Votes" },
  { href: "/blog", label: "Blog" },
  { href: "/authority-watch", label: "Authority Watch" },
  { href: "/funding", label: "Funding" },
  { href: "/money", label: "Money Trail" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/methodology", label: "Methodology" },
  { href: "/submit-source", label: "Submit Source" },
];

const researchLinks = [
  { href: "/tools/public-records-response", label: "Records Response" },
  { href: "/elections/texas/contribute", label: "Free Packet" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/services", label: "Research Services" },
  { href: "/packages/public-data-api", label: "Data Access" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06172f] text-slate-100">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/images/repwatchr-logo-america-first.png"
              alt="RepWatchr"
              width={1254}
              height={1254}
              sizes="48px"
              className="mb-2 h-12 w-12 rounded-xl bg-white object-contain"
            />
            <h3 className="text-lg font-black text-white">
              RepWatchr
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Know your reps. Put them on the record.
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

          {/* Coverage */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#d6b35a]">
              Coverage
            </h4>
            <ul className="mt-3 space-y-2">
              {coverageLinks.map((link) => (
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

          {/* Research and data */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#d6b35a]">
              Research and Data
            </h4>
            <ul className="mt-3 space-y-2">
              {researchLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
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
              reviewed citizen submissions where labeled. Private details and
              unsourced allegations do not belong on public pages.
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
              href="/submit-source"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Submit Source
            </Link>
            <a
              href="/rss.xml"
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              RSS
            </a>
          </div>
          <p className="text-center text-sm font-semibold text-slate-400">
            &copy; {new Date().getFullYear()} RepWatchr. All rights
            reserved. Published by Ryan Nichols.
          </p>
        </div>
      </div>
    </footer>
  );
}
