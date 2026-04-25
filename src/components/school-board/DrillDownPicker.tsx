"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import type { PickerGroup, PickerLevel, PickerMember, PickerState } from "@/lib/picker-data";

interface DrillDownPickerProps {
  states: PickerState[];
  initialStateCode?: string;
  initialLevelKey?: string;
}

export default function DrillDownPicker({
  states,
  initialStateCode,
  initialLevelKey = "school-board",
}: DrillDownPickerProps) {
  const router = useRouter();
  const [stateCode, setStateCode] = useState(initialStateCode ?? states[0]?.code ?? "TX");
  const [levelKey, setLevelKey] = useState(initialLevelKey);
  const [groupSlug, setGroupSlug] = useState<string>("");

  const state = useMemo<PickerState | undefined>(() => states.find((s) => s.code === stateCode), [states, stateCode]);
  const level = useMemo<PickerLevel | undefined>(
    () => state?.levels.find((l) => l.key === levelKey) ?? state?.levels[0],
    [state, levelKey]
  );
  const group = useMemo<PickerGroup | undefined>(
    () => level?.groups.find((g) => g.slug === groupSlug),
    [level, groupSlug]
  );

  function changeState(code: string) {
    setStateCode(code);
    setLevelKey("school-board");
    setGroupSlug("");
    track("picker_drilldown", { step: "state", state: code });
  }

  function changeLevel(key: string) {
    setLevelKey(key);
    setGroupSlug("");
    track("picker_drilldown", { step: "level", state: stateCode, level: key });
  }

  function changeGroup(slug: string) {
    setGroupSlug(slug);
    if (slug) {
      track("picker_drilldown", { step: "district", state: stateCode, level: level?.key ?? levelKey, district_slug: slug });
    }
  }

  function openMember(member: PickerMember) {
    track("profile_open", { source: "picker", profile_id: member.id, href: member.href });
    router.push(member.href);
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-100/40">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Find your rep fast</p>
          <h2 className="text-xl font-black text-blue-950 sm:text-2xl">Pick a state, then a level, then your district.</h2>
        </div>
        <p className="text-xs font-semibold text-gray-500">Three taps. No reading required.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SelectField
          label="State"
          value={stateCode}
          onChange={(value) => changeState(value)}
          options={states.map((s) => ({ value: s.code, label: s.name }))}
        />
        <SelectField
          label="Level"
          value={level?.key ?? ""}
          onChange={(value) => changeLevel(value)}
          options={(state?.levels ?? []).map((l) => ({ value: l.key, label: l.label }))}
          disabled={!state}
        />
        <SelectField
          label={level?.key === "school-board" ? "District" : "Jurisdiction"}
          value={groupSlug}
          onChange={(value) => changeGroup(value)}
          options={[
            { value: "", label: level ? `Pick a ${level.key === "school-board" ? "district" : "jurisdiction"}...` : "Unavailable" },
            ...(level?.groups ?? []).map((g) => ({
              value: g.slug,
              label: g.county ? `${g.label} (${g.county}${g.county.toLowerCase().endsWith("county") ? "" : " County"})` : g.label,
            })),
          ]}
          disabled={!level}
        />
      </div>

      {level ? (
        <p className="mt-3 text-xs font-semibold text-gray-500">{level.description}</p>
      ) : null}

      {group ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">{group.members.length} member{group.members.length === 1 ? "" : "s"} loaded</p>
              <h3 className="text-lg font-black text-blue-950">{group.label}</h3>
            </div>
            {group.href ? (
              <Link href={group.href} className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700">
                Open district file &rarr;
              </Link>
            ) : null}
          </div>
          {group.members.length === 0 ? (
            <p className="text-sm text-gray-600">Roster pending. Open the district file for status.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => openMember(member)}
                  className="text-left rounded-lg border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
                >
                  <p className="text-sm font-black text-gray-950">{member.name}</p>
                  {member.subline ? <p className="mt-0.5 text-xs font-semibold text-gray-500">{member.subline}</p> : null}
                  <p className="mt-2 text-xs font-bold text-blue-700">Open profile &rarr;</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-black text-blue-950 outline-none transition focus:border-red-400 focus:bg-white disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
