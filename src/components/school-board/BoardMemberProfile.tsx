import Image from "next/image";
import type { Official } from "@/types";

interface BoardMemberProfileProps {
  member: Official;
}

export default function BoardMemberProfile({
  member,
}: BoardMemberProfileProps) {
  const termStart = new Date(member.termStart).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const termEnd = new Date(member.termEnd).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      {/* Name and position */}
      <div className="flex items-start gap-4">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            width={128}
            height={128}
            quality={96}
            className="h-20 w-20 shrink-0 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {member.firstName.charAt(0)}
            {member.lastName.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {member.position}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Term: {termStart} &ndash; {termEnd}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      {(member.contactInfo.email ||
        member.contactInfo.phone ||
        member.contactInfo.office) && (
        <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Contact
          </h4>
          {member.contactInfo.email && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Email:</span>{" "}
              <a
                href={`mailto:${member.contactInfo.email}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {member.contactInfo.email}
              </a>
            </p>
          )}
          {member.contactInfo.phone && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Phone:</span>{" "}
              <a
                href={`tel:${member.contactInfo.phone}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {member.contactInfo.phone}
              </a>
            </p>
          )}
          {member.contactInfo.office && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Office:</span>{" "}
              {member.contactInfo.office}
            </p>
          )}
          {member.contactInfo.website && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Website:</span>{" "}
              <a
                href={member.contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {member.contactInfo.website}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Campaign Promises / Positions */}
      {member.campaignPromises && member.campaignPromises.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Campaign Positions
          </h4>
          <ul className="mt-2 space-y-1">
            {member.campaignPromises.map((promise, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {promise}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
