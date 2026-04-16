"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { FundingSummary } from "@/types";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

const LABELS: Record<string, string> = {
  individual: "Individual",
  pac: "PAC",
  selfFunded: "Self-Funded",
  smallDollar: "Small Dollar",
  largeDollar: "Large Dollar",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface DonorBreakdownChartProps {
  breakdown: FundingSummary["donorBreakdown"];
}

export default function DonorBreakdownChart({
  breakdown,
}: DonorBreakdownChartProps) {
  const data = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] ?? key,
      value,
    }));

  if (data.length === 0) {
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
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        Donor Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
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
    </div>
  );
}
