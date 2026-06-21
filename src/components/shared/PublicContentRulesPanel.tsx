import { PUBLIC_CONTENT_RULES } from "@/lib/trust-safety";

export default function PublicContentRulesPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public content rules</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        RepWatchr keeps the receipt attached and keeps private details out of public pages.
      </p>
      <ul className={`mt-3 grid gap-2 text-sm font-bold leading-5 text-slate-700 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {PUBLIC_CONTENT_RULES.map((rule) => (
          <li key={rule} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            {rule}
          </li>
        ))}
      </ul>
    </section>
  );
}

