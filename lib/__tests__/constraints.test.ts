import { describe, expect, it } from "vitest";
import { readConstraints } from "../constraints";

describe("readConstraints", () => {
  it("finds dietary and access needs in plain notes", () => {
    const result = readConstraints(
      "Twelve vegan guests and two gluten-free. Step-free access for my grandmother, and a quiet room would help.",
    );
    expect(result.dietary).toContain("vegan");
    expect(result.dietary).toContain("gluten-free");
    expect(result.access).toContain("step-free or wheelchair access");
    expect(result.access).toContain("a quiet room");
  });

  it("finds the must-have sentence, not the whole note", () => {
    const result = readConstraints(
      "We have 40 guests. The ceremony must be outdoors at sunset. Parking is limited.",
    );
    expect(result.mustHaves).toHaveLength(1);
    expect(result.mustHaves[0]).toContain("must be outdoors");
    expect(result.mustHaves[0]).not.toContain("Parking");
  });

  it("detects a dry event", () => {
    const result = readConstraints("No alcohol at the reception, please.");
    expect(result.dietary).toContain("no alcohol");
  });

  it("returns empty lists for empty or unrelated notes", () => {
    expect(readConstraints("")).toEqual({ dietary: [], access: [], mustHaves: [] });
    expect(readConstraints("The band is my cousin's group.")).toEqual({ dietary: [], access: [], mustHaves: [] });
  });

  it("combines the brief notes with a revision instruction", () => {
    const result = readConstraints("", "Make it vegan and step-free.");
    expect(result.dietary).toContain("vegan");
    expect(result.access.length).toBeGreaterThan(0);
  });
});
