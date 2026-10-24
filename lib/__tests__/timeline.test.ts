import { describe, expect, it } from "vitest";
import { addDays } from "../dates";
import { buildTimeline, compressSeeds, milestoneStatus } from "../timeline";

describe("buildTimeline", () => {
  it("dates every milestone backwards from the event", () => {
    const eventDate = "2027-06-12";
    const timeline = buildTimeline("wedding", eventDate, 400);
    expect(timeline.compressed).toBe(false);
    expect(timeline.items.length).toBeGreaterThanOrEqual(8);
    const first = timeline.items[0]!;
    expect(first.dueDate).toBe(addDays(eventDate, -first.daysBefore));
    expect(timeline.items.map((item) => item.daysBefore)).toEqual(
      [...timeline.items.map((item) => item.daysBefore)].sort((a, b) => b - a),
    );
  });

  it("compresses the timeline for a close date without piling tasks on one day", () => {
    const timeline = buildTimeline("wedding", "2026-11-20", 30);
    expect(timeline.compressed).toBe(true);
    const days = timeline.items.map((item) => item.daysBefore);
    expect(new Set(days).size).toBe(days.length);
    expect(Math.max(...days)).toBeLessThanOrEqual(30);
    expect(Math.min(...days)).toBeGreaterThanOrEqual(1);
  });

  it("keeps a one day runway usable", () => {
    const timeline = buildTimeline("community", "2026-10-24", 1);
    expect(timeline.items.every((item) => item.daysBefore >= 0)).toBe(true);
    expect(timeline.items.every((item) => item.dueDate <= "2026-10-24")).toBe(true);
  });

  it("leaves short seed lists alone when the runway is long enough", () => {
    const result = compressSeeds([{ label: "Book", daysBefore: 10, detail: "Do it." }], 120);
    expect(result.compressed).toBe(false);
    expect(result.seeds[0]?.daysBefore).toBe(10);
  });
});

describe("milestoneStatus", () => {
  it("marks past, close, done, and future milestones", () => {
    expect(milestoneStatus("2026-01-01", false, "2026-02-01")).toBe("overdue");
    expect(milestoneStatus("2026-02-10", false, "2026-02-01")).toBe("soon");
    expect(milestoneStatus("2026-02-10", true, "2026-02-01")).toBe("done");
    expect(milestoneStatus("2026-04-10", false, "2026-02-01")).toBe("upcoming");
  });
});
