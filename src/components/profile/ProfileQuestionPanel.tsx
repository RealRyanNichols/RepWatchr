"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type ProfileQuestion = {
  id: string;
  question: string;
  status: string;
  visibility_status: string;
  due_at: string | null;
  created_at: string;
};

export default function ProfileQuestionPanel({
  targetId,
  targetName,
  className = "",
}: {
  targetId: string;
  targetName: string;
  className?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [questions, setQuestions] = useState<ProfileQuestion[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadQuestions() {
      const { data, error } = await supabase
        .from("profile_questions")
        .select("id, question, status, visibility_status, due_at, created_at")
        .eq("target_id", targetId)
        .in("visibility_status", ["sent_to_target", "public"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (!mounted) return;
      if (error) {
        setQuestions([]);
        return;
      }
      setQuestions((data ?? []) as ProfileQuestion[]);
    }

    loadQuestions();

    return () => {
      mounted = false;
    };
  }, [supabase, targetId]);

  if (questions.length === 0) return null;

  return (
    <section className={className}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900">
            <span aria-hidden="true" className="text-lg font-black">?</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-800">
              Accountability questions
            </p>
            <h2 className="mt-1 text-lg font-black text-amber-950">
              Questions pending for {targetName}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/80">
              These questions were sent from the review office. Answers should come through a claimed profile or documented source response before final publication.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {questions.map((item) => (
            <article key={item.id} className="rounded-xl border border-amber-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-900">
                  {item.status.replaceAll("_", " ")}
                </span>
                {item.due_at ? (
                  <span className="text-xs font-bold text-amber-900/70">
                    Due {new Date(item.due_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item.question}</p>
            </article>
          ))}
        </div>
        <Link
          href="/profiles/claim"
          className="mt-4 inline-flex rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Claim profile to answer
        </Link>
      </div>
    </section>
  );
}
