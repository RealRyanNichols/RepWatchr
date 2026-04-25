"use client";

import { useState } from "react";
import type { CategoryScore, IssueCategory } from "@/types";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import { calculateLetterGrade, getScoreColor } from "@/lib/scoring";

interface CategoryBreakdownProps {
  categories: Record<string, CategoryScore>;
  issueCategories: IssueCategory[];
}

export default function CategoryBreakdown({
  categories,
  issueCategories,
}: CategoryBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const categoryEntries = Object.entries(categories);

  function getCategoryLabel(key: string): string {
    const match = issueCategories.find((ic) => ic.id === key);
    if (match) return match.name;
    // fallback: convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  return (
    <div className="space-y-3">
      {categoryEntries.map(([key, cat]) => {
        const isOpen = expanded === key;
        const displayGrade = calculateLetterGrade(cat.score);
        const barColor = getScoreColor(cat.score);

        return (
          <div
            key={key}
            className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Category header row */}
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              onClick={() => setExpanded(isOpen ? null : key)}
              aria-expanded={isOpen}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getCategoryLabel(key)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.score}
                    </span>
                    <LetterGradeBadge grade={displayGrade} score={cat.score} size="sm" />
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(cat.score, 2)}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
              <svg
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Expanded vote details */}
            {isOpen && cat.votes.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <ul className="space-y-2">
                  {cat.votes.map((vote) => (
                    <li
                      key={`${vote.billId}-${vote.date}`}
                      className="flex items-start gap-2 text-sm"
                    >
                      {vote.aligned ? (
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {vote.billTitle}
                        </span>
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          &mdash; voted{" "}
                          <span className="font-medium">
                            {vote.officialVote}
                          </span>
                        </span>
                        {vote.explanation && (
                          <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                            {vote.explanation}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
