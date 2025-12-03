// Firestore Database Service (Optimized + Safe)
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  where,
  getDocs
} from 'firebase/firestore';

import { db, firebaseEnabled } from './config.js';

// --------------------------------------------
// Helper: Ensure Firestore is available
// --------------------------------------------
const ensureDb = () => {
  if (!firebaseEnabled || !db) {
    throw new Error('Firestore unavailable: Firebase disabled or missing config');
  }
  return db;
};

// Consistent success/error wrapper
const success = (data = null) => ({ success: true, ...(data && { data }) });
const failure = (error) => ({
  success: false,
  error: error.message || String(error),
  errorCode: error.code || null
});

// --------------------------------------------
// Collections
// --------------------------------------------
const USERS = 'users';
const LEADERBOARD = 'leaderboard';
const SESSIONS = 'gameSessions';

// --------------------------------------------
// User Profile
// --------------------------------------------
export const createUserProfile = async (userId, userData) => {
  try {
    ensureDb();

    const profile = {
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
      playerName: userData.playerName || `Fisher${Math.floor(Math.random() * 10000)}`,
      gamesPlayed: 0,
      totalPlayTime: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ...userData
    };

    await setDoc(doc(db, USERS, userId), profile);
    return success(profile);
  } catch (error) {
    console.error('createUserProfile:', error);
    return failure(error);
  }
};

export const getUserProfile = async (userId) => {
  try {
    ensureDb();

    const ref = doc(db, USERS, userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return failure({ message: 'User profile not found', code: 'not-found' });
    }

    return success(snap.data());
  } catch (error) {
    console.error('getUserProfile:', error);
    return failure(error);
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    ensureDb();
    if (!userId) return failure({ message: 'Missing user ID', code: 'missing-user' });

    const ref = doc(db, USERS, userId);

    await updateDoc(ref, {
      ...updates,
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('updateUserProfile:', error);
    return failure(error);
  }
};

// --------------------------------------------
// Game Progress
// --------------------------------------------
export const saveGameProgress = async (userId, progress) => {
  try {
    ensureDb();
    return await updateUserProfile(userId, {
      ...progress,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('saveGameProgress:', error);
    return failure(error);
  }
};

export const addFishToInventory = async (userId, fish) => {
  try {
    ensureDb();

    await updateDoc(doc(db, USERS, userId), {
      inventory: arrayUnion(fish),
      totalCatches: increment(1),
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('addFishToInventory:', error);
    return failure(error);
  }
};

export const sellFishFromInventory = async (userId, fishId, saleValue, newInventory) => {
  try {
    ensureDb();

    await updateDoc(doc(db, USERS, userId), {
      inventory: newInventory,
      currency: increment(saleValue),
      totalFishSold: increment(1),
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('sellFishFromInventory:', error);
    return failure(error);
  }
};

export const purchaseShopItem = async (userId, price, updates) => {
  try {
    ensureDb();

    await updateDoc(doc(db, USERS, userId), {
      ...updates,
      currency: increment(-price),
      totalPurchases: increment(1),
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('purchaseShopItem:', error);
    return failure(error);
  }
};

// --------------------------------------------
// Leaderboard
// --------------------------------------------
export const addToLeaderboard = async (userId, gameResult, player) => {
  try {
    ensureDb();

    const entry = {
      userId,
      playerName: player.playerName || 'Anonymous',
      score: gameResult.score,
      catches: gameResult.catches,
      longestStreak: gameResult.longestStreak,
      level: player.level,
      timestamp: serverTimestamp(),
      date: new Date().toLocaleDateString()
    };

    const ref = await addDoc(collection(db, LEADERBOARD), entry);

    return success({ id: ref.id, ...entry });
  } catch (error) {
    console.error('addToLeaderboard:', error);
    return failure(error);
  }
};

export const getTopScores = async (count = 50) => {
  try {
    ensureDb();

    const q = query(
      collection(db, LEADERBOARD),
      orderBy('score', 'desc'),
      limit(count)
    );

    const snapshot = await getDocs(q);
    const scores = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return success(scores);
  } catch (error) {
    console.error('getTopScores:', error);
    return failure(error);
  }
};

export const getUserRanking = async (userId, score) => {
  try {
    ensureDb();

    const q = query(
      collection(db, LEADERBOARD),
      where('score', '>', score)
    );

    const snapshot = await getDocs(q);

    return success({ rank: snapshot.size + 1 });
  } catch (error) {
    console.error('getUserRanking:', error);
    return failure(error);
  }
};

// Real-time leaderboard listener
export const subscribeToLeaderboard = (callback, count = 50) => {
  ensureDb();

  const q = query(
    collection(db, LEADERBOARD),
    orderBy('score', 'desc'),
    limit(count)
  );

  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

// --------------------------------------------
// Game Sessions
// --------------------------------------------
export const logGameSession = async (userId, session) => {
  try {
    ensureDb();

    await addDoc(collection(db, SESSIONS), {
      userId,
      ...session,
      timestamp: serverTimestamp()
    });

    await updateDoc(doc(db, USERS, userId), {
      gamesPlayed: increment(1),
      totalPlayTime: increment(session.playTime || 0),
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('logGameSession:', error);
    return failure(error);
  }
};

// --------------------------------------------
// Achievements
// --------------------------------------------
export const unlockAchievement = async (userId, achievementId, reward = 0) => {
  try {
    ensureDb();

    await updateDoc(doc(db, USERS, userId), {
      achievements: arrayUnion(achievementId),
      currency: increment(reward),
      lastActive: serverTimestamp()
    });

    return success();
  } catch (error) {
    console.error('unlockAchievement:', error);
    return failure(error);
  }
};

// --------------------------------------------
// Live User Profile Listener
// --------------------------------------------
export const subscribeToUserProfile = (userId, callback, errorCallback) => {
  ensureDb();

  const ref = doc(db, USERS, userId);

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      }
    },
    (err) => {
      console.error('subscribeToUserProfile:', err);
      errorCallback?.(err);
    }
  );
};
