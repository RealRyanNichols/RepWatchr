"use client";

import { useState } from "react";
import FeedbackCluster from "@/components/civic/FeedbackCluster";
import { trackEvent } from "@/lib/analytics-client";
import { publicQuestionFeedbackOptions } from "@/lib/civic-actions";

type PublicQuestionCardProps = {
  officialId: string;
  officialName: string;
  profilePath: string;
  question: string;
  context: string;
  label?: string;
};

export default function PublicQuestionCard({
  officialId,
  officialName,
  profilePath,
  question,
  context,
  label = "Ask this public question",
}: PublicQuestionCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyQuestion() {
    await navigator.clipboard.writeText(question);
    setCopied(true);
    void trackEvent("public_question_copied", {
      official_id: officialId,
      official_name: officialName,
      question,
      context,
    }, { route: profilePath });
    setTimeout(() => setCopied(false), 1700);
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">
            {label}
          </p>
          <p className="mt-2 text-base font-black leading-7 text-slate-950">
            {question}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {context}
          </p>
        </div>
        <button
          type="button"
          onClick={copyQuestion}
          className="shrink-0 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-4">
        <FeedbackCluster
          entityType="public_question"
          entityId={`${officialId}:${question.slice(0, 80)}`}
          route={profilePath}
          title="Question feedback"
          description="Help rank which public questions are worth asking."
          options={publicQuestionFeedbackOptions}
          compact
        />
      </div>
    </article>
  );
}
