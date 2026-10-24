import type { Currency, EventKind } from "./catalog";
import { KIND_META } from "./catalog";
import { formatMoney } from "./format";
import type { Advice, BudgetLine, Constraints, EventBrief } from "./types";

const PER_GUEST_FLOOR: Record<Currency, number> = {
  USD: 60,
  EUR: 55,
  GBP: 50,
  INR: 1500,
  AUD: 80,
  CAD: 75,
  SGD: 80,
  AED: 200,
};

interface RuleContext {
  daysUntil: number;
  budgetLines: BudgetLine[];
  perGuest: number;
  constraints: Constraints;
  compressed: boolean;
}

export function buildAdvice(brief: EventBrief, context: RuleContext): Advice[] {
  const advice: Advice[] = [];
  const push = (id: string, severity: Advice["severity"], message: string) => {
    advice.push({ id, severity, message });
  };

  const { daysUntil, perGuest, constraints } = context;

  if (daysUntil <= 1) {
    push(
      "runway-critical",
      "risk",
      daysUntil === 0
        ? "The event is today. Abandon the plan you cannot finish and do the four things guests will notice: somewhere to sit, something to eat, water, and a working sound check."
        : "The event is tomorrow. Confirm arrival times with every supplier, charge what needs charging, and print the run sheet. Everything else can wait.",
    );
  } else if (daysUntil <= 21) {
    push(
      "runway-critical",
      "risk",
      `There are ${daysUntil} days left. Most venues, caterers, and photographers are booked months out, so secure the two vendors the event cannot run without and keep the rest simple.`,
    );
  } else if (daysUntil <= 45) {
    push(
      "runway-short",
      "watch",
      `There are ${daysUntil} days left, which is inside the lead time many venues work to. Ask each supplier for a written confirmation this week, and expect less choice on dates and menus.`,
    );
  }

  if (brief.kind === "community" && daysUntil < 90) {
    push(
      "permits-lead-time",
      "risk",
      "Permits and road closures often take eight to twelve weeks. Call the council office before you spend anything else, and keep the approval email.",
    );
  }

  const floor = PER_GUEST_FLOOR[brief.currency];
  if (perGuest < floor) {
    push(
      "budget-per-guest",
      "risk",
      `The budget is ${formatMoney(perGuest, brief.currency)} per guest. Food, venue, and service usually take most of that, so decide which two categories matter and cut the rest before you book anything.`,
    );
  }

  const contingency = context.budgetLines.find((line) => line.key === "contingency");
  if (contingency && contingency.share < 0.07) {
    push(
      "thin-buffer",
      "watch",
      `The buffer is ${formatMoney(contingency.amount, brief.currency)}, about ${Math.round(contingency.share * 100)}% of the total. Keep it unspent until the week of the event.`,
    );
  }

  if (brief.guests >= 150 && brief.kind !== "community") {
    push(
      "large-guest-list",
      "watch",
      `${brief.guests} guests means service, seating, and toilets all scale up. Confirm the venue's seated capacity and the caterer's service window in writing.`,
    );
  }

  if (brief.setting === "outdoor") {
    push(
      "outdoor-backup",
      "watch",
      "Name the indoor room or marquee you will move to, and write the decision deadline on the run sheet. An outdoor plan without a wet-weather address is a hope, not a plan.",
    );
  } else if (brief.setting === "mixed") {
    push(
      "two-setups",
      "note",
      "Two settings means two setups and a transition your guests have to make. Put the move on the run sheet with a time and an owner.",
    );
  }

  if (!context.compressed && daysUntil < 60 && brief.guests > 80) {
    push(
      "setup-crew",
      "note",
      `With ${brief.guests} guests and under two months to go, ask two people to own setup and two to own pack-down. It is the cheapest thing you can add.`,
    );
  }

  if (constraints.access.length > 0) {
    push(
      "access-check",
      "note",
      `Your notes mention ${formatList(constraints.access)}. Ask the venue for the step-free route, accessible toilets, and parking in writing, then walk it yourself.`,
    );
  }

  if (constraints.dietary.length > 0) {
    push(
      "dietary-check",
      "note",
      `Your notes mention ${formatList(constraints.dietary)}. Ask the caterer how those dishes are kept separate in the kitchen, not just whether they can make them.`,
    );
  }

  if (constraints.dietary.includes("no alcohol")) {
    push(
      "bar-terms",
      "note",
      "Check the venue's corkage fee and minimum bar spend before signing. A dry event can still be charged a bar minimum.",
    );
  }

  if (!brief.notes.trim()) {
    push(
      "notes-empty",
      "note",
      "Your notes are empty. Add dietary needs, access needs, or the one thing that cannot go wrong, and the plan can account for it.",
    );
  }

  const rank: Record<Advice["severity"], number> = { risk: 0, watch: 1, note: 2 };
  return advice.sort((a, b) => rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id)).slice(0, 7);
}

export function formatList(values: readonly string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0] ?? "";
  const last = values.at(-1) ?? "";
  return `${values.slice(0, -1).join(", ")} and ${last}`;
}

export function standardSplitNote(kind: EventKind, chosen: readonly string[]): string {
  const meta = KIND_META[kind];
  if (chosen.length === 0) {
    return `No priorities were chosen, so the split follows a standard ${meta.noun} shape. Move money between categories before you book.`;
  }
  const labels = meta.categories
    .filter((category) => chosen.includes(category.key))
    .map((category) => category.label.toLowerCase());
  return `The split gives extra weight to ${formatList(labels)} and keeps a minimum buffer. It is a starting point, not a market quote.`;
}
