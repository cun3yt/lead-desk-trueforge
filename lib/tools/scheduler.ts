// Ambiguous CRM scheduler link "Acme demo call", owned by the sales rep (Cuneyt).
// Public endpoints: GET …/slots?date=YYYY-MM-DD, POST …/book.
// Quirk: the link's business hours are applied in UTC, so 9:00–17:00 Pacific is stored as 16:00–24:00.

export const SCHEDULER_LINK = process.env.CONCIERGE_SCHEDULER_LINK ?? "hackathoncool/cuneyt.mertayak/acme-demo";
export const TIMEZONE = process.env.CONCIERGE_TIMEZONE ?? "America/Los_Angeles";
export const schedulerPath = `/api/public/scheduler/${SCHEDULER_LINK}`;

export function slotLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

export function localHour(iso: string) {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIMEZONE }).format(new Date(iso)));
}
