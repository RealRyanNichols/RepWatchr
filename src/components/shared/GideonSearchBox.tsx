"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collectGideonInteraction } from "@/lib/gideon-client";

type GideonSearchBoxProps = {
  compact?: boolean;
  defaultQuery?: string;
  placeholder?: string;
};

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

export default function GideonSearchBox({
  compact = false,
  defaultQuery = "",
  placeholder = "Ask Gideon to find a rep, county, city, district, race, vote, or school board...",
}: GideonSearchBoxProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [listening, setListening] = useState(false);
  const router = useRouter();

  function submitSearch(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    collectGideonInteraction({ kind: "search", content: trimmed, metadata: { source: "gideon_search_box" } });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function startVoice() {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setQuery((current) => current || "Voice search is not supported in this browser. Type what you need Gideon to find.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      submitSearch(transcript);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const quickPrompts = [
    "Find my school board",
    "Who represents Harrison County?",
    "Show East Texas red flags",
    "Find county officials near me",
  ];

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        className={`rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-950/5 ${compact ? "p-2" : "p-3"}`}
      >
        <div className="flex gap-2">
          <label htmlFor="gideon-search" className="sr-only">
            Search RepWatchr with Gideon
          </label>
          <input
            id="gideon-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-gray-950 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={startVoice}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-900 transition hover:bg-amber-100"
          >
            {listening ? "Listening" : "Talk"}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
          >
            Search
          </button>
        </div>
      </form>
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt);
                submitSearch(prompt);
              }}
              className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-black text-blue-950 transition hover:border-red-200 hover:text-red-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
