"use client";

import Link from "next/link";
import ReferralLinkButton from "@/components/referrals/ReferralLinkButton";
import SafeShareTextGenerator from "@/components/referrals/SafeShareTextGenerator";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import type { SafeShareTemplateKind, ShareCampaignType } from "@/lib/referral-share-campaigns";

type ShareCampaignCardProps = {
  title: string;
  description: string;
  campaignType: ShareCampaignType;
  shareKind: SafeShareTemplateKind;
  path: string;
  subject: string;
  topic?: string;
  question?: string;
  ctaLabel?: string;
};

export default function ShareCampaignCard({
  title,
  description,
  campaignType,
  shareKind,
  path,
  subject,
  topic,
  question,
  ctaLabel = "Open record",
}: ShareCampaignCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{campaignType.replaceAll("_", " ")}</p>
      <h3 className="mt-2 text-xl font-black text-blue-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{description}</p>
      <div className="mt-4">
        <SafeShareTextGenerator kind={shareKind} subject={subject} topic={topic} question={question} url={path} compact />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ReferralLinkButton path={path} sourceContext={campaignType} label="Copy referral link" />
        <Link
          href={path}
          onClick={() => trackRepWatchrEvent("share_campaign_clicked", { campaign_type: campaignType, route: path })}
          className="share-primary-link"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
