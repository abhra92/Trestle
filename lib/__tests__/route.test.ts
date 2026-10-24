import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../../app/api/plan/route";
import type { DraftResponse } from "../types";

const originalKey = process.env.GEMINI_API_KEY;

function futureDate(daysAhead = 120): string {
  const date = new Date(Date.now() + daysAhead * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function validBrief() {
  return {
    kind: "community",
    title: "Maple Street Summer Fair",
    date: futureDate(),
    guests: 300,
    budget: 800_000,
    currency: "INR",
    location: "Maple Street",
    setting: "mixed",
    vibe: "playful",
    priorities: ["sound", "access"],
    notes: "Need step-free access. Two vegan stalls.",
  };
}

function request(
  body: unknown,
  options: { ip?: string; contentType?: string | null; raw?: string } = {},
): Request {
  const headers = new Headers({ "x-forwarded-for": options.ip ?? `ip-${Math.random()}` });
  if (options.contentType !== null) {
    headers.set("content-type", options.contentType ?? "application/json");
  }
  return new Request("http://localhost/api/plan", {
    method: "POST",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "";
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});

describe("POST /api/plan", () => {
  it("rejects a body that is not declared as JSON", async () => {
    const response = await POST(request({ brief: validBrief() }, { contentType: "text/plain" }));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Send the brief as JSON." });
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request(null, { raw: "{ not json" }));
    expect(response.status).toBe(400);
  });

  it("rejects a body over the size cap", async () => {
    const response = await POST(request(null, { raw: `{"brief":"${"a".repeat(20_000)}"}` }));
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports field errors for an invalid brief", async () => {
    const response = await POST(request({ brief: { ...validBrief(), title: "", date: "2020-01-01" } }));
    expect(response.status).toBe(422);
    const payload = (await response.json()) as { error: string; errors: Record<string, string> };
    expect(payload.error).toBe("Some details need fixing.");
    expect(payload.errors.title).toBe("Give the event a name.");
    expect(payload.errors.date).toBe("This date has already passed.");
  });

  it("rejects priorities outside the event type", async () => {
    const response = await POST(request({ brief: { ...validBrief(), priorities: ["contingency"] } }));
    expect(response.status).toBe(422);
    const payload = (await response.json()) as { errors: Record<string, string> };
    expect(payload.errors.priorities).toBe("Pick priorities from the list for this event type.");
  });

  it("serves the local planner when no key is configured", async () => {
    const brief = validBrief();
    const response = await POST(request({ brief }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    const payload = (await response.json()) as DraftResponse;
    expect(payload.meta.source).toBe("local");
    expect(payload.meta.fallbackReason).toBe("missing-key");
    expect(payload.plan.brief.title).toBe(brief.title);
    expect(payload.plan.source).toBe("local");

    const lines = payload.plan.budget.lines.reduce((sum, line) => sum + line.amount, 0);
    expect(payload.plan.budget.total).toBe(brief.budget);
    expect(lines).toBe(brief.budget);
  });

  it("limits each client to eight drafts a minute", async () => {
    const ip = "203.0.113.7";
    for (let index = 0; index < 8; index += 1) {
      const response = await POST(request({ brief: validBrief() }, { ip }));
      expect(response.status).toBe(200);
    }

    const blocked = await POST(request({ brief: validBrief() }, { ip }));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);

    const other = await POST(request({ brief: validBrief() }, { ip: "203.0.113.8" }));
    expect(other.status).toBe(200);
  });
});
