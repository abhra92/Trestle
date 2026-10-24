import type { EventKind } from "./catalog";
import { addDays, daysBetween, todayISO } from "./dates";
import type { Milestone } from "./types";

export interface MilestoneSeed {
  label: string;
  daysBefore: number;
  detail: string;
}

export const TIMELINE_SEEDS: Record<EventKind, MilestoneSeed[]> = {
  wedding: [
    { daysBefore: 300, label: "Book the venue", detail: "Confirm the date, capacity, and what the hire includes before paying a deposit." },
    { daysBefore: 240, label: "Choose food and drink", detail: "Shortlist caterers, ask for a tasting, and agree on a per-head ceiling." },
    { daysBefore: 210, label: "Book the photographer", detail: "Agree coverage hours and a shot list you actually want." },
    { daysBefore: 180, label: "Sort attire and alterations", detail: "Buy early enough that alterations are not a last-week panic." },
    { daysBefore: 150, label: "Send invitations", detail: "Include the reply date and any dietary or access questions." },
    { daysBefore: 120, label: "Book music and ceremony sound", detail: "Confirm power, set times, and who speaks to the band on the day." },
    { daysBefore: 90, label: "Confirm flowers and decor", detail: "Fix the palette and the table count, then stop adding ideas." },
    { daysBefore: 60, label: "Collect replies and build the seating plan", detail: "Chase missing replies in one batch, then seat by who talks to whom." },
    { daysBefore: 30, label: "Confirm every supplier in writing", detail: "Arrival times, contacts, access, and final numbers in one email." },
    { daysBefore: 7, label: "Pack the day box", detail: "Rings, vows, chargers, pins, snacks, and a printed run sheet." },
  ],
  birthday: [
    { daysBefore: 56, label: "Fix the date and the room", detail: "Check the space fits the guest list with room to move." },
    { daysBefore: 42, label: "Book entertainment", detail: "A performer or a playlist plan, decided now and not on the day." },
    { daysBefore: 28, label: "Order the cake", detail: "Ask about allergens and whether delivery is included." },
    { daysBefore: 21, label: "Send invitations", detail: "State the food, the end time, and whether siblings are welcome." },
    { daysBefore: 14, label: "Plan the food", detail: "Catering or a home kitchen plan, with one dish for each dietary need." },
    { daysBefore: 10, label: "Shop decor and supplies", detail: "Buy from one list, in one trip, with a receipt." },
    { daysBefore: 7, label: "Confirm numbers", detail: "Tell the caterer and the cake maker the final count." },
    { daysBefore: 1, label: "Set up and charge everything", detail: "Tables, candles, speaker, camera, and a bin near every table." },
  ],
  community: [
    { daysBefore: 120, label: "Start the permit paperwork", detail: "Council permissions and road closures take longer than the event itself." },
    { daysBefore: 100, label: "Lock the site", detail: "Walk the space and write down power, water, access, and toilets." },
    { daysBefore: 90, label: "Arrange insurance", detail: "Public liability cover in the name of the organising group." },
    { daysBefore: 75, label: "Approach sponsors and stallholders", detail: "Ask for a specific amount and say what they get in return." },
    { daysBefore: 60, label: "Recruit volunteers", detail: "Write shifts, name a lead per zone, and collect phone numbers." },
    { daysBefore: 45, label: "Publish the programme", detail: "One poster, one online post, and a printed version for noticeboards." },
    { daysBefore: 30, label: "Confirm stalls and deliveries", detail: "Vehicle access windows, pitch sizes, and who meets each van." },
    { daysBefore: 14, label: "Run the safety check", detail: "First aid, fire points, weather call, and a named person for each." },
    { daysBefore: 2, label: "Set up the site", detail: "Signage, bins, stage, and a printed map at the entrance." },
  ],
};

export function compressSeeds(seeds: readonly MilestoneSeed[], daysUntil: number): { seeds: MilestoneSeed[]; compressed: boolean } {
  if (seeds.length === 0) return { seeds: [], compressed: false };
  const longest = Math.max(...seeds.map((seed) => seed.daysBefore));
  if (daysUntil >= longest) return { seeds: [...seeds], compressed: false };

  const runway = Math.max(0, daysUntil);
  const factor = runway <= 1 ? 0 : Math.min(1, (runway - 1) / longest);
  const seen = new Set<number>();
  const compressed: MilestoneSeed[] = [];

  for (const seed of seeds) {
    let daysBefore = Math.max(0, Math.round(seed.daysBefore * factor));
    while (seen.has(daysBefore) && daysBefore > 0) daysBefore -= 1;
    seen.add(daysBefore);
    compressed.push({ ...seed, daysBefore });
  }

  return {
    seeds: compressed.sort((a, b) => b.daysBefore - a.daysBefore),
    compressed: true,
  };
}

export function buildTimeline(
  kind: EventKind,
  eventDate: string,
  eventDaysUntil: number,
  seeds: readonly MilestoneSeed[] = TIMELINE_SEEDS[kind],
): { items: Milestone[]; compressed: boolean } {
  const { seeds: fitted, compressed } = compressSeeds(seeds, Math.max(0, eventDaysUntil));
  const items = fitted.map((seed, index) => ({
    id: `m-${index + 1}-${seed.daysBefore}`,
    label: seed.label,
    detail: seed.detail,
    daysBefore: seed.daysBefore,
    dueDate: addDays(eventDate, -seed.daysBefore),
    done: false,
  }));
  return { items, compressed };
}

export function milestoneStatus(
  dueDate: string,
  done: boolean,
  today: string = todayISO(),
): "done" | "overdue" | "soon" | "upcoming" {
  if (done) return "done";
  const gap = daysBetween(today, dueDate);
  if (gap < 0) return "overdue";
  if (gap <= 14) return "soon";
  return "upcoming";
}
