/**
 * useCards — Single source of truth for card data.
 *
 * cards-gallery saves edits to AsyncStorage under CARD_EDITS_KEY.
 * Every screen that needs cards should call useCards() instead of
 * reading ALL_CARDS directly, so gallery changes propagate everywhere.
 *
 * Usage:
 *   const cards = useCards();           // all cards, edits applied
 *   const cards = useCards([id1,id2]);  // filtered subset
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_CARDS } from './cards-data';
import { Card } from './types';

/** Must match CARD_EDITS_KEY in cards-gallery.tsx */
export const CARD_EDITS_KEY = 'card_edits_v1';

/** Returns ALL_CARDS merged with any saved edits from the gallery. */
export async function getCardsWithEdits(): Promise<Card[]> {
<<<<<<< HEAD
    try {
        const raw = await AsyncStorage.getItem(CARD_EDITS_KEY);
        if (!raw) return ALL_CARDS;
        const map: Record<string, Partial<Card>> = JSON.parse(raw);
        return ALL_CARDS.map(c => (map[c.id] ? { ...c, ...map[c.id] } : c));
    } catch {
        return ALL_CARDS;
    }
=======
  try {
    const raw = await AsyncStorage.getItem(CARD_EDITS_KEY);
    if (!raw) return ALL_CARDS;
    const map: Record<string, Partial<Card>> = JSON.parse(raw);
    return ALL_CARDS.map(c => (map[c.id] ? { ...c, ...map[c.id] } : c));
  } catch {
    return ALL_CARDS;
  }
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
}

/**
 * React hook — returns cards with gallery edits applied.
 * @param ids  Optional card IDs to filter. Omit to get all cards.
 */
export function useCards(ids?: string[]): Card[] {
<<<<<<< HEAD
    const [cards, setCards] = useState<Card[]>(
        ids ? ALL_CARDS.filter(c => ids.includes(c.id)) : ALL_CARDS
    );

    useEffect(() => {
        let cancelled = false;
        getCardsWithEdits().then(merged => {
            if (cancelled) return;
            setCards(ids ? merged.filter(c => ids.includes(c.id)) : merged);
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ids?.join(',')]);

    return cards;
}
=======
  const [cards, setCards] = useState<Card[]>(
    ids ? ALL_CARDS.filter(c => ids.includes(c.id)) : ALL_CARDS
  );

  useEffect(() => {
    let cancelled = false;
    getCardsWithEdits().then(merged => {
      if (cancelled) return;
      setCards(ids ? merged.filter(c => ids.includes(c.id)) : merged);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids?.join(',')]);

  return cards;
}
>>>>>>> 765f6de734d6ad6d1dd61f8dfa220559988ac639
