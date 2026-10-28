import { NavLink } from 'react-router';
import Button from '../components/Button';
import ProgressProfile from '../components/ProgressProfile';
import navDot from '../assets/icons/nav-dot.svg';
import navDotActive from '../assets/icons/nav-dot-active.svg';
import { useProgress } from '../progress/useProgress';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', label: 'Domov' },
  { to: '/poglavja', label: 'Po poglavjih' },
  { to: '/npz', label: 'Celoten NPZ' },
  { to: '/spojine', label: 'Poimenuj spojine' },
  { to: '/reakcije', label: 'Urejanje reakcij' },
  { to: '/zgodovina', label: 'Zgodovina' },
  { to: '/dosezki', label: 'Dosežki' },
];

export default function Sidebar({
  onOpenPeriodicTable,
}: {
  onOpenPeriodicTable?: () => void;
}) {
  const progress = useProgress();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>BZ</div>
        <div className={styles.logoText}>
          <span className={styles.appName}>Bolje Znam</span>
          <span className={styles.tagline}>Vadnica za devetošolce</span>
        </div>
      </div>

      <ProgressProfile {...progress} />

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={isActive ? navDotActive : navDot}
                  width={8}
                  height={8}
                  alt=""
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.spacer} />

      <Button variant="secondary" fullWidth onClick={onOpenPeriodicTable}>
        Periodni sistem
      </Button>
      <p className={styles.footnote}>
        Brez računa – napredek se shrani samo na tej napravi.
      </p>
    </aside>
  );
}
