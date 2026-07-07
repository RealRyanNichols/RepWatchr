"use client";

import { useState } from "react";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";
import { buildReferralUrl, REFERRAL_STORAGE_KEY, sanitizeReferralCode } from "@/lib/referral-share-campaigns";

type ReferralLinkButtonProps = {
  path: string;
  sourceContext?: string;
  entityType?: string;
  entityId?: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

function storedReferralCode() {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return "";
  }
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ReferralLinkButton({
  path,
  sourceContext = "public_share",
  entityType,
  entityId,
  label = "Copy referral link",
  copiedLabel = "Referral link copied",
  className = "share-action-button",
}: ReferralLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateAndCopy() {
    setLoading(true);
    const anonymousId = getAnonymousSessionId();
    let code = storedReferralCode();
    let referralUrl = code ? buildReferralUrl(path, code) : "";

    if (!referralUrl) {
      const response = await fetch("/api/referrals/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anonymousId,
          path,
          sourceContext,
          entityType,
          entityId,
        }),
      }).catch(() => null);
      const data = response ? await response.json().catch(() => null) : null;
      code = sanitizeReferralCode(data?.code);
      referralUrl = data?.referralUrl || (code ? buildReferralUrl(path, code) : buildReferralUrl(path, anonymousId.slice(0, 12)));
      try {
        if (code) window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
      } catch {
        // Local storage can be blocked.
      }
      trackRepWatchrEvent("referral_link_created", {
        route: path,
        source_context: sourceContext,
        entity_type: entityType || "",
      });
    }

    const didCopy = await copyText(referralUrl || buildReferralUrl(path, anonymousId.slice(0, 12)));
    setCopied(didCopy);
    setLoading(false);
    trackRepWatchrEvent("referral_link_copied", {
      route: path,
      source_context: sourceContext,
      entity_type: entityType || "",
    });

    if (code) {
      fetch("/api/referrals/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          referralCode: code,
          anonymousId,
          eventType: "referral_link_copied",
          route: path,
          entityType,
          entityId,
          metadata: { source_context: sourceContext },
        }),
        keepalive: true,
      }).catch(() => {
        // Best effort.
      });
    }

    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={generateAndCopy} disabled={loading} className={className}>
      {loading ? "Building link..." : copied ? copiedLabel : label}
    </button>
  );
}
