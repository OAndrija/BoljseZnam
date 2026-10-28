/**
 * Slovenian plural: forms for 1, 2, 3–4 and 5+ (by the last two digits),
 * e.g. 1 naloga, 2 nalogi, 3 naloge, 5 nalog, 101 naloga.
 */
export function plural(
  count: number,
  forms: [one: string, two: string, few: string, many: string],
): string {
  const lastTwo = count % 100;
  const form =
    lastTwo === 1
      ? forms[0]
      : lastTwo === 2
        ? forms[1]
        : lastTwo === 3 || lastTwo === 4
          ? forms[2]
          : forms[3];
  return `${count} ${form}`;
}

export const tasks = (count: number) =>
  plural(count, ['naloga', 'nalogi', 'naloge', 'nalog']);

export const chapters = (count: number) =>
  plural(count, ['poglavje', 'poglavji', 'poglavja', 'poglavij']);

export const exams = (count: number) =>
  plural(count, ['preizkus', 'preizkusa', 'preizkusi', 'preizkusov']);

export const atoms = (count: number) =>
  plural(count, ['atom', 'atoma', 'atomi', 'atomov']);

/** "34 pravilnih" */
export const correctAnswers = (count: number) =>
  plural(count, ['pravilna', 'pravilni', 'pravilne', 'pravilnih']);

/** "3 pravilne zapored" */
export const correctInRow = (count: number) =>
  `${plural(count, ['pravilna', 'pravilni', 'pravilne', 'pravilnih'])} zapored`;
