import type { Metadata } from "next";
import Link from "next/link";
import { getOfficialsByLevel } from "@/lib/data";

export const metadata: Metadata = {
  title: "School Boards",
  description:
    "Track school board members in Texas. Know their political positions, votes on curriculum, budgets, and bonds.",
};

export default function SchoolBoardsPage() {
  const boardMembers = getOfficialsByLevel("school-board");

  // Group by jurisdiction (ISD)
  const isdMap = new Map<string, typeof boardMembers>();
  for (const member of boardMembers) {
    const existing = isdMap.get(member.jurisdiction) ?? [];
    existing.push(member);
    isdMap.set(member.jurisdiction, existing);
  }

  const isds = Array.from(isdMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">School Boards</h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          School board members make decisions that directly affect our children.
          Their political positions should be transparent. Here we track board
          members across Texas ISDs -- their positions on curriculum,
          budgets, bonds, and key votes.
        </p>
      </div>

      {/* Why This Matters */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-amber-900 mb-2">
          Why School Board Transparency Matters
        </h2>
        <p className="text-sm text-amber-800">
          School board members are elected officials who control curriculum
          decisions, school funding, bond elections, and policies that affect
          every child in their district. Too often, their political positions
          are hidden from voters. We believe parents and taxpayers deserve to
          know where these officials stand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isds.map(([isdName, members]) => {
          return (
            <div
              key={isdName}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{isdName}</h3>
                <span className="text-sm text-gray-500">
                  {members.length} members
                </span>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/officials/${member.id}`}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.position}
                      </p>
                    </div>
                    <span className="text-xs text-blue-600">View →</span>
                  </Link>
                ))}
              </div>
              {members[0]?.campaignPromises &&
                members[0].campaignPromises.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Sample Positions:
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {members[0].campaignPromises.slice(0, 2).join("; ")}
                    </p>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {isds.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">
            School board data is being collected. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
