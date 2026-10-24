import { z } from "zod";
import {
  COST_BANDS,
  CURRENCIES,
  EFFORT_LEVELS,
  EVENT_KINDS,
  PRIORITY_LEVELS,
  SETTINGS,
  VIBES,
  categoryKeys,
} from "./catalog";
import { parseISODate } from "./dates";
import { cleanLine } from "./sanitize";

export const briefSchema = z.object({
  kind: z.enum(EVENT_KINDS),
  title: z.string().trim().min(1, "Give the event a name.").max(80, "Keep the name under 80 characters."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  guests: z.coerce
    .number()
    .int("Guest count must be a whole number.")
    .min(1, "At least one guest.")
    .max(5000, "This planner is built for up to 5,000 guests."),
  budget: z.coerce
    .number()
    .min(1, "Add a budget above zero.")
    .max(100_000_000, "That budget is out of range."),
  currency: z.enum(CURRENCIES),
  location: z.string().trim().min(1, "Add a city or venue.").max(80, "Keep the location under 80 characters."),
  setting: z.enum(SETTINGS),
  vibe: z.enum(VIBES),
  priorities: z.array(z.string()).max(3, "Choose up to three priorities."),
  notes: z.string().max(600, "Keep notes under 600 characters."),
});

export type BriefInput = z.infer<typeof briefSchema>;

export type BriefFieldErrors = Partial<Record<keyof BriefInput, string>>;

export interface BriefValidation {
  ok: boolean;
  data?: BriefInput;
  errors: BriefFieldErrors;
}

function dateIssue(value: string, now: Date): string | undefined {
  const eventDate = parseISODate(value);
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  if (!eventDate) return "Use a real calendar date.";
  if (value < today.toISOString().slice(0, 10)) return "This date has already passed.";
  if (eventDate.getTime() - today.getTime() > 6 * 365 * 86_400_000) return "Plan up to six years ahead.";
  return undefined;
}

export function validateBrief(input: unknown, now: Date = new Date()): BriefValidation {
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) {
    const errors: BriefFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof BriefInput] = issue.message;
      }
    }

    // A well formed date still deserves its semantic check when another field
    // fails to parse, otherwise the host fixes one problem and finds another.
    const rawDate =
      input && typeof input === "object" ? (input as { date?: unknown }).date : undefined;
    if (!errors.date && typeof rawDate === "string") {
      const issue = dateIssue(rawDate, now);
      if (issue) errors.date = issue;
    }

    return { ok: false, errors };
  }

  const data = parsed.data;
  const errors: BriefFieldErrors = {};

  const issue = dateIssue(data.date, now);
  if (issue) errors.date = issue;

  const allowed = new Set(categoryKeys(data.kind));
  const priorities = [...new Set(data.priorities.map((item) => cleanLine(item, 40)))];
  const invalid = priorities.filter((item) => item === "contingency" || !allowed.has(item));
  if (invalid.length > 0) {
    errors.priorities = "Pick priorities from the list for this event type.";
  }

  data.priorities = priorities;
  data.notes = cleanLine(data.notes, 600);
  data.title = cleanLine(data.title, 80);
  data.location = cleanLine(data.location, 80);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data, errors: {} };
}

export const refineSchema = z.string().max(240, "Keep the revision under 240 characters.");

export const aiBudgetLineSchema = z.object({
  key: z.string().min(1).max(40),
  weight: z.number().positive().max(1),
  note: z.string().min(1).max(160),
});

export const aiMilestoneSchema = z.object({
  label: z.string().min(2).max(80),
  daysBefore: z.number().int().min(0).max(400),
  detail: z.string().min(2).max(200),
});

export const aiVendorSchema = z.object({
  label: z.string().min(2).max(60),
  category: z.string().min(2).max(40),
  why: z.string().min(2).max(140),
  priority: z.enum(PRIORITY_LEVELS),
});

export const aiIdeaSchema = z.object({
  title: z.string().min(2).max(70),
  detail: z.string().min(8).max(240),
  effort: z.enum(EFFORT_LEVELS),
  costBand: z.enum(COST_BANDS),
});

export const aiDraftSchema = z.object({
  headline: z.string().min(4).max(140),
  budget: z.array(aiBudgetLineSchema).min(4).max(12),
  timeline: z.array(aiMilestoneSchema).min(4).max(12),
  vendors: z.array(aiVendorSchema).min(3).max(14),
  ideas: z.array(aiIdeaSchema).min(3).max(6),
});

export type AiDraft = z.infer<typeof aiDraftSchema>;

const stringArray = { type: "ARRAY", items: { type: "STRING" } };

/**
 * Response schema sent to Gemini. Keeping it explicit stops the model from
 * freelancing fields the app cannot validate or render.
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    budget: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          weight: { type: "NUMBER" },
          note: { type: "STRING" },
        },
        required: ["key", "weight", "note"],
      },
    },
    timeline: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          daysBefore: { type: "INTEGER" },
          detail: { type: "STRING" },
        },
        required: ["label", "daysBefore", "detail"],
      },
    },
    vendors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          category: { type: "STRING" },
          why: { type: "STRING" },
          priority: { type: "STRING", enum: [...PRIORITY_LEVELS] },
        },
        required: ["label", "category", "why", "priority"],
      },
    },
    ideas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
          effort: { type: "STRING", enum: [...EFFORT_LEVELS] },
          costBand: { type: "STRING", enum: [...COST_BANDS] },
        },
        required: ["title", "detail", "effort", "costBand"],
      },
    },
  },
  required: ["headline", "budget", "timeline", "vendors", "ideas"],
} as const;

export { stringArray };
