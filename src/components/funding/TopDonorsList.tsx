import type { Donor } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const typeLabels: Record<string, string> = {
  individual: "Individual",
  pac: "PAC",
  corporation: "Org aggregate",
  party: "Party",
};

interface TopDonorsListProps {
  donors: Donor[];
  totalRaised?: number;
}

export default function TopDonorsList({ donors, totalRaised }: TopDonorsListProps) {
  const sorted = [...donors].sort((a, b) => b.totalAmount - a.totalAmount);

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No donor data available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Amount
            </th>
            {totalRaised ? (
              <th
                scope="col"
                className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell dark:text-gray-400"
              >
                Share
              </th>
            ) : null}
            <th
              scope="col"
              className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell dark:text-gray-400"
            >
              Location
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {sorted.map((donor, idx) => (
            <tr
              key={`${donor.name}-${idx}`}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {donor.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {typeLabels[donor.type] ?? donor.type}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(donor.totalAmount)}
              </td>
              {totalRaised ? (
                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 md:table-cell dark:text-gray-400">
                  {((donor.totalAmount / totalRaised) * 100).toFixed(2)}%
                </td>
              ) : null}
              <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 sm:table-cell dark:text-gray-400">
                {[donor.city, donor.state].filter(Boolean).join(", ") || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
