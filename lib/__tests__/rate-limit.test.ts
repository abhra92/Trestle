import { describe, expect, it } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  it("allows the limit then blocks with a retry delay", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 3, 1000, 10_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000, 10_100).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000, 10_200).allowed).toBe(true);

    const blocked = rateLimit(key, 3, 1000, 10_300);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("lets the window slide", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 1, 1000, 20_000).allowed).toBe(true);
    expect(rateLimit(key, 1, 1000, 20_500).allowed).toBe(false);
    expect(rateLimit(key, 1, 1000, 21_100).allowed).toBe(true);
  });

  it("keeps separate budgets per client", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 1000, 30_000).allowed).toBe(true);
    expect(rateLimit(a, 1, 1000, 30_100).allowed).toBe(false);
    expect(rateLimit(b, 1, 1000, 30_100).allowed).toBe(true);
  });
});
