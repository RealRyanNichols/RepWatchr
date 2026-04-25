interface QuickFact {
  label: string;
  value?: string | null;
}

interface QuickFactsProps {
  facts: QuickFact[];
}

export default function QuickFacts({ facts }: QuickFactsProps) {
  const visible = facts.filter((fact) => {
    if (!fact.value) return false;
    const v = String(fact.value).trim();
    if (!v) return false;
    if (v.includes("REQUIRES_FURTHER_EVIDENCE")) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((fact) => (
        <span
          key={`${fact.label}-${fact.value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <span className="text-gray-400">{fact.label}</span>
          <span className="text-gray-900">{fact.value}</span>
        </span>
      ))}
    </div>
  );
}
