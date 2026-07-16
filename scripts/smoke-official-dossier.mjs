import fs from "node:fs";

const pagePath = "src/app/officials/[id]/page.tsx";
const dossierPath = "src/lib/official-dossier.ts";
const experiencePath = "src/components/officials/OfficialProfileExperience.tsx";
const dashboardPath = "src/components/officials/UniversalOfficialDashboard.tsx";

for (const file of [pagePath, dossierPath, experiencePath, dashboardPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required dossier file: ${file}`);
  }
}

const page = fs.readFileSync(pagePath, "utf8");
const dossier = fs.readFileSync(dossierPath, "utf8");
const experience = fs.readFileSync(experiencePath, "utf8");
const dashboard = fs.readFileSync(dashboardPath, "utf8");
const profileSurface = `${page}\n${experience}\n${dashboard}`;

const requiredPageTokens = [
  "OfficialProfileHero",
  "UniversalOfficialDashboard",
  "dashboardMode",
  "Overall grade",
  "What the voting record shows",
  "What verified people think",
  "Positive coverage",
  "Critical coverage and records",
  "Official channels",
  "Evidence still needed",
  "Ask, answer, correct, and add a source",
  "ProfileActionDock",
  "CommentSection",
  "ProfileScorecardVote",
];

const requiredDossierTokens = [
  "sourceCount",
  "confirmed",
  "needsReview",
  "sourceGroups",
  "timeline",
  "publicQuestions",
  "Official links",
  "Vote links",
  "Funding links",
  "Meeting/video links",
  "Article links",
  "Correction history",
];

for (const token of requiredPageTokens) {
  if (!profileSurface.includes(token)) {
    throw new Error(`Official profile page is missing dossier token: ${token}`);
  }
}

for (const token of requiredDossierTokens) {
  if (!dossier.includes(token)) {
    throw new Error(`Official dossier builder is missing token: ${token}`);
  }
}

if (!page.includes("sourceBackedRedFlags")) {
  throw new Error("Red flag rendering must use sourceBackedRedFlags");
}

for (const retiredGenericSection of [
  "RecordSummaryPanel",
  "SourceTrailPanel",
  "ScoreMethodologyPanel",
  "ScoreImpactVoteTable",
  "ProfileTimelinePanel",
  "DossierActionsPanel",
]) {
  if (page.includes(retiredGenericSection)) {
    throw new Error(`Retired generic profile section is still wired: ${retiredGenericSection}`);
  }
}

console.log("official dossier smoke check passed");
