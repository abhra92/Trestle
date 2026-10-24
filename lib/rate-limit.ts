interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, number[]>();
let lastSweep = 0;

/**
 * Fixed window limiter kept in process memory. It protects the Gemini quota
 * from a single tab in a loop. A multi-instance deployment would need a shared
 * store, which this app does not assume.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateResult {
  if (now - lastSweep > windowMs * 4) {
    for (const [bucketKey, hits] of buckets) {
      const newest = hits.at(-1);
      if (!newest || now - newest > windowMs) buckets.delete(bucketKey);
    }
    lastSweep = now;
  }

  const hits = (buckets.get(key) ?? []).filter((hit) => now - hit < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return request.headers.get("x-real-ip")?.slice(0, 64) ?? "local";
}
