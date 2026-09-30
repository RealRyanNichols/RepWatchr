export function marionDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(date.length === 10 ? `${date}T12:00:00-05:00` : date));
}
