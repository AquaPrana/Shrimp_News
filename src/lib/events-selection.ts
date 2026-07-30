import type { PublicEvent } from "@/lib/event-types";

export function selectHomepageEvents(events: PublicEvent[], now = new Date()) {
  const ordered = [...events].sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      a.date.localeCompare(b.date) ||
      a.id.localeCompare(b.id),
  );
  let lead = ordered.find((event) => event.isFeatured);
  if (!lead) {
    lead = [...ordered]
      .filter((event) => new Date(`${event.date}T23:59:59.999Z`) >= now)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || ordered[0];
  }
  return {
    lead: lead || null,
    supporting: lead ? ordered.filter((event) => event.id !== lead.id) : [],
  };
}
