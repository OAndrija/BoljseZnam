import { useNavigate } from 'react-router';
import { Atom, Check, FileText, Scale, Trophy } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import ModeCard from '../components/ModeCard';
import ProgressBar from '../components/ProgressBar';
import { type Catalog, useCatalog } from '../hooks/useCatalog';
import { loadLastPosition } from '../progress/lastPosition';
import { useProgress } from '../progress/useProgress';
import { chapters, exams, tasks } from '../utils/plural';
import styles from './HomePage.module.css';

const dayLetters = ['P', 'T', 'S', 'Č', 'P', 'S', 'N'];

/** Chapter of the day: changes every day, same for the whole day. */
function dailyChapter(catalog: Catalog) {
  const chapters = catalog.categories.filter((category) =>
    catalog.problems.some((problem) =>
      problem.categories.includes(category.id),
    ),
  );
  if (chapters.length === 0) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  return chapters[day % chapters.length];
}

export default function HomePage() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const progress = useProgress();
  const lastPosition = loadLastPosition();

  const chapter = catalog && dailyChapter(catalog);
  const chapterSize =
    catalog?.problems.filter((problem) =>
      problem.categories.includes(chapter?.id ?? ''),
    ).length ?? 0;
  const chapterCount = catalog?.categories.length ?? 0;
  const examCount = new Set(catalog?.problems.map(({ year }) => year)).size;
  const tasksLeft = Math.max(progress.weeklyGoal - progress.weeklyDone, 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Atom className={styles.heroDecoration} size={220} strokeWidth={1} />
        <div className={styles.heroText}>
          <h1 className={styles.greeting}>Živjo!</h1>
          <p className={styles.heroSubtitle}>
            {tasksLeft > 0
              ? `Še ${tasks(tasksLeft)} do tedenskega cilja.`
              : 'Tedenski cilj je dosežen – odlično!'}
          </p>
          <div className={styles.continueRow}>
            {lastPosition ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate(lastPosition.path)}
                >
                  Nadaljuj, kjer si ostal
                </Button>
                <span className={styles.continueLabel}>
                  {lastPosition.label}
                </span>
              </>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/poglavja')}>
                Začni z vajo
              </Button>
            )}
          </div>
        </div>

        <div className={styles.goal}>
          <div className={styles.goalHeader}>
            <span>Tedenski cilj</span>
            <span className={styles.goalCount}>
              {progress.weeklyDone} / {tasks(progress.weeklyGoal)}
            </span>
          </div>
          <ProgressBar
            value={progress.weeklyDone / progress.weeklyGoal}
            height={8}
            label="Tedenski cilj"
          />
          <div className={styles.days}>
            {dayLetters.map((letter, index) => (
              <div key={index} className={styles.day}>
                <span
                  className={`${styles.dayDot} ${progress.activeDays[index] ? styles.dayDone : ''}`}
                >
                  {progress.activeDays[index] && (
                    <Check size={14} strokeWidth={3} />
                  )}
                </span>
                {letter}
              </div>
            ))}
          </div>
          <p className={styles.streakNote}>
            {progress.streakDays} dni zapored – ne prekini niza!
          </p>
        </div>
      </section>

      {chapter && (
        <Card className={styles.challenge}>
          <div className={styles.challengeIcon}>
            <Trophy size={26} />
          </div>
          <div className={styles.challengeText}>
            <span className={styles.eyebrow}>IZZIV DNEVA</span>
            <h2 className={styles.challengeTitle}>
              {tasks(chapterSize)} iz poglavja {chapter.name}
            </h2>
            {/* TODO: award the double points once XP is saved (phase 5) */}
            <p className={styles.muted}>
              Reši vse brez napake in dobiš dvojne točke.
            </p>
          </div>
          <Badge>+100 XP</Badge>
          <Button
            onClick={() =>
              navigate(`/naloga?poglavje=${encodeURIComponent(chapter.id)}`)
            }
          >
            Sprejmi izziv
          </Button>
        </Card>
      )}

      <h2 className={styles.sectionTitle}>Načini vadbe</h2>
      <div className={styles.modes}>
        <ModeCard
          to="/poglavja"
          tone="primary"
          icon={<FileText size={22} />}
          meta={chapters(chapterCount)}
          title="Naloge po poglavjih"
          description="Vadi tisto, kar trenutno delaš pri pouku."
        />
        <ModeCard
          to="/npz"
          tone="success"
          icon={<Trophy size={22} />}
          meta={exams(examCount)}
          title="Celoten NPZ"
          description="Preizkusi se na pravem preizkusu od začetka do konca."
        />
        <ModeCard
          to="/spojine"
          tone="streak"
          icon={<Atom size={22} />}
          meta="Neomejeno"
          title="Poimenuj spojino"
          description="Naključne organske spojine – koliko jih poznaš?"
        />
        <ModeCard
          to="/reakcije"
          tone="error"
          icon={<Scale size={22} />}
          meta="Neomejeno"
          title="Uredi reakcijo"
          description="Dopolni koeficiente, da bo enačba uravnotežena."
        />
      </div>
    </div>
  );
}
