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
  /\b(house of representatives|senate|congress|legislature|general assembly|assembly|court of appeals|supreme court|district court|court of criminal appeals|department of|railroad commission|land office|commission of|board of)\b/i;

/**
 * Some records carry a jurisdiction that describes the office rather than
 * naming a place: "Texas statewide public office", "Alabama statewide public
 * office". Passing that whole string into a title yields "Kay Ivey - Alabama
 * statewide public office Governor" instead of "Kay Ivey - Alabama Governor".
 * 193 records have this shape.
 */
const DESCRIPTIVE_JURISDICTION =
  /\b(statewide|public office|at[- ]large|elected position|government|office of)\b/i;

/** "Alabama statewide public office" -> "Alabama". */
function placeFromDescriptiveJurisdiction(jurisdiction: string) {
  return jurisdiction
    .replace(/\s*\b(statewide|public office|at[- ]large|elected position|government|office of)\b.*$/i, "")
    .trim();
}

/**
 * "City of Athens Mayor" is not how anyone searches. "Athens Mayor" is.
 * The civic prefix carries no query value, so it comes off the front.
 */
function placeSearchName(jurisdiction: string) {
  return jurisdiction.replace(/^(?:city|town|village|borough) of\s+/i, "").trim() || jurisdiction;
}

/**
 * Drops the parts of a place the office already names.
 *
 * An appellate record carries position "Chief Justice, First Court of Appeals"
 * and district "First Court of Appeals, Place 1". Joined naively that reads
 * "Chief Justice, First Court of Appeals, First Court of Appeals, Place 1".
 * Only the segment that adds something survives.
 */
function placeRemainder(office: string, place: string) {
  const lowerOffice = office.toLowerCase();
  const kept = place
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment && !lowerOffice.includes(segment.toLowerCase()));
  return kept.join(", ");
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
  if (TRAILING_JURISDICTION.test(place) || DISTRICT_CODE.test(place)) {
    const remainder = placeRemainder(office, place);
    return remainder ? `${office}, ${remainder}` : office;
  }

  return `${place} ${office}`;
}

/** The <title> for an official's profile. */
export function officialProfileTitle(official: {
  name: string;
  position?: string;
  jurisdiction?: string;
  district?: string;
}) {
  const rawDistrict = (official.district ?? "").replace(/\s+/g, " ").trim();
  const district = DESCRIPTIVE_JURISDICTION.test(rawDistrict)
    ? placeFromDescriptiveJurisdiction(rawDistrict) || rawDistrict
    : rawDistrict;
  const jurisdiction = (official.jurisdiction ?? "").replace(/\s+/g, " ").trim();

  let place = jurisdiction;
  if (INSTITUTION_JURISDICTION.test(jurisdiction)) {
    // A chamber or bench. The district is the place.
    place = district || jurisdiction;
  } else if (DESCRIPTIVE_JURISDICTION.test(jurisdiction)) {
    // An office description. Keep the state or district it names.
    place = district || placeFromDescriptiveJurisdiction(jurisdiction) || jurisdiction;
  }

  let office = officeSearchLabel(official.position, place);
  // A county or city seat that also runs by precinct keeps both.
  if (district && place !== district) {
    const remainder = placeRemainder(office, district);
    if (remainder) office = `${office}, ${remainder}`;
  }
  // Some records are a seat with no incumbent named yet, so the "name" is
  // itself an office string. Titling those "Council Member, District 1 -
  // Longview City Council Member, District 1" helps nobody; the office alone
  // is both accurate and what a person searches.
  if (office && office.toLowerCase().includes(official.name.trim().toLowerCase())) return office;
  return office ? `${official.name} - ${office}` : official.name;
}
