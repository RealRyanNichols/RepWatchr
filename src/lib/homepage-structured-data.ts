/**
 * The homepage's structured data, built here rather than inside the page.
 *
 * It used to be assembled inline in src/app/page.tsx, including a Dataset node
 * hand-written alongside the shared `datasetJsonLd` builder. That put the
 * site's most-crawled graph out of reach of anything that evaluates JSON-LD:
 * a guard could only string-match the page source, and a source check cannot
 * tell a reference to the canonical organization from a second anonymous
 * declaration of it. With the graph in a module, the schema probe builds the
 * real thing and inspects it.
 */

import { REPWATCHR_ORIGIN, absoluteRepWatchrUrl } from "@/lib/repwatchr-seo";
import { datasetJsonLd } from "@/lib/structured-data";

/** The four-step loop the homepage renders and also publishes as a HowTo. */
export const RECORD_LOOP = [
  {
    step: "Search",
    title: "Find the person fast",
    detail: "Start with a name, district, office, or school board and get to the record fast.",
  },
  {
    step: "Grade",
    title: "Let citizens put pressure on the record",
    detail:
      "Profiles are not static biographies. They are public accountability pages people can rate, revisit, and watch.",
  },
  {
    step: "Source",
    title: "Turn claims into receipts",
    detail:
      "Every useful tip should become a source, missing-record lead, vote, funding trail, or red flag for review.",
  },
  {
    step: "Share",
    title: "Make every profile easy to share",
    detail:
      "The page should give voters a clean link they can post before meetings, elections, hearings, and news cycles.",
  },
] as const;

export function homepageStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "RepWatchr",
      url: REPWATCHR_ORIGIN,
      description:
        "Search public officials, school boards, votes, funding, red flags, source links, and citizen grades.",
      potentialAction: {
        "@type": "SearchAction",
        target: absoluteRepWatchrUrl("/faretta-ai?q={search_term_string}"),
        "query-input": "required name=search_term_string",
      },
    },
    datasetJsonLd({
      name: "RepWatchr public accountability profiles",
      path: "/",
      description:
        "Source-backed public profiles covering officials, school boards, power profiles, votes, campaign finance, red flags, and public source links.",
      keywords: [
        "public officials",
        "school boards",
        "voting records",
        "campaign finance",
        "red flags",
        "citizen grades",
        "public records",
      ],
      spatialCoverage: "United States",
      variableMeasured: [
        "public profiles",
        "source links",
        "citizen grades",
        "voting records",
        "campaign finance",
        "school-board rosters",
      ],
    }),
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to use RepWatchr",
      description: "A four-step public accountability loop for voters.",
      step: RECORD_LOOP.map((item, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: item.title,
        text: item.detail,
      })),
    },
  ];
}
