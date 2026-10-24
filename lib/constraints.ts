import type { Constraints } from "./types";

interface Rule {
  label: string;
  pattern: RegExp;
}

const DIETARY_RULES: Rule[] = [
  { label: "vegetarian", pattern: /\bvegetarian\b/i },
  { label: "vegan", pattern: /\bvegan\b/i },
  { label: "gluten-free", pattern: /\b(gluten[- ]free|coeliac|celiac)\b/i },
  { label: "dairy-free", pattern: /\b(dairy[- ]free|lactose)\b/i },
  { label: "nut allergy", pattern: /\b(nut|peanut)\s*(allergy|allergies|free)\b/i },
  { label: "halal", pattern: /\bhalal\b/i },
  { label: "kosher", pattern: /\bkosher\b/i },
  { label: "jain", pattern: /\bjain\b/i },
  { label: "no alcohol", pattern: /\b(no alcohol|alcohol[- ]free|dry event)\b/i },
  { label: "allergy-aware menu", pattern: /\ballerg(y|ies)\b/i },
];

const ACCESS_RULES: Rule[] = [
  { label: "step-free or wheelchair access", pattern: /\b(step[- ]free|wheelchair|accessible|mobility)\b/i },
  { label: "accessible toilets", pattern: /\baccessible toilet/i },
  { label: "a quiet room", pattern: /\b(quiet room|sensory|overwhelm)/i },
  { label: "a hearing loop", pattern: /\b(hearing loop|hard of hearing|deaf)\b/i },
  { label: "sign language interpretation", pattern: /\b(sign language|bsl|asl|interpreter)\b/i },
  { label: "young children", pattern: /\b(young children|toddlers|kids|children|prams?|strollers?)\b/i },
  { label: "older guests", pattern: /\b(older guests|elderly|grandparents|mobility issues)\b/i },
];

const MUST_HAVE = /\b(must|have to|needs? to|can't miss|cannot miss|important that|essential that)\b/i;

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function readConstraints(notes: string, extra: string = ""): Constraints {
  const text = `${notes} ${extra}`.trim();
  if (!text) return { dietary: [], access: [], mustHaves: [] };

  const dietary = unique(DIETARY_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label));
  const access = unique(ACCESS_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label));

  const mustHaves: string[] = [];
  const sentences = text.split(/(?<=[.!?;])\s+/);
  for (const sentence of sentences) {
    if (!MUST_HAVE.test(sentence)) continue;
    const trimmed = sentence.replace(/\s+/g, " ").trim().slice(0, 120);
    if (trimmed.length >= 8) mustHaves.push(trimmed);
    if (mustHaves.length === 3) break;
  }

  return { dietary, access, mustHaves: unique(mustHaves) };
}
