import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reportKinds = new Set([
  "behavior_concern",
  "registry_update",
  "failure_to_register",
  "possible_unregistered",
  "victim_statement",
  "source_correction",
]);

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const maxUploads = 5;
const maxUploadBytes = 15 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function headerIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    ""
  );
}

function hashValue(value: string) {
  const secret = process.env.REPORT_INTAKE_HASH_SECRET || process.env.MEMBER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !value) return null;
  return createHash("sha256").update(`${value}:${secret}`).digest("hex");
}

function rateLimitKey(request: Request) {
  const ipHash = hashValue(headerIp(request));
  const userAgentHash = hashValue(request.headers.get("user-agent") ?? "");
  return ipHash || userAgentHash || "anonymous";
}

function checkRateLimit(request: Request) {
  const key = rateLimitKey(request);
  const now = Date.now();
  const current = rateLimit.get(key);

  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (current.count >= 6) return false;
  current.count += 1;
  return true;
}

function normalizeIncidentAt(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function splitLinks(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^https?:\/\//i.test(line))
    .slice(0, 10);
}

function isUploadFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value.name === "string" && value.size > 0;
}

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "evidence-file";
}

export async function POST(request: Request) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: "Too many reports. Try again in a few minutes." }, { status: 429 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Report queue is temporarily unavailable." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Report form could not be read." }, { status: 400 });
  }

  const personName = cleanText(formData.get("personName"), 160);
  const profileSlug = cleanText(formData.get("profileSlug"), 160);
  const reportKind = cleanText(formData.get("reportKind"), 80);
  const county = cleanText(formData.get("county"), 80);
  const city = cleanText(formData.get("city"), 120);
  const incidentAt = normalizeIncidentAt(cleanText(formData.get("incidentAt"), 80));
  const policeContacted = cleanText(formData.get("policeContacted"), 40) || "unknown";
  const summary = cleanMultiline(formData.get("summary"), 4000);
  const evidenceLinks = splitLinks(cleanMultiline(formData.get("evidenceLinks"), 2000));
  const submitterName = cleanText(formData.get("submitterName"), 160) || null;
  const submitterEmail = cleanText(formData.get("submitterEmail"), 200).toLowerCase() || null;
  const submitterPhone = cleanText(formData.get("submitterPhone"), 80) || null;
  const emergencyAcknowledged = formData.get("emergencyAcknowledged") === "on";
  const consentAcknowledged = formData.get("consentAcknowledged") === "on";
  const uploadFiles = formData.getAll("evidenceFiles").filter(isUploadFile).slice(0, maxUploads);

  if (!personName || !county || !city || !summary) {
    return NextResponse.json({ error: "Name, county, city, and report details are required." }, { status: 400 });
  }

  if (!reportKinds.has(reportKind)) {
    return NextResponse.json({ error: "Report type is not valid." }, { status: 400 });
  }

  if (summary.length < 40) {
    return NextResponse.json({ error: "Report details need at least 40 characters." }, { status: 400 });
  }

  if (!emergencyAcknowledged || !consentAcknowledged) {
    return NextResponse.json({ error: "Emergency and review acknowledgments are required." }, { status: 400 });
  }

  const oversized = uploadFiles.find((file) => file.size > maxUploadBytes);
  if (oversized) {
    return NextResponse.json({ error: `File is too large: ${safeFileName(oversized.name)}.` }, { status: 400 });
  }

  let profileId: string | null = null;
  if (profileSlug) {
    const { data: profileMatch } = await admin
      .from("predator_profiles")
      .select("id")
      .eq("slug", profileSlug)
      .maybeSingle();
    profileId = profileMatch?.id ?? null;
  }

  const { data: report, error: reportError } = await admin
    .from("predator_reports")
    .insert({
      profile_id: profileId,
      person_name: personName,
      report_kind: reportKind,
      county,
      city,
      incident_at: incidentAt,
      police_contacted: policeContacted,
      summary,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      submitter_phone: submitterPhone,
      submitter_ip_hash: hashValue(headerIp(request)),
      user_agent_hash: hashValue(request.headers.get("user-agent") ?? ""),
      emergency_acknowledged: emergencyAcknowledged,
      consent_acknowledged: consentAcknowledged,
      review_status: "new",
      publication_status: "private",
    })
    .select("id, tracking_id")
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Report could not be stored for review." }, { status: 500 });
  }

  const evidenceRows: Array<Record<string, unknown>> = evidenceLinks.map((url) => ({
    report_id: report.id,
    evidence_type: "link",
    external_url: url,
    review_status: "new",
  }));

  for (const file of uploadFiles) {
    const fileName = safeFileName(file.name);
    const storagePath = `${report.id}/${randomUUID()}-${fileName}`;
    const { error: uploadError } = await admin.storage
      .from("predator-report-evidence")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      evidenceRows.push({
        report_id: report.id,
        evidence_type: "upload_failed",
        external_url: `upload failed: ${fileName}`,
        review_status: "error",
      });
      continue;
    }

    evidenceRows.push({
      report_id: report.id,
      evidence_type: "upload",
      external_url: null,
      storage_bucket: "predator-report-evidence",
      storage_path: storagePath,
      file_name: fileName,
      file_size: file.size,
      content_type: file.type || "application/octet-stream",
      review_status: "new",
    });
  }

  if (evidenceRows.length) {
    await admin.from("predator_report_evidence").insert(evidenceRows);
  }

  return NextResponse.json({ ok: true, trackingId: report.tracking_id });
}
