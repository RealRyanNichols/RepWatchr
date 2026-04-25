import { REPWATCHR_SITE_URL } from "@/lib/repwatchr-contact";

type QuoReplyInput = {
  body: string;
};

export function buildRepWatchrTextReply({ body }: QuoReplyInput) {
  const text = body.toLowerCase();

  if (text.includes("claim") || text.includes("candidate") || text.includes("profile")) {
    return `RepWatchr: To claim or correct a public profile, start here: ${REPWATCHR_SITE_URL}/profiles/claim. Facts, evidence, scores, and source links stay locked for review.`;
  }

  if (text.includes("school") || text.includes("board") || text.includes("isd")) {
    return `RepWatchr: Send the ISD, city, county, board member name, and any public link you have. School-board records start here: ${REPWATCHR_SITE_URL}/school-boards.`;
  }

  if (text.includes("data") || text.includes("pack") || text.includes("research")) {
    return `RepWatchr Data Desk: Reply with the location, race, school, county, or official you need researched. Data pack options are here: ${REPWATCHR_SITE_URL}/data-reports.`;
  }

  if (text.includes("wrong") || text.includes("incorrect") || text.includes("fix") || text.includes("report")) {
    return `RepWatchr: Send the page link, what is wrong, and the source showing the correction. You can also file it here: ${REPWATCHR_SITE_URL}/feedback.`;
  }

  if (text.includes("gideon") || text.includes("search") || text.includes("find")) {
    return `RepWatchr GideonAI: Search by official, city, county, district, race, vote, donor, or issue here: ${REPWATCHR_SITE_URL}/gideon.`;
  }

  return `RepWatchr: Text the official, school, city, county, race, or issue you want checked. Add public links if you have them. Start searching here: ${REPWATCHR_SITE_URL}/search.`;
}
