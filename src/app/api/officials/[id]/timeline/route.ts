import { NextResponse } from "next/server";
import { getOfficialTimelineBundle, summarizeTimeline } from "@/lib/official-timeline";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "1000");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(1000, limitParam)) : 1000;
  const bundle = await getOfficialTimelineBundle(id);

  if (!bundle.official) {
    return NextResponse.json(
      {
        ok: false,
        error: "Official not found.",
        events: [],
      },
      { status: 404 },
    );
  }

  const events = bundle.events
    .filter((event) => {
      if (type && event.eventType !== type) return false;
      if (!query) return true;
      return [
        event.title,
        event.summary,
        event.sourceTitle,
        event.sourceDomain,
        event.eventType,
        event.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .slice(0, limit);
  const summary = summarizeTimeline(bundle.events);

  return NextResponse.json({
    ok: true,
    official: {
      id: bundle.official.id,
      name: bundle.official.name,
      position: bundle.official.position,
      jurisdiction: bundle.official.jurisdiction,
      state: bundle.official.state ?? null,
    },
    counts: {
      totalEvents: bundle.events.length,
      returnedEvents: events.length,
      staticEvents: bundle.staticEventCount,
      databaseEvents: bundle.databaseEventCount,
      sourceCount: summary.sourceCount,
      eventTypeCounts: summary.eventTypeCounts,
    },
    filters: {
      type,
      query,
      limit,
    },
    errors: bundle.errors,
    events,
  });
}
