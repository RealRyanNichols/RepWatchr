import Link from "next/link";

const quickLinks = [
  { href: "/officials", label: "Officials" },
  { href: "/scorecards", label: "Scorecards" },
  { href: "/votes", label: "Votes" },
  { href: "/funding", label: "Funding" },
  { href: "/school-boards", label: "School Boards" },
  { href: "/red-flags", label: "Red Flags" },
  { href: "/methodology", label: "Methodology" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              RepWatchr
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Watch your reps. Hold them accountable.
            </p>
            <a
              href="https://www.RepWatchr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              www.RepWatchr.com
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Data Sources
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Data sourced from FEC, Texas Ethics Commission, Open States
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} RepWatchr. All rights
            reserved. A product of RealRyanNichols.
          </p>
        </div>
      </div>
    </footer>
  );
}
