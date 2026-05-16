import { NextResponse } from "next/server";
import { emptyProfileOverlay, getPublicProfileOverlay, type ProfileOverlayType } from "@/lib/profile-overlays";

export const dynamic = "force-dynamic";

const allowedTypes = new Set<ProfileOverlayType>([
  "official",
  "school_board",
  "attorney",
  "law_firm",
  "media_company",
  "journalist",
  "editor",
  "law_enforcement_agency",
  "public_safety_official",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;

  if (!allowedTypes.has(type as ProfileOverlayType)) {
    return NextResponse.json(emptyProfileOverlay(false, ["Unsupported profile type."]), { status: 400 });
  }

  const overlay = await getPublicProfileOverlay(type as ProfileOverlayType, id);
  return NextResponse.json(overlay);
}
