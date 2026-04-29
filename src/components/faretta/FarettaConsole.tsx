"use client";

import { useMemo, useState, type DragEvent } from "react";
import { collectFarettaInteraction } from "@/lib/faretta-client";

type FarettaConsoleProps = {
  initialQuery?: string;
};

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  readable: boolean;
  textPreview?: string;
};

type Message = {
  role: "user" | "faretta";
  content: string;
  attachments?: string[];
};

const farettaModes = [
  {
    id: "find-records",
    label: "Find Records",
    description: "Names, offices, districts, votes, donors, schools, sources.",
  },
  {
    id: "research-path",
    label: "Build Path",
    description: "Turn a concern into the next public-record steps.",
  },
  {
    id: "check-source",
    label: "Check Source",
    description: "Paste a link or upload text and ask what it proves.",
  },
  {
    id: "public-question",
    label: "Draft Question",
    description: "Create a direct public question for a profile or agency.",
  },
  {
    id: "file-review",
    label: "Review Files",
    description: "Attach text files and pull names, dates, gaps, and leads.",
  },
] as const;

type FarettaModeId = (typeof farettaModes)[number]["id"];

const quickPrompts = [
  "Find the profile for my official",
  "Build a scorecard research path",
  "What records are missing here?",
  "Turn this into public questions",
  "Find attorneys or media tied to this issue",
  "Show me what to search next",
];

const textFileExtensions = [".txt", ".md", ".csv", ".json", ".log"];

function buildAnswer(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("file") || text.includes("attached") || text.includes("document")) {
    return "I can use attached text as a lead sheet. The useful output is names, dates, public agencies, claims, source links, missing records, and the next search terms. For PDF or image files, add a short note until full document parsing is wired in.";
  }

  if (text.includes("attorney") || text.includes("law firm") || text.includes("lawyer")) {
    return "Start with the attorney or firm name, county, public case, public client, and any official relationship. RepWatchr should track license source, court footprint, public clients, disciplinary records when public, and correction requests.";
  }

  if (text.includes("media") || text.includes("journalist") || text.includes("reporter") || text.includes("editor")) {
    return "Start with the outlet, person, article, date, and public issue. The clean record is bylines, public sources used, missing source links, corrections, ownership, official relationships, and follow-up questions.";
  }

  if (text.includes("school") || text.includes("board") || text.includes("isd")) {
    return "Start with the district profile. I need the district name, county, and any person or issue you are checking. Then I can point you to board members, source links, public questions, claims, and open research gaps.";
  }

  if (text.includes("county") || text.includes("city") || text.includes("mayor") || text.includes("commissioner")) {
    return "Give me the county or city first. I will narrow it to county judge, sheriff, district attorney, commissioners, mayor, council members, and related school-board records where RepWatchr has them loaded.";
  }

  if (text.includes("race") || text.includes("election") || text.includes("candidate")) {
    return "For a race, I need office, district, county, election date, and candidate names if you have them. The useful output is a race file: candidate profiles, funding, votes, public statements, praise, concerns, and missing records.";
  }

  if (text.includes("evidence") || text.includes("concern") || text.includes("bad") || text.includes("wrong")) {
    return "Keep it source-backed. Give me what happened, who was involved, where it happened, dates, public links, and documents. RepWatchr should separate facts, allegations, missing records, and questions that deserve a public answer.";
  }

  return "I can help search RepWatchr and shape the next question. Start with a name, school, county, city, district, race, issue, vote, donor, source link, attorney, media outlet, or attached text file.";
}

function canPreviewFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return file.type.startsWith("text/") || textFileExtensions.some((extension) => lowerName.endsWith(extension));
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${Math.round((size / (1024 * 1024)) * 10) / 10} MB`;
}

function buildContextBlock(modeLabel: string, attachments: Attachment[], sourceLinks: string[]): string {
  const lines: string[] = [`Mode: ${modeLabel}`];

  if (sourceLinks.length > 0) {
    lines.push("Source links:");
    sourceLinks.forEach((link, index) => lines.push(`${index + 1}. ${link}`));
  }

  if (attachments.length > 0) {
    lines.push("Attached files:");
    attachments.forEach((file, index) => {
      lines.push(
        `${index + 1}. ${file.name} (${formatBytes(file.size)}, ${file.type || "unknown type"})${file.readable ? "" : " - metadata only"}`,
      );
      if (file.textPreview) {
        lines.push(`Preview: ${file.textPreview}`);
      }
    });
  }

  return lines.join("\n");
}

export default function FarettaConsole({ initialQuery = "" }: FarettaConsoleProps) {
  const initialQuestion = initialQuery.trim();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<FarettaModeId>("find-records");
  const [sourceLink, setSourceLink] = useState("");
  const [sourceLinks, setSourceLinks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>(() =>
    initialQuestion
      ? [
          { role: "user", content: initialQuestion },
          { role: "faretta", content: buildAnswer(initialQuestion) },
        ]
      : [
          {
            role: "faretta",
            content:
              "I am Faretta AI inside RepWatchr. Use me as the search and research helper: find profiles, check sources, build public questions, and turn scattered details into a clean next step.",
          },
        ],
  );
  const selectedMode = farettaModes.find((item) => item.id === mode) ?? farettaModes[0];
  const nextAnswer = useMemo(() => buildAnswer(input), [input]);

  async function handleFiles(files: FileList | File[]) {
    const incoming = Array.from(files).slice(0, 8);
    if (incoming.length === 0) return;

    setIsReadingFile(true);
    const nextAttachments = await Promise.all(
      incoming.map(async (file) => {
        const readable = canPreviewFile(file);
        let textPreview: string | undefined;

        if (readable) {
          try {
            const text = await file.text();
            textPreview = text.replace(/\s+/g, " ").trim().slice(0, 1200);
          } catch {
            textPreview = undefined;
          }
        }

        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          readable,
          textPreview,
        };
      }),
    );

    setAttachments((current) => [...current, ...nextAttachments].slice(-8));
    setIsReadingFile(false);
  }

  function addSourceLink() {
    const trimmed = sourceLink.trim();
    if (!trimmed) return;
    setSourceLinks((current) => (current.includes(trimmed) ? current : [...current, trimmed].slice(-8)));
    setSourceLink("");
  }

  async function copyShareLink() {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content;
    const query = input.trim() || initialQuestion || lastUserMessage || "";
    const url = `${window.location.origin}/faretta-ai${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    await navigator.clipboard?.writeText(url);
    setShareStatus("Share link copied.");
    window.setTimeout(() => setShareStatus(""), 1800);
  }

  async function send(nextInput = input, kind: "chat" | "prompt_button" = "chat") {
    const trimmed = nextInput.trim();
    if (!trimmed || isAsking) return;

    const attachmentNames = attachments.map((file) => file.name);
    const contextBlock = buildContextBlock(selectedMode.label, attachments, sourceLinks);
    const apiMessage = [trimmed, contextBlock].filter(Boolean).join("\n\n").slice(0, 4900);
    const visibleHistory = [...messages, { role: "user" as const, content: trimmed, attachments: attachmentNames }];

    setMessages(visibleHistory);
    setIsAsking(true);
    setLiveError(null);
    collectFarettaInteraction({
      kind,
      content: trimmed,
      metadata: {
        source: "faretta_console",
        mode,
        attachmentCount: attachments.length,
        sourceLinkCount: sourceLinks.length,
      },
    });
    setInput("");

    try {
      const response = await fetch("/api/faretta/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: apiMessage,
          history: messages,
          tier: "free",
          userContext: {
            page: "faretta_console",
            mode,
            attachments: attachmentNames,
            sourceLinks,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Faretta AI is not reachable.");
      }

      const body = (await response.json()) as { reply?: string | null; fallback?: boolean };
      const reply = body.reply?.trim() || buildAnswer(apiMessage);
      setMessages((current) => [...current, { role: "faretta", content: reply }]);
      if (body.fallback) {
        setLiveError("Live Faretta AI endpoint is not configured yet. Showing RepWatchr fallback guidance.");
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Faretta AI is not reachable.");
      setMessages((current) => [...current, { role: "faretta", content: buildAnswer(apiMessage) }]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-7 lg:border-b-0 lg:border-r">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">AI Search</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Faretta helps find the record.</h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-300 sm:text-base">
            It is not the main product. It is the helper built into RepWatchr so people can search names, attach notes,
            check links, and figure out what public record should be opened next.
          </p>

          <div className="mt-6 grid gap-2">
            {farettaModes.map((item) => {
              const active = item.id === mode;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-red-300 bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={`mt-1 block text-xs font-semibold leading-5 ${active ? "text-slate-600" : "text-slate-300"}`}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black text-white">What makes it useful</p>
            <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-300">
              <p>Find the right profile faster.</p>
              <p>Turn scattered claims into names, dates, records, and questions.</p>
              <p>Keep every answer tied to sources, gaps, or a next public-record pull.</p>
            </div>
          </div>
        </aside>

        <div className="p-4 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">{selectedMode.label}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Ask in plain English.</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Add a file, paste a source, or ask what to search. Faretta should point back to public records.
                </p>
              </div>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-black text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
              >
                Share Search
              </button>
            </div>
            {shareStatus ? <p className="mt-2 text-xs font-bold text-blue-700">{shareStatus}</p> : null}

            <div
              className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4"
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                void handleFiles(event.dataTransfer.files);
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-950">Add files or source links</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Text, CSV, JSON, and notes are previewed in-browser. PDFs and images are attached as file metadata for now.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-900">
                  {isReadingFile ? "Reading..." : "Add Files"}
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files) void handleFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={sourceLink}
                  onChange={(event) => setSourceLink(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSourceLink();
                    }
                  }}
                  placeholder="Paste a public source link..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addSourceLink}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-50"
                >
                  Add
                </button>
              </div>

              {(attachments.length > 0 || sourceLinks.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-300 hover:bg-red-50"
                      title="Remove file"
                    >
                      {file.name} / {formatBytes(file.size)}
                    </button>
                  ))}
                  {sourceLinks.map((link) => (
                    <button
                      key={link}
                      type="button"
                      onClick={() => setSourceLinks((current) => current.filter((item) => item !== link))}
                      className="max-w-full truncate rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900 hover:border-red-300 hover:bg-red-50"
                      title="Remove link"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "faretta" ? "rounded-2xl bg-slate-100 p-4" : "ml-auto max-w-[92%] rounded-2xl bg-blue-900 p-4 text-white"}
              >
                <p className="text-xs font-black uppercase tracking-wide opacity-70">
                  {message.role === "faretta" ? "Faretta AI" : "You"}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6">{message.content}</p>
                {message.attachments?.length ? (
                  <p className="mt-2 text-xs font-bold opacity-70">Attached: {message.attachments.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="mt-4"
          >
            <label htmlFor="faretta-chat-input" className="sr-only">
              Ask Faretta AI
            </label>
            <textarea
              id="faretta-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              placeholder="Tell Faretta what you are trying to find..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold leading-5 text-slate-500">
                {liveError ? liveError : `Preview: ${nextAnswer.slice(0, 110)}...`}
              </p>
              <button
                type="submit"
                disabled={isAsking}
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAsking ? "Asking..." : "Ask Faretta"}
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setInput(prompt);
                  void send(prompt, "prompt_button");
                }}
                disabled={isAsking}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
