"use client";

import { useEffect, useRef, useState } from "react";
import { readPlansSnapshot, removePlan, replacePlan, upsertPlan } from "@/lib/storage";
import type { BriefFieldErrors } from "@/lib/schema";
import type { DraftMeta, DraftResponse, EventBrief, Plan } from "@/lib/types";
import { BriefForm } from "./BriefForm";
import { PlanSheet } from "./PlanSheet";
import { SavedPlans } from "./SavedPlans";
import { useSavedPlans } from "./useSavedPlans";
import styles from "./planner.module.css";

type Status = "idle" | "loading" | "error";

export function Planner() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meta, setMeta] = useState<DraftMeta | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<BriefFieldErrors>({});
  const [pending, setPending] = useState<{ brief: EventBrief; refine: string } | null>(null);
  const { plans: saved, hydrated: loaded } = useSavedPlans();
  const [saveState, setSaveState] = useState<"idle" | "saved" | "blocked">("idle");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastFocused = useRef<string | null>(null);

  useEffect(() => {
    if (!plan || lastFocused.current === plan.id) return;
    lastFocused.current = plan.id;
    const node = headingRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "start" });
  }, [plan]);

  async function draft(brief: EventBrief, refine = "") {
    const reviseTarget = refine ? plan : null;
    setStatus("loading");
    setError("");
    setFieldErrors({});
    setPending({ brief, refine });
    setSaveState("idle");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brief, refine }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (DraftResponse & { error?: string; errors?: BriefFieldErrors })
        | null;

      if (!response.ok || !payload?.plan) {
        setStatus("error");
        setError(payload?.error ?? `The planner answered with status ${response.status}.`);
        if (payload?.errors) setFieldErrors(payload.errors);
        return;
      }

      // A revision keeps the saved plan's id so it updates that entry instead of
      // leaving a second copy with the same title in the saved list.
      const nextPlan = reviseTarget ? { ...payload.plan, id: reviseTarget.id } : payload.plan;
      setPlan(nextPlan);
      setMeta(payload.meta ?? null);
      setStatus("idle");

      try {
        upsertPlan(nextPlan, readPlansSnapshot());
        setSaveState("saved");
      } catch {
        setSaveState("blocked");
      }
    } catch {
      setStatus("error");
      setError("The request did not leave the browser. Check the connection and try again.");
    }
  }

  function retry() {
    if (!pending) return;
    void draft(pending.brief, pending.refine);
  }

  function updatePlan(next: Plan) {
    setPlan(next);
    try {
      replacePlan(next, readPlansSnapshot());
      setSaveState("saved");
    } catch {
      setSaveState("blocked");
    }
  }

  function openSaved(item: Plan) {
    setPlan(item);
    setMeta(null);
    setStatus("idle");
    setError("");
    setSaveState("saved");
  }

  function deleteSaved(id: string) {
    try {
      removePlan(id, readPlansSnapshot());
      if (plan?.id === id) setSaveState("idle");
    } catch {
      setSaveState("blocked");
    }
  }

  function revise(text: string) {
    if (!plan) return;
    void draft(plan.brief, text);
  }

  return (
    <>
      <div className={styles.workspace}>
        <section id="brief" className={styles.brief} aria-labelledby="brief-heading" data-print="hide">
          <h2 id="brief-heading" className={styles.sectionTitle}>
            The brief
          </h2>
          <p className={styles.sectionLead}>
            Seven answers is enough to start. The more you write in the notes, the more the plan can account for.
          </p>
          <BriefForm
            busy={status === "loading"}
            fieldErrors={fieldErrors}
            onClearError={() => {
              setFieldErrors({});
              setError("");
              if (status === "error") setStatus("idle");
            }}
            onSubmit={(brief) => draft(brief)}
          />
        </section>

        <section id="plan" className={styles.planColumn} aria-labelledby="plan-heading">
          <h2 id="plan-heading" className={styles.sectionTitle}>
            The plan
          </h2>

          {status === "loading" ? (
            <div className={styles.state} role="status">
              <h3 className={styles.stateTitle}>Drafting the plan</h3>
              <p className={styles.stateBody}>
                Sizing the budget, dating the milestones, and writing the notes for this brief. It usually takes a
                few seconds.
              </p>
              <div className={styles.loadLines} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}

          {status === "error" ? (
            <div className={styles.state} role="alert">
              <h3 className={styles.stateTitle}>That draft did not come back.</h3>
              <p className={styles.stateBody}>{error}</p>
              <div className={styles.stateActions}>
                {pending ? (
                  <button type="button" className={styles.secondaryButton} onClick={retry}>
                    Try that brief again
                  </button>
                ) : null}
                <a className={styles.textLink} href="#brief">
                  Change the brief
                </a>
              </div>
            </div>
          ) : null}

          {status === "idle" && !plan ? (
            <div className={styles.state}>
              <h3 className={styles.stateTitle}>Your plan lands here.</h3>
              <p className={styles.stateBody}>
                A budget that adds up to your total, milestones counted back from the date, the vendors to book, ideas
                for this brief, and the things to check before you sign anything.
              </p>
              <a className={styles.textLink} href="#brief">
                Write the brief
              </a>
            </div>
          ) : null}

          {plan ? (
            <PlanSheet
              plan={plan}
              meta={meta}
              saveState={saveState}
              busy={status === "loading"}
              headingRef={headingRef}
              onChange={updatePlan}
              onRevise={revise}
            />
          ) : null}
        </section>
      </div>

      <section id="saved" className={styles.saved} aria-labelledby="saved-heading" data-print="hide">
        <SavedPlans
          plans={saved}
          currentId={plan?.id ?? null}
          loaded={loaded}
          onOpen={openSaved}
          onDelete={deleteSaved}
        />
      </section>
    </>
  );
}
