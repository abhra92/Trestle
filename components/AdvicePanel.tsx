import { SEVERITY_LABEL } from "@/lib/catalog";
import type { Advice } from "@/lib/types";
import styles from "./planner.module.css";

interface AdvicePanelProps {
  advice: Advice[];
}

export function AdvicePanel({ advice }: AdvicePanelProps) {
  if (advice.length === 0) return null;

  return (
    <section className={styles.block} aria-labelledby="advice-heading">
      <h4 className={styles.blockTitle} id="advice-heading">
        Before you book
      </h4>
      <p className={styles.blockLead}>
        Written by the app&apos;s own rules, not by the model, so every line can be traced to something you told it.
      </p>

      <ul className={styles.adviceList}>
        {advice.map((item) => (
          <li key={item.id} className={styles.advice} data-severity={item.severity}>
            <span className={styles.adviceLabel}>{SEVERITY_LABEL[item.severity]}</span>
            <p>{item.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
