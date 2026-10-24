"use client";

import { useRef, useState, type RefObject } from "react";
import { KIND_META, SETTING_LABEL, VIBE_LABEL, type EventKind } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { downloadText, filenameFor, planToMarkdown } from "@/lib/export";
import type { DraftMeta, Plan } from "@/lib/types";
import { BudgetLedger } from "./BudgetLedger";
import { Timeline } from "./Timeline";
import { VendorList } from "./VendorList";
import { IdeaList } from "./IdeaList";
import { AdvicePanel } from "./AdvicePanel";
import styles from "./planner.module.css";

interface PlanSheetProps {
  plan: Plan;
  meta: DraftMeta | null;
  saveState: "idle" | "saved" | "blocked";
  busy: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onChange: (plan: Plan) => void;
  onRevise: (text: string) => void;
}

const WORKING_NOTE: Record<NonNullable<DraftMeta["fallbackReason"]>, string> = {
  "missing-key": "Drafted by the local planner. No Gemini key is set for this deployment.",
  timeout: "Gemini did not answer in time, so the local planner wrote this draft.",
  quota: "Gemini's quota is used up, so the local planner wrote this draft.",
  upstream: "Gemini returned an error, so the local planner wrote this draft.",
  invalid: "Gemini's answer did not pass validation, so the local planner wrote this draft.",
};

function sourceLine(plan: Plan, meta: DraftMeta | null): string {
  const day = formatDate(plan.createdAt.slice(0, 10));
  if (plan.source === "gemini") {
    return `Drafted with ${meta?.model ?? plan.model ?? "Gemini"} on ${day}.`;
  }
  if (meta?.fallbackReason) return `${WORKING_NOTE[meta.fallbackReason]} Drafted on ${day}.`;
  return `Drafted by the local planner on ${day}.`;
}

export function PlanSheet({ plan, meta, saveState, busy, headingRef, onChange, onRevise }: PlanSheetProps) {
  const [revision, setRevision] = useState("");
  const [downloadNote, setDownloadNote] = useState("");
  const revisionRef = useRef<HTMLInputElement>(null);

  const kind = KIND_META[plan.brief.kind as EventKind];

  function toggleMilestone(id: string) {
    onChange({
      ...plan,
      timeline: {
        ...plan.timeline,
        items: plan.timeline.items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
      },
    });
  }

  function toggleVendor(id: string) {
    onChange({
      ...plan,
      vendors: plan.vendors.map((vendor) => (vendor.id === id ? { ...vendor, booked: !vendor.booked } : vendor)),
    });
  }

  function handleDownload() {
    downloadText(filenameFor(plan), planToMarkdown(plan));
    setDownloadNote("Markdown file downloaded.");
  }

  function handleRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = revision.trim();
    if (text.length === 0 || busy) {
      revisionRef.current?.focus();
      return;
    }
    setDownloadNote("");
    onRevise(text);
  }

  return (
    <article className={styles.sheet} aria-labelledby="sheet-headline" data-print="sheet">
      <header className={styles.sheetHeader}>
        <p className={styles.sheetKicker}>
          {kind.label} · {formatDate(plan.timeline.eventDate)} · {plan.brief.guests} guests
        </p>
        <h3 className={styles.sheetHeadline} id="sheet-headline" ref={headingRef} tabIndex={-1}>
          {plan.headline}
        </h3>
        <p className={styles.sheetMeta}>
          {plan.brief.title} · {plan.brief.location} · {SETTING_LABEL[plan.brief.setting]} ·{" "}
          {VIBE_LABEL[plan.brief.vibe].toLowerCase()}
        </p>
        <p className={styles.sourceLine}>{sourceLine(plan, meta)}</p>
      </header>

      <div className={styles.sheetActions} data-print="hide">
        <button type="button" className={styles.secondaryButton} onClick={handleDownload}>
          Download as Markdown
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
          Print the sheet
        </button>
        <p className={styles.saveLine} aria-live="polite">
          {downloadNote ||
            (saveState === "saved"
              ? "Saved in this browser."
              : saveState === "blocked"
                ? "This browser is blocking local saving. The sheet still works until you reload."
                : "")}
        </p>
      </div>

      <BudgetLedger lines={plan.budget.lines} total={plan.budget.total} perGuest={plan.budget.perGuest} currency={plan.currency} />
      <Timeline items={plan.timeline.items} onToggle={toggleMilestone} compressed={plan.timeline.compressed} />
      <VendorList vendors={plan.vendors} onToggle={toggleVendor} />
      <IdeaList ideas={plan.ideas} />
      <AdvicePanel advice={plan.advice} />

      <details className={styles.assumptions}>
        <summary>What this plan assumes ({plan.assumptions.length})</summary>
        <ul>
          {plan.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>

      <form className={styles.revise} onSubmit={handleRevision} data-print="hide">
        <label htmlFor="revise">Change something</label>
        <p className={styles.hint} id="revise-hint">
          Say what to shift, for example: cut the food budget, no alcohol, or more photos. The whole sheet is
          redrafted and replaces the saved copy, so your ticks start fresh.
        </p>
        <div className={styles.reviseRow}>
          <input
            id="revise"
            ref={revisionRef}
            value={revision}
            onChange={(event) => setRevision(event.target.value)}
            maxLength={240}
            placeholder="What should change?"
            aria-describedby="revise-hint"
            disabled={busy}
          />
          <button type="submit" className={styles.primaryButton} disabled={busy || revision.trim().length === 0}>
            {busy ? "Redrafting" : "Redraft"}
          </button>
        </div>
      </form>
    </article>
  );
}
