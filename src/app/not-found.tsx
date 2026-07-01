import Link from "next/link";

const quickLinks = [
  { href: "/search", label: "Search RepWatchr" },
  { href: "/officials", label: "Find an official" },
  { href: "/submit-source", label: "Submit a source" },
  { href: "/free-packet", label: "Build a free packet" },
];

export default function NotFound() {
  return (
    <main className="min-h-[72vh] bg-[#f5f8fc] px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
        <div className="h-2 bg-[linear-gradient(90deg,#b91c1c_0%,#f5d061_35%,#f8fafc_50%,#2563eb_100%)]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Record not found</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            This RepWatchr page is not available.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-700">
            The page may have moved, the record may still need a source, or the link may be incorrect. Use one of the
            next actions below to keep the public record moving.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
