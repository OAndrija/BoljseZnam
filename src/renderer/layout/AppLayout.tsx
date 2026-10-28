import { useState } from 'react';
import { Outlet } from 'react-router';
import PeriodicTableModal from '../components/PeriodicTableModal';
import { ResultsProvider } from '../progress/ResultsContext';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [periodicTableOpen, setPeriodicTableOpen] = useState(false);

  return (
    <ResultsProvider>
      <div className={styles.layout}>
        <Sidebar onOpenPeriodicTable={() => setPeriodicTableOpen(true)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <PeriodicTableModal
        open={periodicTableOpen}
        onClose={() => setPeriodicTableOpen(false)}
      />
    </ResultsProvider>
  );
}
