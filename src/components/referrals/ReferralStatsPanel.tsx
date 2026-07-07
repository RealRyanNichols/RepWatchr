type ReferralStatsPanelProps = {
  stats: {
    referralCodes: number;
    referralEvents: number;
    visits: number;
    conversions: number;
    activeCampaigns: number;
    activeAssets: number;
  };
};

export default function ReferralStatsPanel({ stats }: ReferralStatsPanelProps) {
  const items = [
    ["Referral codes", stats.referralCodes],
    ["Referral events", stats.referralEvents],
    ["Referral visits", stats.visits],
    ["Conversions", stats.conversions],
    ["Active campaigns", stats.activeCampaigns],
    ["Active assets", stats.activeAssets],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
