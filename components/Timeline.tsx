import { formatDate, todayISO } from "@/lib/dates";
import { milestoneStatus } from "@/lib/timeline";
import type { Milestone } from "@/lib/types";
import styles from "./planner.module.css";

interface TimelineProps {
  items: Milestone[];
  compressed: boolean;
  onToggle: (id: string) => void;
}

const STATUS_TEXT: Record<ReturnType<typeof milestoneStatus>, string> = {
  done: "Done",
  overdue: "Overdue",
  soon: "Due soon",
  upcoming: "",
};

export function Timeline({ items, compressed, onToggle }: TimelineProps) {
  const today = todayISO();

  return (
    <section className={styles.block} aria-labelledby="timeline-heading">
      <h4 className={styles.blockTitle} id="timeline-heading">
        Timeline
      </h4>
      <p className={styles.blockLead}>
        {compressed
          ? "Your date is close, so the milestones are pulled together. A few of them now land in the same fortnight."
          : "Counted back from the event date. Tick a milestone when it is genuinely finished."}
      </p>

      <ol className={styles.timeline}>
        {items.map((item) => {
          const status = milestoneStatus(item.dueDate, item.done, today);
          return (
            <li key={item.id} className={styles.milestone} data-status={status}>
              <div className={styles.milestoneWhen}>
                <time dateTime={item.dueDate}>{formatDate(item.dueDate, { year: undefined })}</time>
                <span>{status === "upcoming" ? `${item.daysBefore} days before` : STATUS_TEXT[status]}</span>
              </div>
              <div className={styles.milestoneBody}>
                <p className={styles.milestoneLabel}>{item.label}</p>
                <p className={styles.milestoneDetail}>{item.detail}</p>
              </div>
              <label className={styles.tick}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(item.id)}
                  aria-label={`Mark "${item.label}" as done`}
                />
              </label>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
