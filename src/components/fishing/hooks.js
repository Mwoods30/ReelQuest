import { useCallback, useEffect, useRef, useState } from 'react';
import { dedupeLeaderboardEntries, readGlobalScores } from './storage.js';
import { OFFLINE_MODE } from './constants.js';

/* -------------------------------------------------------
   LEADERBOARD HOOK
-------------------------------------------------------- */
export const useLeaderboard = (isAuthenticated) => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  useEffect(() => {
    let unsubscribe = null;

    const loadLeaderboard = async () => {
      // Offline or guest → local storage only
      if (OFFLINE_MODE || !isAuthenticated) {
        const localScores = dedupeLeaderboardEntries(readGlobalScores());
        setGlobalLeaderboard(localScores);
        return;
      }

      try {
        // Firebase real-time listener
        const { subscribeToLeaderboard } = await import('../../firebase/database.js');
        unsubscribe = subscribeToLeaderboard((scores) => {
          setGlobalLeaderboard(dedupeLeaderboardEntries(scores));
        });
      } catch (err) {
        console.warn("Falling back to local leaderboard:", err?.message || err);
        const localScores = dedupeLeaderboardEntries(readGlobalScores());
        setGlobalLeaderboard(localScores);
      }
    };

    loadLeaderboard();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isAuthenticated]);

  return [globalLeaderboard, setGlobalLeaderboard];
};


/* -------------------------------------------------------
   GAME TIMER HOOK
-------------------------------------------------------- */
export const useGameTimer = (phase, onExpire, duration = 60) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timeLeftRef = useRef(duration);
  const timerRef = useRef(null);

  // Stop interval safely
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle starting/ending timer based on game active state.
  // Using a boolean instead of phase prevents the interval from
  // restarting on every phase change (ready→waiting→hooked→celebrate→ready),
  // which caused the timer to drift by up to 1 second per catch.
  const isActive = phase !== 'idle' && phase !== 'ended';

  useEffect(() => {
    if (!isActive) {
      clearTimer();
      return;
    }

    // Already running — don't create a duplicate interval
    if (timerRef.current !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [isActive, clearTimer]);

  // Fire onExpire EXACTLY once when timer hits zero
  useEffect(() => {
    timeLeftRef.current = timeLeft;

    if (phase !== "idle" && timeLeft === 0) {
      onExpire?.();
    }
  }, [timeLeft, phase, onExpire]);

  return { timeLeft, setTimeLeft, timeLeftRef, clearTimer };
};
