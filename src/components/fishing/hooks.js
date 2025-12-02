import { useCallback, useEffect, useRef, useState } from 'react';
import { dedupeLeaderboardEntries, readGlobalScores } from './storage.js';
import { OFFLINE_MODE } from './constants.js';

export const useLeaderboard = (isAuthenticated) => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  useEffect(() => {
    let unsubscribe;

    const load = async () => {
      if (OFFLINE_MODE || !isAuthenticated) {
        const localScores = readGlobalScores();
        setGlobalLeaderboard(dedupeLeaderboardEntries(localScores));
        return;
      }

      try {
        const { subscribeToLeaderboard } = await import('../../firebase/database.js');
        unsubscribe = subscribeToLeaderboard((scores) => {
          setGlobalLeaderboard(dedupeLeaderboardEntries(scores));
        });
      } catch (error) {
        // Fall back to local scores if Firestore read fails
        console.warn('Falling back to local leaderboard:', error?.message || error);
        const localScores = readGlobalScores();
        setGlobalLeaderboard(dedupeLeaderboardEntries(localScores));
      }
    };

    load();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated]);

  return [globalLeaderboard, setGlobalLeaderboard];
};

export const useGameTimer = (phase, onExpire, duration = 60) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timeLeftRef = useRef(duration);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === 'idle' || phase === 'ended') {
      clearTimer();
      return undefined;
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearTimer();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [phase, clearTimer]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    if (phase !== 'idle' && timeLeft === 0) {
      onExpire?.();
    }
  }, [timeLeft, phase, onExpire]);

  return { timeLeft, setTimeLeft, timeLeftRef, clearTimer };
};
