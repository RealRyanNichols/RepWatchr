import fs from "node:fs";

const pagePath = "src/app/officials/[id]/page.tsx";
const dossierPath = "src/lib/official-dossier.ts";

for (const file of [pagePath, dossierPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required dossier file: ${file}`);
  }
}

const page = fs.readFileSync(pagePath, "utf8");
const dossier = fs.readFileSync(dossierPath, "utf8");

const requiredPageTokens = [
  "HeroDossierMetric",
  "RecordSummaryPanel",
  "SourceTrailPanel",
  "ScoreMethodologyPanel",
  "ScoreImpactVoteTable",
  "ProfileTimelinePanel",
  "PublicQuestionsPanel",
  "DossierActionsPanel",
  "RedFlagStatusLabel",
  "Watch profile",
  "Submit correction",
  "Request official brief",
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
  if (!page.includes(token)) {
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

console.log("official dossier smoke check passed");
