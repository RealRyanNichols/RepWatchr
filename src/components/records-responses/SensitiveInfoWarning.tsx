"use client";

import {
  detectRecordsResponseSensitivity,
  responseStatusLabel,
  type RecordsSensitiveFlag,
} from "@/lib/records-response-intake";

const flagDescriptions: Record<RecordsSensitiveFlag, string> = {
  private_address: "Possible private address",
  minor_child: "Possible minor or student detail",
  medical_info: "Possible medical information",
  social_security: "Possible Social Security number",
  bank_info: "Possible bank or card information",
  phone_email_private: "Possible private phone or email",
  family_info: "Possible family detail",
  irrelevant_private_info: "Possible irrelevant private information",
  sealed_or_restricted_warning: "Possible sealed, restricted, or confidential record",
  violent_threat: "Possible threat or unsafe language",
  defamation_risk: "Possible risky accusation wording",
};

export function getSensitiveInfoWarnings(text: string) {
  return detectRecordsResponseSensitivity(text);
}

export default function SensitiveInfoWarning({ text, flags }: { text?: string; flags?: RecordsSensitiveFlag[] }) {
  const detected = flags ?? detectRecordsResponseSensitivity(text ?? "");
  if (!detected.length) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">
        Basic scan found no obvious private-data pattern. Human review is still required before public display.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-black uppercase tracking-wide text-red-800">Sensitive review required</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-red-950">
        These flags do not prove the document is unsafe. They mean the record needs private admin review before any public summary.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {detected.map((flag) => (
          <span key={flag} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-red-800">
            {flagDescriptions[flag] ?? responseStatusLabel(flag)}
          </span>
        ))}
      </div>
    </div>
  );
}
