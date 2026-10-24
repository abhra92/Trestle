# Trestle: design direction

Trestle is a planning notebook for people who are hosting something: a wedding, a birthday, a street fair. The interface should feel like a well made printed program on a kitchen table, not a dashboard. Warm, quiet, legible, with money and dates treated as the important printed facts they are.

Dial: **ENERGY 2 / RHYTHM 3 / MOTION 2**

## Identity

- Product name: Trestle (the long table people gather around). The wordmark is set in the display serif, lowercase, no icon, no sparkle.
- One screen, one job: write the brief, read the plan. The brief panel and the plan sheet sit side by side on a wide screen, and stack on a phone.
- The plan is a sheet of paper. It is the only surface allowed a shadow, because it is the one object lifted off the table.

## Palette

Two cores plus one accent. Neutrals are paper and ink.

| Token | Light | Dark ("Candlelight") | Role | Reason |
| --- | --- | --- | --- | --- |
| paper | `#f6f0e3` | `#161c19` | page ground | warm stock, not clinical white |
| sheet | `#fffdf6` | `#1e2622` | plan sheet | the sheet is brighter than the table it sits on |
| ink | `#1c2a24` | `#eee8d9` | body text | deep green black, softer than pure black on warm paper |
| ink soft | `#4d5b52` | `#b9c2b8` | secondary text | muted ink, still above 4.5:1 |
| rule | `#d6cbb4` | `#36423b` | hairlines | printed rule lines |
| accent | `#a8401f` | `#e08a5f` | persimmon | the one warm mark: section rule, active chip, focus ring |
| accent ink | `#8c3517` | `#f0b08d` | accent text on paper | darkened persimmon for 4.5:1 body text |
| danger | `#8f2f22` | `#f0a08a` | risk labels | reads as a printer's red, not a UI alert |
| safe | `#3f6b4a` | `#9ec9a8` | done labels | ink green, the same family as body text |

The accent is one warm mark with one meaning: this needs your attention. It appears on the short rule above a section title, the selected chip, the focus ring, the dot on a milestone that is due soon, and the label on a "watch" advice line. It is never used for buttons, page backgrounds, or decoration. Buttons are ink on paper.

## Typography

- Display: **Fraunces** (variable serif). Chosen because its soft, slightly wonky optical sizes read like a letterpress invitation, which is the emotional register of this product. Headlines, amounts, and the wordmark only.
- Text: **Karla** (humanist sans). Chosen for its wide apertures and tall x-height, which hold up at 13px in a dense checklist, and because it does not read as the default UI grotesque.
- Money and dates use `font-variant-numeric: tabular-nums` so columns line up like a printed ledger.
- Labels are sentence case. No wide tracked uppercase, no monospace anywhere.

## The motif

A printed program uses dot leaders to connect a label to its amount. Trestle's budget ledger does exactly that: `Catering ........ 2,400`. Section headers sit under a short persimmon rule, and the sheet has a double hairline under its masthead. This motif is functional (it aligns money) and it is what makes the screen belong to this product.

## Composition (RHYTHM 3)

- Masthead: wordmark left, navigation and theme control right. One line, lots of air.
- Brief panel: narrow column, form as a stack of short questions. No cards.
- Plan sheet: wide, asymmetric. Ledger on paper with leaders, timeline as a date spine, vendors as a grouped list, ideas as margin notes with a hairline on the left.
- Saved plans: a quiet list at the end of the page. It is present from the start so the navigation has an honest target; when empty it says so in one sentence and links back to the brief.
- No hero, no feature grid, no testimonial, no pricing, no FAQ, no logo bar. The product is the page.

## Motion (MOTION 2)

- The plan sheet fades up 8px once when it arrives, so the eye lands where the work landed.
- Ledger bars ease in width once, to show share of budget.
- Chips and buttons have 120ms hover and focus transitions.
- The only loop is the loading placeholder: three quiet bars that breathe slowly while a draft is in flight, because a twelve second wait with no movement reads as a hung page. Nothing else loops, and no element pulses, parallaxes, or bounces. `prefers-reduced-motion` removes all of it.

## States

- Empty: the plan area says what will appear and links to the brief.
- Loading: one line naming the wait plus a quiet three line placeholder that is labelled as loading, not a fake plan.
- Error: states what failed, offers retry, and says the key may be missing.
- Saved plans: empty state explains that saving happens in this browser. No account, no sync claim.

## Accessibility

- Full keyboard path: skip link, labelled fields, fieldsets for chip groups, focus moved to the plan heading after generation, and a visible focus ring on every control. The two disclosures use native `details`, so they open and close from the keyboard without custom script.
- All text meets WCAG AA in both themes. Measured in `lib/__tests__/contrast.test.ts`.
- Tap targets are at least 44px. No horizontal overflow at 360px.
- Status changes are announced with `aria-live="polite"`.

## Boundaries

- The date and plan are stored in this browser only. Nothing is sent anywhere except the brief, to Gemini, when a key is configured.
- No invented vendors, prices, or statistics. Budget figures are computed from the host's own total. Advice lines come from a deterministic rules engine, not from the model.
