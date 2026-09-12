export const HD7_RECORDS_REVIEWED_AT = "2026-09-12";
export const HD7_RACE_SLUG = "texas-house-district-7-2026";

export type HD7PublicRecord = {
  title: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType: "Official record" | "Campaign position" | "Proposed budget";
  dateLabel: string;
};

export type HD7RecordSubject = {
  id: string;
  name: string;
  role: string;
  context: string;
  profileHref: string;
  records: HD7PublicRecord[];
  questions: string[];
};

export const HD7_REPORTED_PRIMARY = {
  sourceLabel: "MultiState: reported HD7 election results",
  sourceUrl: "https://www.multistate.us/elections/district?chamber=House&d=7&st=TX",
  detail: "MultiState reports that Jay Dean won the March 3 Republican primary against Melissa Beckett and lists Fantasha Allen as his November 3 Democratic opponent. The certified districtwide canvass and final general-election ballot are still needed in this desk.",
};

export const HD7_RECORD_SUBJECTS: HD7RecordSubject[] = [
  {
    id: "jay-dean",
    name: "Jay Dean",
    role: "Current state representative",
    context: "Republican • Texas House District 7",
    profileHref: "/officials/jay-dean",
    records: [
      {
        title: "The office and its boundaries",
        detail: "The Legislative Reference Library lists Dean's current term as January 14, 2025–January 12, 2027, serving Gregg, Harrison and Marion counties. His first House term began in January 2017.",
        sourceLabel: "Legislative Reference Library: Dean's service record",
        sourceUrl: "https://lrl.texas.gov/legeLeaders/members/memberDisplay.cfm?memberID=5818",
        sourceType: "Official record",
        dateLabel: "2025–2027 term",
      },
      {
        title: "Insurance committee chair",
        detail: "The House Insurance Committee roster names Dean as chair, appointed February 13, 2025. The committee page links its meetings and bills for review.",
        sourceLabel: "Texas Legislature: Insurance Committee roster",
        sourceUrl: "https://capitol.texas.gov/Committees/MembershipCmte.aspx?CmteCode=C320&LegSess=89R",
        sourceType: "Official record",
        dateLabel: "February 13, 2025",
      },
      {
        title: "Bills, amendments and committee work",
        detail: "His official member record links authored and sponsored legislation and lists service on Energy Resources and the Select Committee on Health Care Affordability.",
        sourceLabel: "Texas Legislature: Dean's legislative record",
        sourceUrl: "https://capitol.texas.gov/members/MemberInfo.aspx?Chamber=H&Code=A3515&Leg=89",
        sourceType: "Official record",
        dateLabel: "89th Legislature",
      },
    ],
    questions: [
      "Which bills and recorded votes support his statements about insurance costs, school funding and property taxes?",
      "What do his latest Texas Ethics Commission reports disclose about contributions, spending and outstanding loans?",
    ],
  },
  {
    id: "melissa-beckett",
    name: "Melissa Beckett",
    role: "Former Republican primary challenger",
    context: "Texas House District 7 • Reported primary result below",
    profileHref: "/candidates/melissa-beckett",
    records: [
      {
        title: "Property taxes and education",
        detail: "Beckett's campaign platform supports eliminating property taxes and giving parents and teachers more control over education. These are her stated positions, not laws she enacted.",
        sourceLabel: "Beckett campaign: published issue platform",
        sourceUrl: "https://www.melissafortexas.com/issues",
        sourceType: "Campaign position",
        dateLabel: "Undated campaign page",
      },
      {
        title: "Water, land and public spending",
        detail: "The same platform calls for protecting East Texas water and land, prohibiting taxpayer-funded lobbying, and reducing government size and spending.",
        sourceLabel: "Beckett campaign: water and spending positions",
        sourceUrl: "https://www.melissafortexas.com/issues",
        sourceType: "Campaign position",
        dateLabel: "Undated campaign page",
      },
      {
        title: "A documented legislative appearance",
        detail: "The Senate Education witness list records Melissa Beckett, representing herself and Texas Education 911, testifying FOR SB 133. The witness list establishes participation; it does not establish the content of her testimony.",
        sourceLabel: "Texas Legislature: March 8 Education witness list",
        sourceUrl: "https://capitol.texas.gov/tlodocs/88R/witlistmtg/html/C5302023030809001.HTM",
        sourceType: "Official record",
        dateLabel: "March 8, 2023",
      },
    ],
    questions: [
      "What written plan identifies replacement revenue and service changes under her proposal to eliminate property taxes?",
      "What do her latest Texas Ethics Commission reports disclose about contributions, spending and outstanding loans?",
    ],
  },
  {
    id: "leward-j-lafleur-ii",
    name: "Leward J. LaFleur II",
    role: "Marion County Judge",
    context: "County office within HD7 • Separate county-judge race",
    profileHref: "/officials/leward-j-lafleur-ii",
    records: [
      {
        title: "His recorded 2026 budget vote",
        detail: "The county's budget page lists LaFleur voting FOR the adopted 2026 budget. It reports $251,928 more in property-tax revenue than the prior budget, a 5.65% increase, including $110,710 from new property.",
        sourceLabel: "Marion County: adopted 2026 budget and recorded vote",
        sourceUrl: "https://www.co.marion.tx.us/page/marion.Budgets",
        sourceType: "Official record",
        dateLabel: "2026 adopted budget",
      },
      {
        title: "The 2027 proposal is a separate record",
        detail: "The proposed 2027 budget, certified by LaFleur on August 14, projects $111,971 more property-tax revenue, a 2.40% increase, including $76,280 from new property. This file is a proposal; it does not establish the final adopted line items.",
        sourceLabel: "Marion County: proposed 2027 budget",
        sourceUrl: "https://www.co.marion.tx.us/upload/page/1269/docs/public%20notices/budget%20notices/2027/Proposed%20Budget.pdf",
        sourceType: "Proposed budget",
        dateLabel: "August 14, 2026",
      },
      {
        title: "A tax rate the court adopted",
        detail: "The August 31 order adopts $0.5358775 per $100 valuation for tax year 2026 to fund the 2027 budget. This is a Commissioners Court action; this desk has not established each member's roll-call vote.",
        sourceLabel: "Marion County: tax-rate adoption order",
        sourceUrl: "https://www.co.marion.tx.us/upload/page/1263/2027/Tax%20Adoption%202026.pdf",
        sourceType: "Official record",
        dateLabel: "August 31, 2026",
      },
    ],
    questions: [
      "Where are the final adopted 2027 line-item budget and the individual votes recorded in the meeting minutes?",
      "Which spending changes explain the additional revenue, and which proposed salary changes were adopted?",
    ],
  },
];
