import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './FishingGame.css';
import {
  OFFLINE_MODE,
  GAME_DURATION,
  LEVEL_XP_REQUIREMENTS,
  XP_PER_CATCH,
  ENVIRONMENT_LIBRARY,
  SHOP_ITEMS,
  ACHIEVEMENTS,
  PHASES,
  FISH_TYPES
} from './fishing/constants.js';
import { getDefaultPlayerData } from './fishing/defaults.js';
import {
  readStoredBestScore,
  writeStoredBestScore,
  readPlayerData,
  writePlayerData,
  readGlobalScores,
  dedupeLeaderboardEntries,
  addToGlobalLeaderboard,
  readPlayerStats,
  writePlayerStats
} from './fishing/storage.js';
import { useLeaderboard, useGameTimer } from './fishing/hooks.js';
import GameHeader from './fishing/GameHeader.jsx';
import GameStatsBar from './fishing/GameStatsBar.jsx';
import GameControls from './fishing/GameControls.jsx';
import useInventory from './fishing/useInventory.js';
import ShopOverlay from './fishing/ShopOverlay.jsx';
import LeaderboardOverlay from './fishing/LeaderboardOverlay.jsx';
import InstructionsOverlay from './fishing/InstructionsOverlay.jsx';

const getLevelDifficultyProfile = (level = 1) => {
  const progress = Math.max(0, level - 1);
  const reelPenalty = Math.min(0.45, progress * 0.03);
  const decayBoost = Math.min(0.85, progress * 0.04);
  const startPenalty = Math.min(0.55, progress * 0.03);
  const rarityBias = Math.min(0.55, progress * 0.05);
  const biteWindowMod = Math.max(0.65, 1 - progress * 0.02);

  return {
    reelPowerMod: Math.max(0.4, 1 - reelPenalty),
    decayMod: 1 + decayBoost,
    initialProgressPenalty: startPenalty,
    rarityBias,
    biteWindowMod
  };
};

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

const getAdjustedRarityWeight = (rarity, rarityBias) => {
  const baseWeight = rarityWeight(rarity);
  if (!rarityBias) return baseWeight;

  switch (rarity.toLowerCase()) {
    case 'legendary':
      return baseWeight * (1 + rarityBias * 1.3);
    case 'rare':
      return baseWeight * (1 + rarityBias * 1.0);
    case 'uncommon':
      return baseWeight * (1 + rarityBias * 0.45);
    default:
      return baseWeight * Math.max(0.4, 1 - rarityBias * 1.25);
  }
};

const pickRandomFish = (level = 1) => {
  const difficultyProfile = getLevelDifficultyProfile(level);
  const totalWeight = FISH_TYPES.reduce(
    (sum, fish) => sum + getAdjustedRarityWeight(fish.rarity, difficultyProfile.rarityBias),
    0
  );
  let target = Math.random() * totalWeight;

  for (const fish of FISH_TYPES) {
    target -= getAdjustedRarityWeight(fish.rarity, difficultyProfile.rarityBias);
    if (target <= 0) {
      const sizeInches = fish.minSize + Math.random() * (fish.maxSize - fish.minSize);
      return { ...fish, id: cryptoRandomId(), sizeInches };
    }
  }

  const fallback = FISH_TYPES[FISH_TYPES.length - 1];
  const sizeInches = fallback.minSize + Math.random() * (fallback.maxSize - fallback.minSize);
  return { ...fallback, id: cryptoRandomId(), sizeInches };
};

const cryptoRandomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fish-${Math.random().toString(36).slice(2, 11)}`;
};

const updatePlayerStats = (gameResult, playTime) => {
  const stats = readPlayerStats();
  
  stats.gamesPlayed += 1;
  stats.totalScore += gameResult.score;
  stats.totalCatches += gameResult.catches;
  stats.totalPlayTime += playTime;
  stats.bestScore = Math.max(stats.bestScore, gameResult.score);
  stats.bestStreak = Math.max(stats.bestStreak, gameResult.longestStreak);
  stats.avgScore = Math.round(stats.totalScore / stats.gamesPlayed);
  stats.lastPlayed = new Date().toISOString();
  
  writePlayerStats(stats);
  return stats;
};

// Progression System Functions
const calculateLevelFromXP = (xp) => {
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      return i + 1;
    }
  }
  return 1;
};

const checkAchievements = (playerData, newStats) => {
  const unlockedAchievements = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (playerData.achievements.includes(achievement.id)) return;
    
    let requirementMet = false;
    switch (achievement.requirement.type) {
      case 'catches':
        requirementMet = newStats.totalCatches >= achievement.requirement.value;
        break;
      case 'level':
        requirementMet = newStats.level >= achievement.requirement.value;
        break;
      case 'currency':
        requirementMet = newStats.currency >= achievement.requirement.value;
        break;
      case 'rarity':
        requirementMet = newStats.lastCaughtRarity === achievement.requirement.value || 
                        newStats.lastCaughtRarity === 'Legendary';
        break;
      case 'shop_purchase':
        requirementMet = newStats.totalPurchases >= achievement.requirement.value;
        break;
    }
    
    if (requirementMet) {
      unlockedAchievements.push(achievement);
    }
  });
  
  return unlockedAchievements;
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

function FishingGame({
  onGameComplete,
  user,
  userProfile,
  isAuthenticated,
  onProfileCacheUpdate,
  renderNavigationTabs,
  isMobile = false
}) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readStoredBestScore);
  const { timeLeft, setTimeLeft, timeLeftRef, clearTimer } = useGameTimer(
    phase,
    null,
    GAME_DURATION
  );
  const [currentFish, setCurrentFish] = useState(null);
  const [reelProgress, setReelProgress] = useState(0);
  const [totalCatches, setTotalCatches] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastCatch, setLastCatch] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Initialize player data based on authentication status
  const initializePlayerData = () => {
    if (isAuthenticated && userProfile) {
      return userProfile;
    }
    return readPlayerData();
  };

  // Progression and Collection State
  const [playerData, setPlayerData] = useState(initializePlayerData);
  const [inventory, setInventory] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [playerStats, setPlayerStats] = useState(readPlayerStats());
  const [gameMode, setGameMode] = useState(() => (isMobile ? 'playing' : 'home')); // 'home' | 'playing'
  const [globalLeaderboard, setGlobalLeaderboard] = useLeaderboard(isAuthenticated);
  const playerDataSafe = playerData || getDefaultPlayerData();
  const ownedEnvironmentIds = playerData?.ownedEnvironments?.length
    ? playerData.ownedEnvironments
    : ['crystal_lake'];
  const activeEnvironmentId = playerData?.currentEnvironment || 'crystal_lake';
  const activeEnvironment =
    ENVIRONMENT_LIBRARY[activeEnvironmentId] || ENVIRONMENT_LIBRARY.crystal_lake;
  const environmentClassName = `environment-${activeEnvironment.id}`;
  const environmentInventory = ownedEnvironmentIds
    .map((envId) => ENVIRONMENT_LIBRARY[envId])
    .filter(Boolean);
  const syncPlayerData = useCallback((nextData, { skipCacheUpdate = false } = {}) => {
    if (!nextData) return;

    let mergedSnapshot = null;
    setPlayerData((prev) => {
      mergedSnapshot = { ...getDefaultPlayerData(), ...prev, ...nextData };
      return mergedSnapshot;
    });

    if (!skipCacheUpdate && !OFFLINE_MODE && isAuthenticated && onProfileCacheUpdate && mergedSnapshot) {
      Promise.resolve().then(() => onProfileCacheUpdate(mergedSnapshot));
    }
  }, [isAuthenticated, onProfileCacheUpdate]);
  const playerLevel = playerData?.level || 1;
  const levelDifficulty = useMemo(() => getLevelDifficultyProfile(playerLevel), [playerLevel]);
  const persistProgress = useCallback((updates) => {
    if (OFFLINE_MODE) return;
    if (!isAuthenticated || !user) return;

    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    if (Object.keys(sanitized).length === 0) return;

    // Fire-and-forget to avoid blocking UI or crashing on network errors
    import('../firebase/database.js')
      .then(({ saveGameProgress }) => {
        console.debug('[sync] persistProgress start', { uid: user?.uid, ...sanitized });
        return saveGameProgress(user.uid, sanitized);
      })
      .then(() => {
        console.debug('[sync] persistProgress ok');
      })
      .catch((error) => {
        console.warn('[sync] persistProgress failed', error);
      });
  }, [isAuthenticated, user]);


  const streakRef = useRef(0);
  const biteTimeoutRef = useRef(null);
  const reelDecayRef = useRef(null);
  const celebrationTimeoutRef = useRef(null);
  const phaseRef = useRef(PHASES.IDLE);
  const mobileAutoStartRef = useRef(false);

  const bubbles = useMemo(createBubbleField, []);
  const swimmers = useMemo(createSwimField, []);

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

  // Sync userProfile with local playerData when user logs in/out
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      syncPlayerData(userProfile, { skipCacheUpdate: true });
      setInventory(userProfile.inventory || []);
    } else {
      const localData = readPlayerData();
      syncPlayerData(localData);
      setInventory(localData.inventory || []);
    }
  }, [isAuthenticated, userProfile, syncPlayerData]);

  const cleanupAll = useCallback(() => {
    clearTimer();
    clearBiteTimeout();
    clearReelDecay();
    clearCelebration();
  }, [clearTimer, clearBiteTimeout, clearReelDecay, clearCelebration]);

  const getUpgradeMultiplier = useCallback((upgradeType) => {
    if (!playerData?.ownedUpgrades) return 1;
    
    const relevantUpgrades = SHOP_ITEMS.upgrades.filter(upgrade => 
      playerData.ownedUpgrades.includes(upgrade.id) && upgrade.effect.type === upgradeType
    );
    
    return relevantUpgrades.reduce((multiplier, upgrade) => {
      return upgradeType === 'escape_reduction' 
        ? multiplier * upgrade.effect.value 
        : multiplier * upgrade.effect.value;
    }, 1);
  }, [playerData?.ownedUpgrades]);

  const endGame = useCallback(async () => {
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

    // Calculate game session time
    const sessionTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 60;
    
    const gameResult = {
      score,
      catches: totalCatches,
      bestScore: nextBest,
      longestStreak
    };

    // Update player statistics
    const updatedStats = updatePlayerStats(gameResult, sessionTime);
    setPlayerStats(updatedStats);

    // Add to global leaderboard and save progress
    if (score > 0) {
      if (!OFFLINE_MODE && isAuthenticated && user) {
        // Firebase operations for authenticated users (non-blocking)
        import('../firebase/database.js')
          .then(async ({ addToLeaderboard, logGameSession }) => {
            const leaderboardResult = await addToLeaderboard(user.uid, gameResult, playerData);
            await logGameSession(user.uid, {
              score: gameResult.score,
              catches: gameResult.catches,
              longestStreak: gameResult.longestStreak,
              playTime: sessionTime
            });

            const remotePlayerData = {
              ...playerData,
              gamesPlayed: (playerData.gamesPlayed || 0) + 1,
              totalPlayTime: (playerData.totalPlayTime || 0) + sessionTime,
              bestScore: Math.max(playerData.bestScore || 0, nextBest),
              xp: playerData.xp,
              level: playerData.level
            };
            syncPlayerData(remotePlayerData);
            persistProgress({
              gamesPlayed: remotePlayerData.gamesPlayed,
              totalPlayTime: remotePlayerData.totalPlayTime,
              bestScore: remotePlayerData.bestScore,
              xp: remotePlayerData.xp,
              level: remotePlayerData.level
            });

            if (leaderboardResult.success) {
              setStatusMessage(`Game saved! Check the leaderboard to see your ranking!`);
            }
          })
          .catch((error) => {
            console.error('[endGame] Error saving game to Firebase:', error);
            setStatusMessage('Game completed but failed to save to server.');
          });
      } else {
        // localStorage operations for guests
        const leaderboardEntry = addToGlobalLeaderboard(playerData, gameResult);
        
        // Update player data with games played
        const updatedPlayerData = {
          ...playerData,
          gamesPlayed: (playerData.gamesPlayed || 0) + 1,
          totalPlayTime: (playerData.totalPlayTime || 0) + sessionTime
        };
        syncPlayerData(updatedPlayerData);
        writePlayerData(updatedPlayerData);

        // Show leaderboard position message
        const globalScores = readGlobalScores();
        setGlobalLeaderboard(dedupeLeaderboardEntries(globalScores));
        const position = globalScores.findIndex(entry => entry.id === leaderboardEntry.id) + 1;
        if (position <= 10) {
          setStatusMessage(`New high score! You're #${position} on the global leaderboard!`);
        } else if (position <= 50) {
          setStatusMessage(`Great job! You're #${position} on the global leaderboard!`);
        }
      }
    }

    onGameComplete?.({
      score,
      catches: totalCatches,
      bestScore: nextBest,
      longestStreak
    });

    setPhase(PHASES.ENDED);
  }, [phase, cleanupAll, bestScore, score, totalCatches, longestStreak, onGameComplete, gameStartTime, playerData, isAuthenticated, user, persistProgress, syncPlayerData]);

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
      try {
        if (!fish) return;
        console.debug('[catch] start', {
          isAuthenticated,
          userPresent: !!user,
          offline: OFFLINE_MODE,
          playerDataNull: !playerData
        });
        clearReelDecay();
        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);
        setLongestStreak((value) => Math.max(value, nextStreak));

        const streakBonus = nextStreak > 1 ? nextStreak * 5 : 0;
        const pointsEarned = fish.points + streakBonus;

        // XP and Level Progression
        const baseXP = XP_PER_CATCH[fish.rarity] || 10;
        const xpMultiplier = getUpgradeMultiplier('xp_multiplier');
        const xpGained = Math.floor(baseXP * xpMultiplier);
        const basePlayerData = playerData || getDefaultPlayerData();
        const newXP = (basePlayerData.xp || 0) + xpGained;
        const newLevel = calculateLevelFromXP(newXP);
        const leveledUp = newLevel > (basePlayerData.level || 1);

        // Add fish to inventory
        const caughtFish = {
          ...fish,
          id: `catch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          caughtAt: new Date().toISOString(),
          size: fish.sizeInches,
          value: fish.value
        };

        const newInventory = [...(inventory || []), caughtFish];
        setInventory(newInventory);

        // Update player data
        const updatedPlayerData = {
          ...getDefaultPlayerData(),
          ...basePlayerData,
          xp: newXP,
          level: newLevel,
          totalCatches: (basePlayerData.totalCatches || 0) + 1,
          inventory: newInventory
        };

        // Check for achievements
        const newStats = {
          ...updatedPlayerData,
          lastCaughtRarity: fish.rarity
        };
        const newAchievements = checkAchievements(basePlayerData, newStats);
        let nextCurrency = basePlayerData.currency || 0;

        if (newAchievements.length > 0) {
          updatedPlayerData.achievements = [
            ...(playerData?.achievements || []),
            ...newAchievements.map((achievement) => achievement.id)
          ];
          
          const achievementReward = newAchievements.reduce((sum, achievement) => sum + achievement.reward, 0);
          nextCurrency += achievementReward;
        }

        updatedPlayerData.currency = nextCurrency;
        syncPlayerData(updatedPlayerData);
        writePlayerData(updatedPlayerData);

        if (isAuthenticated && user && !OFFLINE_MODE) {
          persistProgress({
            xp: updatedPlayerData.xp,
            level: updatedPlayerData.level,
            totalCatches: updatedPlayerData.totalCatches,
            achievements: updatedPlayerData.achievements,
            currency: updatedPlayerData.currency,
            inventory: newInventory,
            ownedEnvironments: updatedPlayerData.ownedEnvironments,
            ownedUpgrades: updatedPlayerData.ownedUpgrades,
            totalPurchases: updatedPlayerData.totalPurchases
          });
        }

        writePlayerData(updatedPlayerData);

        setScore((value) => value + pointsEarned);
        setTotalCatches((value) => value + 1);
        setLastCatch({ 
          ...fish, 
          pointsEarned, 
          streak: nextStreak, 
          streakBonus,
          xpGained,
          leveledUp,
          newLevel,
          achievements: newAchievements
        });
        setPhase(PHASES.CELEBRATE);
        
        let statusMsg = `You landed a ${fish.name}! +${xpGained} XP`;
        if (leveledUp) statusMsg += ` | Level Up! Now Level ${newLevel}`;
        if (newAchievements.length > 0) statusMsg += ` | Achievement Unlocked!`;
        setStatusMessage(statusMsg);
        
        setCurrentFish(null);
        setReelProgress(100);

        clearCelebration();
        celebrationTimeoutRef.current = setTimeout(() => {
          setPhase(PHASES.READY);
          setReelProgress(0);
        }, 1800);
      } catch (error) {
        console.error('Catch handling failed:', error);
        setStatusMessage('Catch processed locally.');
        setPhase(PHASES.READY);
        setCurrentFish(null);
      }
    },
    [clearReelDecay, clearCelebration, playerData, getUpgradeMultiplier, inventory, isAuthenticated, persistProgress, user, syncPlayerData]
  );

  const { sellFish, sellAllFish, purchaseItem, equipEnvironment } = useInventory({
    inventory,
    playerData: playerDataSafe,
    setInventory,
    syncPlayerData,
    persistProgress,
    isAuthenticated,
    user,
    setStatusMessage,
    checkAchievements,
    writePlayerData,
    ENVIRONMENT_LIBRARY,
    SHOP_ITEMS,
    ACHIEVEMENTS,
    OFFLINE_MODE
  });

  const handleReel = useCallback(() => {
    if (phase !== PHASES.HOOKED || !currentFish) return;

    const baseReelPower = Math.max(8, 20 - currentFish.difficulty * 4);
    const reelMultiplier = getUpgradeMultiplier('reel_power');
    const reelPower = Math.max(4, baseReelPower * reelMultiplier * levelDifficulty.reelPowerMod);
    
    setReelProgress((value) => Math.min(100, value + reelPower));
  }, [phase, currentFish, getUpgradeMultiplier, levelDifficulty]);

  const beginFishFight = useCallback(
    (fish) => {
      setCurrentFish(fish);
      setPhase(PHASES.HOOKED);
      const startPenalty = levelDifficulty.initialProgressPenalty;
      const startMin = Math.max(6, 20 - startPenalty * 18);
      const startMax = Math.max(startMin + 6, 35 - startPenalty * 20);
      setReelProgress(randomBetween(startMin, startMax));
      setStatusMessage(`${fish.name} is on the line — keep reeling!`);

      clearReelDecay();
      const decayInterval = Math.max(110, 150 / Math.max(1, levelDifficulty.decayMod));
      reelDecayRef.current = setInterval(() => {
        const escapeMultiplier = getUpgradeMultiplier('escape_reduction');
        const baseEscape = (fish.escapeRate * 0.9 + 0.6) * levelDifficulty.decayMod;
        const escapeRate = baseEscape * escapeMultiplier;
        setReelProgress((value) => Math.max(0, value - escapeRate));
      }, decayInterval);
    },
    [clearReelDecay, getUpgradeMultiplier, levelDifficulty]
  );

  const castLine = useCallback(() => {
    if (phase !== PHASES.READY || timeLeft <= 0) return;

    streakRef.current = Math.max(0, streakRef.current);
    setPhase(PHASES.WAITING);
    setStatusMessage('Waiting for a bite…');
    setCurrentFish(null);
    setReelProgress(0);

    clearBiteTimeout();
    const biteDelay = Math.max(450, randomBetween(600, 1600) * levelDifficulty.biteWindowMod);
    biteTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== PHASES.WAITING || timeLeftRef.current <= 0) {
        return;
      }
      const fish = pickRandomFish(playerLevel);
      beginFishFight(fish);
    }, biteDelay);
  }, [phase, timeLeft, beginFishFight, clearBiteTimeout, levelDifficulty, playerLevel]);

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
    setGameStartTime(Date.now());
    setGameMode('playing');
    setPhase(PHASES.READY);
  }, [cleanupAll]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (mobileAutoStartRef.current) {
      return;
    }

    if (phase === PHASES.IDLE) {
      mobileAutoStartRef.current = true;
      startGame();
    }
  }, [isMobile, phase, startGame]);

  const returnToHome = useCallback(() => {
    cleanupAll();
    setPhase(PHASES.IDLE);
    setGameMode('home');
    setShowShop(false);
    setShowLeaderboard(false);
    setShowInstructions(false);
  }, [cleanupAll]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== PHASES.IDLE && phase !== PHASES.ENDED && timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, phase, endGame]);

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

  const overlays = (showShop || showLeaderboard || showInstructions) ? (
    <>
      {showShop && (
        <ShopOverlay
          inventory={inventory}
          sellAllFish={sellAllFish}
          sellFish={sellFish}
          environmentInventory={environmentInventory}
          activeEnvironment={activeEnvironment}
          equipEnvironment={equipEnvironment}
          shopItems={SHOP_ITEMS}
          ownedEnvironmentIds={ownedEnvironmentIds}
          playerData={playerData}
          purchaseItem={purchaseItem}
          achievements={ACHIEVEMENTS}
          onClose={() => setShowShop(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardOverlay
          onClose={() => setShowLeaderboard(false)}
          playerStats={playerStats}
          globalLeaderboard={globalLeaderboard}
          playerData={playerData}
        />
      )}

      {showInstructions && (
        <InstructionsOverlay
          onClose={() => setShowInstructions(false)}
          fishTypes={FISH_TYPES}
        />
      )}
    </>
  ) : null;

  // Home Screen Render
  if (gameMode === 'home') {
    return (
      <div 
        ref={gameRef}
        className={`fishing-game home-screen ${environmentClassName}${isFullscreen ? ' fullscreen-game' : ''}${isMobile ? ' mobile-layout' : ''}`} 
        role="group" 
        aria-label="ReelQuest Fishing Game Home"
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

        <div className="home-ui">
          <div className="home-header">
            <div className="game-title">
              <h1>🎣 ReelQuest</h1>
              <p>Master the art of fishing</p>
            </div>
            
            <div className="player-info-card">
              <div className="player-details">
                <h3>{playerData.playerName}</h3>
                <div className="player-stats-summary">
                  <span>Level {playerData.level}</span>
                  <span>💰 {playerData.currency}</span>
                  <span>🏆 {playerStats.bestScore}</span>
                </div>
                <div className="player-environment" title="Current environment">
                  <span className="environment-emoji">{activeEnvironment.emoji || '🌊'}</span>
                  <div className="environment-text">
                    <span className="environment-label">Environment</span>
                    <span className="environment-name">{activeEnvironment.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="home-content">
            <div className="main-actions">
              <button className="play-game-button" onClick={startGame}>
                🎣 Start Fishing
              </button>
              <p className="game-description">
                Cast your line and catch as many fish as you can in 60 seconds!
              </p>
            </div>

            <div className="menu-grid">
              <button 
                className="menu-button inventory-menu" 
                onClick={() => setShowShop(true)}
              >
                <div className="menu-icon">🎒</div>
                <div className="menu-text">
                  <h4>Inventory & Shop</h4>
                  <p>Sell fish and buy upgrades</p>
                  <span className="menu-badge">{inventory.length} fish</span>
                </div>
              </button>

              <button 
                className="menu-button leaderboard-menu" 
                onClick={() => setShowLeaderboard(true)}
              >
                <div className="menu-icon">🏆</div>
                <div className="menu-text">
                  <h4>Leaderboard</h4>
                  <p>Global rankings & stats</p>
                  <span className="menu-badge">#{globalLeaderboard.findIndex(s => s.playerName === playerData.playerName) + 1 || 'Unranked'}</span>
                </div>
              </button>

              <button 
                className="menu-button guide-menu" 
                onClick={() => setShowInstructions(true)}
              >
                <div className="menu-icon">ℹ️</div>
                <div className="menu-text">
                  <h4>How to Play</h4>
                  <p>Learn the fishing basics</p>
                </div>
              </button>

              <button 
                className="menu-button settings-menu" 
                onClick={toggleFullscreen}
              >
                <div className="menu-icon">{isFullscreen ? '⤦' : '⛶'}</div>
                <div className="menu-text">
                  <h4>Fullscreen</h4>
                  <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                </div>
              </button>
            </div>
          </div>

          {typeof renderNavigationTabs === 'function' ? (
            <div className="game-bottom-nav home-nav">
              {renderNavigationTabs('game')}
            </div>
          ) : null}

          {overlays}
        </div>
      </div>
    );
  }

  // Game Screen Render
  return (
    <div 
      ref={gameRef}
      className={`fishing-game ${environmentClassName}${isFullscreen ? ' fullscreen-game' : ''}${isMobile ? ' mobile-layout' : ''}`} 
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
        <GameHeader
          score={score}
          playerData={playerData}
          timeDisplay={timeDisplay}
          bestScore={bestScore}
          activeEnvironment={activeEnvironment}
          returnToHome={returnToHome}
        />

        <GameStatsBar
          totalCatches={totalCatches}
          streak={streak}
          longestStreak={longestStreak}
        />

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
            <div className="caught-rewards">
              <span className="caught-points">
                +{lastCatch.pointsEarned} pts
                {lastCatch.streakBonus ? ` (streak x${lastCatch.streak})` : ''}
              </span>
              <span className="caught-xp">+{lastCatch.xpGained} XP</span>
              {lastCatch.leveledUp && (
                <span className="level-up">🌟 Level {lastCatch.newLevel}!</span>
              )}
              {lastCatch.achievements?.length > 0 && (
                <div className="new-achievements">
                  {lastCatch.achievements.map(achievement => (
                    <span key={achievement.id} className="achievement-unlock">
                      🏆 {achievement.name}!
                    </span>
                  ))}
                </div>
              )}
            </div>
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
            <div className="game-over-actions">
              <button className="home-button" onClick={returnToHome}>
                🏠 Home
              </button>
              <button className="shop-button-end" onClick={() => setShowShop(true)}>
                🛒 Shop
              </button>
            </div>
          </div>
        ) : null}

        <GameControls
          phase={phase}
          castLine={castLine}
          handleReel={handleReel}
          endGame={endGame}
          startGame={startGame}
          isPlaying={isPlaying}
          statusMessage={statusMessage}
          renderNavigationTabs={null}
        />
      </div>
      {overlays}
    </div>
  )
}

FishingGame.propTypes = {
  onGameComplete: PropTypes.func,
  user: PropTypes.object,
  userProfile: PropTypes.object,
  isAuthenticated: PropTypes.bool,
  onProfileCacheUpdate: PropTypes.func,
  renderNavigationTabs: PropTypes.func,
  isMobile: PropTypes.bool
};

export default FishingGame;
