"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { FundingSummary } from "@/types";

const COLORS = ["#2563eb", "#dc2626", "#7c3aed", "#64748b"];

const LABELS: Record<string, string> = {
  individual: "Individual",
  pac: "PAC / committee",
  selfFunded: "Self-Funded",
  smallDollar: "Small Dollar",
  largeDollar: "Large Dollar",
};

interface DonorBreakdownChartProps {
  breakdown: FundingSummary["donorBreakdown"];
}

export default function DonorBreakdownChart({
  breakdown,
}: DonorBreakdownChartProps) {
  const sourceKnown = breakdown.individual + breakdown.pac + breakdown.selfFunded;
  const sourceData = [
    { name: LABELS.individual, value: breakdown.individual },
    { name: LABELS.pac, value: breakdown.pac },
    { name: LABELS.selfFunded, value: breakdown.selfFunded },
    { name: "Other / uncoded", value: Math.max(0, 100 - sourceKnown) },
  ].filter((item) => item.value > 0);
  const sizeData = [
    { name: LABELS.smallDollar, value: breakdown.smallDollar, color: "#059669" },
    { name: LABELS.largeDollar, value: breakdown.largeDollar, color: "#d97706" },
  ];

  if (sourceData.length === 0 && sizeData.every((item) => item.value === 0)) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No donor breakdown data available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Donor Breakdown
        </h3>
        <p className="mt-1 text-xs font-medium leading-5 text-gray-500 dark:text-gray-400">
          Source type and donor-size are separate cuts. They are not stacked into one fake 100% pie.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
            >
              {sourceData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${Number(value)}%`}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                fontSize: "0.875rem",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Source type
            </p>
            <div className="mt-2 space-y-2">
              {sourceData.map((item, index) => (
                <BreakdownBar
                  key={item.name}
                  label={item.name}
                  value={item.value}
                  color={COLORS[index % COLORS.length]}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Donor size
            </p>
            <div className="mt-2 space-y-2">
              {sizeData.map((item) => (
                <BreakdownBar
                  key={item.name}
                  label={item.name}
                  value={item.value}
                  color={item.color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
