import { footprintJurisdictions } from "@/lib/district-footprint";

/** Only a known public roster path can become the submission's return/context link. */
export function getRosterSourceContext(from: string | undefined) {
  if (!from) return null;
  const { counties, places } = footprintJurisdictions();
  const jurisdiction = [...counties, ...places].find(
    (row) => from === `/home-district/roster/${row.kind}/${row.slug}`,
  );
  if (!jurisdiction) return null;
  return { name: jurisdiction.name, href: from };
}
