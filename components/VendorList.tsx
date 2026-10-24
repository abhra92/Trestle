import { PRIORITY_LABEL, PRIORITY_LEVELS, type VendorPriority } from "@/lib/catalog";
import type { VendorItem } from "@/lib/types";
import styles from "./planner.module.css";

interface VendorListProps {
  vendors: VendorItem[];
  onToggle: (id: string) => void;
}

const GROUP_TITLE: Record<VendorPriority, string> = {
  essential: "Book first",
  useful: "Worth booking",
  optional: "Only if it fits",
};

export function VendorList({ vendors, onToggle }: VendorListProps) {
  const booked = vendors.filter((vendor) => vendor.booked).length;

  return (
    <section className={styles.block} aria-labelledby="vendors-heading">
      <div className={styles.blockHead}>
        <h4 className={styles.blockTitle} id="vendors-heading">
          Vendors
        </h4>
        <p className={styles.blockCount} aria-live="polite">
          {booked} of {vendors.length} booked
        </p>
      </div>
      <p className={styles.blockLead}>Categories to book, not named businesses. Ask each for a written quote.</p>

      {PRIORITY_LEVELS.map((priority) => {
        const group = vendors.filter((vendor) => vendor.priority === priority);
        if (group.length === 0) return null;
        return (
          <div key={priority} className={styles.vendorGroup}>
            <h5 className={styles.vendorGroupTitle}>{GROUP_TITLE[priority]}</h5>
            <ul className={styles.vendorList}>
              {group.map((vendor) => (
                <li key={vendor.id} className={styles.vendor} data-booked={vendor.booked}>
                  <label className={styles.tick}>
                    <input
                      type="checkbox"
                      checked={vendor.booked}
                      onChange={() => onToggle(vendor.id)}
                      aria-label={`Mark "${vendor.label}" as booked`}
                    />
                  </label>
                  <div className={styles.vendorBody}>
                    <p className={styles.vendorLabel}>{vendor.label}</p>
                    <p className={styles.vendorWhy}>{vendor.why}</p>
                    <p className={styles.vendorMeta}>
                      {vendor.category} · {PRIORITY_LABEL[vendor.priority]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
