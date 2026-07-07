import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildRecordsResponsePacket,
  detectRecordsResponseSensitivity,
  normalizeRecordsResponseInput,
  recommendSensitivityStatus,
  validateRecordsResponseInput,
  type RecordsResponseInput,
} from "@/lib/records-response-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const storageBucket = "records-response-private";
const maxUploadBytes = 10 * 1024 * 1024;

async function getOptionalUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formInput(formData: FormData): RecordsResponseInput {
  return {
    recordsRequestId: formValue(formData, "recordsRequestId"),
    responseTitle: formValue(formData, "responseTitle"),
    agencyName: formValue(formData, "agencyName"),
    jurisdiction: formValue(formData, "jurisdiction"),
    responseType: formValue(formData, "responseType"),
    responseDate: formValue(formData, "responseDate"),
    responseUrl: formValue(formData, "responseUrl"),
    responseText: formValue(formData, "responseText"),
    explanation: formValue(formData, "explanation"),
    userBelievesPublic: formValue(formData, "userBelievesPublic"),
    submitMode: formValue(formData, "submitMode"),
    anonymousId: formValue(formData, "anonymousId"),
    referrer: formValue(formData, "referrer"),
    landingPage: formValue(formData, "landingPage"),
    utmSource: formValue(formData, "utmSource"),
    utmMedium: formValue(formData, "utmMedium"),
    utmCampaign: formValue(formData, "utmCampaign"),
    utmTerm: formValue(formData, "utmTerm"),
    utmContent: formValue(formData, "utmContent"),
  };
}

function uploadFileFromForm(formData: FormData) {
  const value = formData.get("file");
  return value instanceof File && value.size > 0 ? value : null;
}

function safeStorageFileName(value: string) {
  const fallback = "records-response";
  const clean =
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || fallback;
  return clean.includes(".") ? clean : `${clean}.bin`;
}

async function extractTextIfSafe(file: File) {
  if (!file.type.startsWith("text/") || file.size > 200_000) {
    return { text: "", status: "metadata_only" };
  }

  try {
    return { text: (await file.text()).slice(0, 12000), status: "text_extracted" };
  } catch {
    return { text: "", status: "failed" };
  }
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ responses: [] });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("records_responses")
    .select("id, response_title, agency_name, jurisdiction, response_type, response_date, response_url, status, sensitivity_status, public_summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ responses: data ?? [] });
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Use multipart form data." }, { status: 400 });

  if (formValue(formData, "website") || formValue(formData, "company_website")) {
    return NextResponse.json({ ok: true, responseId: "", status: "new" });
  }

  const file = uploadFileFromForm(formData);
  if (file && file.size > maxUploadBytes) {
    return NextResponse.json({ error: "Upload is too large. Keep response documents under 10 MB." }, { status: 400 });
  }

  const normalized = normalizeRecordsResponseInput(formInput(formData));
  const validationError = validateRecordsResponseInput(normalized, Boolean(file));
  const initialFlags = detectRecordsResponseSensitivity(
    `${normalized.responseTitle}\n${normalized.agencyName}\n${normalized.jurisdiction}\n${normalized.responseText}\n${normalized.explanation}`,
  );
  const initialSensitivity = recommendSensitivityStatus(initialFlags);
  const fallbackPacket = buildRecordsResponsePacket({
    ...normalized,
    fileNames: file ? [file.name] : [],
    sensitivityFlags: initialFlags,
    sensitivityStatus: initialSensitivity,
  });

  if (validationError) {
    return NextResponse.json({ error: validationError, packet: fallbackPacket }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "The response intake queue is temporarily unavailable. Copy the packet and try again later.",
        packet: fallbackPacket,
      },
      { status: 503 },
    );
  }

  const user = await getOptionalUser();
  const status = normalized.submitMode === "private" ? "saved_private" : "new";
  const { data: responseRow, error: insertError } = await admin
    .from("records_responses")
    .insert({
      records_request_id: normalized.recordsRequestId || null,
      anonymous_id: normalized.anonymousId || null,
      user_id: user?.id ?? null,
      response_title: normalized.responseTitle || null,
      agency_name: normalized.agencyName,
      jurisdiction: normalized.jurisdiction || null,
      response_type: normalized.responseType,
      response_date: normalized.responseDate,
      response_url: normalized.responseUrl || null,
      response_text: normalized.responseText || null,
      status,
      sensitivity_status: initialSensitivity,
      public_summary: null,
      attribution: {
        user_believes_public: normalized.userBelievesPublic,
        explanation: normalized.explanation,
        referrer: normalized.referrer || null,
        landing_page: normalized.landingPage || null,
        utm_source: normalized.utmSource || null,
        utm_medium: normalized.utmMedium || null,
        utm_campaign: normalized.utmCampaign || null,
        utm_term: normalized.utmTerm || null,
        utm_content: normalized.utmContent || null,
        intake: "records_response_intake",
      },
    })
    .select("id, status, sensitivity_status")
    .maybeSingle();

  if (insertError || !responseRow?.id) {
    return NextResponse.json(
      {
        error: insertError?.message || "The response queue did not return a response ID.",
        packet: fallbackPacket,
      },
      { status: 500 },
    );
  }

  const responseId = String(responseRow.id);
  const fileNames: string[] = [];
  let combinedFlags = initialFlags;

  if (file) {
    const extracted = await extractTextIfSafe(file);
    const fileFlags = detectRecordsResponseSensitivity(`${file.name}\n${extracted.text}`);
    combinedFlags = Array.from(new Set([...combinedFlags, ...fileFlags]));
    fileNames.push(file.name);

    let storagePath: string | null = null;
    let extractionStatus = extracted.status;
    const ownerFolder = user?.id ?? "anonymous";
    const path = `${ownerFolder}/${responseId}/${Date.now()}-${safeStorageFileName(file.name)}`;

    try {
      const upload = await admin.storage.from(storageBucket).upload(path, await file.arrayBuffer(), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upload.error) {
        extractionStatus = "upload_failed";
      } else {
        storagePath = path;
      }
    } catch {
      extractionStatus = "upload_failed";
    }

    const { error: fileError } = await admin.from("records_response_files").insert({
      records_response_id: responseId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      page_count: null,
      extracted_text: extracted.text || null,
      extraction_status: extractionStatus,
      sensitivity_flags: combinedFlags,
    });
    if (fileError) {
      console.warn(JSON.stringify({ level: "warn", msg: "records_response_file_insert_skipped", error: fileError.message }));
    }
  }

  const nextSensitivity = recommendSensitivityStatus(combinedFlags);
  if (nextSensitivity !== initialSensitivity) {
    await admin.from("records_responses").update({ sensitivity_status: nextSensitivity }).eq("id", responseId);
  }

  const packet = buildRecordsResponsePacket({
    ...normalized,
    responseId,
    fileNames,
    sensitivityFlags: combinedFlags,
    sensitivityStatus: nextSensitivity,
  });

  const eventPayload = {
    records_response_id: responseId,
    event_type: status === "saved_private" ? "saved_private" : "submitted_for_review",
    actor_user_id: user?.id ?? null,
    metadata: {
      has_file: Boolean(file),
      response_type: normalized.responseType,
      sensitivity_status: nextSensitivity,
      sensitivity_flags: combinedFlags,
    },
  };
  const { error: eventError } = await admin.from("records_response_events").insert(eventPayload);
  if (eventError) {
    console.warn(JSON.stringify({ level: "warn", msg: "records_response_event_insert_skipped", error: eventError.message }));
  }

  return NextResponse.json({
    ok: true,
    responseId,
    status,
    sensitivityStatus: nextSensitivity,
    packet,
    nextAction:
      "Review status is saved. Keep this packet private until RepWatchr clears the document, source label, and public summary.",
  });
}
