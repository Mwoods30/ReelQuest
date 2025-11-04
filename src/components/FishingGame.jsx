import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './FishingGame.css';

const GAME_DURATION = 60;
const STORAGE_KEY = 'reelquest:fishing:best-score';

const PHASES = Object.freeze({
  IDLE: 'idle',
  READY: 'ready',
  WAITING: 'waiting',
  HOOKED: 'hooked',
  CELEBRATE: 'celebrate',
  ENDED: 'ended'
});

const FISH_TYPES = [
  {
    name: 'Bluegill',
    emoji: '🐟',
    rarity: 'Common',
    points: 10,
    difficulty: 1.0,
    escapeRate: 1.0
  },
  {
    name: 'Yellow Perch',
    emoji: '🐠',
    rarity: 'Common',
    points: 14,
    difficulty: 1.2,
    escapeRate: 1.2
  },
  {
    name: 'Rainbow Trout',
    emoji: '🐡',
    rarity: 'Uncommon',
    points: 20,
    difficulty: 1.6,
    escapeRate: 1.4
  },
  {
    name: 'Striped Bass',
    emoji: '🐬',
    rarity: 'Rare',
    points: 28,
    difficulty: 1.9,
    escapeRate: 1.6
  },
  {
    name: 'Golden Marlin',
    emoji: '🐋',
    rarity: 'Legendary',
    points: 40,
    difficulty: 2.4,
    escapeRate: 1.9
  }
];

const rarityWeight = (rarity) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 0.6;
    case 'rare':
      return 1.2;
    case 'uncommon':
      return 2.5;
    default:
      return 4.5;
  }
};

const pickRandomFish = () => {
  const totalWeight = FISH_TYPES.reduce((sum, fish) => sum + rarityWeight(fish.rarity), 0);
  let target = Math.random() * totalWeight;

  for (const fish of FISH_TYPES) {
    target -= rarityWeight(fish.rarity);
    if (target <= 0) {
      return { ...fish, id: cryptoRandomId() };
    }
  }

  const fallback = FISH_TYPES[FISH_TYPES.length - 1];
  return { ...fallback, id: cryptoRandomId() };
};

const cryptoRandomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fish-${Math.random().toString(36).slice(2, 11)}`;
};

const safeLocalStorage =
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined;

const readStoredBestScore = () => {
  if (!safeLocalStorage) return 0;
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  return stored ? Number(stored) || 0 : 0;
};

const writeStoredBestScore = (value) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(STORAGE_KEY, String(value));
};

const formatTime = (seconds) => {
  const remaining = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const createBubbleField = () =>
  Array.from({ length: 24 }).map((_, index) => ({
    id: `bubble-${index}`,
    left: `${Math.random() * 100}%`,
    size: randomBetween(6, 18),
    duration: randomBetween(8, 18),
    delay: randomBetween(0, 8)
  }));

const createSwimField = () =>
  Array.from({ length: 7 }).map((_, index) => ({
    id: `swimmer-${index}`,
    left: `${randomBetween(5, 90)}%`,
    top: `${randomBetween(30, 80)}%`,
    duration: randomBetween(2.2, 4.5),
    delay: randomBetween(0, 2)
  }));

function FishingGame({ onGameComplete }) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readStoredBestScore);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentFish, setCurrentFish] = useState(null);
  const [reelProgress, setReelProgress] = useState(0);
  const [totalCatches, setTotalCatches] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastCatch, setLastCatch] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const streakRef = useRef(0);
  const timerRef = useRef(null);
  const biteTimeoutRef = useRef(null);
  const reelDecayRef = useRef(null);
  const celebrationTimeoutRef = useRef(null);
  const phaseRef = useRef(PHASES.IDLE);
  const timeLeftRef = useRef(GAME_DURATION);

  const bubbles = useMemo(createBubbleField, []);
  const swimmers = useMemo(createSwimField, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearBiteTimeout = useCallback(() => {
    if (biteTimeoutRef.current) {
      clearTimeout(biteTimeoutRef.current);
      biteTimeoutRef.current = null;
    }
  }, []);

  const clearReelDecay = useCallback(() => {
    if (reelDecayRef.current) {
      clearInterval(reelDecayRef.current);
      reelDecayRef.current = null;
    }
  }, []);

  const clearCelebration = useCallback(() => {
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
  }, []);

  const cleanupAll = useCallback(() => {
    clearTimer();
    clearBiteTimeout();
    clearReelDecay();
    clearCelebration();
  }, [clearTimer, clearBiteTimeout, clearReelDecay, clearCelebration]);

  const endGame = useCallback(() => {
    if (phase === PHASES.ENDED) return;

    cleanupAll();
    streakRef.current = 0;
    setCurrentFish(null);
    setReelProgress(0);
    setLastCatch(null);
    setStreak(0);
    setStatusMessage(null);
    setTimeLeft(0);

    const nextBest = Math.max(bestScore, score);
    if (nextBest !== bestScore) {
      setBestScore(nextBest);
      writeStoredBestScore(nextBest);
    }

    onGameComplete?.({
      score,
      catches: totalCatches,
      bestScore: nextBest,
      longestStreak
    });

    setPhase(PHASES.ENDED);
  }, [phase, cleanupAll, bestScore, score, totalCatches, longestStreak, onGameComplete]);

  const handleEscape = useCallback(
    (fish) => {
      if (!fish) return;
      clearReelDecay();
      setCurrentFish(null);
      setReelProgress(0);
      setPhase(PHASES.READY);
      streakRef.current = 0;
      setStreak(0);
      setStatusMessage(`${fish.name} slipped away!`);
    },
    [clearReelDecay]
  );

  const handleCatch = useCallback(
    (fish) => {
      if (!fish) return;
      clearReelDecay();
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      setLongestStreak((value) => Math.max(value, nextStreak));

      const streakBonus = nextStreak > 1 ? nextStreak * 5 : 0;
      const pointsEarned = fish.points + streakBonus;

      setScore((value) => value + pointsEarned);
      setTotalCatches((value) => value + 1);
      setLastCatch({ ...fish, pointsEarned, streak: nextStreak, streakBonus });
      setPhase(PHASES.CELEBRATE);
      setStatusMessage(`You landed a ${fish.name}!`);
      setCurrentFish(null);
      setReelProgress(100);

      clearCelebration();
      celebrationTimeoutRef.current = setTimeout(() => {
        setPhase(PHASES.READY);
        setReelProgress(0);
      }, 1200);
    },
    [clearReelDecay, clearCelebration]
  );

  const handleReel = useCallback(() => {
    if (phase !== PHASES.HOOKED || !currentFish) return;

    const reelPower = Math.max(8, 20 - currentFish.difficulty * 4);
    setReelProgress((value) => Math.min(100, value + reelPower));
  }, [phase, currentFish]);

  const beginFishFight = useCallback(
    (fish) => {
      setCurrentFish(fish);
      setPhase(PHASES.HOOKED);
      setReelProgress(randomBetween(20, 35));
      setStatusMessage(`${fish.name} is on the line — keep reeling!`);

      clearReelDecay();
      reelDecayRef.current = setInterval(() => {
        setReelProgress((value) => Math.max(0, value - (fish.escapeRate * 0.9 + 0.6)));
      }, 150);
    },
    [clearReelDecay]
  );

  const castLine = useCallback(() => {
    if (phase !== PHASES.READY || timeLeft <= 0) return;

    streakRef.current = Math.max(0, streakRef.current);
    setPhase(PHASES.WAITING);
    setStatusMessage('Waiting for a bite…');
    setCurrentFish(null);
    setReelProgress(0);

    clearBiteTimeout();
    biteTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== PHASES.WAITING || timeLeftRef.current <= 0) {
        return;
      }
      const fish = pickRandomFish();
      beginFishFight(fish);
    }, randomBetween(600, 1600));
  }, [phase, timeLeft, beginFishFight, clearBiteTimeout]);

  const startGame = useCallback(() => {
    cleanupAll();
    streakRef.current = 0;
    setScore(0);
    setTotalCatches(0);
    setStreak(0);
    setLongestStreak(0);
    setLastCatch(null);
    setStatusMessage('Cast your line to start catching fish!');
    setCurrentFish(null);
    setReelProgress(0);
    setTimeLeft(GAME_DURATION);
    setPhase(PHASES.READY);
  }, [cleanupAll]);

  useEffect(() => {
    if (phase === PHASES.IDLE || phase === PHASES.ENDED) {
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
    if (phase !== PHASES.IDLE && timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, phase, endGame]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (phase === PHASES.HOOKED && currentFish) {
      if (reelProgress >= 100) {
        handleCatch(currentFish);
      } else if (reelProgress <= 0) {
        handleEscape(currentFish);
      }
    }
  }, [phase, currentFish, reelProgress, handleCatch, handleEscape]);

  useEffect(() => () => cleanupAll(), [cleanupAll]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timeout = setTimeout(() => setStatusMessage(null), 1600);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  // Fullscreen functionality
  const gameRef = useRef(null);
  
  const toggleFullscreen = useCallback(async () => {
    if (!gameRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await gameRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error);
    }
  }, []);

  // Listen for fullscreen changes and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event) => {
      // F11 or F for fullscreen toggle
      if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey)) {
        event.preventDefault();
        toggleFullscreen();
      }
      // Escape to exit fullscreen
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  const timeDisplay = formatTime(timeLeft);
  const isPlaying = phase !== PHASES.IDLE && phase !== PHASES.ENDED;

  return (
    <div 
      ref={gameRef}
      className={`fishing-game ${isFullscreen ? 'fullscreen-game' : ''}`} 
      role="group" 
      aria-label="ReelQuest Fishing Mini Game"
    >
      <div className="water-background" aria-hidden="true">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`
            }}
          />
        ))}
        {swimmers.map((fish) => (
          <span
            key={fish.id}
            className="swimming-fish"
            style={{
              left: fish.left,
              top: fish.top,
              animationDuration: `${fish.duration}s`,
              animationDelay: `${fish.delay}s`
            }}
          >
            🐟
          </span>
        ))}
      </div>

      <div className="game-ui">
        <header className="game-header">
          <div className="score-display">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="timer-display">
            <span className="timer-label">Time</span>
            <span className="timer-value">{timeDisplay}</span>
          </div>
          <div className="best-score-display">
            <span className="best-score-label">Best</span>
            <span className="best-score-value">{Math.max(bestScore, score)}</span>
          </div>
          <button 
            className="fullscreen-button" 
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? '⤦' : '⛶'}
          </button>
        </header>

        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Catches</span>
            <span className="stat-value">{totalCatches}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Longest</span>
            <span className="stat-value">{longestStreak}</span>
          </div>
        </div>

        {isPlaying ? <div className="fishing-line" aria-hidden="true" /> : null}

        {phase === PHASES.WAITING ? (
          <div className="current-fish" role="status">
            <div className="fish-info">
              <span className="fish-emoji">🎣</span>
              <span className="fish-name">Something is nibbling…</span>
            </div>
            <p>Stay ready! Reel as soon as the fish bites.</p>
          </div>
        ) : null}

        {phase === PHASES.HOOKED && currentFish ? (
          <div className="current-fish">
            <div className="fish-info">
              <span className="fish-emoji">{currentFish.emoji}</span>
              <span className="fish-name">{currentFish.name}</span>
              <span className="fish-points">
                {currentFish.points} pts • {currentFish.rarity}
              </span>
            </div>
            <div className="reel-progress-container">
              <div className="reel-progress-label">Tap reel to fill the meter!</div>
              <div className="reel-progress-bar">
                <div
                  className="reel-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, reelProgress))}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {phase === PHASES.CELEBRATE && lastCatch ? (
          <div className="caught-fish" role="status">
            <span className="caught-emoji">{lastCatch.emoji}</span>
            <span className="caught-name">{lastCatch.name}</span>
            <span className="caught-points">
              +{lastCatch.pointsEarned} pts
              {lastCatch.streakBonus ? ` (streak x${lastCatch.streak})` : ''}
            </span>
          </div>
        ) : null}

        {phase === PHASES.ENDED ? (
          <div className="game-over" role="status">
            <div className="game-over-title">Time&apos;s Up!</div>
            <div className="final-stats">
              <p>
                Score: <strong>{score}</strong>
              </p>
              <p>
                Total Catches: <strong>{totalCatches}</strong>
              </p>
              <p>
                Longest Streak: <strong>{longestStreak}</strong>
              </p>
              {score >= bestScore ? <p className="new-record">New personal best!</p> : null}
            </div>
          </div>
        ) : null}

        <div className="instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Hit &quot;Start&quot; then cast your line to begin the 60 second run.</li>
            <li>When a fish bites, click &quot;Reel&quot; repeatedly to fill the meter.</li>
            <li>Keep your streak alive to earn bonus points on every catch.</li>
            <li>Legendary fish are rare, but worth big points when you land them.</li>
          </ul>
          <div className="fish-guide">
            <h4>Species Guide</h4>
            <div className="fish-list">
              {FISH_TYPES.map((fish) => (
                <div key={fish.name} className="fish-item">
                  <span className="fish-emoji" aria-hidden="true">
                    {fish.emoji}
                  </span>
                  <div className="fish-details">
                    <div>{fish.name}</div>
                    <div>
                      {fish.points} pts • {fish.rarity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="game-controls">
          {phase === PHASES.IDLE ? (
            <button className="start-button" type="button" onClick={startGame}>
              Start 60s Challenge
            </button>
          ) : null}

          {phase === PHASES.READY ? (
            <button className="cast-button" type="button" onClick={castLine}>
              Cast Line
            </button>
          ) : null}

          {phase === PHASES.WAITING ? (
            <button className="cast-button casting" type="button" disabled>
              Waiting for a bite…
            </button>
          ) : null}

          {phase === PHASES.HOOKED ? (
            <button className="cast-button" type="button" onClick={handleReel}>
              Reel!
            </button>
          ) : null}

          {phase === PHASES.CELEBRATE ? (
            <button className="cast-button" type="button" onClick={castLine}>
              Cast Again
            </button>
          ) : null}

          {isPlaying ? (
            <button className="end-game-button" type="button" onClick={endGame}>
              End Run
            </button>
          ) : null}

          {phase === PHASES.ENDED ? (
            <button className="play-again-button" type="button" onClick={startGame}>
              Fish Again
            </button>
          ) : null}

          {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
        </div>
      </div>
    </div>
  )
}

FishingGame.propTypes = {
  onGameComplete: PropTypes.func
};

export default FishingGame;
