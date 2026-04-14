import { useState, useCallback, useMemo } from 'react';
import { Filter } from 'bad-words';
import { globalProfanityList } from '../data/profanity';

const MAX_STRIKES = 5;
const STORAGE_KEY = 'tv_community_strikes';

// ── Helper ────────────────────────────────────────────────────────────────────
function loadStrikes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : Math.min(val, MAX_STRIKES);
  } catch {
    return 0;
  }
}

function saveStrikes(n) {
  try {
    localStorage.setItem(STORAGE_KEY, String(n));
  } catch { /* ignore */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useModerator() {
  const [strikes, setStrikes] = useState(() => loadStrikes());

  // Inizializza la libreria open-source bad-words
  const filter = useMemo(() => {
    const f = new Filter();
    // Aggiungi termini finanziari e profanità multilingua (IT, FR, DE, ES + Spam)
    f.addWords(...globalProfanityList);
    return f;
  }, []);

  const isBanned = strikes >= MAX_STRIKES;

  /**
   * Controlla il testo usando la libreria open-source.
   * Ritorna true se il testo contiene profanità, false altrimenti.
   */
  const checkContent = useCallback((text) => {
    if (!text || !text.trim()) return false;
    return filter.isProfane(text);
  }, [filter]);

  /**
   * Aggiunge uno strike e ritorna il nuovo stato
   */
  const addStrikeAndGetStatus = useCallback(() => {
    const newStrikes = Math.min(strikes + 1, MAX_STRIKES);
    setStrikes(newStrikes);
    saveStrikes(newStrikes);
    return {
      newStrikes,
      isBanned: newStrikes >= MAX_STRIKES,
    };
  }, [strikes]);

  const resetStrikes = useCallback(() => {
    setStrikes(0);
    saveStrikes(0);
  }, []);

  return { 
    strikes, 
    isBanned, 
    checkContent, 
    addStrikeAndGetStatus, 
    resetStrikes, 
    MAX_STRIKES 
  };
}
