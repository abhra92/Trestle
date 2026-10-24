import { NextResponse } from "next/server";
import { buildLocalPlan, buildPlanFromDraft } from "@/lib/planner";
import { DraftError, draftWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { validateBrief } from "@/lib/schema";
import { cleanLine } from "@/lib/sanitize";
import type { DraftMeta, DraftResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

function responseHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra,
  };
}

function fail(message: string, status: number, extra?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers: responseHeaders(extra) });
}

export async function POST(request: Request) {
  const started = Date.now();
  const limit = rateLimit(clientKey(request), RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return fail(
      `That is ${RATE_LIMIT} drafts in a minute. Try again in ${limit.retryAfterSeconds} seconds.`,
      429,
      { "retry-after": String(limit.retryAfterSeconds) },
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return fail("Send the brief as JSON.", 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return fail("That brief is too large.", 413);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return fail("That brief is too large.", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("That request was not valid JSON.", 400);
  }

  if (!body || typeof body !== "object") return fail("Add a brief to the request.", 400);
  const payload = body as { brief?: unknown; refine?: unknown };

  const validation = validateBrief(payload.brief);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      { error: "Some details need fixing.", errors: validation.errors },
      { status: 422, headers: responseHeaders() },
    );
  }

  const brief = validation.data;
  const refine = typeof payload.refine === "string" ? cleanLine(payload.refine, 240) : "";
  const now = new Date();

  try {
    if (isGeminiConfigured()) {
      try {
        const { draft, model } = await draftWithGemini(brief, refine, now);
        const plan = buildPlanFromDraft(brief, draft, { now, source: "gemini", model });
        const meta: DraftMeta = { source: "gemini", model, elapsedMs: Date.now() - started };
        const result: DraftResponse = { plan, meta };
        return NextResponse.json(result, { headers: responseHeaders() });
      } catch (error) {
        const fallbackReason = error instanceof DraftError ? error.code : "upstream";
        const plan = buildLocalPlan(brief, { now, source: "local" });
        const meta: DraftMeta = { source: "local", fallbackReason, elapsedMs: Date.now() - started };
        console.warn(`[plan] gemini draft failed: ${fallbackReason}; served the local planner`);
        return NextResponse.json({ plan, meta } satisfies DraftResponse, { headers: responseHeaders() });
      }
    }

    const plan = buildLocalPlan(brief, { now, source: "local" });
    const meta: DraftMeta = {
      source: "local",
      fallbackReason: "missing-key",
      elapsedMs: Date.now() - started,
    };
    return NextResponse.json({ plan, meta } satisfies DraftResponse, { headers: responseHeaders() });
  } catch (error) {
    console.error("[plan] unexpected failure", error instanceof Error ? error.name : "unknown");
    return fail("The draft could not be built. Try once more.", 500);
  }
}
