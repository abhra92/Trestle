import { describe, expect, it } from "vitest";
import { buildLocalPlan } from "../planner";
import { filenameFor, planToMarkdown } from "../export";
import type { EventBrief } from "../types";

const brief: EventBrief = {
  kind: "community",
  title: "Maple Street | Summer Fair",
  date: "2027-07-10",
  guests: 300,
  budget: 800_000,
  currency: "INR",
  location: "Maple Street",
  setting: "mixed",
  vibe: "playful",
  priorities: ["sound", "access"],
  notes: "Need step-free access and a quiet room.",
};

describe("planToMarkdown", () => {
  const plan = buildLocalPlan(brief, { now: new Date("2026-10-23T09:00:00Z") });
  const markdown = planToMarkdown(plan);

  it("carries every section of the sheet", () => {
    for (const heading of ["## Budget", "## Timeline", "## Vendors", "## Ideas", "## Before you book", "## Assumptions"]) {
      expect(markdown).toContain(heading);
    }
  });

  it("prints the real total and per guest figure", () => {
    expect(markdown).toContain("**Total**");
    expect(markdown).toContain("per guest");
  });

  it("escapes table pipes so the table stays a table", () => {
    expect(markdown).toContain("Maple Street \\| Summer Fair");
  });

  it("uses no em dash anywhere", () => {
    expect(markdown).not.toContain("\u2014");
  });
});

describe("filenameFor", () => {
  it("builds a portable file name", () => {
    const plan = buildLocalPlan(brief, { now: new Date("2026-10-23T09:00:00Z") });
    expect(filenameFor(plan)).toBe("trestle-maple-street-summer-fair-2027-07-10.md");
  });
});
