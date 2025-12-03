import { GLOBAL_SCORES_KEY, PLAYER_DATA_KEY, PLAYER_STATS_KEY, STORAGE_KEY } from './constants.js';
import { getDefaultPlayerData } from './defaults.js';

/* -----------------------------
   Safe LocalStorage Wrapper
------------------------------ */
const safeLocalStorage =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : undefined;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn("Failed to parse localStorage value:", e);
    return fallback;
  }
};

/* -----------------------------
   Best Score Handling
------------------------------ */
export const readStoredBestScore = () => {
  if (!safeLocalStorage) return 0;
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  const num = Number(stored);
  return Number.isFinite(num) ? num : 0;
};

export const writeStoredBestScore = (value) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(STORAGE_KEY, String(value));
};

/* -----------------------------
   Player Data
------------------------------ */
export const readPlayerData = () => {
  if (!safeLocalStorage) return getDefaultPlayerData();

  const stored = safeLocalStorage.getItem(PLAYER_DATA_KEY);
  const parsed = stored ? safeParse(stored, {}) : {};

  return { ...getDefaultPlayerData(), ...parsed };
};

export const writePlayerData = (playerData) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
};

/* -----------------------------
   Player Stats (Local)
------------------------------ */
const defaultPlayerStats = {
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
};

export const readPlayerStats = () => {
  if (!safeLocalStorage) return { ...defaultPlayerStats };
  const stored = safeLocalStorage.getItem(PLAYER_STATS_KEY);
  const parsed = stored ? safeParse(stored, {}) : {};
  return { ...defaultPlayerStats, ...parsed };
};

export const writePlayerStats = (stats) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
};

/* -----------------------------
   Global Scores (Local Leaderboard)
------------------------------ */
export const readGlobalScores = () => {
  if (!safeLocalStorage) return [];
  const stored = safeLocalStorage.getItem(GLOBAL_SCORES_KEY);
  return stored ? safeParse(stored, []) : [];
};

export const writeGlobalScores = (scores) => {
  if (!safeLocalStorage) return;
  safeLocalStorage.setItem(GLOBAL_SCORES_KEY, JSON.stringify(scores));
};

/* -----------------------------
   Deduplicate Leaderboard Entries
------------------------------ */
export const dedupeLeaderboardEntries = (entries) => {
  if (!Array.isArray(entries)) return [];

  // Sort by best score first
  const sorted = entries
    .filter(Boolean)
    .slice()
    .sort((a, b) => (b?.score || 0) - (a?.score || 0));

  const seen = new Set();
  const result = [];

  for (const entry of sorted) {
    // Unique key priority:
    // 1. userId (Firebase users)
    // 2. id (local unique ID)
    // 3. playerName (fallback only)
    const uniqueKey = entry.userId || entry.id || entry.playerName;

    if (!uniqueKey || seen.has(uniqueKey)) continue;

    seen.add(uniqueKey);
    result.push(entry);
  }

  return result;
};

/* -----------------------------
   Add Entry to Leaderboard
------------------------------ */
export const addToGlobalLeaderboard = (playerData, gameResult) => {
  const globalScores = readGlobalScores();

  // Always generate a unique, collision-resistant ID
  const newEntry = {
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: playerData.uid || null,
    playerName: playerData.playerName || `Fisher${Math.floor(Math.random() * 10000)}`,
    score: gameResult.score,
    catches: gameResult.catches,
    longestStreak: gameResult.longestStreak,
    level: playerData.level,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
  };

  globalScores.push(newEntry);

  const deduped = dedupeLeaderboardEntries(globalScores);
  const top100 = deduped.slice(0, 100);

  writeGlobalScores(top100);

  return (
    top100.find((entry) =>
      entry.userId
        ? entry.userId === playerData.uid
        : entry.id === newEntry.id
    ) || newEntry
  );
};
