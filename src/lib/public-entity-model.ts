import type { Official } from "@/types";
import { getFundingSummary, getNewsByOfficialId, getOfficialById, getPublicVoteRecord, getRedFlags, getScoreCard } from "@/lib/data";
import { getOfficialIdeologyProfile } from "@/lib/ideology";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const PUBLIC_ENTITY_TYPES = [
  "elected_official",
  "appointed_official",
  "candidate",
  "law_enforcement_official",
  "sheriff",
  "police_chief",
  "constable",
  "judge",
  "prosecutor",
  "district_attorney",
  "county_commissioner",
  "city_council_member",
  "mayor",
  "school_board_member",
  "state_legislator",
  "governor",
  "federal_legislator",
  "agency_head",
  "board_member",
  "commission_member",
  "public_body",
  "agency",
  "office",
  "race",
  "court",
  "other_public_role",
] as const;

export const PUBLIC_OFFICE_LEVELS = [
  "federal",
  "state",
  "county",
  "city",
  "school_district",
  "special_district",
  "court",
  "agency",
  "board",
  "commission",
] as const;

export const PUBLIC_CONFIDENCE_LABELS = [
  "official_record",
  "source_backed",
  "needs_source",
  "under_review",
  "disputed",
] as const;

export const PUBLIC_BOUNDARIES = ["public_role_only", "public_body", "private_review", "redacted"] as const;

export type PublicEntityType = (typeof PUBLIC_ENTITY_TYPES)[number];
export type PublicOfficeLevel = (typeof PUBLIC_OFFICE_LEVELS)[number];
export type PublicConfidenceLabel = (typeof PUBLIC_CONFIDENCE_LABELS)[number];
export type PublicBoundary = (typeof PUBLIC_BOUNDARIES)[number];

export interface PublicEntity {
  id: string;
  slug: string;
  displayName: string;
  entityType: PublicEntityType;
  officeLevel: PublicOfficeLevel | null;
  jurisdictionId: string | null;
  parentEntityId: string | null;
  stateCode: string | null;
  countyName: string | null;
  cityName: string | null;
  profilePath: string | null;
  primarySourceUrl: string | null;
  sourceCount: number;
  confidenceLabel: PublicConfidenceLabel;
  publicBoundary: PublicBoundary;
  reviewStatus: string;
  indexStatus: "indexable" | "noindex" | "hidden";
  status: "draft" | "active" | "under_review" | "archived" | "hidden";
  summary: string | null;
  sourceGapSummary: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  lastSourceAddedAt: string | null;
  lastReviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OfficialPublicProfile {
  entityId: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  party: string | null;
  biography: string | null;
  photoUrl: string | null;
  photoSourceUrl: string | null;
  photoCredit: string | null;
  officialWebsite: string | null;
  officialContactUrl: string | null;
  officialEmail: string | null;
  officialPhone: string | null;
  publicOfficeAddress: string | null;
  publicContactKind: "official_public" | "none";
  voteProfileStatus: string;
  fundingProfileStatus: string;
  scoreProfileStatus: string;
  correctionStatus: string;
  sourceNotes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProfileSourceGap {
  key: string;
  label: string;
  priority: "critical" | "important" | "useful";
  nextAction: string;
}

export interface ProfileCompletenessSnapshot {
  entityId: string;
  profileSlug: string;
  profileName: string;
  completenessScore: number;
  completenessLabel: "complete" | "nearly_complete" | "needs_buildout" | "thin_profile" | "not_ready";
  loadedItems: string[];
  missingItems: string[];
  sourceGaps: ProfileSourceGap[];
  sourceCount: number;
  confidenceLabel: PublicConfidenceLabel;
  dataCompletenessOnly: true;
  calculatedAt: string;
}

interface CompletenessFacts {
  entity: Pick<
    PublicEntity,
    | "id"
    | "slug"
    | "displayName"
    | "entityType"
    | "officeLevel"
    | "jurisdictionId"
    | "stateCode"
    | "countyName"
    | "cityName"
    | "primarySourceUrl"
    | "sourceCount"
    | "confidenceLabel"
  >;
  officialProfile?: Partial<OfficialPublicProfile> | null;
  roleCount?: number;
  sourceCount?: number;
  hasTimeline?: boolean;
  hasVotes?: boolean;
  hasFunding?: boolean;
  hasScore?: boolean;
  hasRedFlags?: boolean;
  hasNews?: boolean;
  hasCorrectionPath?: boolean;
}

const entityTypeSet = new Set<string>(PUBLIC_ENTITY_TYPES);
const officeLevelSet = new Set<string>(PUBLIC_OFFICE_LEVELS);
const confidenceSet = new Set<string>(PUBLIC_CONFIDENCE_LABELS);
const boundarySet = new Set<string>(PUBLIC_BOUNDARIES);

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function typedEntityType(value: unknown): PublicEntityType {
  const raw = stringValue(value);
  return raw && entityTypeSet.has(raw) ? (raw as PublicEntityType) : "other_public_role";
}

function typedOfficeLevel(value: unknown): PublicOfficeLevel | null {
  const raw = stringValue(value);
  return raw && officeLevelSet.has(raw) ? (raw as PublicOfficeLevel) : null;
}

function typedConfidence(value: unknown): PublicConfidenceLabel {
  const raw = stringValue(value);
  return raw && confidenceSet.has(raw) ? (raw as PublicConfidenceLabel) : "needs_source";
}

function typedBoundary(value: unknown): PublicBoundary {
  const raw = stringValue(value);
  return raw && boundarySet.has(raw) ? (raw as PublicBoundary) : "public_role_only";
}

function rowToPublicEntity(row: Record<string, unknown>): PublicEntity {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    displayName: String(row.display_name ?? ""),
    entityType: typedEntityType(row.entity_type),
    officeLevel: typedOfficeLevel(row.office_level),
    jurisdictionId: stringValue(row.jurisdiction_id),
    parentEntityId: stringValue(row.parent_entity_id),
    stateCode: stringValue(row.state_code),
    countyName: stringValue(row.county_name),
    cityName: stringValue(row.city_name),
    profilePath: stringValue(row.profile_path),
    primarySourceUrl: stringValue(row.primary_source_url),
    sourceCount: numberValue(row.source_count),
    confidenceLabel: typedConfidence(row.confidence_label),
    publicBoundary: typedBoundary(row.public_boundary),
    reviewStatus: stringValue(row.review_status) ?? "needs_review",
    indexStatus: row.index_status === "noindex" || row.index_status === "hidden" ? row.index_status : "indexable",
    status:
      row.status === "draft" || row.status === "under_review" || row.status === "archived" || row.status === "hidden"
        ? row.status
        : "active",
    summary: stringValue(row.summary),
    sourceGapSummary: stringValue(row.source_gap_summary),
    tags: stringArray(row.tags),
    metadata: objectValue(row.metadata),
    lastSourceAddedAt: stringValue(row.last_source_added_at),
    lastReviewedAt: stringValue(row.last_reviewed_at),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

function rowToOfficialProfile(row: Record<string, unknown>): OfficialPublicProfile {
  return {
    entityId: String(row.entity_id ?? ""),
    firstName: stringValue(row.first_name),
    middleName: stringValue(row.middle_name),
    lastName: stringValue(row.last_name),
    suffix: stringValue(row.suffix),
    party: stringValue(row.party),
    biography: stringValue(row.biography),
    photoUrl: stringValue(row.photo_url),
    photoSourceUrl: stringValue(row.photo_source_url),
    photoCredit: stringValue(row.photo_credit),
    officialWebsite: stringValue(row.official_website),
    officialContactUrl: stringValue(row.official_contact_url),
    officialEmail: stringValue(row.official_email),
    officialPhone: stringValue(row.official_phone),
    publicOfficeAddress: stringValue(row.public_office_address),
    publicContactKind: row.public_contact_kind === "none" ? "none" : "official_public",
    voteProfileStatus: stringValue(row.vote_profile_status) ?? "not_loaded",
    fundingProfileStatus: stringValue(row.funding_profile_status) ?? "not_loaded",
    scoreProfileStatus: stringValue(row.score_profile_status) ?? "not_loaded",
    correctionStatus: stringValue(row.correction_status) ?? "open",
    sourceNotes: stringValue(row.source_notes),
    metadata: objectValue(row.metadata),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

function mapLevel(level: Official["level"]): PublicOfficeLevel {
  if (level === "school-board") return "school_district";
  if (level === "federal" || level === "state" || level === "county" || level === "city") return level;
  return "agency";
}

function entityTypeForOfficial(official: Official): PublicEntityType {
  const position = official.position.toLowerCase();
  if (official.level === "federal") return "federal_legislator";
  if (official.level === "state") return "state_legislator";
  if (official.level === "school-board") return "school_board_member";
  if (position.includes("sheriff")) return "sheriff";
  if (position.includes("police chief")) return "police_chief";
  if (position.includes("constable")) return "constable";
  if (position.includes("judge")) return "judge";
  if (position.includes("district attorney")) return "district_attorney";
  if (position.includes("prosecutor")) return "prosecutor";
  if (position.includes("commissioner")) return "county_commissioner";
  if (position.includes("council")) return "city_council_member";
  if (position.includes("mayor")) return "mayor";
  return "elected_official";
}

function sourceCountForOfficial(official: Official) {
  const sourceLinks = official.sourceLinks?.length ?? 0;
  return sourceLinks + (official.photoSourceUrl ? 1 : 0) + (official.contactInfo.website ? 1 : 0);
}

export function mapOfficialToPublicEntity(official: Official): PublicEntity {
  const primarySourceUrl =
    official.sourceLinks?.find((source) => source.url.startsWith("http"))?.url ??
    official.contactInfo.website ??
    official.photoSourceUrl ??
    null;
  const sourceCount = sourceCountForOfficial(official);

  return {
    id: official.id,
    slug: official.id,
    displayName: official.name,
    entityType: entityTypeForOfficial(official),
    officeLevel: mapLevel(official.level),
    jurisdictionId: null,
    parentEntityId: null,
    stateCode: official.state ?? null,
    countyName: official.county[0] ?? null,
    cityName: null,
    profilePath: `/officials/${official.id}`,
    primarySourceUrl,
    sourceCount,
    confidenceLabel: sourceCount > 0 ? "source_backed" : "needs_source",
    publicBoundary: "public_role_only",
    reviewStatus: official.reviewStatus === "verified" || official.reviewStatus === "complete" ? "verified" : "source_seeded",
    indexStatus: sourceCount > 0 ? "indexable" : "noindex",
    status: "active",
    summary: official.bio ?? null,
    sourceGapSummary: null,
    tags: [official.level, official.position, official.jurisdiction, official.state ?? ""].filter(Boolean),
    metadata: {
      staticOfficialId: official.id,
      district: official.district ?? null,
      termStart: official.termStart,
      termEnd: official.termEnd,
    },
    lastSourceAddedAt: null,
    lastReviewedAt: official.lastVerifiedAt ?? null,
    createdAt: null,
    updatedAt: official.lastVerifiedAt ?? null,
  };
}

export function mapOfficialToOfficialProfile(official: Official): OfficialPublicProfile {
  const contact = official.contactInfo;
  const contactEmail = contact.email?.startsWith("http") ? null : contact.email ?? null;
  const contactUrl = contact.email?.startsWith("http") ? contact.email : undefined;

  return {
    entityId: official.id,
    firstName: official.firstName,
    middleName: null,
    lastName: official.lastName,
    suffix: null,
    party: official.party,
    biography: official.bio ?? null,
    photoUrl: official.photo ?? null,
    photoSourceUrl: official.photoSourceUrl ?? null,
    photoCredit: official.photoCredit ?? null,
    officialWebsite: contact.website ?? null,
    officialContactUrl: contactUrl ?? null,
    officialEmail: contactEmail,
    officialPhone: contact.phone ?? null,
    publicOfficeAddress: contact.office ?? null,
    publicContactKind: contact.website || contact.email || contact.phone || contact.office ? "official_public" : "none",
    voteProfileStatus: getPublicVoteRecord(official.id) ? "loaded" : "not_loaded",
    fundingProfileStatus: getFundingSummary(official.id) ? "loaded" : "not_loaded",
    scoreProfileStatus: getScoreCard(official.id) ? "loaded" : "not_loaded",
    correctionStatus: "open",
    sourceNotes: "Adapted from existing static RepWatchr official JSON.",
    metadata: {
      district: official.district ?? null,
      campaignPromises: official.campaignPromises ?? [],
      socialMedia: contact.socialMedia ?? {},
    },
    createdAt: null,
    updatedAt: official.lastVerifiedAt ?? null,
  };
}

function completenessLabel(score: number): ProfileCompletenessSnapshot["completenessLabel"] {
  if (score >= 95) return "complete";
  if (score >= 80) return "nearly_complete";
  if (score >= 55) return "needs_buildout";
  if (score >= 25) return "thin_profile";
  return "not_ready";
}

function addCheck(
  checks: Array<{ key: string; label: string; loaded: boolean; weight: number; priority: ProfileSourceGap["priority"]; nextAction: string }>,
  key: string,
  label: string,
  loaded: boolean,
  weight: number,
  priority: ProfileSourceGap["priority"],
  nextAction: string,
) {
  checks.push({ key, label, loaded, weight, priority, nextAction });
}

export function calculateProfileCompletenessFromFacts(facts: CompletenessFacts): ProfileCompletenessSnapshot {
  const profile = facts.officialProfile;
  const sourceCount = facts.sourceCount ?? facts.entity.sourceCount;
  const checks: Array<{
    key: string;
    label: string;
    loaded: boolean;
    weight: number;
    priority: ProfileSourceGap["priority"];
    nextAction: string;
  }> = [];

  addCheck(checks, "identity", "Name and entity type", Boolean(facts.entity.displayName && facts.entity.entityType), 10, "critical", "Add a public name and entity type.");
  addCheck(checks, "public_role", "Current public role", Boolean((facts.roleCount ?? 0) > 0 || profile), 10, "critical", "Attach an official role, seat, or office source.");
  addCheck(checks, "jurisdiction", "Jurisdiction", Boolean(facts.entity.jurisdictionId || facts.entity.stateCode || facts.entity.countyName || facts.entity.cityName), 10, "critical", "Attach state, county, city, district, court, agency, or board jurisdiction.");
  addCheck(checks, "primary_source", "Primary public source", Boolean(facts.entity.primarySourceUrl), 15, "critical", "Attach the strongest official source URL.");
  addCheck(checks, "source_trail", "Source trail", sourceCount > 0, 12, "critical", "Attach at least one reviewed public source.");
  addCheck(checks, "official_contact", "Official public contact", Boolean(profile?.officialWebsite || profile?.officialContactUrl || profile?.officialEmail || profile?.officialPhone || profile?.publicOfficeAddress), 8, "important", "Attach an official website, contact form, phone, email, or office contact source.");
  addCheck(checks, "photo_or_logo", "Photo or public image", Boolean(profile?.photoUrl || profile?.photoSourceUrl), 7, "useful", "Attach an official or licensed public photo/source.");
  addCheck(checks, "timeline", "Timeline events", Boolean(facts.hasTimeline), 8, "important", "Attach at least one vote, filing, meeting, public statement, article, or source event.");
  addCheck(checks, "votes_or_actions", "Votes or official actions", Boolean(facts.hasVotes), 8, "important", "Attach roll calls, meeting votes, orders, filings, or other role-specific actions.");
  addCheck(checks, "funding_or_financials", "Funding or public financial record", Boolean(facts.hasFunding), 6, "useful", "Attach campaign finance, budget, vendor, contract, or financial disclosure source where applicable.");
  addCheck(checks, "score_methodology", "Score or review methodology", Boolean(facts.hasScore), 6, "useful", "Attach a scorecard, methodology link, or mark the score module not applicable.");
  addCheck(checks, "correction_path", "Correction path", Boolean(facts.hasCorrectionPath), 6, "important", "Attach correction/request-review action for this profile.");

  const totalWeight = checks.reduce((total, check) => total + check.weight, 0);
  const loadedWeight = checks.filter((check) => check.loaded).reduce((total, check) => total + check.weight, 0);
  const completenessScore = totalWeight > 0 ? Math.round((loadedWeight / totalWeight) * 100) : 0;
  const loadedItems = checks.filter((check) => check.loaded).map((check) => check.key);
  const missingItems = checks.filter((check) => !check.loaded).map((check) => check.key);
  const sourceGaps = checks
    .filter((check) => !check.loaded)
    .map((check) => ({
      key: check.key,
      label: check.label,
      priority: check.priority,
      nextAction: check.nextAction,
    }));

  return {
    entityId: facts.entity.id,
    profileSlug: facts.entity.slug,
    profileName: facts.entity.displayName,
    completenessScore,
    completenessLabel: completenessLabel(completenessScore),
    loadedItems,
    missingItems,
    sourceGaps,
    sourceCount,
    confidenceLabel: facts.entity.confidenceLabel,
    dataCompletenessOnly: true,
    calculatedAt: new Date().toISOString(),
  };
}

async function countRows(table: string, column: string, value: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;

  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq(column, value);
  if (error) return 0;
  return count ?? 0;
}

export async function getPublicEntityBySlug(slug: string): Promise<PublicEntity | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("public_entities")
      .select("*")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (!error && data) {
      return rowToPublicEntity(data as Record<string, unknown>);
    }
  }

  const staticOfficial = getOfficialById(normalizedSlug);
  return staticOfficial ? mapOfficialToPublicEntity(staticOfficial) : null;
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getPublicEntityByIdOrSlug(entityIdOrSlug: string): Promise<PublicEntity | null> {
  const normalized = entityIdOrSlug.trim();
  if (!normalized) return null;

  if (!looksLikeUuid(normalized)) {
    return getPublicEntityBySlug(normalized);
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("public_entities")
      .select("*")
      .eq("id", normalized)
      .maybeSingle();

    if (!error && data) {
      return rowToPublicEntity(data as Record<string, unknown>);
    }
  }

  return null;
}

export async function getOfficialProfile(entityId: string): Promise<OfficialPublicProfile | null> {
  const normalizedId = entityId.trim();
  if (!normalizedId) return null;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("official_profiles")
      .select("*")
      .eq("entity_id", normalizedId)
      .maybeSingle();

    if (!error && data) {
      return rowToOfficialProfile(data as Record<string, unknown>);
    }
  }

  const staticOfficial = getOfficialById(normalizedId);
  return staticOfficial ? mapOfficialToOfficialProfile(staticOfficial) : null;
}

export async function calculateProfileCompleteness(entityId: string): Promise<ProfileCompletenessSnapshot | null> {
  const entity = await getPublicEntityByIdOrSlug(entityId);
  if (!entity) return null;

  const staticOfficial = getOfficialById(entity.slug);
  const officialProfile = (await getOfficialProfile(entity.id)) ?? (staticOfficial ? mapOfficialToOfficialProfile(staticOfficial) : null);
  const roleCount = await countRows("public_roles", "entity_id", entity.id);
  const dbSourceCount = await countRows("source_links", "entity_id", entity.id);
  const timelineCount = await countRows("official_timeline_events", "official_id", entity.slug);

  return calculateProfileCompletenessFromFacts({
    entity: {
      ...entity,
      sourceCount: Math.max(entity.sourceCount, dbSourceCount),
    },
    officialProfile,
    roleCount: Math.max(roleCount, staticOfficial ? 1 : 0),
    sourceCount: Math.max(entity.sourceCount, dbSourceCount, staticOfficial ? sourceCountForOfficial(staticOfficial) : 0),
    hasTimeline: timelineCount > 0 || Boolean(staticOfficial && (getRedFlags(staticOfficial.id).length > 0 || getNewsByOfficialId(staticOfficial.id).length > 0)),
    hasVotes: Boolean(staticOfficial && getPublicVoteRecord(staticOfficial.id)),
    hasFunding: Boolean(staticOfficial && getFundingSummary(staticOfficial.id)),
    hasScore: Boolean(staticOfficial && (getScoreCard(staticOfficial.id) || getOfficialIdeologyProfile(staticOfficial.id))),
    hasRedFlags: Boolean(staticOfficial && getRedFlags(staticOfficial.id).length > 0),
    hasNews: Boolean(staticOfficial && getNewsByOfficialId(staticOfficial.id).length > 0),
    hasCorrectionPath: Boolean(entity.profilePath),
  });
}

export async function getProfileSourceGaps(entityId: string): Promise<ProfileSourceGap[]> {
  const snapshot = await calculateProfileCompleteness(entityId);
  return snapshot?.sourceGaps ?? [];
}

export async function incrementSourceCount(entityId: string): Promise<boolean> {
  const normalizedId = entityId.trim();
  if (!normalizedId) return false;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("public_entities")
    .select("source_count")
    .eq("id", normalizedId)
    .maybeSingle();

  if (error || !data) return false;
  const current = numberValue((data as Record<string, unknown>).source_count);

  const { error: updateError } = await supabase
    .from("public_entities")
    .update({
      source_count: current + 1,
      last_source_added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", normalizedId);

  return !updateError;
}

export async function updateEntityLastUpdated(entityId: string): Promise<boolean> {
  const normalizedId = entityId.trim();
  if (!normalizedId) return false;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("public_entities")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", normalizedId);

  return !error;
}
