import { describe, expect, it } from "vitest";
import { aiDraftSchema, validateBrief } from "../schema";

const NOW = new Date("2026-10-23T09:00:00.000Z");

const validBrief = {
  kind: "birthday",
  title: "Nina turns forty",
  date: "2026-12-05",
  guests: 30,
  budget: 60_000,
  currency: "INR",
  location: "Pune",
  setting: "indoor",
  vibe: "playful",
  priorities: ["cake", "entertainment"],
  notes: "Two guests are vegan.",
};

describe("validateBrief", () => {
  it("accepts a complete brief", () => {
    const result = validateBrief(validBrief, NOW);
    expect(result.ok).toBe(true);
    expect(result.data?.priorities).toEqual(["cake", "entertainment"]);
  });

  it("rejects a date in the past", () => {
    const result = validateBrief({ ...validBrief, date: "2026-01-01" }, NOW);
    expect(result.ok).toBe(false);
    expect(result.errors.date).toMatch(/passed/i);
  });

  it("still reports the date when another field also fails", () => {
    const result = validateBrief({ ...validBrief, title: "", date: "2026-01-01" }, NOW);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.date).toMatch(/passed/i);
  });

  it("rejects impossible or fractional guest counts", () => {
    expect(validateBrief({ ...validBrief, guests: 0 }, NOW).errors.guests).toBeDefined();
    expect(validateBrief({ ...validBrief, guests: 12.5 }, NOW).errors.guests).toBeDefined();
    expect(validateBrief({ ...validBrief, guests: 6000 }, NOW).errors.guests).toBeDefined();
  });

  it("rejects priorities from another event type and the contingency line", () => {
    expect(validateBrief({ ...validBrief, priorities: ["catering"] }, NOW).ok).toBe(false);
    expect(validateBrief({ ...validBrief, kind: "wedding", priorities: ["contingency"] }, NOW).ok).toBe(false);
  });

  it("rejects a fourth priority", () => {
    const result = validateBrief({ ...validBrief, priorities: ["cake", "entertainment", "venue", "food"] }, NOW);
    expect(result.ok).toBe(false);
    expect(result.errors.priorities).toBeDefined();
  });

  it("cleans notes: no em dash and no emoji", () => {
    const result = validateBrief(
      { ...validBrief, notes: "Vegan guests \u2014 arrive at four \u{1F389}" },
      NOW,
    );
    expect(result.ok).toBe(true);
    expect(result.data?.notes).toBe("Vegan guests, arrive at four");
    expect(result.data?.notes).not.toContain("\u2014");
  });

  it("rejects notes over the limit", () => {
    const result = validateBrief({ ...validBrief, notes: "a".repeat(601) }, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown currency", () => {
    const result = validateBrief({ ...validBrief, currency: "BTC" }, NOW);
    expect(result.ok).toBe(false);
  });
});

describe("aiDraftSchema", () => {
  const draft = {
    headline: "A fortieth with a long table and a cake at four.",
    budget: [
      { key: "venue", weight: 0.2, note: "Hall and tables." },
      { key: "food", weight: 0.3, note: "Family style." },
      { key: "cake", weight: 0.1, note: "Two cakes." },
      { key: "contingency", weight: 0.1, note: "Buffer." },
    ],
    timeline: [
      { label: "Book the hall", daysBefore: 40, detail: "Check the kitchen." },
      { label: "Order the cake", daysBefore: 21, detail: "Ask about allergens." },
      { label: "Send invitations", daysBefore: 14, detail: "State the end time." },
      { label: "Set up", daysBefore: 1, detail: "Tables and speaker." },
    ],
    vendors: [
      { label: "Hall", category: "Venue", why: "Capacity and access.", priority: "essential" },
      { label: "Cake maker", category: "Cake", why: "Allergens and delivery.", priority: "essential" },
      { label: "DJ", category: "Entertainment", why: "One good set.", priority: "useful" },
    ],
    ideas: [
      { title: "Cake at four", detail: "A fixed time gives the party a spine.", effort: "low", costBand: "none" },
      { title: "One long table", detail: "People talk across the meal instead of down it.", effort: "medium", costBand: "small" },
      { title: "Notes box", detail: "Ask guests to leave a card instead of a favour.", effort: "low", costBand: "none" },
    ],
  };

  it("accepts a well formed draft", () => {
    expect(aiDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("rejects an invented priority or effort value", () => {
    expect(
      aiDraftSchema.safeParse({ ...draft, vendors: [{ ...draft.vendors[0], priority: "urgent" }] }).success,
    ).toBe(false);
    expect(
      aiDraftSchema.safeParse({ ...draft, ideas: [{ ...draft.ideas[0], effort: "extreme" }] }).success,
    ).toBe(false);
  });

  it("rejects a draft with too few ideas", () => {
    expect(aiDraftSchema.safeParse({ ...draft, ideas: draft.ideas.slice(0, 2) }).success).toBe(false);
  });
});
