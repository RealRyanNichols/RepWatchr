"use client";

import { useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { attorneyBuildoutQuestions } from "@/data/attorney-buildout";
import { collectFarettaInteraction } from "@/lib/faretta-client";

const focusButtons = [
  "license status first",
  "disciplinary history first",
  "court footprint first",
  "government-client ties",
  "client-file and withdrawal issues",
  "reviews and public sentiment",
];

export default function AttorneyLearningQuestions() {
  const [selectedQuestion, setSelectedQuestion] = useState<string>(attorneyBuildoutQuestions[0].id);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const question = attorneyBuildoutQuestions.find((item) => item.id === selectedQuestion) ?? attorneyBuildoutQuestions[0];

  function recordLearning(content: string, source: string) {
    collectFarettaInteraction({
      kind: "research_note",
      content,
      metadata: {
        source: "attorney_learning_questions",
        questionId: question.id,
        question: question.question,
        responseSource: source,
      },
    });
    track("attorney_learning_feedback", {
      question_id: question.id,
      source,
    });
    setStatus("Recorded for the attorney-watch learning loop.");
    window.setTimeout(() => setStatus(""), 2200);
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) return;

    recordLearning(`Attorney-watch model feedback\nQuestion: ${question.question}\nAnswer: ${trimmed}`, "freeform");
    setAnswer("");
  }

  return (
    <section id="teach-model" className="mt-8 scroll-mt-28 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#1d4ed8_0%,#1d4ed8_42%,#d6b35a_42%,#d6b35a_58%,#b42318_58%,#b42318_100%)]" />
      <div className="grid gap-5 p-5 lg:grid-cols-[0.86fr_1.14fr] lg:p-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Teach the attorney model</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Ask better intake questions as the attorney map grows.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            These prompts collect structured research preferences through the existing Faretta interaction table. They should guide future attorney intake without publishing private facts or unsupported accusations.
          </p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-950">
            Do not paste private client data, sealed records, minor information, or confidential case material here. Keep answers about source priority, public records, and profile standards.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Question to answer</span>
            <select
              value={selectedQuestion}
              onChange={(event) => setSelectedQuestion(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {attorneyBuildoutQuestions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.question}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => recordLearning(`Attorney-watch model feedback\nQuestion: ${question.question}\nAnswer: ${option}`, "option")}
                className="rounded-xl border border-white bg-white px-3 py-3 text-left text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Fast priority signals</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {focusButtons.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => recordLearning(`Attorney-watch priority signal: ${item}`, "priority_button")}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submitAnswer} className="mt-4 grid gap-3">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Example: Start Texas profiles with license status, then public discipline, then court/cause number, then firm and public-client connections."
              className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-slate-500">{status || "Answers are stored as research notes, not public profile findings."}</p>
              <button className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700">
                Save answer
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
