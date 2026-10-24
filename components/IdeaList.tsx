import { COST_BAND_LABEL, EFFORT_LABEL } from "@/lib/catalog";
import type { Idea } from "@/lib/types";
import styles from "./planner.module.css";

interface IdeaListProps {
  ideas: Idea[];
}

export function IdeaList({ ideas }: IdeaListProps) {
  return (
    <section className={styles.block} aria-labelledby="ideas-heading">
      <h4 className={styles.blockTitle} id="ideas-heading">
        Ideas for this brief
      </h4>
      <p className={styles.blockLead}>Small things that change how the day feels, not how it looks in a photo.</p>

      <ul className={styles.ideaList}>
        {ideas.map((idea) => (
          <li key={idea.id} className={styles.idea}>
            <h5 className={styles.ideaTitle}>{idea.title}</h5>
            <p className={styles.ideaDetail}>{idea.detail}</p>
            <p className={styles.ideaMeta}>
              {EFFORT_LABEL[idea.effort]} · {COST_BAND_LABEL[idea.costBand]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
