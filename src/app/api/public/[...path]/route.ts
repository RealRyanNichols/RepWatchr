import { NextResponse } from "next/server";
import { getPublicApiAuthState, PUBLIC_API_DISABLED_MESSAGE, recordApiUsageEvent } from "@/lib/public-data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const auth = await getPublicApiAuthState(request);
  const endpointPath = `/api/public/${path.join("/")}`;

  if (!auth.enabled) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        message: PUBLIC_API_DISABLED_MESSAGE,
        request_access_url: "/packages/public-data-api",
        endpoint: endpointPath,
        required_scope: auth.requiredScope,
      },
      { status: 503 },
    );
  }

  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error, required_scope: auth.requiredScope }, { status: auth.status });
  }

  await recordApiUsageEvent({
    apiKeyId: auth.apiKey.id,
    userId: auth.apiKey.user_id,
    endpoint: auth.endpoint,
    method: request.method,
    statusCode: 200,
    recordsReturned: 0,
    metadata: {
      key_prefix: auth.apiKey.key_prefix,
      requested_path: endpointPath,
      scope: auth.requiredScope,
      adapter_status: "pending_public_data_adapter",
    },
  });

  return NextResponse.json({
    ok: true,
    data: [],
    meta: {
      endpoint: endpointPath,
      required_scope: auth.requiredScope,
      records_returned: 0,
      adapter_status: "pending_public_data_adapter",
      safety: "Only approved public-record data will be returned when this adapter is activated.",
    },
  });
}
