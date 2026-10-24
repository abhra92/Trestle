import type { CostBand, Effort, EventKind, Setting, Vibe } from "./catalog";
import type { Constraints, Idea } from "./types";
import { makeId } from "./ids";

interface IdeaSeed {
  title: string;
  detail: string;
  effort: Effort;
  costBand: CostBand;
}

const BY_KIND: Record<EventKind, IdeaSeed[]> = {
  wedding: [
    {
      title: "Write the ceremony in three sentences",
      detail: "Why today, what you promise, who you thank. Print two copies. Vows read from a phone look like a work email.",
      effort: "low",
      costBand: "none",
    },
    {
      title: "Give the last hour to the people who travelled",
      detail: "Ask the band or DJ for one more set and plan a late snack. Guests remember the end of the night, not the centrepieces.",
      effort: "medium",
      costBand: "small",
    },
    {
      title: "A shot list of fifteen, not fifty",
      detail: "Name the people in each photo and pick one family wrangler. Fifteen organised shots beat an hour of hunting for relatives.",
      effort: "low",
      costBand: "none",
    },
    {
      title: "Mix the tables on purpose",
      detail: "Seat each family group beside one they have not met. Four people per table who know nobody is a quiet table all night.",
      effort: "medium",
      costBand: "none",
    },
  ],
  birthday: [
    {
      title: "Let the guest of honour pick the food",
      detail: "Not the guest list, the food. It is the one decision they will still be talking about next week.",
      effort: "low",
      costBand: "none",
    },
    {
      title: "Put cake at a fixed time",
      detail: "Announce it on the invitation and again when people arrive. A fixed cake time gives the afternoon a spine.",
      effort: "low",
      costBand: "none",
    },
    {
      title: "One quiet table with something to do",
      detail: "Colouring, cards, or a puzzle for the people who need ten minutes away from the noise. It keeps the party going for everyone else.",
      effort: "low",
      costBand: "small",
    },
    {
      title: "Send people home with something eaten tomorrow",
      detail: "A box of the cake, a bag of the snacks, a jar of the punch. Favours that get used beat favours that get binned.",
      effort: "low",
      costBand: "small",
    },
  ],
  community: [
    {
      title: "A printed map at every entrance",
      detail: "People arrive from four directions and ask the same three questions. One map and one volunteer answers all of them.",
      effort: "low",
      costBand: "small",
    },
    {
      title: "Name the weather caller",
      detail: "One person, one decision time, one phone tree. A committee deciding at 7am is how events get cancelled twice.",
      effort: "low",
      costBand: "none",
    },
    {
      title: "Feed the volunteers properly",
      detail: "A hot meal and a chair for twenty minutes. Volunteers who eat stay for the pack-down.",
      effort: "low",
      costBand: "small",
    },
    {
      title: "Print the programme twice the size you think",
      detail: "Large type, high contrast, and the times people actually need. Half the people reading it will be holding it at arm's length.",
      effort: "low",
      costBand: "small",
    },
  ],
};

const BY_PRIORITY: Record<string, IdeaSeed> = {
  food: {
    title: "Taste the menu before you trust it",
    detail: "Ask for a tasting, or cook the shortlist once at home for six people. Catering is the line most likely to disappoint unseen.",
    effort: "medium",
    costBand: "small",
  },
  catering: {
    title: "Taste the menu before you trust it",
    detail: "Ask for a tasting, or cook the shortlist once at home for six people. Catering is the line most likely to disappoint unseen.",
    effort: "medium",
    costBand: "small",
  },
  photos: {
    title: "Twenty minutes of daylight, protected",
    detail: "Put the portrait slot in the run sheet before dinner and tell two people to guard it. Light is the one supplier you cannot rebook.",
    effort: "low",
    costBand: "none",
  },
  photography: {
    title: "Twenty minutes of daylight, protected",
    detail: "Put the portrait slot in the run sheet before dinner and tell two people to guard it. Light is the one supplier you cannot rebook.",
    effort: "low",
    costBand: "none",
  },
  music: {
    title: "Three songs you love, three you never want to hear",
    detail: "Send the list before the day. A band reading the room is good; a band reading your mind is not a thing.",
    effort: "low",
    costBand: "none",
  },
  entertainment: {
    title: "Put the performance where the energy dips",
    detail: "Schedule it for the hour after food, when people are seated and half ready to leave. That is when a room needs a reason to stay.",
    effort: "low",
    costBand: "none",
  },
  venue: {
    title: "Walk the venue at the same hour as the event",
    detail: "Light, noise, and parking all change by the hour. Visit once at the time guests will actually arrive.",
    effort: "low",
    costBand: "none",
  },
  flowers: {
    title: "Fewer flowers, larger",
    detail: "Six big arrangements read better than twenty small ones, and they cost less to deliver. Move the saved money to the meal.",
    effort: "low",
    costBand: "none",
  },
  decor: {
    title: "Light the room, not the tables",
    detail: "Two uplights and a warm bulb change a hall more than another hundred balloons. Borrow the lights before you buy the decor.",
    effort: "medium",
    costBand: "small",
  },
  sound: {
    title: "Hire the technician, not just the speakers",
    detail: "The person who knows the desk is what stops the feedback in the middle of a speech. Confirm they stay for the whole event.",
    effort: "low",
    costBand: "notable",
  },
  publicity: {
    title: "One poster, four places it actually goes",
    detail: "The library, the school gate, the corner shop, the group chat. Print for the places where people still stand still.",
    effort: "low",
    costBand: "small",
  },
  access: {
    title: "Walk the route in the chair they will use",
    detail: "Car park, entrance, toilet, table. Fix the two tightest points before the day, then mark the route on the map.",
    effort: "medium",
    costBand: "small",
  },
  guests: {
    title: "Name one person to run the guest list",
    detail: "Not you. Give them the list, the seating plan, and permission to make small decisions without asking.",
    effort: "low",
    costBand: "none",
  },
  cake: {
    title: "Order the cake against the final count",
    detail: "One slice per guest plus ten. Cake for the invited count is cake you carry home.",
    effort: "low",
    costBand: "none",
  },
  drinks: {
    title: "One good drink, made well",
    detail: "A single signature serve, a big jug of something soft, and plenty of water. A short bar moves faster than a long one.",
    effort: "low",
    costBand: "small",
  },
  keepsakes: {
    title: "Ask people to leave a note, not buy a gift",
    detail: "One card per guest and a box to put them in. Cheaper than favours and the only thing from the day that gets reread.",
    effort: "low",
    costBand: "none",
  },
  permits: {
    title: "Get the permit answer in writing",
    detail: "A phone call is not approval. Keep the email with the reference number in the folder the site manager will ask about.",
    effort: "medium",
    costBand: "none",
  },
  volunteers: {
    title: "Write shifts, not a sign-up sheet",
    detail: "Two hour blocks, one lead per zone, phone numbers on the printed sheet. People help longer when they know when they finish.",
    effort: "medium",
    costBand: "none",
  },
  supplies: {
    title: "One bin per ten metres",
    detail: "Rubbish is the thing that decides how the site looks at 6pm. Put bins where people already stand and empty them once at the midpoint.",
    effort: "low",
    costBand: "small",
  },
  stationery: {
    title: "Print the run sheet for the people working",
    detail: "Times, addresses, phone numbers, and who decides what. Four copies, one per person who needs to answer a question.",
    effort: "low",
    costBand: "small",
  },
};

const BY_VIBE: Record<Vibe, IdeaSeed> = {
  relaxed: {
    title: "Leave a two hour gap in the middle",
    detail: "A gap looks like nothing on paper and feels like the best part of the day. Build the run sheet with air in it.",
    effort: "low",
    costBand: "none",
  },
  playful: {
    title: "One game everyone can join without being picked",
    detail: "A quiz on the tables, a photo hunt, a playlist vote. No teams, no stage, no one left standing at the side.",
    effort: "medium",
    costBand: "small",
  },
  traditional: {
    title: "Keep one ritual intact, simplify the rest",
    detail: "Choose the one moment that would not be the same without it, then let the other formalities go. Guests notice intention, not length.",
    effort: "low",
    costBand: "none",
  },
  modern: {
    title: "Skip the receiving line",
    detail: "Greet people at the tables during the meal instead. The line costs twenty minutes and nobody's favourite memory.",
    effort: "low",
    costBand: "none",
  },
  outdoorsy: {
    title: "Plan for wind first, rain second",
    detail: "Weights on the cloth, a backup for paper, and a named indoor room. Wind ruins more outdoor events than rain does.",
    effort: "medium",
    costBand: "small",
  },
  formal: {
    title: "A printed run sheet inside the day box",
    detail: "Times down the left, names on the right, one page. The most useful thing at a formal event is a small piece of paper.",
    effort: "low",
    costBand: "none",
  },
};

const BY_CONSTRAINT = {
  dietary: {
    title: "Label every dish at the table",
    detail: "Small cards with the common allergens and what is actually in each dish. Guests stop asking the caterer and start eating.",
    effort: "low",
    costBand: "small",
  },
  access: {
    title: "Walk the route a guest will take",
    detail: "From the car park to the toilet to the table, at the pace of the person who will use it. Fix the two tightest points before the day.",
    effort: "medium",
    costBand: "small",
  },
  mustHaves: {
    title: "Put the one must-have first on the run sheet",
    detail: "Whatever the day cannot lose gets the earliest slot and a named owner. Everything else can move around it.",
    effort: "low",
    costBand: "none",
  },
  outdoor: {
    title: "Name the indoor room before you need it",
    detail: "Write the wet-weather plan on the invitation and tell two people the decision time. A plan nobody knows about is not a plan.",
    effort: "low",
    costBand: "none",
  },
} satisfies Record<string, IdeaSeed>;

export function buildIdeas(
  kind: EventKind,
  vibe: Vibe,
  priorities: readonly string[],
  constraints: Constraints,
  setting: Setting,
): Idea[] {
  const seeds: IdeaSeed[] = [...BY_KIND[kind]];

  for (const priority of priorities) {
    const seed = BY_PRIORITY[priority];
    if (seed) seeds.push(seed);
  }
  seeds.push(BY_VIBE[vibe]);

  if (constraints.dietary.length > 0) seeds.push(BY_CONSTRAINT.dietary);
  if (constraints.access.length > 0) seeds.push(BY_CONSTRAINT.access);
  if (constraints.mustHaves.length > 0) seeds.push(BY_CONSTRAINT.mustHaves);
  if (setting === "outdoor") seeds.push(BY_CONSTRAINT.outdoor);

  const seen = new Set<string>();
  const ideas: Idea[] = [];
  for (const seed of seeds) {
    const key = seed.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ideas.push({ id: makeId("idea"), ...seed });
    if (ideas.length === 6) break;
  }
  return ideas;
}
