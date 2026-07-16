"use client";

import { useEffect, useState } from "react";

const coreSections = [
  { id: "snapshot", label: "60-second brief" },
  { id: "record", label: "Voting record" },
  { id: "money", label: "Money trail" },
  { id: "sources", label: "Source room" },
  { id: "participate", label: "Have your say" },
];
const verifiedSections = [{ id: "verified-brief", label: "2026 verified brief" }, ...coreSections];
const storySections = [
  { id: "snapshot", label: "Start here" },
  { id: "identity", label: "Who he is" },
  { id: "balanced-record", label: "Good + concerns" },
  { id: "record", label: "Turning points" },
  { id: "score", label: "Grade" },
  { id: "participate", label: "Community" },
  { id: "sources", label: "Sources" },
];

export default function ProfileQuickNav({
  hasVerifiedBrief = false,
  storyMode = false,
}: {
  hasVerifiedBrief?: boolean;
  storyMode?: boolean;
}) {
  const sections = storyMode ? storySections : hasVerifiedBrief ? verifiedSections : coreSections;
  const [activeId, setActiveId] = useState(sections[0].id);

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((target): target is HTMLElement => Boolean(target));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-24% 0px -64%", threshold: [0, 0.12, 0.35] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="mr-2 hidden shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 md:inline">
          Jump to
        </span>
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? "location" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition sm:text-sm ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
