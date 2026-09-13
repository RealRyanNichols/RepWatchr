/**
 * How an office reads when someone searches for it.
 *
 * Profile titles used to be "Maxey Cerliano - County Sheriff". The words
 * "Gregg County" were in the record and in the description, but never in the
 * title, so the highest-intent query on this beat - "Gregg County sheriff" -
 * had nothing to match. This builds the phrase a person actually types.
 */

/** Jurisdictions that read better after the office than in front of it. */
const TRAILING_JURISDICTION = /\b(district|precinct|ward|place|seat|position|at-large)\b/i;

/** "HD-7", "TX-1", "SD-1" - a district code, which also reads better trailing. */
const DISTRICT_CODE = /^[A-Za-z]{1,3}-?\d+$/;

/**
 * A chamber or bench is an institution, not a place. Someone searching for Jay
 * Dean types "HD-7 state rep", never "Texas House of Representatives State
 * Representative", so where a district is on the record it wins.
 */
const INSTITUTION_JURISDICTION =
  /\b(house of representatives|senate|congress|legislature|general assembly|assembly|court of appeals|supreme court|district court|court of criminal appeals)\b/i;

/**
 * "City of Athens Mayor" is not how anyone searches. "Athens Mayor" is.
 * The civic prefix carries no query value, so it comes off the front.
 */
function placeSearchName(jurisdiction: string) {
  return jurisdiction.replace(/^(?:city|town|village|borough) of\s+/i, "").trim() || jurisdiction;
}

export function officeSearchLabel(position?: string, jurisdiction?: string) {
  const office = (position ?? "").replace(/\s+/g, " ").trim();
  const place = placeSearchName((jurisdiction ?? "").replace(/\s+/g, " ").trim());
  if (!place) return office;
  if (!office) return place;

  const normalizedOffice = office.toLowerCase();
  const normalizedPlace = place.toLowerCase();

  // The office already names its place: "Gregg County Sheriff".
  if (normalizedOffice.includes(normalizedPlace)) return office;

  // "Gregg County" + "County Sheriff" reads "Gregg County Sheriff", not
  // "Gregg County County Sheriff".
  const placeTail = normalizedPlace.split(" ").pop() ?? "";
  if (placeTail && normalizedOffice.startsWith(`${placeTail} `)) {
    return `${place} ${office.slice(placeTail.length + 1)}`;
  }

  // "U.S. Representative, Texas District 1" beats "Texas District 1 U.S.
  // Representative".
  if (TRAILING_JURISDICTION.test(place) || DISTRICT_CODE.test(place)) return `${office}, ${place}`;

  return `${place} ${office}`;
}

/** The <title> for an official's profile. */
export function officialProfileTitle(official: {
  name: string;
  position?: string;
  jurisdiction?: string;
  district?: string;
}) {
  const district = (official.district ?? "").replace(/\s+/g, " ").trim();
  const jurisdiction = (official.jurisdiction ?? "").replace(/\s+/g, " ").trim();
  const place = INSTITUTION_JURISDICTION.test(jurisdiction) ? district || jurisdiction : jurisdiction;

  let office = officeSearchLabel(official.position, place);
  // A county or city seat that also runs by precinct keeps both.
  if (district && place !== district && !office.toLowerCase().includes(district.toLowerCase())) {
    office = `${office}, ${district}`;
  }
  return office ? `${official.name} - ${office}` : official.name;
}
