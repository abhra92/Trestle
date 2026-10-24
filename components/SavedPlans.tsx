"use client";

import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Plan } from "@/lib/types";
import styles from "./planner.module.css";

interface SavedPlansProps {
  plans: Plan[];
  currentId: string | null;
  loaded: boolean;
  onOpen: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function SavedPlans({ plans, currentId, loaded, onOpen, onDelete }: SavedPlansProps) {
  return (
    <>
      <div className={styles.savedHead}>
        <h2 id="saved-heading" className={styles.sectionTitle}>
          Saved plans
        </h2>
        <p className={styles.savedCount}>
          {loaded ? `${plans.length} of 8 saved in this browser` : "Reading this browser"}
        </p>
      </div>

      {!loaded ? (
        <p className={styles.stateBody}>Reading saved plans from this browser.</p>
      ) : plans.length === 0 ? (
        <div className={styles.savedEmpty}>
          <p>
            Nothing saved yet. Every plan you draft stays in this browser, on this device. There is no account and
            nothing syncs.
          </p>
          <a className={styles.textLink} href="#brief">
            Draft the first one
          </a>
        </div>
      ) : (
        <ul className={styles.savedList}>
          {plans.map((plan) => (
            <li key={plan.id} className={styles.savedItem} data-current={plan.id === currentId}>
              <div className={styles.savedBody}>
                <p className={styles.savedTitle}>{plan.headline}</p>
                <p className={styles.savedMeta}>
                  {plan.brief.title} · {formatDate(plan.timeline.eventDate)} ·{" "}
                  {formatMoney(plan.budget.total, plan.currency)} · {plan.source === "gemini" ? "Gemini draft" : "Local draft"}
                </p>
              </div>
              <div className={styles.savedActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => onOpen(plan)}
                  aria-label={`Open the plan for ${plan.brief.title}`}
                >
                  Open
                </button>
                <button
                  type="button"
                  className={styles.quietButton}
                  onClick={() => onDelete(plan.id)}
                  aria-label={`Delete the plan for ${plan.brief.title}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
