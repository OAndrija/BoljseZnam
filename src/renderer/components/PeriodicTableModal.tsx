import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  categoryLabels,
  type ChemicalElement,
  type ElementCategory,
  elements,
  formatMass,
} from '../data/elements';
import styles from './PeriodicTableModal.module.css';

/** "Periodni sistem": can be opened from the sidebar on every screen. */
export default function PeriodicTableModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ChemicalElement>(elements[0]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="periodic-table-title"
      // Esc closes the dialog natively; keep React state in sync
      onClose={onClose}
      // a click outside the dialog box (on the backdrop) closes it too
      onClick={(event) => {
        // backdrop clicks target the dialog itself; keyboard "clicks" on
        // buttons inside have no coordinates, so check the target first
        if (event.target !== dialogRef.current) return;
        const box = dialogRef.current.getBoundingClientRect();
        const outside =
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom;
        if (outside) onClose();
      }}
    >
      <div className={styles.header}>
        <div>
          <h2 id="periodic-table-title" className={styles.title}>
            Periodni sistem elementov
          </h2>
          <p className={styles.subtitle}>
            Klikni na element za podrobnosti. Okno lahko odpreš na vsakem
            zaslonu.
          </p>
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Zapri"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.table}>
        <div className={`${styles.details} ${styles[selected.category]}`}>
          <div className={styles.detailsSymbol}>
            <small>{selected.number}</small>
            {selected.symbol}
          </div>
          <div className={styles.detailsText}>
            <span className={styles.detailsName}>{selected.name}</span>
            <span>Vrstno število: {selected.number}</span>
            <span>Relativna atomska masa: {formatMass(selected)}</span>
            <span>Vrsta: {categoryLabels[selected.category]}</span>
          </div>
        </div>

        {elements.map((element) => (
          <button
            key={element.number}
            type="button"
            className={`${styles.cell} ${styles[element.category]} ${element === selected ? styles.selected : ''}`}
            style={{ gridRow: element.row, gridColumn: element.column }}
            aria-label={`${element.name}, ${element.symbol}`}
            aria-pressed={element === selected}
            onClick={() => setSelected(element)}
          >
            <span className={styles.number}>{element.number}</span>
            <span className={styles.symbol}>{element.symbol}</span>
          </button>
        ))}

        {/* where the lanthanoids and actinoids belong */}
        <span
          className={styles.placeholder}
          style={{ gridRow: 6, gridColumn: 3 }}
        >
          57–71
        </span>
        <span
          className={styles.placeholder}
          style={{ gridRow: 7, gridColumn: 3 }}
        >
          89–103
        </span>
      </div>

      <div className={styles.legend}>
        {(Object.keys(categoryLabels) as ElementCategory[]).map((category) => (
          <span key={category} className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles[category]}`} />
            {categoryLabels[category]}
          </span>
        ))}
      </div>
    </dialog>
  );
}
