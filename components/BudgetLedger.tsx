import type { Currency } from "@/lib/catalog";
import { formatMoney, formatPercent } from "@/lib/format";
import type { BudgetLine } from "@/lib/types";
import styles from "./planner.module.css";

interface BudgetLedgerProps {
  lines: BudgetLine[];
  total: number;
  perGuest: number;
  currency: Currency;
}

export function BudgetLedger({ lines, total, perGuest, currency }: BudgetLedgerProps) {
  return (
    <section className={styles.block} aria-labelledby="budget-heading">
      <h4 className={styles.blockTitle} id="budget-heading">
        Budget
      </h4>
      <p className={styles.blockLead}>
        Every line is a share of your own total, not a quote. Move money by editing the plan you take to a supplier.
      </p>

      <table className={styles.ledger}>
        <caption className={styles.srOnly}>Budget split by line</caption>
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Amount</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key}>
              <th scope="row">
                <span className={styles.ledgerRow}>
                  <span className={styles.ledgerLabel}>{line.label}</span>
                  <span className={styles.leader} aria-hidden="true" />
                </span>
                <span className={styles.ledgerNote}>{line.note}</span>
                <span className={styles.ledgerBar} aria-hidden="true">
                  <span style={{ width: `${Math.max(2, line.share * 100)}%` }} />
                </span>
              </th>
              <td className={styles.ledgerAmount}>{formatMoney(line.amount, currency)}</td>
              <td className={styles.ledgerShare}>{formatPercent(line.share)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className={styles.ledgerAmount}>{formatMoney(total, currency)}</td>
            <td className={styles.ledgerShare}>{formatMoney(perGuest, currency)} / guest</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
