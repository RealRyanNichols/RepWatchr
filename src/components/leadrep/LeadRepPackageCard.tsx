import Link from "next/link";

export type LeadRepPackageCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  price: string;
  recurring?: string;
  href: string;
  cta: string;
  bullets: string[];
};

export function LeadRepPackageCard({
  eyebrow,
  title,
  body,
  price,
  recurring,
  href,
  cta,
  bullets,
}: LeadRepPackageCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{body}</p>
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-2xl font-black text-blue-950">{price}</p>
        {recurring ? <p className="text-xs font-black uppercase tracking-wide text-blue-700">{recurring}</p> : null}
      </div>
      <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-950 px-4 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
      >
        {cta}
      </Link>
    </article>
  );
}
