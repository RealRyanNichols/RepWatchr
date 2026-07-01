import { getFundingSummary, getPublicVoteRecord, getRedFlags } from "@/lib/data";
import type { Official, Party, ScoreCard } from "@/types";

const TEXAS_US_HOUSE_DISTRICTS = 38;
const TEXAS_US_SENATE_SEATS = 2;
const TEXAS_HOUSE_DISTRICTS = 150;
const TEXAS_SENATE_DISTRICTS = 31;

export type TexasChamberBuildout = {
  key: string;
  label: string;
  loaded: number;
  expected: number;
  missing: number[];
  sourceLinked: number;
  withPhotos: number;
  withVotes: number;
  withFunding: number;
  withRedFlags: number;
};

export type TexasRepresentativeBuildout = {
  officials: Official[];
  federalHouse: Official[];
  federalSenate: Official[];
  stateHouse: Official[];
  stateSenate: Official[];
  chambers: TexasChamberBuildout[];
  partyCounts: Record<Party, number>;
  scoreStatus: {
    strong: number;
    mixed: number;
    bad: number;
    unscored: number;
  };
  totals: {
    loaded: number;
    expected: number;
    missing: number;
    sourceLinked: number;
    withPhotos: number;
    withVotes: number;
    withFunding: number;
    withRedFlags: number;
    withScorecards: number;
  };
};

function districtNumber(official: Official) {
  const match = official.district?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function missingDistricts(officials: Official[], expected: number) {
  const loaded = new Set(officials.map(districtNumber).filter((value): value is number => Number.isFinite(value)));
  return Array.from({ length: expected }, (_, index) => index + 1).filter((district) => !loaded.has(district));
}

function chamberBuildout(key: string, label: string, officials: Official[], expected: number): TexasChamberBuildout {
  return {
    key,
    label,
    loaded: officials.length,
    expected,
    missing: missingDistricts(officials, expected),
    sourceLinked: officials.filter((official) => (official.sourceLinks?.length ?? 0) > 0).length,
    withPhotos: officials.filter((official) => Boolean(official.photo)).length,
    withVotes: officials.filter((official) => Boolean(getPublicVoteRecord(official.id))).length,
    withFunding: officials.filter((official) => Boolean(getFundingSummary(official.id))).length,
    withRedFlags: officials.filter((official) => getRedFlags(official.id).length > 0).length,
  };
}

function isTexasRepresentativeRecord(official: Official) {
  const state = official.state?.toUpperCase();
  const district = official.district?.toUpperCase() ?? "";
  const id = official.id.toLowerCase();

  return (
    state === "TX" ||
    district.startsWith("TX-") ||
    district.startsWith("HD-") ||
    district.startsWith("SD-") ||
    id.startsWith("tx-") ||
    id.startsWith("us-house-tx") ||
    id.startsWith("us-senate-tx")
  );
}

export function getTexasRepresentativeBuildout(
  officials: Official[],
  scoreCards: ScoreCard[],
): TexasRepresentativeBuildout {
  const scoreCardMap = new Map(scoreCards.map((scoreCard) => [scoreCard.officialId, scoreCard]));
  const texasOfficials = officials.filter(isTexasRepresentativeRecord);
  const federalHouse = texasOfficials.filter((official) => official.position === "U.S. Representative");
  const federalSenate = texasOfficials.filter((official) => official.position === "U.S. Senator");
  const stateHouse = texasOfficials.filter((official) => official.position === "State Representative");
  const stateSenate = texasOfficials.filter((official) => official.position === "State Senator");
  const representatives = [...federalHouse, ...federalSenate, ...stateHouse, ...stateSenate];
  const partyCounts = representatives.reduce<Record<Party, number>>(
    (counts, official) => {
      counts[official.party] = (counts[official.party] ?? 0) + 1;
      return counts;
    },
    { R: 0, D: 0, I: 0, NP: 0, VR: 0, VD: 0 },
  );
  const scoreStatus = representatives.reduce(
    (counts, official) => {
      const scoreCard = scoreCardMap.get(official.id);
      if (!scoreCard) {
        counts.unscored += 1;
      } else if (scoreCard.overall < 60) {
        counts.bad += 1;
      } else if (scoreCard.overall >= 80) {
        counts.strong += 1;
      } else {
        counts.mixed += 1;
      }
      return counts;
    },
    { strong: 0, mixed: 0, bad: 0, unscored: 0 },
  );
  const chambers = [
    chamberBuildout("us-house", "Texas U.S. House", federalHouse, TEXAS_US_HOUSE_DISTRICTS),
    chamberBuildout("us-senate", "Texas U.S. Senate", federalSenate, TEXAS_US_SENATE_SEATS),
    chamberBuildout("tx-house", "Texas House", stateHouse, TEXAS_HOUSE_DISTRICTS),
    chamberBuildout("tx-senate", "Texas Senate", stateSenate, TEXAS_SENATE_DISTRICTS),
  ];
  const totals = chambers.reduce(
    (acc, chamber) => {
      acc.loaded += chamber.loaded;
      acc.expected += chamber.expected;
      acc.missing += chamber.missing.length;
      acc.sourceLinked += chamber.sourceLinked;
      acc.withPhotos += chamber.withPhotos;
      acc.withVotes += chamber.withVotes;
      acc.withFunding += chamber.withFunding;
      acc.withRedFlags += chamber.withRedFlags;
      return acc;
    },
    {
      loaded: 0,
      expected: 0,
      missing: 0,
      sourceLinked: 0,
      withPhotos: 0,
      withVotes: 0,
      withFunding: 0,
      withRedFlags: 0,
      withScorecards: 0,
    },
  );

  totals.withScorecards = representatives.filter((official) => scoreCardMap.has(official.id)).length;

  return {
    officials: representatives.sort((a, b) => {
      const chamberOrder = a.position.localeCompare(b.position);
      return chamberOrder || (districtNumber(a) ?? 999) - (districtNumber(b) ?? 999) || a.name.localeCompare(b.name);
    }),
    federalHouse,
    federalSenate,
    stateHouse,
    stateSenate,
    chambers,
    partyCounts,
    scoreStatus,
    totals,
  };
}
