import type { Plan } from "./types";

const STORAGE_KEY = "trestle.plans.v1";
const MAX_PLANS = 8;
const EMPTY_PLANS: Plan[] = [];

const listeners = new Set<() => void>();
let cached: Plan[] | null = null;

function notify(): void {
  cached = null;
  for (const listener of listeners) listener();
}

/**
 * Saved plans live in localStorage, which is an external store. Components read
 * it through useSyncExternalStore so the browser, not React state, owns the
 * truth, and a second tab stays in step through the storage event.
 */
export function subscribePlans(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") return () => listeners.delete(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function readPlansSnapshot(): Plan[] {
  cached ??= loadPlans();
  return cached;
}

export function serverPlansSnapshot(): Plan[] {
  return EMPTY_PLANS;
}


export class StorageUnavailable extends Error {
  constructor() {
    super("This browser is blocking local storage.");
    this.name = "StorageUnavailable";
  }
}

function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<Plan>;
  return (
    typeof plan.id === "string" &&
    typeof plan.createdAt === "string" &&
    typeof plan.headline === "string" &&
    !!plan.brief &&
    typeof plan.brief.date === "string" &&
    Array.isArray(plan.budget?.lines) &&
    Array.isArray(plan.timeline?.items) &&
    Array.isArray(plan.vendors) &&
    Array.isArray(plan.ideas) &&
    Array.isArray(plan.advice)
  );
}

export function loadPlans(): Plan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPlan).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function persistPlans(plans: readonly Plan[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.slice(0, MAX_PLANS)));
    notify();
  } catch {
    throw new StorageUnavailable();
  }
}

export function upsertPlan(plan: Plan, current: readonly Plan[]): Plan[] {
  const next = [plan, ...current.filter((item) => item.id !== plan.id)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_PLANS);
  persistPlans(next);
  return next;
}

export function removePlan(id: string, current: readonly Plan[]): Plan[] {
  const next = current.filter((plan) => plan.id !== id);
  persistPlans(next);
  return next;
}

export function replacePlan(plan: Plan, current: readonly Plan[]): Plan[] {
  const next = current.map((item) => (item.id === plan.id ? plan : item));
  persistPlans(next);
  return next;
}
