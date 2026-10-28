import { Lock } from 'lucide-react';
import Badge from '../components/Badge';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { achievements } from '../progress/achievements';
import { levels } from '../progress/levels';
import { useResults } from '../progress/ResultsContext';
import { useProgress } from '../progress/useProgress';
import list from './listPages.module.css';
import styles from './AchievementsPage.module.css';

/** "12 Dosežki" */
export default function AchievementsPage() {
  const progress = useProgress();
  const { history } = useResults();
  const { level, nextLevel, xp } = progress;

  return (
    <div className={list.page}>
      <header>
        <h1 className={list.title}>Dosežki</h1>
        <p className={list.subtitle}>
          Značke dobiš za redno vadbo in obvladana poglavja – tekmuješ samo s
          seboj.
        </p>
      </header>

      <Card className={styles.level}>
        <div className={styles.levelRow}>
          <div className={styles.levelNumber}>{level.number}</div>
          <div className={styles.levelText}>
            <h2 className={styles.levelName}>
              Stopnja {level.number} – {level.name}
            </h2>
            <ProgressBar
              value={progress.levelProgress}
              height={10}
              label="Napredek do naslednje stopnje"
            />
            <span className={list.muted}>
              {nextLevel
                ? `${xp} / ${nextLevel.minXp} XP · še ${progress.xpToNextLevel} XP do stopnje ${nextLevel.name}`
                : `${xp} XP · najvišja stopnja`}
            </span>
          </div>
        </div>
        <div className={styles.ladder}>
          {levels.map((item) => (
            <Badge
              key={item.number}
              tone={
                item.number === level.number
                  ? 'primary'
                  : item.number < level.number
                    ? 'success'
                    : 'neutral'
              }
            >
              {item.number} {item.name}
            </Badge>
          ))}
        </div>
      </Card>

      <div className={styles.badges}>
        {achievements(history, progress).map((achievement) => {
          const unlocked = achievement.progress >= achievement.target;
          const Icon = unlocked ? achievement.icon : Lock;
          return (
            <Card
              key={achievement.id}
              className={`${styles.badge} ${unlocked ? '' : styles.locked}`}
            >
              <div className={styles.badgeIcon}>
                <Icon size={26} />
              </div>
              <h3 className={styles.badgeName}>{achievement.name}</h3>
              <p className={styles.badgeDescription}>
                {achievement.description}
              </p>
              <div className={styles.badgeProgress}>
                {unlocked ? (
                  <Badge tone="success">Odklenjeno</Badge>
                ) : (
                  <>
                    <ProgressBar
                      value={achievement.progress / achievement.target}
                      label={`${achievement.name}: napredek`}
                    />
                    <span>
                      {Math.min(achievement.progress, achievement.target)} /{' '}
                      {achievement.target}
                    </span>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
