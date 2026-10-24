# Trestle

A GenAI event planner for weddings, birthdays, and community events. You write a short brief. Trestle returns a plan you could actually hand to a committee: a budget that adds up, dated milestones counted back from the event, the vendor categories to book, a few ideas for this specific brief, and the things to check before you sign anything.

Trestle is not a vendor marketplace and it does not invent prices. It does the arithmetic and the scheduling itself, then uses Gemini to write the wording around those facts.

**Demo video:** add the unlisted YouTube or Drive link here before submitting.

## The vertical

General "event planning" tools tend to split into two camps: venue marketplaces that want a booking, and checklists that are the same twelve items for every event. Both leave the host doing the actual thinking.

Trestle is for the person holding the spreadsheet: a couple planning a wedding, a parent planning a birthday, or a volunteer coordinating a street fair. The three event types have genuinely different cost shapes and risks, so the budget categories, vendor lists, milestones, and advice rules differ by type rather than sharing one generic template.

Community events are the clearest example. Permits, road closures, public liability, accessible routes, and volunteer meals matter more than chair covers. Trestle treats those as first-class categories, and the advice engine raises permit lead time and access checks when the brief calls for them.

## What makes it different

- **The model never does arithmetic.** Budget splits, date maths, and advice are deterministic TypeScript. Gemini writes the headline, the budget notes, the milestone wording, the vendor reasons, and the ideas. A model cannot make the totals wrong because it is not asked to total anything.
- **It works without an API key.** With no key, a local planner produces a complete, useful plan from templated copy. With a key, the same structure is filled by Gemini. If Gemini times out, hits quota, or returns an invalid shape, the API falls back to the local plan and says why in `meta.fallbackReason`.
- **Every number is traceable.** The budget uses the host's total and the host's priorities. Amounts are allocated to the cent with the largest remainder method, so printed lines add back up exactly. Advice lines are rule outputs, not model guesses.
- **No account, no analytics.** Plans live in `localStorage` on the device. There is no database, no login, no tracking script.

## How it works

```
Brief form
   |
   v
POST /api/plan  (rate limit, body cap, content-type check, Zod validation)
   |
   +-- no key ------------------------------+
   |                                        |
   +-- key --> Gemini generateContent       |
   |             | success   | failure      |
   |             v           v              |
   |        AI draft      local planner     |
   |             |           |              |
   +-------------+-----------+--------------+
                 |
                 v
        Deterministic assembly
        - validate and sanitise every model field
        - drop unknown budget keys and vendor categories
        - allocate the real budget, dates, and advice
                 |
                 v
        Plan sheet, saved in this browser
```

1. **Brief validation.** `lib/schema.ts` checks the event kind, date, guest count, budget, currency, location, setting, vibe, priorities, and notes. Priorities must belong to the chosen event type and cannot include the contingency line.
2. **Prompting.** `lib/prompt.ts` builds a system instruction and a user prompt with the brief, the constraints read from the notes, and the event's allowed budget categories and vendor categories.
3. **Gemini call.** `lib/gemini.ts` posts to the REST API with `x-goog-api-key`, a JSON response schema, a 20 second timeout, and one retry on a transient upstream failure. It never uses a browser-side key and never sends the key to the client.
4. **Draft checking.** The model output is normalised (trimmed, length-capped), then validated with Zod. Budget keys and vendor categories outside the event type are dropped. If the draft is too thin (fewer than three usable budget lines, four milestones, three vendors, or three ideas), the local version of that section is used instead.
5. **Assembly.** `lib/budget.ts` allocates the host's total across the event's categories. `lib/timeline.ts` turns milestone seeds into dated items, compressing them when the event is soon. `lib/rules.ts` produces the advice.
6. **Presentation.** The plan sheet renders the ledger with dot leaders, a date spine, grouped vendors, ideas, and the advice panel. It can be printed, downloaded as Markdown, or kept in the browser.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Zod 4 for both request validation and the Gemini response schema
- CSS Modules with custom properties. No Tailwind, no component library
- Fraunces and Karla via `next/font` (self-hosted at build time)
- Vitest for unit tests

Gemini is called over plain `fetch`, so there is no SDK dependency and no client bundle cost.

## Getting started

Requires Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without a key, the app runs on the local planner.

To enable Gemini, put a key in `.env.local`:

```bash
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.5-flash   # optional
```

`GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash`. The key is read only in the server route, never prefixed with `NEXT_PUBLIC_`, and `.env*` files are ignored by git.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, Next core web vitals plus the React hooks rules |

## Project layout

```
app/
  api/plan/route.ts     POST endpoint: limits, validation, fallback
  layout.tsx            fonts, theme bootstrap, masthead, footer
  page.tsx              the one screen
components/
  Planner.tsx           request state, persistence, focus management
  BriefForm.tsx         the brief, with inline field errors
  PlanSheet.tsx         sheet layout, print, download, revise
  BudgetLedger.tsx      dot-leader ledger and share bars
  Timeline.tsx          date spine and milestone status
  VendorList.tsx        grouped vendor checklist
  IdeaList.tsx          margin-note ideas
  AdvicePanel.tsx       deterministic advice
  SavedPlans.tsx        browser-local plan list
lib/
  catalog.ts            event types, categories, vendors, labels
  schema.ts             brief + AI draft validation, Gemini schema
  budget.ts             weights, priority boosts, cent allocation
  timeline.ts           milestone seeds and compression
  rules.ts              advice rules
  constraints.ts        dietary, access, must-have extraction
  planner.ts            local plan and AI plan assembly
  gemini.ts             REST client, timeout, retry, normalisation
  prompt.ts             system instruction and user prompt
  storage.ts            localStorage store and cross-tab sync
  export.ts             Markdown export and file names
  __tests__/            unit tests
```

## Design

The full direction is in [DESIGN.md](./DESIGN.md). Short version: warm paper, ink green, one persimmon accent, a printed-program feel. The plan is a sheet of paper and the only element with a shadow. The budget uses dot leaders because that is how a printed ledger connects a label to an amount. There is a real dark theme ("Candlelight"), not an inverted afterthought.

The interface follows the anti-slop rules used for this build: no hero, no feature grid, no gradient text, no glass cards, no emoji, no em dash, no fake testimonials, no "AI-powered" badges. The product is the page.

## Accessibility

- Skip link, one `h1`, labelled sections, and fieldsets for the chip groups.
- Focus moves to the plan heading when a plan arrives. Revise controls are keyboard reachable. Errors are announced with `role="alert"`; loading uses `role="status"`.
- Every control has a visible focus ring. Tap targets are at least 44px.
- Both themes are checked against WCAG AA by `lib/__tests__/contrast.test.ts`, which parses the real CSS custom properties rather than a copy of the palette.
- `prefers-reduced-motion` removes the entrance fade and bar transitions. Print styles hide the form and saved list.
- No horizontal overflow at 360px; the two columns stack.

## Security and privacy

- The API key exists only as a server environment variable. The client bundle never contains it.
- `POST /api/plan` enforces `application/json`, a 16 KB body cap, and an 8 request per minute per IP limit. The limiter is in-memory and best effort: it protects a single instance, not a distributed deployment.
- All input is validated and sanitised. Model output is treated as untrusted: unknown keys and categories are dropped, strings are trimmed and length-capped, and React escapes everything it renders.
- The response is `no-store`. Security headers are set in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- There is no CSP header. Next's hydration scripts are inline, so a useful policy needs nonce plumbing through middleware; that was left out rather than shipping `unsafe-inline` and calling it done.
- Plans are stored in `localStorage` only. The footer explains exactly what leaves the browser. There are no cookies, no analytics, and no accounts.

## Tests

```bash
npm test        # 84 tests across 10 files
```

The suite covers:

- budget allocation, priority weighting, contingency floor, cent reconciliation
- timeline compression, date ordering, status boundaries
- advice rules for runway, per-guest budget, buffer, access, weather, permits
- constraint extraction from free-text notes
- brief validation and AI draft validation, including out-of-range values
- local and AI plan assembly, including malformed and thin model output
- Markdown export and pipe escaping
- rate limiting
- the `POST /api/plan` contract: content type, size cap, malformed JSON, field errors, the local plan with no key, and the per-client limit
- WCAG contrast computed from the actual CSS tokens
- copy checks: no em dash and no decorative emoji in source

`npm run lint`, `npm run typecheck`, and `npm run build` are also clean.

## Assumptions

- **One host, one event at a time.** The brief models a single event. Multi-day festivals and recurring programmes are out of scope.
- **The plan is a starting point.** Budget shares are proportions of the host's own total, not market quotes. Vendor entries are categories to book, not named businesses.
- **Advice is generic but honest.** Rules know about runway, spend per guest, buffer size, outdoor settings, guest scale, and details present in the notes. They do not know local permit rules or real supplier lead times.
- **Gemini is optional.** The local planner is the product's floor, not a degraded error state. The AI path improves the wording, not the arithmetic.
- **English and metric-neutral.** Copy is English. Currency formatting uses the selected currency. Dates are formatted for en-GB readability.
- **Browser storage is the database.** Clearing site data clears saved plans. There is no export other than the Markdown download.
- **One server instance.** The rate limiter is in-memory. A real deployment behind multiple instances would need a shared store such as Redis.

## What I would do next

- Nonce-based CSP through middleware.
- Persistent, shared rate limiting.
- Calendar export (`.ics`) and a printable run sheet.
- A revision history with a compare view, so a host can see what changed between drafts.
- Locale-aware date and currency formatting instead of a single en-GB presentation.

## License

MIT. See [LICENSE](./LICENSE).
#   T r e s t l e  
 