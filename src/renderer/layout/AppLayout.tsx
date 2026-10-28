import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.layout}>
      {/* Periodic table modal comes in phase 6 */}
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
