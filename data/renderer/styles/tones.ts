import tones from './tones.module.css';

export type Tone = 'primary' | 'success' | 'error' | 'streak' | 'neutral';

/** Class that sets --tone-bg / --tone-fg for the given tone. */
export function toneClass(tone: Tone): string {
  return tones[tone];
}
