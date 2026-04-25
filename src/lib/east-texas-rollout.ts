import type { GovernmentLevel, Official } from "@/types";

export const activeCountyRollout = [
  "Harrison",
  "Marion",
  "Upshur",
  "Gregg",
  "Panola",
  "Morris",
  "Cass",
  "Smith",
] as const;

export type ActiveCounty = (typeof activeCountyRollout)[number];

const activeCountySet = new Set<string>(activeCountyRollout);

export const countyOfficeTargets: Record<
  ActiveCounty,
  {
    seat: string;
    priority: string[];
    nextRecords: string[];
  }
> = {
  Harrison: {
    seat: "Marshall",
    priority: ["County court", "Marshall city offices", "Harleton, Hallsville, Marshall, Waskom, Elysian Fields school boards"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Marion: {
    seat: "Jefferson",
    priority: ["County court", "Jefferson city offices", "Jefferson ISD"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Upshur: {
    seat: "Gilmer",
    priority: ["County court", "Gilmer city offices", "Gilmer, Ore City, Union Grove, Big Sandy school boards"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Gregg: {
    seat: "Longview",
    priority: ["County court", "Longview/Kilgore/Gladewater/White Oak city offices", "Longview, Pine Tree, Spring Hill, Kilgore school boards"],
    nextRecords: ["Justice of the peace seats", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Panola: {
    seat: "Carthage",
    priority: ["County court", "Carthage city offices", "Carthage, Beckville, Gary school boards"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Morris: {
    seat: "Daingerfield",
    priority: ["County court", "Daingerfield city offices", "Daingerfield-Lone Star ISD"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Cass: {
    seat: "Linden",
    priority: ["County court", "Atlanta/Linden city offices", "Atlanta, Linden-Kildare, Queen City school boards"],
    nextRecords: ["Commissioner precincts", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
  Smith: {
    seat: "Tyler",
    priority: ["County court", "Tyler/Whitehouse/Bullard/Lindale city offices", "Tyler, Whitehouse, Chapel Hill, Bullard, Lindale school boards"],
    nextRecords: ["Justice of the peace seats", "Constables", "County clerk", "District clerk", "Tax assessor-collector"],
  },
};

export function isActiveCountyOfficial(official: Official): boolean {
  return official.county.some((county) => activeCountySet.has(county));
}

export function getActiveCountyOfficials(officials: Official[]): Official[] {
  return officials.filter(isActiveCountyOfficial);
}

export function getActiveCountyStats(officials: Official[]) {
  const scoped = getActiveCountyOfficials(officials);
  const levelCounts = scoped.reduce(
    (counts, official) => {
      counts[official.level] = (counts[official.level] ?? 0) + 1;
      return counts;
    },
    {} as Partial<Record<GovernmentLevel, number>>,
  );

  const countyCounts = activeCountyRollout.map((county) => {
    const countyOfficials = scoped.filter((official) => official.county.includes(county));
    const byLevel = countyOfficials.reduce(
      (counts, official) => {
        counts[official.level] = (counts[official.level] ?? 0) + 1;
        return counts;
      },
      {} as Partial<Record<GovernmentLevel, number>>,
    );

    return {
      county,
      loaded: countyOfficials.length,
      byLevel,
      ...countyOfficeTargets[county],
    };
  });

  return {
    totalLoaded: scoped.length,
    countiesLoaded: countyCounts.filter((county) => county.loaded > 0).length,
    countyCounts,
    levelCounts,
  };
}
