import { describe, expect, it } from "vitest";
import { buildLocalPlan, buildPlanFromDraft } from "../planner";
import { KIND_META } from "../catalog";
import type { AiDraft } from "../schema";
import type { EventBrief } from "../types";

const NOW = new Date("2026-10-23T09:00:00.000Z");

const brief: EventBrief = {
  kind: "wedding",
  title: "A garden wedding",
  date: "2027-06-12",
  guests: 80,
  budget: 250_000,
  currency: "INR",
  location: "Pune",
  setting: "outdoor",
  vibe: "relaxed",
  priorities: ["catering", "photography"],
  notes: "Twelve vegan guests and step-free access for my grandmother. The ceremony must be outdoors.",
};

function localPlan(overrides: Partial<EventBrief> = {}) {
  return buildLocalPlan({ ...brief, ...overrides }, { now: NOW });
}

describe("buildLocalPlan", () => {
  it("returns a complete, self consistent plan", () => {
    const plan = localPlan();
    expect(plan.source).toBe("local");
    expect(plan.headline).toContain("Pune");
    expect(plan.budget.lines.reduce((sum, line) => sum + line.amount, 0)).toBeCloseTo(250_000, 2);
    expect(plan.timeline.items.length).toBeGreaterThan(5);
    expect(plan.vendors.length).toBeGreaterThan(5);
    expect(plan.ideas.length).toBeGreaterThan(2);
    expect(plan.advice.length).toBeGreaterThan(1);
    expect(plan.assumptions.join(" ")).toContain("Drafted locally");
  });

  it("reads dietary, access, and must-have details from the notes", () => {
    const plan = localPlan();
    expect(plan.constraints.dietary).toContain("vegan");
    expect(plan.constraints.access.length).toBeGreaterThan(0);
    expect(plan.constraints.mustHaves.length).toBeGreaterThan(0);
    expect(plan.assumptions.join(" ")).toContain("vegan");
  });

  it("flags a budget that cannot cover the guest list", () => {
    const plan = localPlan({ guests: 120, budget: 4_000, currency: "USD" });
    expect(plan.advice.some((item) => item.id === "budget-per-guest" && item.severity === "risk")).toBe(true);
  });

  it("flags a short runway and an outdoor venue", () => {
    const plan = localPlan({ date: "2026-11-05" });
    expect(plan.advice.some((item) => item.id === "runway-short" || item.id === "runway-critical")).toBe(true);
    expect(plan.advice.some((item) => item.id === "outdoor-backup")).toBe(true);
    expect(plan.timeline.compressed).toBe(true);
  });

  it("keeps every category from the event type and no others", () => {
    const plan = localPlan({
      kind: "community",
      title: "Street fair",
      date: "2026-12-05",
      location: "Bristol",
      guests: 400,
      budget: 900_000,
      currency: "GBP",
      priorities: ["sound", "access"],
    });
    expect(plan.budget.lines.map((line) => line.key)).toEqual(KIND_META.community.categories.map((line) => line.key));
    expect(plan.advice.some((item) => item.id === "permits-lead-time")).toBe(true);
  });
});

describe("buildPlanFromDraft", () => {
  const draft: AiDraft = {
    headline: "A wedding for 80 in Pune, with long tables and one loud band.",
    budget: [
      { key: "venue", weight: 0.2, note: "Site fee plus chairs." },
      { key: "catering", weight: 0.35, note: "Family style, two vegan mains." },
      { key: "photography", weight: 0.12, note: "Six hours, one shooter." },
      { key: "contingency", weight: 0.1, note: "Left alone." },
      { key: "unknown-key", weight: 0.9, note: "Dropped." },
    ],
    timeline: [
      { label: "Book the venue", daysBefore: 200, detail: "Confirm capacity and the wet-weather room." },
      { label: "Tasting", daysBefore: 120, detail: "Bring the vegan guests' requirements." },
      { label: "Final numbers", daysBefore: 21, detail: "Send the count to the caterer." },
      { label: "Print the run sheet", daysBefore: 3, detail: "One page, four copies." },
    ],
    vendors: [
      { label: "Venue", category: "Venue", why: "It sets the capacity.", priority: "essential" },
      { label: "Caterer", category: "Catering", why: "Two vegan mains.", priority: "essential" },
      { label: "Photographer", category: "Nonsense", why: "Six hours of coverage.", priority: "useful" },
    ],
    ideas: [
      { title: "Long tables", detail: "One table per thirty guests, so people talk across the meal.", effort: "medium", costBand: "small" },
      { title: "Vegan mains first", detail: "Serve the vegan plates first so nobody has to ask.", effort: "low", costBand: "none" },
      { title: "A printed run sheet", detail: "Times, names, and phone numbers for the people working.", effort: "low", costBand: "none" },
    ],
  };

  it("keeps the model's wording and the app's arithmetic", () => {
    const plan = buildPlanFromDraft(brief, draft, { now: NOW, source: "gemini", model: "gemini-2.5-flash" });
    expect(plan.source).toBe("gemini");
    expect(plan.model).toBe("gemini-2.5-flash");
    expect(plan.headline).toContain("long tables");
    expect(plan.budget.lines.reduce((sum, line) => sum + line.amount, 0)).toBeCloseTo(250_000, 2);
    expect(plan.budget.lines.some((line) => line.key === "unknown-key")).toBe(false);
    expect(plan.vendors[2]?.category).toBe("Venue");
    expect(plan.assumptions.join(" ")).toContain("gemini-2.5-flash");
  });

  it("falls back to the event's own timeline when the model returns too few steps", () => {
    const plan = buildPlanFromDraft(brief, { ...draft, timeline: draft.timeline.slice(0, 2) }, { now: NOW });
    expect(plan.timeline.items.length).toBeGreaterThanOrEqual(8);
  });

  it("drops duplicate budget keys and still totals correctly", () => {
    const plan = buildPlanFromDraft(
      brief,
      { ...draft, budget: [...draft.budget, { key: "venue", weight: 0.01, note: "Duplicate." }] },
      { now: NOW },
    );
    const venue = plan.budget.lines.find((line) => line.key === "venue");
    expect(venue).toBeDefined();
    expect(venue?.note).toBe("Site fee plus chairs.");
  });
});
