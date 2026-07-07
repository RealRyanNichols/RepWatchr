"use client";

import { useEffect, useState } from "react";
import ReferralLinkButton from "@/components/referrals/ReferralLinkButton";
import SafeShareTextGenerator from "@/components/referrals/SafeShareTextGenerator";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import {
  safeSharePrimaryPrompt,
  safeShareSecondaryPrompt,
  type SafeShareTemplateKind,
} from "@/lib/referral-share-campaigns";

type SharePromptModalProps = {
  moment: string;
  path: string;
  subject: string;
  kind?: SafeShareTemplateKind;
  topic?: string;
  question?: string;
  entityType?: string;
  entityId?: string;
  className?: string;
};

export default function SharePromptModal({
  moment,
  path,
  subject,
  kind = "profile",
  topic,
  question,
  entityType,
  entityId,
  className = "",
}: SharePromptModalProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    trackRepWatchrEvent("share_campaign_viewed", {
      moment,
      route: path,
      share_kind: kind,
      entity_type: entityType || "",
    });
  }, [entityType, kind, moment, path]);

  if (dismissed) return null;

  return (
    <section className={`rounded-xl border border-blue-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">Share moment</p>
          <h2 className="mt-1 text-xl font-black text-blue-950">{safeSharePrimaryPrompt()}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{safeShareSecondaryPrompt()}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 hover:border-red-300 hover:text-red-700"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <SafeShareTextGenerator kind={kind} subject={subject} topic={topic} question={question} url={path} compact />
        <ReferralLinkButton
          path={path}
          sourceContext={moment}
          entityType={entityType}
          entityId={entityId}
          label="Copy referral link"
          className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        />
      </div>
    </section>
  );
}
