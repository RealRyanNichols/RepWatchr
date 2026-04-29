import type { ContactInfo } from "@/types";

interface OfficialSocialPanelProps {
  officialName: string;
  contactInfo: ContactInfo;
}

const platformLabels: Array<[keyof NonNullable<ContactInfo["socialMedia"]>, string]> = [
  ["x", "X"],
  ["twitter", "X"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
];

type SocialLink = {
  key: keyof NonNullable<ContactInfo["socialMedia"]>;
  label: string;
  href: string;
};

function normalizeUrl(value: string, platform: keyof NonNullable<ContactInfo["socialMedia"]>) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const handle = value.startsWith("@") ? value.slice(1) : value;

  if (platform === "facebook") return `https://www.facebook.com/${handle}`;
  if (platform === "instagram") return `https://www.instagram.com/${handle}`;
  if (platform === "youtube") return handle.startsWith("@") ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/@${handle}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;

  return `https://x.com/${handle}`;
}

export default function OfficialSocialPanel({ officialName, contactInfo }: OfficialSocialPanelProps) {
  const social = contactInfo.socialMedia ?? {};
  const links = platformLabels.reduce<SocialLink[]>((items, [key, label]) => {
    const value = social[key];
    if (!value) return items;
    items.push({ key, label, href: normalizeUrl(value, key) });
    return items;
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">Public statements</p>
      <h2 className="mt-1 text-lg font-black text-slate-950">Social account links</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        RepWatchr links public official accounts when a source is loaded. Live X scanning stays off until API credentials,
        source rules, rate limits, and admin review are configured.
      </p>

      {links.length > 0 ? (
        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <a
              key={`${link.key}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span>{link.label}</span>
              <span className="text-xs uppercase tracking-wide">Open</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">No public social account loaded yet.</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">
            Add an official source for {officialName}&apos;s public X/social account before showing a feed or public statement roll.
          </p>
        </div>
      )}
    </section>
  );
}
