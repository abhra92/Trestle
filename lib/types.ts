import type {
  CostBand,
  Currency,
  Effort,
  EventKind,
  Severity,
  Setting,
  VendorPriority,
  Vibe,
} from "./catalog";

export interface EventBrief {
  kind: EventKind;
  title: string;
  date: string;
  guests: number;
  budget: number;
  currency: Currency;
  location: string;
  setting: Setting;
  vibe: Vibe;
  priorities: string[];
  notes: string;
}

export interface BudgetLine {
  key: string;
  label: string;
  amount: number;
  share: number;
  note: string;
}

export interface Milestone {
  id: string;
  label: string;
  detail: string;
  daysBefore: number;
  dueDate: string;
  done: boolean;
}

export interface VendorItem {
  id: string;
  label: string;
  category: string;
  why: string;
  priority: VendorPriority;
  booked: boolean;
}

export interface Idea {
  id: string;
  title: string;
  detail: string;
  effort: Effort;
  costBand: CostBand;
}

export interface Advice {
  id: string;
  severity: Severity;
  message: string;
}

export interface Constraints {
  dietary: string[];
  access: string[];
  mustHaves: string[];
}

export interface Plan {
  id: string;
  createdAt: string;
  source: "gemini" | "local";
  model?: string;
  headline: string;
  currency: Currency;
  brief: EventBrief;
  constraints: Constraints;
  budget: {
    total: number;
    perGuest: number;
    lines: BudgetLine[];
  };
  timeline: {
    eventDate: string;
    compressed: boolean;
    items: Milestone[];
  };
  vendors: VendorItem[];
  ideas: Idea[];
  advice: Advice[];
  assumptions: string[];
}

export interface DraftMeta {
  source: "gemini" | "local";
  model?: string;
  fallbackReason?: "missing-key" | "timeout" | "quota" | "upstream" | "invalid";
  elapsedMs: number;
}

export interface DraftResponse {
  plan: Plan;
  meta: DraftMeta;
}
