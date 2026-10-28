// Where the user left off, for "Nadaljuj, kjer si ostal" on the home screen.
// Per-device convenience only, so localStorage is fine (and may be empty).
const STORAGE_KEY = 'bolje-znam:zadnja-naloga';

export interface LastPosition {
  path: string;
  label: string;
}

export function saveLastPosition(position: LastPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // storage unavailable – nothing to remember
  }
}

export function loadLastPosition(): LastPosition | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LastPosition) : null;
  } catch {
    return null;
  }
}

export function clearLastPosition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
