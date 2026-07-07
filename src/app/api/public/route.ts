import { NextResponse } from "next/server";
import { getPublicApiAuthState, PUBLIC_API_DISABLED_MESSAGE, PUBLIC_API_ENDPOINTS, recordApiUsageEvent } from "@/lib/public-data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getPublicApiAuthState(request);

  if (!auth.enabled) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        message: PUBLIC_API_DISABLED_MESSAGE,
        request_access_url: "/packages/public-data-api",
        endpoints: PUBLIC_API_ENDPOINTS.map(({ path, label, scope }) => ({ path, label, scope })),
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
    recordsReturned: PUBLIC_API_ENDPOINTS.length,
    metadata: { key_prefix: auth.apiKey.key_prefix, route: "api_index" },
  });

  return NextResponse.json({
    ok: true,
    data: PUBLIC_API_ENDPOINTS,
    meta: {
      message: "Public API foundation is enabled. Endpoint data adapters are released one scope at a time.",
      records_returned: PUBLIC_API_ENDPOINTS.length,
    },
  });
}
