"use client";

import { useState } from "react";

interface CappedListProps {
  items: string[];
  cap?: number;
  emptyText?: string;
}

export default function CappedList({ items, cap = 3, emptyText = "Nothing recorded yet." }: CappedListProps) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) {
    return <p className="text-sm leading-6 text-gray-500">{emptyText}</p>;
  }
  const visible = expanded ? items : items.slice(0, cap);
  const remaining = items.length - visible.length;
  return (
    <div>
      <ul className="space-y-2 text-sm leading-6">
        {visible.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {items.length > cap ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-bold uppercase tracking-wide opacity-80 hover:opacity-100"
        >
          {expanded ? "Show less" : `+${remaining} more`}
        </button>
      ) : null}
    </div>
  );
}
