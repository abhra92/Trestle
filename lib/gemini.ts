import type { AiDraft } from "./schema";
import { aiDraftSchema, GEMINI_RESPONSE_SCHEMA } from "./schema";
import { cleanLine } from "./sanitize";
import type { Constraints, EventBrief } from "./types";
import { buildSystemInstruction, buildUserPrompt } from "./prompt";
import { readConstraints } from "./constraints";

export type DraftFailure = "timeout" | "quota" | "upstream" | "invalid";

export class DraftError extends Error {
  readonly code: DraftFailure;

  constructor(code: DraftFailure) {
    super(`draft failed: ${code}`);
    this.name = "DraftError";
    this.code = code;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_OUTPUT_TOKENS = 2600;

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; status?: string; message?: string };
}

export async function draftWithGemini(
  brief: EventBrief,
  refine: string,
  now: Date,
): Promise<{ draft: AiDraft; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new DraftError("invalid");

  const model = geminiModel();
  const constraints: Constraints = readConstraints(brief.notes, refine);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: buildSystemInstruction(brief.kind) }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(brief, constraints, refine, now) }] }],
    generationConfig: {
      temperature: 0.65,
      topP: 0.9,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
    safetySettings: [],
  };

  const attempt = async (): Promise<GeminiResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 429) throw new DraftError("quota");
      if (!response.ok) throw new DraftError("upstream");

      return (await response.json()) as GeminiResponse;
    } catch (error) {
      if (error instanceof DraftError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new DraftError("timeout");
      throw new DraftError("upstream");
    } finally {
      clearTimeout(timer);
    }
  };

  let payload: GeminiResponse;
  try {
    payload = await attempt();
  } catch (error) {
    // A timeout usually means the model is saturated. Retrying would double the
    // wait before the local planner can take over, so only transient upstream
    // failures get a second try.
    if (error instanceof DraftError && error.code === "upstream") {
      await new Promise((resolve) => setTimeout(resolve, 650));
      payload = await attempt();
    } else {
      throw error;
    }
  }

  if (payload.promptFeedback?.blockReason) throw new DraftError("invalid");

  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new DraftError("invalid");

  const json = extractJson(text);
  const draft = aiDraftSchema.safeParse(normalizeDraft(json));
  if (!draft.success) throw new DraftError("invalid");

  return { draft: draft.data, model };
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new DraftError("invalid");
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new DraftError("invalid");
    }
  }
}

/**
 * Models occasionally overshoot a length or skip a field the schema promised.
 * Trim what can be trimmed before validation so a good plan is not thrown away
 * over one long sentence. Shape errors still fail.
 */
function normalizeDraft(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const draft = value as Record<string, unknown>;

  const list = (input: unknown): unknown[] => (Array.isArray(input) ? input : []);

  return {
    headline: cleanLine(draft.headline, 140),
    budget: list(draft.budget).map((entry) => {
      const line = (entry ?? {}) as Record<string, unknown>;
      return {
        key: cleanLine(line.key, 40),
        weight: typeof line.weight === "number" ? line.weight : Number(line.weight),
        note: cleanLine(line.note, 160),
      };
    }),
    timeline: list(draft.timeline).map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        label: cleanLine(item.label, 80),
        daysBefore: Math.round(Number(item.daysBefore)),
        detail: cleanLine(item.detail, 200),
      };
    }),
    vendors: list(draft.vendors).map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        label: cleanLine(item.label, 60),
        category: cleanLine(item.category, 40),
        why: cleanLine(item.why, 140),
        priority: cleanLine(item.priority, 20),
      };
    }),
    ideas: list(draft.ideas).map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        title: cleanLine(item.title, 70),
        detail: cleanLine(item.detail, 240),
        effort: cleanLine(item.effort, 20),
        costBand: cleanLine(item.costBand, 20),
      };
    }),
  };
}
