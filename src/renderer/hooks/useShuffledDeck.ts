import { useState } from 'react';

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Goes through the items in random order without repeats; reshuffles
 * once every item has been shown.
 */
export function useShuffledDeck<T>(items: readonly T[]) {
  const [deck, setDeck] = useState(() => shuffled(items));
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index + 1 < deck.length) {
      setIndex(index + 1);
      return;
    }
    // avoid showing the same item twice in a row after reshuffling
    let reshuffled = shuffled(items);
    if (reshuffled.length > 1 && reshuffled[0] === deck[index]) {
      reshuffled = [...reshuffled.slice(1), reshuffled[0]];
    }
    setDeck(reshuffled);
    setIndex(0);
  };

  return { current: deck[index], next };
}
