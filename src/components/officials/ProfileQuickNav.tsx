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
const dashboardSections = [
  { id: "record", label: "Voting record" },
  { id: "sentiment", label: "Public sentiment" },
  { id: "coverage", label: "Coverage" },
  { id: "sources", label: "Sources" },
  { id: "discussion", label: "Discussion" },
];

export default function ProfileQuickNav({
  hasVerifiedBrief = false,
  storyMode = false,
  dashboardMode = false,
}: {
  hasVerifiedBrief?: boolean;
  storyMode?: boolean;
  dashboardMode?: boolean;
}) {
  const sections = dashboardMode
    ? dashboardSections
    : storyMode
      ? storySections
      : hasVerifiedBrief
        ? verifiedSections
        : coreSections;
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
      className="relative z-30 border-b border-[#cbc4b5] bg-[#f4f1e8]/95 backdrop-blur-sm lg:sticky lg:top-[142px]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-stretch px-2 sm:flex sm:overflow-x-auto sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="mr-5 hidden shrink-0 items-center border-b-2 border-transparent py-3 text-sm font-semibold text-[#615f59] lg:flex">
          Chapters
        </span>
        {sections.map((section, index) => {
          const active = section.id === activeId;
          const hiddenOnSmallDashboard = dashboardMode && index > 2;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? "location" : undefined}
              className={`-mb-px min-h-10 min-w-0 items-center justify-center gap-1 border-b-2 px-1.5 py-2 text-xs font-semibold transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a23a2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1e8] sm:min-h-12 sm:shrink-0 sm:justify-start sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${hiddenOnSmallDashboard ? "hidden sm:inline-flex" : "inline-flex"} ${
                active
                  ? "border-[#a23a2b] text-[#111b24]"
                  : "border-transparent text-[#615f59] hover:border-[#a23a2b]/40 hover:text-[#111b24]"
              }`}
            >
              <span className={`text-[10px] tabular-nums sm:text-xs ${active ? "text-[#a23a2b]" : "text-[#8b867c]"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{section.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
