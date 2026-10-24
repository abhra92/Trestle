import { KIND_META, type EventKind } from "./catalog";
import type { BudgetLine } from "./types";

export interface WeightedLine {
  key: string;
  label: string;
  weight: number;
  note: string;
}

const PRIORITY_BOOST = 0.06;
const CONTINGENCY_FLOOR = 0.05;

/**
 * Priorities pull weight from the categories the host did not pick. The
 * contingency line is never raided, and it always keeps a floor, because a
 * plan without a buffer is the one thing that reliably breaks a budget.
 */
export function boostWeights(
  kind: EventKind,
  priorities: readonly string[],
  overrides?: Readonly<Record<string, number>>,
): Record<string, number> {
  const categories = KIND_META[kind].categories;
  const weights: Record<string, number> = {};
  for (const category of categories) {
    const override = overrides?.[category.key];
    weights[category.key] = override && override > 0 ? override : category.weight;
  }

  const chosen = new Set(priorities.filter((key) => key in weights && key !== "contingency"));
  const donors = categories.filter(
    (category) => !chosen.has(category.key) && category.key !== "contingency",
  );
  const weightOf = (key: string) => weights[key] ?? 0;

  if (chosen.size > 0 && donors.length > 0) {
    const donorWeight = donors.reduce((sum, category) => sum + weightOf(category.key), 0);
    const wanted = PRIORITY_BOOST * chosen.size;
    const takeable = Math.max(0, donorWeight - 0.02 * donors.length);
    const take = Math.min(wanted, takeable * 0.5);
    const scale = donorWeight > 0 ? Math.max(0, donorWeight - take) / donorWeight : 1;

    for (const category of donors) {
      weights[category.key] = weightOf(category.key) * scale;
    }
    for (const key of chosen) {
      weights[key] = weightOf(key) + take / chosen.size;
    }
  }

  const contingencyWeight = weightOf("contingency");
  if (contingencyWeight < CONTINGENCY_FLOOR) {
    const shortfall = CONTINGENCY_FLOOR - contingencyWeight;
    const largest = categories
      .filter((category) => category.key !== "contingency")
      .sort((a, b) => weightOf(b.key) - weightOf(a.key))[0];
    if (largest && weightOf(largest.key) > shortfall) {
      weights[largest.key] = weightOf(largest.key) - shortfall;
      weights.contingency = CONTINGENCY_FLOOR;
    }
  }

  return normalizeWeights(weights);
}

export function normalizeWeights(weights: Readonly<Record<string, number>>): Record<string, number> {
  const entries = Object.entries(weights).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return {};
  const normalized: Record<string, number> = {};
  for (const [key, weight] of entries) normalized[key] = weight / total;
  return normalized;
}

/**
 * Splits an amount into whole cents with the largest remainder method, so the
 * printed lines always add back up to the host's total.
 */
export function allocate(total: number, weights: Readonly<Record<string, number>>): Record<string, number> {
  const entries = Object.entries(weights);
  const totalCents = Math.round(total * 100);
  if (entries.length === 0 || totalCents <= 0) return {};

  const exact = entries.map(([key, weight]) => ({ key, value: totalCents * weight }));
  const base = exact.map((entry) => ({ key: entry.key, cents: Math.floor(entry.value), fraction: entry.value - Math.floor(entry.value) }));
  let assigned = base.reduce((sum, entry) => sum + entry.cents, 0);
  const order = [...base].sort((a, b) => b.fraction - a.fraction || a.key.localeCompare(b.key));

  let index = 0;
  while (assigned < totalCents && order.length > 0) {
    const target = order[index % order.length];
    if (!target) break;
    target.cents += 1;
    assigned += 1;
    index += 1;
  }

  const result: Record<string, number> = {};
  for (const entry of base) result[entry.key] = entry.cents / 100;
  return result;
}

export function buildBudget(
  kind: EventKind,
  total: number,
  guests: number,
  priorities: readonly string[],
  notes?: Readonly<Record<string, string>>,
  overrides?: Readonly<Record<string, number>>,
): { total: number; perGuest: number; lines: BudgetLine[] } {
  const weights = boostWeights(kind, priorities, overrides);
  const amounts = allocate(total, weights);
  const lines: BudgetLine[] = [];

  for (const category of KIND_META[kind].categories) {
    const share = weights[category.key];
    if (share === undefined) continue;
    lines.push({
      key: category.key,
      label: category.label,
      amount: amounts[category.key] ?? 0,
      share,
      note: notes?.[category.key] ?? category.hint,
    });
  }

  const sum = lines.reduce((acc, line) => acc + line.amount, 0);
  return {
    total: Math.round(sum * 100) / 100,
    perGuest: Math.round((total / Math.max(1, guests)) * 100) / 100,
    lines,
  };
}
