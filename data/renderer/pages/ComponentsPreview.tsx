import { useState } from 'react';
import { Atom, FileText, Scale, Trophy, Zap } from 'lucide-react';
import AnswerOption from '../components/AnswerOption';
import Badge from '../components/Badge';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/Button';
import FeedbackBanner from '../components/FeedbackBanner';
import ModeCard from '../components/ModeCard';
import ProgressBar from '../components/ProgressBar';
import styles from './ComponentsPreview.module.css';

/** Dev-only page (#/komponente) for comparing components with Figma. */
export default function ComponentsPreview() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.page}>
      <h1>Komponente</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>Gumb</h2>
        <div className={styles.row}>
          <Button>Primarni</Button>
          <Button variant="secondary">Sekundarni</Button>
          <Button variant="ghost">Tihi</Button>
          <Button variant="success">Potrdi</Button>
          <Button variant="danger">Zavrni</Button>
          <Button disabled>Onemogočen</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Oznaka</h2>
        <div className={styles.row}>
          <Badge>+100 XP</Badge>
          <Badge tone="success" icon={<Zap size={12} />}>
            +10 XP
          </Badge>
          <Badge tone="error">Napačno</Badge>
          <Badge tone="streak">3 pravilne zapored</Badge>
          <Badge tone="neutral">Obkroževanje</Badge>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Pot in napredek</h2>
        <Breadcrumb
          items={[
            { label: 'Po poglavjih', to: '/poglavja' },
            { label: 'Kisline, baze in soli' },
          ]}
        />
        <ProgressBar value={3 / 14} label="Naloga 3 od 14" />
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Možnost odgovora (klikni)</h2>
        {['Raztopina sode bikarbone', 'Kis', 'Destilirana voda'].map(
          (text, index) => (
            <AnswerOption
              key={text}
              letter={'abc'[index]}
              state={selected === index ? 'selected' : 'default'}
              onClick={() => setSelected(index)}
            >
              {text}
            </AnswerOption>
          ),
        )}
        <AnswerOption letter="b" state="correct" disabled>
          Pravilno
        </AnswerOption>
        <AnswerOption letter="a" state="wrong" disabled>
          Napačno
        </AnswerOption>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Povratna informacija</h2>
        <FeedbackBanner
          kind="success"
          title="Pravilno! Odlično."
          rewards={
            <>
              <Badge tone="success">+10 XP</Badge>
              <Badge tone="streak">3 pravilne zapored</Badge>
            </>
          }
        >
          To je propan-1-ol (tudi 1-propanol).
        </FeedbackBanner>
        <FeedbackBanner
          kind="error"
          title="Ni čisto prav – a zdaj veš, zakaj."
          rewards={<Badge tone="error">+2 XP za poskus</Badge>}
        >
          Izbral si A. Pravilen odgovor je B.
        </FeedbackBanner>
        <FeedbackBanner kind="neutral" title="Primer odgovora iz rešitev">
          Tega odgovora ni mogoče samodejno preveriti – primerjaj ga s svojim.
        </FeedbackBanner>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Načini vadbe</h2>
        <div className={styles.grid}>
          <ModeCard
            to="/poglavja"
            tone="primary"
            icon={<FileText size={22} />}
            meta="6 poglavij"
            title="Naloge po poglavjih"
            description="Vadi tisto, kar trenutno delaš pri pouku."
          />
          <ModeCard
            to="/npz"
            tone="success"
            icon={<Trophy size={22} />}
            meta="9 preizkusov"
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
      </section>
    </div>
  );
}
