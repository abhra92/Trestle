import { KIND_META, categoryKeys } from "./catalog";
import { buildBudget } from "./budget";
import { readConstraints } from "./constraints";
import { daysUntil, formatDate } from "./dates";
import { formatMoney, pluralize } from "./format";
import { buildIdeas } from "./ideas";
import { makeId, randomToken } from "./ids";
import { buildAdvice, formatList, standardSplitNote } from "./rules";
import { cleanLine } from "./sanitize";
import type { AiDraft } from "./schema";
import { TIMELINE_SEEDS, buildTimeline, type MilestoneSeed } from "./timeline";
import type { EventBrief, Idea, Plan, VendorItem } from "./types";
import { buildVendors } from "./vendors";

interface BuildOptions {
  now?: Date;
  source?: "gemini" | "local";
  model?: string;
}

export function buildLocalPlan(brief: EventBrief, options: BuildOptions = {}): Plan {
  const now = options.now ?? new Date();
  const remaining = Math.max(0, daysUntil(brief.date, now));
  const constraints = readConstraints(brief.notes);
  const budget = buildBudget(brief.kind, brief.budget, brief.guests, brief.priorities);
  const timeline = buildTimeline(brief.kind, brief.date, remaining);
  const vendors = localVendors(brief);
  const ideas = buildIdeas(brief.kind, brief.vibe, brief.priorities, constraints, brief.setting);
  const advice = buildAdvice(brief, {
    daysUntil: remaining,
    budgetLines: budget.lines,
    perGuest: budget.perGuest,
    constraints,
    compressed: timeline.compressed,
  });

  return {
    id: `plan-${randomToken(6)}`,
    createdAt: now.toISOString(),
    source: options.source ?? "local",
    model: options.model,
    headline: localHeadline(brief),
    currency: brief.currency,
    brief,
    constraints,
    budget,
    timeline: { eventDate: brief.date, compressed: timeline.compressed, items: timeline.items },
    vendors,
    ideas,
    advice,
    assumptions: buildAssumptions(brief, {
      remaining,
      compressed: timeline.compressed,
      constraints,
      budgetTotal: budget.total,
      source: options.source ?? "local",
      model: options.model,
    }),
  };
}

export function buildPlanFromDraft(brief: EventBrief, draft: AiDraft, options: BuildOptions = {}): Plan {
  const now = options.now ?? new Date();
  const remaining = Math.max(0, daysUntil(brief.date, now));
  const constraints = readConstraints(brief.notes);
  const allowedKeys = new Set(categoryKeys(brief.kind));

  const weights: Record<string, number> = {};
  const notes: Record<string, string> = {};
  for (const line of draft.budget) {
    const key = cleanLine(line.key, 40);
    if (!allowedKeys.has(key)) continue;
    const note = cleanLine(line.note, 160);
    if (!Number.isFinite(line.weight) || line.weight <= 0) continue;
    weights[key] = Math.max(weights[key] ?? 0, line.weight);
    if (note && !notes[key]) notes[key] = note;
  }
  const usableWeights = Object.keys(weights).length >= 3 ? weights : undefined;

  const budget = buildBudget(brief.kind, brief.budget, brief.guests, brief.priorities, notes, usableWeights);

  const seeds = resolveSeeds(brief, draft);
  const timeline = buildTimeline(brief.kind, brief.date, remaining, seeds);
  const vendors = resolveVendors(brief, draft);
  const ideas = resolveIdeas(draft, brief, constraints);
  const advice = buildAdvice(brief, {
    daysUntil: remaining,
    budgetLines: budget.lines,
    perGuest: budget.perGuest,
    constraints,
    compressed: timeline.compressed,
  });

  return {
    id: `plan-${randomToken(6)}`,
    createdAt: now.toISOString(),
    source: options.source ?? "gemini",
    model: options.model,
    headline: cleanLine(draft.headline, 140) || localHeadline(brief),
    currency: brief.currency,
    brief,
    constraints,
    budget,
    timeline: { eventDate: brief.date, compressed: timeline.compressed, items: timeline.items },
    vendors,
    ideas,
    advice,
    assumptions: buildAssumptions(brief, {
      remaining,
      compressed: timeline.compressed,
      constraints,
      budgetTotal: budget.total,
      source: options.source ?? "gemini",
      model: options.model,
    }),
  };
}

function resolveSeeds(brief: EventBrief, draft: AiDraft): MilestoneSeed[] {
  const seen = new Set<string>();
  const seeds: MilestoneSeed[] = [];
  for (const item of draft.timeline) {
    const label = cleanLine(item.label, 80);
    const detail = cleanLine(item.detail, 200);
    if (label.length < 2 || detail.length < 2) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push({
      label,
      detail,
      daysBefore: Math.max(0, Math.min(400, Math.round(item.daysBefore))),
    });
  }
  if (seeds.length < 4) return TIMELINE_SEEDS[brief.kind];
  return seeds.sort((a, b) => b.daysBefore - a.daysBefore).slice(0, 12);
}

function resolveVendors(brief: EventBrief, draft: AiDraft): VendorItem[] {
  const allowed = new Set(KIND_META[brief.kind].vendorCategories);
  const seen = new Set<string>();
  const vendors: VendorItem[] = [];

  for (const item of draft.vendors) {
    const label = cleanLine(item.label, 60);
    const why = cleanLine(item.why, 140);
    const category = cleanLine(item.category, 40);
    if (label.length < 2 || why.length < 2) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    vendors.push({
      id: makeId("vendor"),
      label,
      category: allowed.has(category) ? category : (KIND_META[brief.kind].vendorCategories[0] ?? "General"),
      why,
      priority: item.priority,
      booked: false,
    });
  }

  if (vendors.length < 3) return localVendors(brief);
  return vendors.slice(0, 12);
}

function resolveIdeas(draft: AiDraft, brief: EventBrief, constraints: Plan["constraints"]): Idea[] {
  const seen = new Set<string>();
  const ideas: Idea[] = [];
  for (const item of draft.ideas) {
    const title = cleanLine(item.title, 70);
    const detail = cleanLine(item.detail, 240);
    if (title.length < 2 || detail.length < 8) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ideas.push({ id: makeId("idea"), title, detail, effort: item.effort, costBand: item.costBand });
  }
  if (ideas.length < 3) return buildIdeas(brief.kind, brief.vibe, brief.priorities, constraints, brief.setting);
  return ideas.slice(0, 6);
}

function localVendors(brief: EventBrief): VendorItem[] {
  return buildVendors(brief.kind).map((vendor) => ({ ...vendor, id: makeId("vendor") }));
}

function localHeadline(brief: EventBrief): string {
  const meta = KIND_META[brief.kind];
  const guestLabel = `${brief.guests} ${pluralize(brief.guests, "guest")}`;
  const headline = `A ${meta.noun} for ${guestLabel} in ${brief.location}`;
  return headline.charAt(0).toUpperCase() + headline.slice(1);
}

function buildAssumptions(
  brief: EventBrief,
  context: {
    remaining: number;
    compressed: boolean;
    constraints: Plan["constraints"];
    budgetTotal: number;
    source: "gemini" | "local";
    model?: string;
  },
): string[] {
  const found: string[] = [];
  if (context.constraints.dietary.length > 0) found.push(`dietary: ${formatList(context.constraints.dietary)}`);
  if (context.constraints.access.length > 0) found.push(`access: ${formatList(context.constraints.access)}`);
  if (context.constraints.mustHaves.length > 0) found.push(`must-haves: ${context.constraints.mustHaves.length}`);

  return [
    standardSplitNote(brief.kind, brief.priorities),
    `Amounts are in ${brief.currency} and add up to ${formatMoney(context.budgetTotal, brief.currency)}. The split is a starting point, not a market quote.`,
    context.compressed
      ? `The timeline is compressed to fit ${context.remaining} days, so several milestones now land in the same fortnight.`
      : `Milestones count backwards from ${formatDate(brief.date)}.`,
    found.length > 0
      ? `Read from your notes: ${found.join("; ")}.`
      : "No dietary, access, or must-have details were found in your notes.",
    "Vendors are the categories to book, not named businesses.",
    context.source === "gemini"
      ? `Wording came from ${context.model ?? "Gemini"}. Budget arithmetic, dates, and advice are computed by Trestle.`
      : "Drafted locally without a model. The structure and arithmetic are the same; the wording is templated.",
  ];
}
