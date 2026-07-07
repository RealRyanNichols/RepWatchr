"use client";

import { useState } from "react";
import { copyText, downloadTextFile, safeFileName } from "@/components/source-submissions/sourceSubmissionClient";

export default function RecordsResponsePreview({
  packet,
  fileNameSeed = "records-response-packet",
}: {
  packet: string;
  fileNameSeed?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Private packet draft</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Copy the safe summary backup.</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        This packet is for review and follow-up. It is not public proof until a human review clears the source and summary.
      </p>
      <textarea
        readOnly
        value={packet}
        rows={12}
        className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-900"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => setCopied(await copyText(packet))}
          className="primary-button"
        >
          {copied ? "Copied" : "Copy packet"}
        </button>
        <button
          type="button"
          onClick={() => downloadTextFile(`${safeFileName(fileNameSeed)}.txt`, packet)}
          className="secondary-button"
        >
          Download text
        </button>
      </div>
    </div>
  );
}
