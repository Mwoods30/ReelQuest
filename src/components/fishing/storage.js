import { GLOBAL_SCORES_KEY, PLAYER_DATA_KEY, PLAYER_STATS_KEY, STORAGE_KEY } from './constants.js';
import { getDefaultPlayerData } from './defaults.js';

const safeLocalStorage =
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined;

export const readStoredBestScore = () => {
  if (!safeLocalStorage) return 0;
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  return stored ? Number(stored) || 0 : 0;
};

export const writeStoredBestScore = (value) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(STORAGE_KEY, String(value));
};

export const readPlayerData = () => {
  if (!safeLocalStorage) return getDefaultPlayerData();
  const stored = safeLocalStorage.getItem(PLAYER_DATA_KEY);
  return stored ? { ...getDefaultPlayerData(), ...JSON.parse(stored) } : getDefaultPlayerData();
};

export const writePlayerData = (playerData) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
};

export const readGlobalScores = () => {
  if (!safeLocalStorage) return [];
  const stored = safeLocalStorage.getItem(GLOBAL_SCORES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const writeGlobalScores = (scores) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(GLOBAL_SCORES_KEY, JSON.stringify(scores));
};

export const dedupeLeaderboardEntries = (entries) => {
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

export const addToGlobalLeaderboard = (playerData, gameResult) => {
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

export const readPlayerStats = () => {
  if (!safeLocalStorage) return getDefaultPlayerStats();
  const stored = safeLocalStorage.getItem(PLAYER_STATS_KEY);
  return stored ? { ...getDefaultPlayerStats(), ...JSON.parse(stored) } : getDefaultPlayerStats();
};

export const writePlayerStats = (stats) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
};

export const getDefaultPlayerStats = () => ({
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

export const updatePlayerStats = (gameResult, playTime) => {
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
