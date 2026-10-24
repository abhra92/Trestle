import type { EventKind } from "./catalog";
import type { VendorItem } from "./types";

interface VendorSeed {
  label: string;
  category: string;
  why: string;
  priority: VendorItem["priority"];
}

export const VENDOR_SEEDS: Record<EventKind, VendorSeed[]> = {
  wedding: [
    { label: "Venue or ceremony site", category: "Venue", why: "Sets the date, the capacity, and what furniture you still have to hire.", priority: "essential" },
    { label: "Caterer and bar", category: "Catering", why: "The largest line in most budgets and the one guests judge the day by.", priority: "essential" },
    { label: "Photographer", category: "Photography", why: "Books out earliest. Agree hours and a shot list before you sign.", priority: "essential" },
    { label: "Officiant or celebrant", category: "Officiant", why: "Needed for the legal side, and worth meeting before you commit.", priority: "essential" },
    { label: "Band or DJ", category: "Music", why: "Ask what they bring, who runs sound, and when they need power.", priority: "useful" },
    { label: "Florist", category: "Flowers", why: "Confirm what arrives assembled and who collects the vases.", priority: "useful" },
    { label: "Attire and alterations", category: "Attire", why: "Alterations take two fittings, so the timeline matters more than the shop.", priority: "useful" },
    { label: "Stationer or printer", category: "Stationery", why: "Invitations set the reply date, which drives every number after it.", priority: "useful" },
    { label: "Hair and make-up", category: "Attire", why: "Book as one group so nobody is waiting at the wrong hour.", priority: "optional" },
    { label: "Transport", category: "Venue", why: "Only if the venue is far from where people are staying.", priority: "optional" },
  ],
  birthday: [
    { label: "Venue or hall", category: "Venue", why: "Confirm capacity, kitchen access, and what time you can get in.", priority: "essential" },
    { label: "Caterer or food lead", category: "Catering", why: "One person owns the food, even if that person is you.", priority: "essential" },
    { label: "Cake maker", category: "Cake", why: "Ask about allergens, delivery, and how long it holds at room temperature.", priority: "essential" },
    { label: "Entertainer or music", category: "Entertainment", why: "A fixed performance time gives the party a shape.", priority: "useful" },
    { label: "Decorator or decor hire", category: "Decor", why: "Hire the big items and buy only what you can carry home.", priority: "useful" },
    { label: "Rentals: tables, chairs, glassware", category: "Rentals", why: "Book against the final count, not the invited count.", priority: "useful" },
    { label: "Photographer or a named camera person", category: "Photography", why: "One person with a phone and a list beats everyone taking the same photo.", priority: "optional" },
  ],
  community: [
    { label: "Site or venue manager", category: "Venue", why: "Owns access times, power, and the rules you have to follow.", priority: "essential" },
    { label: "Council permits office", category: "Permits", why: "Road closures and amplified sound need written approval, not a phone call.", priority: "essential" },
    { label: "Insurer", category: "Safety", why: "Public liability cover has to name the organising group correctly.", priority: "essential" },
    { label: "Sound and stage hire", category: "Sound", why: "Ask for a technician, not just the equipment.", priority: "essential" },
    { label: "Food stalls or community kitchen", category: "Catering", why: "Agree pitches, power, water, and who handles waste.", priority: "useful" },
    { label: "Printer", category: "Print", why: "Programmes, signage, and maps all land in the same week.", priority: "useful" },
    { label: "First aid provider", category: "Safety", why: "Name a trained person and a fixed point people can find.", priority: "essential" },
    { label: "Rentals: tables, marquees, bins", category: "Rentals", why: "Delivery windows decide the whole setup schedule.", priority: "useful" },
  ],
};

export function buildVendors(kind: EventKind): VendorItem[] {
  return VENDOR_SEEDS[kind].map((seed, index) => ({
    id: `v-${index + 1}`,
    label: seed.label,
    category: seed.category,
    why: seed.why,
    priority: seed.priority,
    booked: false,
  }));
}
