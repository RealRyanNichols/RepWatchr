export function normalizeSearchQuery(value: unknown, maxLength = 220) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeSearchKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 220);
}
