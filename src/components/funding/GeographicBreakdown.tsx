"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FundingSummary } from "@/types";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

function formatPercent(amount: number): string {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}%`;
}

interface GeographicBreakdownProps {
  breakdown: FundingSummary["geographicBreakdown"];
}

export default function GeographicBreakdown({
  breakdown,
}: GeographicBreakdownProps) {
  const data = [
    { name: "In-District", amount: breakdown.inDistrict },
    { name: "In-State", amount: breakdown.inState },
    { name: "Out-of-State", amount: breakdown.outOfState },
  ];

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        Geographic Breakdown
      </h3>
      <p className="mb-4 text-xs font-medium leading-5 text-gray-500 dark:text-gray-400">
        Percent of coded contribution geography. For statewide senators, in-state is the key constituent geography.
      </p>

      {/* Simple stat bars for mobile */}
      <div className="mb-4 space-y-3 sm:hidden">
        {data.map((item, idx) => {
          const pct = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPercent(item.amount)}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    backgroundColor: COLORS[idx],
                  }}
                />
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Share of coded geography: {pct.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Bar chart for larger screens */}
      <div className="hidden sm:block">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => formatPercent(v)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatPercent(Number(value))}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                fontSize: "0.875rem",
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
