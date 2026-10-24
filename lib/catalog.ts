export const EVENT_KINDS = ["wedding", "birthday", "community"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SETTINGS = ["indoor", "outdoor", "mixed"] as const;
export type Setting = (typeof SETTINGS)[number];

export const VIBES = ["relaxed", "playful", "traditional", "modern", "outdoorsy", "formal"] as const;
export type Vibe = (typeof VIBES)[number];

export const EFFORT_LEVELS = ["low", "medium", "high"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];

export const COST_BANDS = ["none", "small", "notable"] as const;
export type CostBand = (typeof COST_BANDS)[number];

export const PRIORITY_LEVELS = ["essential", "useful", "optional"] as const;
export type VendorPriority = (typeof PRIORITY_LEVELS)[number];

export const SEVERITIES = ["note", "watch", "risk"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface BudgetCategory {
  key: string;
  label: string;
  weight: number;
  hint: string;
}

export interface KindMeta {
  label: string;
  noun: string;
  blurb: string;
  defaultGuests: number;
  categories: BudgetCategory[];
  vendorCategories: readonly string[];
}

export const KIND_META: Record<EventKind, KindMeta> = {
  wedding: {
    label: "Wedding",
    noun: "wedding",
    blurb: "Ceremony, meal, and the people who stay until the last song.",
    defaultGuests: 90,
    categories: [
      { key: "venue", label: "Venue and site fees", weight: 0.26, hint: "Room hire, ceremony fee, tables and chairs" },
      { key: "catering", label: "Food and drink", weight: 0.29, hint: "Catering, bar, cake, service staff" },
      { key: "photography", label: "Photography and film", weight: 0.09, hint: "Coverage hours, second shooter, album" },
      { key: "attire", label: "Attire and beauty", weight: 0.08, hint: "Outfits, alterations, hair and make-up" },
      { key: "music", label: "Music and sound", weight: 0.06, hint: "Band or DJ, ceremony sound, lighting" },
      { key: "flowers", label: "Flowers and decor", weight: 0.07, hint: "Bouquets, table centrepieces, signage" },
      { key: "stationery", label: "Stationery and print", weight: 0.03, hint: "Invitations, place cards, menus" },
      { key: "rings", label: "Rings and gifts", weight: 0.04, hint: "Rings, gifts for the party, officiant" },
      { key: "contingency", label: "Contingency", weight: 0.08, hint: "The buffer that saves the day" },
    ],
    vendorCategories: ["Venue", "Catering", "Photography", "Music", "Attire", "Flowers", "Stationery", "Officiant"],
  },
  birthday: {
    label: "Birthday",
    noun: "birthday party",
    blurb: "One afternoon that the guest of honour actually enjoys.",
    defaultGuests: 30,
    categories: [
      { key: "venue", label: "Venue or hire", weight: 0.16, hint: "Hall, garden marquee, permits for a park" },
      { key: "food", label: "Food", weight: 0.24, hint: "Catering or a home kitchen plan" },
      { key: "cake", label: "Cake and dessert", weight: 0.07, hint: "The cake, plus something for allergies" },
      { key: "entertainment", label: "Entertainment", weight: 0.14, hint: "Music, games, performer, photo booth" },
      { key: "decor", label: "Decor", weight: 0.11, hint: "Balloons, table settings, lighting" },
      { key: "drinks", label: "Drinks", weight: 0.09, hint: "Soft drinks, coffee, a toast" },
      { key: "keepsakes", label: "Keepsakes", weight: 0.04, hint: "Favours, a guest book, thank you cards" },
      { key: "supplies", label: "Supplies and rentals", weight: 0.05, hint: "Serving ware, ice, bins, tape" },
      { key: "contingency", label: "Contingency", weight: 0.1, hint: "The buffer that saves the day" },
    ],
    vendorCategories: ["Venue", "Catering", "Cake", "Entertainment", "Decor", "Rentals", "Photography"],
  },
  community: {
    label: "Community event",
    noun: "community event",
    blurb: "A street, a hall, or a field, opened up to neighbours.",
    defaultGuests: 200,
    categories: [
      { key: "venue", label: "Venue and site", weight: 0.18, hint: "Hall, field, road closure, site crew" },
      { key: "permits", label: "Permits and insurance", weight: 0.07, hint: "Council permits, public liability cover" },
      { key: "food", label: "Food and stalls", weight: 0.18, hint: "Stallholders, community kitchen, water" },
      { key: "publicity", label: "Publicity", weight: 0.1, hint: "Posters, local paper, social posts" },
      { key: "sound", label: "Sound, stage and power", weight: 0.13, hint: "PA, generator, staging, cables" },
      { key: "supplies", label: "Supplies and signage", weight: 0.12, hint: "Tables, bins, first aid, wayfinding" },
      { key: "access", label: "Access and inclusion", weight: 0.05, hint: "Ramps, accessible toilets, interpretation" },
      { key: "volunteers", label: "Volunteer support", weight: 0.07, hint: "Briefings, food, badges, thank yous" },
      { key: "contingency", label: "Contingency", weight: 0.1, hint: "The buffer that saves the day" },
    ],
    vendorCategories: ["Venue", "Permits", "Catering", "Sound", "Print", "Rentals", "Safety"],
  },
};

export const KIND_ORDER: readonly EventKind[] = EVENT_KINDS;

export const CURRENCY_LABEL: Record<Currency, string> = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "Pound sterling",
  INR: "Indian rupee",
  AUD: "Australian dollar",
  CAD: "Canadian dollar",
  SGD: "Singapore dollar",
  AED: "UAE dirham",
};

export const VIBE_LABEL: Record<Vibe, string> = {
  relaxed: "Relaxed",
  playful: "Playful",
  traditional: "Traditional",
  modern: "Modern",
  outdoorsy: "Outdoorsy",
  formal: "Formal",
};

export const SETTING_LABEL: Record<Setting, string> = {
  indoor: "Indoors",
  outdoor: "Outdoors",
  mixed: "Indoors and out",
};

export const EFFORT_LABEL: Record<Effort, string> = {
  low: "An evening's work",
  medium: "A weekend",
  high: "Needs a helper",
};

export const COST_BAND_LABEL: Record<CostBand, string> = {
  none: "No extra spend",
  small: "Small spend",
  notable: "Notable spend",
};

export const PRIORITY_LABEL: Record<VendorPriority, string> = {
  essential: "Essential",
  useful: "Useful",
  optional: "Optional",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  note: "Note",
  watch: "Watch",
  risk: "Risk",
};

export function categoriesFor(kind: EventKind): BudgetCategory[] {
  return KIND_META[kind].categories;
}

export function categoryKeys(kind: EventKind): string[] {
  return KIND_META[kind].categories.map((category) => category.key);
}

export function isEventKind(value: unknown): value is EventKind {
  return typeof value === "string" && (EVENT_KINDS as readonly string[]).includes(value);
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

export function isVibe(value: unknown): value is Vibe {
  return typeof value === "string" && (VIBES as readonly string[]).includes(value);
}

export function isSetting(value: unknown): value is Setting {
  return typeof value === "string" && (SETTINGS as readonly string[]).includes(value);
}
