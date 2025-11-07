import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './FishingGame.css';
import {
  sellFishFromInventory,
  addToLeaderboard,
  subscribeToLeaderboard,
  logGameSession,
  saveGameProgress
} from '../firebase/database.js';

const GAME_DURATION = 60;
const STORAGE_KEY = 'reelquest:fishing:best-score';
const PLAYER_DATA_KEY = 'reelquest:player:data';
const GLOBAL_SCORES_KEY = 'reelquest:global:leaderboard';
const PLAYER_STATS_KEY = 'reelquest:player:stats';

// Progression System Constants
const LEVEL_XP_REQUIREMENTS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950
];

const XP_PER_CATCH = {
  'Common': 15,
  'Uncommon': 25,
  'Rare': 40,
  'Legendary': 75
};

const ENVIRONMENT_LIBRARY = Object.freeze({
  crystal_lake: {
    id: 'crystal_lake',
    name: 'Crystal Lake',
    description: 'Peaceful freshwater retreat with balanced fish spawns',
    emoji: '🏞️',
    levelRequired: 1,
    price: 0,
    purchasable: false
  },
  mountain_lake: {
    id: 'mountain_lake',
    name: 'Mountain Lake',
    description: 'Crystal clear waters with alpine fish species',
    emoji: '🏔️',
    price: 200,
    levelRequired: 3,
    purchasable: true
  },
  ocean_reef: {
    id: 'ocean_reef',
    name: 'Ocean Reef',
    description: 'Tropical waters teeming with exotic fish',
    emoji: '🌊',
    price: 500,
    levelRequired: 5,
    purchasable: true
  },
  deep_sea: {
    id: 'deep_sea',
    name: 'Deep Sea',
    description: 'Mysterious depths with legendary creatures',
    emoji: '🌀',
    price: 1000,
    levelRequired: 8,
    purchasable: true
  }
});

// Shop System Constants
const SHOP_ITEMS = {
  environments: Object.values(ENVIRONMENT_LIBRARY)
    .filter((env) => env.purchasable)
    .map((env) => ({ ...env })),
  upgrades: [
    {
      id: 'better_rod',
      name: 'Carbon Fiber Rod',
      description: 'Increases reel power by 25%',
      emoji: '🎣',
      price: 150,
      levelRequired: 2,
      owned: false,
      effect: { type: 'reel_power', value: 1.25 }
    },
    {
      id: 'lucky_lure',
      name: 'Lucky Lure',
      description: 'Increases rare fish spawn rate by 20%',
      emoji: '✨',
      price: 300,
      levelRequired: 4,
      owned: false,
      effect: { type: 'rare_chance', value: 1.2 }
    },
    {
      id: 'master_hooks',
      name: 'Master Hooks',
      description: 'Reduces fish escape chance by 30%',
      emoji: '🪝',
      price: 400,
      levelRequired: 6,
      owned: false,
      effect: { type: 'escape_reduction', value: 0.7 }
    },
    {
      id: 'xp_booster',
      name: 'Experience Booster',
      description: 'Gain 50% more XP from catches',
      emoji: '⚡',
      price: 600,
      levelRequired: 7,
      owned: false,
      effect: { type: 'xp_multiplier', value: 1.5 }
    }
  ]
};

// Achievement System
const ACHIEVEMENTS = [
  {
    id: 'first_catch',
    name: 'First Catch',
    description: 'Catch your first fish',
    emoji: '🎣',
    requirement: { type: 'catches', value: 1 },
    reward: 50
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Catch 10 fish',
    emoji: '🐠',
    requirement: { type: 'catches', value: 10 },
    reward: 100
  },
  {
    id: 'rare_hunter',
    name: 'Rare Hunter',
    description: 'Catch a rare or legendary fish',
    emoji: '🏆',
    requirement: { type: 'rarity', value: 'Rare' },
    reward: 150
  },
  {
    id: 'level_up',
    name: 'Level Up',
    description: 'Reach level 2',
    emoji: '⭐',
    requirement: { type: 'level', value: 2 },
    reward: 75
  },
  {
    id: 'millionaire',
    name: 'Rich Fisher',
    description: 'Accumulate 500 coins',
    emoji: '💰',
    requirement: { type: 'currency', value: 500 },
    reward: 200
  },
  {
    id: 'shopper',
    name: 'First Purchase',
    description: 'Buy your first shop item',
    emoji: '🛒',
    requirement: { type: 'shop_purchase', value: 1 },
    reward: 100
  }
];

const PHASES = Object.freeze({
  IDLE: 'idle',
  READY: 'ready',
  WAITING: 'waiting',
  HOOKED: 'hooked',
  CELEBRATE: 'celebrate',
  ENDED: 'ended'
});

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

const FISH_TYPES = [
  {
    name: 'Bluegill',
    emoji: '🐟',
    rarity: 'Common',
    points: 10,
    difficulty: 1.0,
    escapeRate: 1.0,
    minSize: 4,
    maxSize: 8,
    value: 5
  },
  {
    name: 'Yellow Perch',
    emoji: '🐠',
    rarity: 'Common',
    points: 14,
    difficulty: 1.2,
    escapeRate: 1.2,
    minSize: 6,
    maxSize: 10,
    value: 8
  },
  {
    name: 'Rainbow Trout',
    emoji: '🐡',
    rarity: 'Uncommon',
    points: 20,
    difficulty: 1.6,
    escapeRate: 1.4,
    minSize: 8,
    maxSize: 14,
    value: 12
  },
  {
    name: 'Striped Bass',
    emoji: '🐬',
    rarity: 'Rare',
    points: 28,
    difficulty: 1.9,
    escapeRate: 1.6,
    minSize: 12,
    maxSize: 20,
    value: 25
  },
  {
    name: 'Golden Marlin',
    emoji: '🐋',
    rarity: 'Legendary',
    points: 50,
    difficulty: 2.5,
    escapeRate: 2.0,
    minSize: 16,
    maxSize: 28,
    value: 60
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

// Player Data Storage Functions
const readPlayerData = () => {
  if (!safeLocalStorage) return getDefaultPlayerData();
  const stored = safeLocalStorage.getItem(PLAYER_DATA_KEY);
  return stored ? { ...getDefaultPlayerData(), ...JSON.parse(stored) } : getDefaultPlayerData();
};

const writePlayerData = (playerData) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
};

const getDefaultPlayerData = () => ({
  level: 1,
  xp: 0,
  currency: 0,
  inventory: [],
  achievements: [],
  totalCatches: 0,
  totalFishSold: 0,
  ownedEnvironments: ['crystal_lake'],
  ownedUpgrades: [],
  currentEnvironment: 'crystal_lake',
  totalPurchases: 0,
  playerName: `Fisher${Math.floor(Math.random() * 10000)}`,
  gamesPlayed: 0,
  totalPlayTime: 0
});

// Global Leaderboard Functions
const readGlobalScores = () => {
  if (!safeLocalStorage) return [];
  const stored = safeLocalStorage.getItem(GLOBAL_SCORES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const writeGlobalScores = (scores) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(GLOBAL_SCORES_KEY, JSON.stringify(scores));
};

const dedupeLeaderboardEntries = (entries) => {
  if (!Array.isArray(entries)) return [];

  const seen = new Set();
  const sorted = entries
    .filter(Boolean)
    .slice()
    .sort((a, b) => (b?.score || 0) - (a?.score || 0));

  const unique = [];
  for (const entry of sorted) {
    const key = entry.userId || entry.playerName || entry.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }
  return unique;
};

const addToGlobalLeaderboard = (playerData, gameResult) => {
  const globalScores = readGlobalScores();
  
  const newEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    playerName: playerData.playerName || `Fisher${Math.floor(Math.random() * 10000)}`,
    score: gameResult.score,
    catches: gameResult.catches,
    longestStreak: gameResult.longestStreak,
    level: playerData.level,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString()
  };
  
  globalScores.push(newEntry);
  
  const dedupedScores = dedupeLeaderboardEntries(globalScores);
  const topScores = dedupedScores.slice(0, 100);
  
  writeGlobalScores(topScores);
  const savedEntry = topScores.find((entry) => {
    if (entry.userId && playerData?.uid) {
      return entry.userId === playerData.uid;
    }
    return entry.playerName === newEntry.playerName;
  });

  return savedEntry || newEntry;
};

// Player Statistics Functions
const readPlayerStats = () => {
  if (!safeLocalStorage) return getDefaultPlayerStats();
  const stored = safeLocalStorage.getItem(PLAYER_STATS_KEY);
  return stored ? { ...getDefaultPlayerStats(), ...JSON.parse(stored) } : getDefaultPlayerStats();
};

const writePlayerStats = (stats) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
};

const getDefaultPlayerStats = () => ({
  gamesPlayed: 0,
  totalScore: 0,
  totalCatches: 0,
  totalPlayTime: 0,
  bestScore: 0,
  bestStreak: 0,
  avgScore: 0,
  favoriteFish: null,
  fishCaught: {},
  lastPlayed: null
});

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

function FishingGame({ onGameComplete, user, userProfile, isAuthenticated, onProfileCacheUpdate }) {
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
  const [gameMode, setGameMode] = useState('home'); // 'home' | 'playing'
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
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
    if (!nextData) {
      return;
    }

    setPlayerData(nextData);

    if (skipCacheUpdate) {
      return;
    }

    if (isAuthenticated && onProfileCacheUpdate) {
      onProfileCacheUpdate(nextData);
    }
  }, [isAuthenticated, onProfileCacheUpdate]);
  const playerLevel = playerData?.level || 1;
  const levelDifficulty = useMemo(() => getLevelDifficultyProfile(playerLevel), [playerLevel]);
  const persistProgress = useCallback((updates) => {
    if (!isAuthenticated || !user) {
      return;
    }

    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitized).length === 0) {
      return;
    }

    saveGameProgress(user.uid, sanitized).catch((error) => {
      console.error('Failed to sync progress to Firebase:', error);
    });
  }, [isAuthenticated, user]);


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

  // Sync userProfile with local playerData when user logs in/out
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      syncPlayerData(userProfile, { skipCacheUpdate: true });
      setInventory(userProfile.inventory || []);
    } else {
      syncPlayerData(readPlayerData());
      setInventory([]);
    }
  }, [isAuthenticated, userProfile, syncPlayerData]);

  // Load global leaderboard
  useEffect(() => {
    let unsubscribe;

    const loadLeaderboard = async () => {
      if (isAuthenticated) {
        // Use Firebase real-time leaderboard for authenticated users
        unsubscribe = subscribeToLeaderboard((scores) => {
          setGlobalLeaderboard(dedupeLeaderboardEntries(scores));
        });
      } else {
        // Use localStorage leaderboard for guests
        const localScores = readGlobalScores();
        setGlobalLeaderboard(dedupeLeaderboardEntries(localScores));
      }
    };

    loadLeaderboard();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated]);

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
      if (isAuthenticated && user) {
        // Firebase operations for authenticated users
        try {
          // Add to Firebase leaderboard
          const leaderboardResult = await addToLeaderboard(user.uid, gameResult, playerData);
          
          // Log game session
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
        } catch (error) {
          console.error('Error saving game to Firebase:', error);
          setStatusMessage('Game completed but failed to save to server.');
        }
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
      if (!fish) return;
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
      const newXP = playerData.xp + xpGained;
      const newLevel = calculateLevelFromXP(newXP);
      const leveledUp = newLevel > playerData.level;

      // Add fish to inventory
      const caughtFish = {
        ...fish,
        id: `catch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        caughtAt: new Date().toISOString(),
        size: fish.sizeInches,
        value: fish.value
      };

      const newInventory = [...inventory, caughtFish];
      setInventory(newInventory);

      // Update player data
      const updatedPlayerData = {
        ...playerData,
        xp: newXP,
        level: newLevel,
        totalCatches: (playerData.totalCatches || 0) + 1,
        inventory: newInventory
      };

      // Check for achievements
      const newStats = {
        ...updatedPlayerData,
        lastCaughtRarity: fish.rarity
      };
      const newAchievements = checkAchievements(playerData, newStats);
      let nextCurrency = playerData.currency || 0;

      if (newAchievements.length > 0) {
        updatedPlayerData.achievements = [
          ...(playerData.achievements || []),
          ...newAchievements.map((achievement) => achievement.id)
        ];
        
        // Add achievement rewards to currency
        const achievementReward = newAchievements.reduce((sum, achievement) => sum + achievement.reward, 0);
        nextCurrency += achievementReward;
      }

      updatedPlayerData.currency = nextCurrency;
  syncPlayerData(updatedPlayerData);
      writePlayerData(updatedPlayerData);

      if (isAuthenticated && user) {
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
    },
    [clearReelDecay, clearCelebration, playerData, getUpgradeMultiplier, inventory, isAuthenticated, persistProgress, user, syncPlayerData]
  );

  const sellFish = useCallback(async (fishId) => {
    const fishToSell = inventory.find(fish => fish.id === fishId);
    if (!fishToSell) return;

    const saleValue = fishToSell.value;
    const updatedInventory = inventory.filter(fish => fish.id !== fishId);

    if (isAuthenticated && user) {
      // Use Firebase for authenticated users
      const result = await sellFishFromInventory(user.uid, fishId, saleValue, updatedInventory);
      if (result.success) {
        setInventory(updatedInventory);
        const updatedPlayerData = {
          ...playerData,
          currency: (playerData.currency || 0) + saleValue,
          totalFishSold: (playerData.totalFishSold || 0) + 1,
          inventory: updatedInventory
        };
  syncPlayerData(updatedPlayerData);
        persistProgress({
          currency: updatedPlayerData.currency,
          totalFishSold: updatedPlayerData.totalFishSold,
          inventory: updatedInventory
        });
        setStatusMessage(`Sold ${fishToSell.name} for ${saleValue} coins!`);
      } else {
        setStatusMessage('Failed to sell fish. Please try again.');
      }
    } else {
      // Use localStorage for guests
      const updatedPlayerData = {
        ...playerData,
        currency: playerData.currency + saleValue,
        totalFishSold: (playerData.totalFishSold || 0) + 1
      };

      setInventory(updatedInventory);
  syncPlayerData(updatedPlayerData);
      writePlayerData(updatedPlayerData);
      setStatusMessage(`Sold ${fishToSell.name} for ${saleValue} coins!`);
    }
  }, [inventory, playerData, isAuthenticated, user, persistProgress, syncPlayerData]);

  const sellAllFish = useCallback(async () => {
    if (inventory.length === 0) return;

    const totalValue = inventory.reduce((sum, fish) => sum + fish.value, 0);

    if (isAuthenticated && user) {
      // Use Firebase for authenticated users
      const result = await sellFishFromInventory(user.uid, 'all', totalValue, []);
      if (result.success) {
        setInventory([]);
        const updatedPlayerData = {
          ...playerData,
          currency: (playerData.currency || 0) + totalValue,
          totalFishSold: (playerData.totalFishSold || 0) + inventory.length,
          inventory: []
        };
  syncPlayerData(updatedPlayerData);
        persistProgress({
          currency: updatedPlayerData.currency,
          totalFishSold: updatedPlayerData.totalFishSold,
          inventory: []
        });
        setStatusMessage(`Sold all fish for ${totalValue} coins!`);
      } else {
        setStatusMessage('Failed to sell fish. Please try again.');
      }
    } else {
      // Use localStorage for guests
      const updatedPlayerData = {
        ...playerData,
        currency: playerData.currency + totalValue,
        totalFishSold: (playerData.totalFishSold || 0) + inventory.length
      };

      setInventory([]);
  syncPlayerData(updatedPlayerData);
      writePlayerData(updatedPlayerData);
      setStatusMessage(`Sold all fish for ${totalValue} coins!`);
    }
  }, [inventory, playerData, isAuthenticated, user, persistProgress, syncPlayerData]);

  const purchaseItem = useCallback((itemType, itemId) => {
    const items = SHOP_ITEMS[itemType];
    const item = items?.find((i) => i.id === itemId);

    if (!item) {
      setStatusMessage('Item not found.');
      return;
    }

    if (itemType === 'environments') {
      const alreadyOwned = (playerData.ownedEnvironments || ['crystal_lake']).includes(itemId);
      if (alreadyOwned) {
        setStatusMessage('Environment already unlocked. Equip it from your inventory.');
        return;
      }
    }

    if (playerData.currency < item.price) {
      setStatusMessage('Not enough coins for this purchase.');
      return;
    }

    if (playerData.level < item.levelRequired) {
      setStatusMessage(`Reach level ${item.levelRequired} to unlock this item.`);
      return;
    }

    const updatedPlayerData = {
      ...playerData,
      currency: (playerData.currency || 0) - item.price,
      totalPurchases: (playerData.totalPurchases || 0) + 1
    };

    if (itemType === 'environments') {
      const nextOwned = new Set(playerData.ownedEnvironments || ['crystal_lake']);
      nextOwned.add(itemId);
      updatedPlayerData.ownedEnvironments = Array.from(nextOwned);
      updatedPlayerData.currentEnvironment = itemId;
    } else if (itemType === 'upgrades') {
      updatedPlayerData.ownedUpgrades = [...(playerData.ownedUpgrades || []), itemId];
    }

    // Check for achievements
    const newStats = {
      ...updatedPlayerData
    };
    const newAchievements = checkAchievements(playerData, newStats);

    if (newAchievements.length > 0) {
      updatedPlayerData.achievements = [
        ...playerData.achievements,
        ...newAchievements.map((a) => a.id)
      ];
      const achievementReward = newAchievements.reduce(
        (sum, achievement) => sum + achievement.reward,
        0
      );
      updatedPlayerData.currency += achievementReward;
    }

    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);
    if (isAuthenticated && user) {
      const persistPayload = {
        currency: updatedPlayerData.currency,
        totalPurchases: updatedPlayerData.totalPurchases,
        achievements: updatedPlayerData.achievements
      };

      if (itemType === 'environments') {
        persistPayload.ownedEnvironments = updatedPlayerData.ownedEnvironments;
        persistPayload.currentEnvironment = updatedPlayerData.currentEnvironment;
      } else if (itemType === 'upgrades') {
        persistPayload.ownedUpgrades = updatedPlayerData.ownedUpgrades;
      }

      persistProgress(persistPayload);
    }

    const itemName = ENVIRONMENT_LIBRARY[itemId]?.name || item.name;
    let purchaseMsg = `Purchased ${itemName}!`;
    if (itemType === 'environments') {
      purchaseMsg = `Unlocked ${itemName}! Equipped automatically.`;
    }
    if (newAchievements.length > 0) {
      purchaseMsg += ' Achievement unlocked!';
    }
    setStatusMessage(purchaseMsg);
  }, [playerData, isAuthenticated, user, persistProgress, syncPlayerData]);

  const equipEnvironment = useCallback((environmentId) => {
    const envConfig = ENVIRONMENT_LIBRARY[environmentId];
    if (!envConfig) {
      setStatusMessage('Environment not available.');
      return;
    }
    const owned = (playerData.ownedEnvironments || ['crystal_lake']).includes(environmentId);

    if (!owned) {
      setStatusMessage('Unlock this environment in the shop first.');
      return;
    }

    if (playerData.currentEnvironment === environmentId) {
      setStatusMessage(`${envConfig?.name || 'Environment'} already equipped.`);
      return;
    }

    const updatedPlayerData = {
      ...playerData,
      currentEnvironment: environmentId
    };

    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    if (isAuthenticated && user) {
      persistProgress({
        currentEnvironment: environmentId
      });
    }

    setStatusMessage(`${envConfig?.name || 'Environment'} equipped!`);
  }, [playerData, isAuthenticated, user, persistProgress, syncPlayerData]);

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

  const returnToHome = useCallback(() => {
    cleanupAll();
    setPhase(PHASES.IDLE);
    setGameMode('home');
    setShowShop(false);
    setShowLeaderboard(false);
    setShowInstructions(false);
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

  // Home Screen Render
  if (gameMode === 'home') {
    return (
      <div 
        ref={gameRef}
        className={`fishing-game home-screen ${environmentClassName}${isFullscreen ? ' fullscreen-game' : ''}`} 
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

          {/* Overlays for home screen */}
          {showShop && (
            <div className="shop-overlay">
              <div className="shop-content">
                <div className="shop-header">
                  <h3>🎒 Your Inventory</h3>
                  <p>Sell your fish to earn coins!</p>
                  <button className="close-overlay-button" onClick={() => setShowShop(false)}>✕</button>
                  <div className="shop-stats">
                    <span>Fish: {inventory.length}</span>
                    <span>Value: {inventory.reduce((sum, fish) => sum + fish.value, 0)} coins</span>
                  </div>
                </div>
                
                {inventory.length > 0 ? (
                  <div className="inventory-section">
                    <div className="inventory-actions">
                      <button 
                        className="sell-all-button" 
                        onClick={sellAllFish}
                      >
                        Sell All ({inventory.reduce((sum, fish) => sum + fish.value, 0)} coins)
                      </button>
                    </div>
                    
                    <div className="inventory-grid">
                      {inventory.map((fish) => (
                        <div key={fish.id} className="inventory-item">
                          <span className="inventory-fish-emoji">{fish.emoji}</span>
                          <div className="inventory-fish-details">
                            <div className="inventory-fish-name">{fish.name}</div>
                            <div className="inventory-fish-meta">
                              {fish.size?.toFixed(1)}&quot; • {fish.rarity}
                            </div>
                            <div className="inventory-fish-value">{fish.value} coins</div>
                          </div>
                          <button 
                            className="sell-fish-button" 
                            onClick={() => sellFish(fish.id)}
                          >
                            Sell
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-inventory">
                    <p>No fish in inventory. Go catch some!</p>
                  </div>
                )}

                <div className="shop-section environment-inventory-section">
                  <h4>🌍 Environment Loadout</h4>
                  <p className="environment-inventory-hint">Swap between unlocked locations.</p>
                  <div className="environment-inventory-grid">
                    {environmentInventory.map((env) => {
                      const isActive = env.id === activeEnvironment.id;
                      return (
                        <div
                          key={env.id}
                          className={`environment-card ${isActive ? 'environment-card-active' : ''}`}
                        >
                          <span className="environment-card-emoji">{env.emoji}</span>
                          <div className="environment-card-details">
                            <div className="environment-card-name">{env.name}</div>
                            <div className="environment-card-description">{env.description}</div>
                          </div>
                          <button
                            className="environment-card-button"
                            onClick={() => equipEnvironment(env.id)}
                            disabled={isActive}
                          >
                            {isActive ? 'Equipped' : 'Equip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="shop-section">
                  <h4>🏪 Shop - Environments</h4>
                  <div className="shop-grid">
                    {SHOP_ITEMS.environments.map((env) => {
                      const isOwned = ownedEnvironmentIds.includes(env.id);
                      const isEquipped = activeEnvironment.id === env.id;
                      const meetsLevel = (playerData.level || 1) >= env.levelRequired;
                      const hasCurrency = (playerData.currency || 0) >= env.price;
                      const buttonDisabled = isEquipped || (!isOwned && (!meetsLevel || !hasCurrency));
                      const buttonLabel = isEquipped
                        ? 'Equipped'
                        : isOwned
                        ? 'Equip'
                        : !meetsLevel
                        ? `Level ${env.levelRequired}`
                        : 'Buy';
                      const handleClick = isOwned
                        ? () => equipEnvironment(env.id)
                        : () => purchaseItem('environments', env.id);

                      return (
                        <div key={env.id} className="shop-item">
                          <span className="shop-item-emoji">{env.emoji}</span>
                          <div className="shop-item-details">
                            <div className="shop-item-name">{env.name}</div>
                            <div className="shop-item-description">{env.description}</div>
                            <div className="shop-item-requirements">
                              Level {env.levelRequired} • {env.price} coins
                            </div>
                            <div
                              className={`shop-item-status ${
                                isEquipped ? 'shop-item-status-equipped' : isOwned ? 'shop-item-status-owned' : 'shop-item-status-locked'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : isOwned ? 'Owned' : 'Locked'}
                            </div>
                          </div>
                          <button
                            className="shop-purchase-button"
                            onClick={handleClick}
                            disabled={buttonDisabled}
                          >
                            {buttonLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="shop-section">
                  <h4>⚙️ Shop - Upgrades</h4>
                  <div className="shop-grid">
                    {SHOP_ITEMS.upgrades.map((upgrade) => (
                      <div key={upgrade.id} className="shop-item">
                        <span className="shop-item-emoji">{upgrade.emoji}</span>
                        <div className="shop-item-details">
                          <div className="shop-item-name">{upgrade.name}</div>
                          <div className="shop-item-description">{upgrade.description}</div>
                          <div className="shop-item-requirements">
                            Level {upgrade.levelRequired} • {upgrade.price} coins
                          </div>
                        </div>
                        <button 
                          className="shop-purchase-button" 
                          onClick={() => purchaseItem('upgrades', upgrade.id)}
                          disabled={
                            (playerData.ownedUpgrades || []).includes(upgrade.id) ||
                            playerData.currency < upgrade.price ||
                            playerData.level < upgrade.levelRequired
                          }
                        >
                          {(playerData.ownedUpgrades || []).includes(upgrade.id) 
                            ? 'Owned' 
                            : playerData.level < upgrade.levelRequired 
                            ? `Level ${upgrade.levelRequired}` 
                            : 'Buy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="achievements-section">
                  <h4>🏆 Achievements</h4>
                  <div className="achievements-grid">
                    {ACHIEVEMENTS.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className={`achievement-item ${
                          playerData.achievements?.includes(achievement.id) ? 'unlocked' : 'locked'
                        }`}
                      >
                        <span className="achievement-emoji">{achievement.emoji}</span>
                        <div className="achievement-details">
                          <div className="achievement-name">{achievement.name}</div>
                          <div className="achievement-description">{achievement.description}</div>
                          {playerData.achievements?.includes(achievement.id) && (
                            <div className="achievement-reward">+{achievement.reward} coins</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showLeaderboard && (
            <div className="leaderboard-overlay">
              <div className="leaderboard-content">
                <div className="leaderboard-header">
                  <h3>🏆 Global Leaderboard</h3>
                  <p>Top fishers from around the world</p>
                  <button className="close-overlay-button" onClick={() => setShowLeaderboard(false)}>✕</button>
                </div>
                
                <div className="stats-section">
                  <h4>📊 Your Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-number">{playerStats.gamesPlayed}</span>
                      <span className="stat-label">Games Played</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{playerStats.bestScore}</span>
                      <span className="stat-label">Best Score</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{playerStats.avgScore}</span>
                      <span className="stat-label">Avg Score</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{playerStats.bestStreak}</span>
                      <span className="stat-label">Best Streak</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{playerStats.totalCatches}</span>
                      <span className="stat-label">Total Catches</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{Math.floor(playerStats.totalPlayTime / 60)}m</span>
                      <span className="stat-label">Play Time</span>
                    </div>
                  </div>
                </div>

                <div className="leaderboard-section">
                  <h4>🥇 Top Scores</h4>
                  <div className="leaderboard-list">
                    {globalLeaderboard.slice(0, 20).map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className={`leaderboard-entry ${
                          entry.playerName === playerData.playerName ? 'current-player' : ''
                        }`}
                      >
                        <div className="rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="player-info">
                          <div className="player-name">{entry.playerName}</div>
                          <div className="player-meta">
                            Level {entry.level} • {entry.date}
                          </div>
                        </div>
                        <div className="score-info">
                          <div className="score">{entry.score} pts</div>
                          <div className="catches">{entry.catches} catches</div>
                        </div>
                        <div className="streak">
                          {entry.longestStreak} streak
                        </div>
                      </div>
                    ))}
                    {globalLeaderboard.length === 0 && (
                      <div className="empty-leaderboard">
                        <p>No scores yet. Be the first to set a record!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showInstructions && (
            <div className="instructions-overlay">
              <div className="instructions-content">
                <h3>How to Play</h3>
                <button className="close-overlay-button" onClick={() => setShowInstructions(false)}>✕</button>
                <ul>
                  <li>Hit &quot;Start Fishing&quot; then cast your line to begin the 60 second run.</li>
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
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game Screen Render
  return (
    <div 
      ref={gameRef}
      className={`fishing-game ${environmentClassName}${isFullscreen ? ' fullscreen-game' : ''}`} 
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
          <div className="level-display">
            <span className="level-label">Level {playerData?.level || 1}</span>
            <div className="xp-bar">
              <div 
                className="xp-fill" 
                style={{ 
                  width: `${Math.min(100, ((playerData?.xp || 0) / (LEVEL_XP_REQUIREMENTS[playerData?.level || 1] || (playerData?.xp || 0) + 1)) * 100)}%` 
                }}
              />
            </div>
            <span className="xp-text">
              {playerData?.xp || 0}/{LEVEL_XP_REQUIREMENTS[playerData?.level || 1] || 'Max'}
            </span>
          </div>
          <div className="currency-display">
            <span className="currency-label">💰</span>
            <span className="currency-value">{playerData.currency || 0}</span>
          </div>
          <div className="timer-display">
            <span className="timer-label">Time</span>
            <span className="timer-value">{timeDisplay}</span>
          </div>
          <div className="best-score-display">
            <span className="best-score-label">Best</span>
            <span className="best-score-value">{Math.max(bestScore, score)}</span>
          </div>
          <div className="environment-badge" title="Current environment">
            <span className="environment-emoji">{activeEnvironment.emoji || '🌊'}</span>
            <div className="environment-details">
              <span className="environment-label">Environment</span>
              <span className="environment-name">{activeEnvironment.name}</span>
            </div>
          </div>
          <div className="header-buttons">
            <button 
              className="home-button-game" 
              onClick={returnToHome}
              aria-label="Return to home"
              title="Return to home"
            >
              🏠
            </button>
          </div>
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

        <div className="game-controls">
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
  onGameComplete: PropTypes.func,
  user: PropTypes.object,
  userProfile: PropTypes.object,
  isAuthenticated: PropTypes.bool,
  onProfileCacheUpdate: PropTypes.func
};

export default FishingGame;
