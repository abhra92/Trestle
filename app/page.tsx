import { Planner } from "@/components/Planner";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.intro} aria-labelledby="page-title" data-print="hide">
        <h1 className={styles.title} id="page-title">
          Plan the thing you are hosting.
        </h1>
        <div className={styles.introAside}>
          <p>
            Write a short brief. Trestle sizes the budget, dates the milestones, lists the vendors to book, and
            flags what will bite before you sign.
          </p>
          <p className={styles.introNote}>
            Weddings, birthdays, and community events. No account, no dashboard, no syncing.
          </p>
        </div>
      </section>

      <Planner />
    </>
  );
}
