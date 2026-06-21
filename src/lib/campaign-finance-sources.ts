import type { Official, SourceLink } from "@/types";

export interface CampaignFinanceSourcePath {
  label: string;
  summary: string;
  sources: SourceLink[];
  reviewItems: string[];
}

function encoded(value: string) {
  return encodeURIComponent(value);
}

function cleanSearchName(official: Official) {
  return official.name.replace(/\s+/g, " ").trim();
}

function fecOffice(official: Official) {
  if (official.position === "U.S. Senator") return "S";
  if (official.position === "U.S. Representative") return "H";
  return "";
}

export function getCampaignFinanceSourcePath(official: Official): CampaignFinanceSourcePath {
  const name = cleanSearchName(official);
  const state = official.state ?? (official.county.includes("Texas") ? "TX" : "");

  if (official.level === "federal") {
    const office = fecOffice(official);
    const searchParams = [
      `q=${encoded(name)}`,
      "cycle=2026",
      state ? `state=${encoded(state)}` : "",
      office ? `office=${office}` : "",
    ]
      .filter(Boolean)
      .join("&");

    return {
      label: "Federal campaign finance source path",
      summary:
        "Use the FEC candidate and committee records for totals, disbursements, cash on hand, committee links, and itemized donor records. RepWatchr does not treat missing local JSON as a zero-dollar record.",
      sources: [
        {
          title: "FEC candidate search",
          url: `https://www.fec.gov/data/candidates/?${searchParams}`,
        },
        {
          title: "FEC committee search",
          url: `https://www.fec.gov/data/committees/?q=${encoded(name)}&cycle=2026`,
        },
      ],
      reviewItems: [
        "Match candidate ID and principal campaign committee before loading totals.",
        "Load total raised, total spent, cash on hand, donor size, geography, and top donor/source aggregates.",
        "Keep independent expenditures and leadership PAC records separate from direct campaign receipts.",
      ],
    };
  }

  if (state === "TX" || official.jurisdiction.startsWith("Texas ")) {
    return {
      label: "Texas campaign finance source path",
      summary:
        "Texas state-office campaign finance should be checked against Texas Ethics Commission filings before any total is shown. RepWatchr keeps this as a source path until a filing-backed funding summary is loaded.",
      sources: [
        {
          title: "Texas Ethics Commission campaign finance search",
          url: "https://www.ethics.state.tx.us/search/cf/",
        },
        {
          title: "Texas Ethics Commission campaign finance reports",
          url: "https://www.ethics.state.tx.us/filinginfo/CFReport.php",
        },
        {
          title: "Transparency USA Texas search",
          url: `https://www.transparencyusa.org/tx/search?search=${encoded(name)}`,
        },
      ],
      reviewItems: [
        "Match the filer name, office, district, and election cycle before importing totals.",
        "Separate candidate committees, officeholder accounts, PACs, and in-kind support.",
        "Load total contributions, total expenditures, cash on hand, top donors, donor geography, and source links.",
      ],
    };
  }

  return {
    label: "Campaign finance source path",
    summary:
      "Campaign finance records require a jurisdiction-specific official source before RepWatchr shows totals.",
    sources: official.contactInfo.website
      ? [{ title: "Official website", url: official.contactInfo.website }]
      : official.sourceLinks ?? [],
    reviewItems: [
      "Identify the official campaign-finance filing authority.",
      "Match filer identity before loading totals.",
      "Attach source links before publishing donor or spending figures.",
    ],
  };
}

export function hasCampaignFinanceSourcePath(official: Official) {
  return getCampaignFinanceSourcePath(official).sources.length > 0;
}
