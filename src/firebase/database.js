// Firestore Database Service
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
import { db } from './config.js';

// Collections
const USERS_COLLECTION = 'users';
const LEADERBOARD_COLLECTION = 'leaderboard';
const GAME_SESSIONS_COLLECTION = 'gameSessions';

// User Data Management
export const createUserProfile = async (userId, userData) => {
  try {
    const defaultUserData = {
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

    await setDoc(doc(db, USERS_COLLECTION, userId), defaultUserData);
    return { success: true, data: defaultUserData };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Game Progress Management
export const saveGameProgress = async (userId, progressData) => {
  try {
    const updates = {
      ...progressData,
      lastActive: serverTimestamp()
    };
    
    await updateUserProfile(userId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error saving game progress:', error);
    return { success: false, error: error.message };
  }
};

export const addFishToInventory = async (userId, fish) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      inventory: arrayUnion(fish),
      totalCatches: increment(1),
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding fish to inventory:', error);
    return { success: false, error: error.message };
  }
};

export const sellFishFromInventory = async (userId, fishId, saleValue, newInventory) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      inventory: newInventory,
      currency: increment(saleValue),
      totalFishSold: increment(1),
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error selling fish:', error);
    return { success: false, error: error.message };
  }
};

export const purchaseShopItem = async (userId, itemPrice, updates) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      currency: increment(-itemPrice),
      totalPurchases: increment(1),
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error purchasing shop item:', error);
    return { success: false, error: error.message };
  }
};

// Leaderboard Management
export const addToLeaderboard = async (userId, gameResult, playerData) => {
  try {
    const leaderboardEntry = {
      userId,
      playerName: playerData.playerName || 'Anonymous',
      score: gameResult.score,
      catches: gameResult.catches,
      longestStreak: gameResult.longestStreak,
      level: playerData.level,
      timestamp: serverTimestamp(),
      date: new Date().toLocaleDateString()
    };

    const docRef = await addDoc(collection(db, LEADERBOARD_COLLECTION), leaderboardEntry);
    
    return { 
      success: true, 
      leaderboardId: docRef.id,
      entry: { ...leaderboardEntry, id: docRef.id }
    };
  } catch (error) {
    console.error('Error adding to leaderboard:', error);
    return { success: false, error: error.message };
  }
};

export const getTopScores = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const scores = [];
    
    querySnapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: scores };
  } catch (error) {
    console.error('Error getting top scores:', error);
    return { success: false, error: error.message };
  }
};

export const getUserRanking = async (userId, userScore) => {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      where('score', '>', userScore)
    );
    
    const querySnapshot = await getDocs(q);
    const rank = querySnapshot.size + 1;
    
    return { success: true, rank };
  } catch (error) {
    console.error('Error getting user ranking:', error);
    return { success: false, error: error.message };
  }
};

// Real-time Leaderboard Listener
export const subscribeToLeaderboard = (callback, limitCount = 50) => {
  const q = query(
    collection(db, LEADERBOARD_COLLECTION),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const scores = [];
    querySnapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    callback(scores);
  });
};

// Game Session Tracking
export const logGameSession = async (userId, sessionData) => {
  try {
    const sessionEntry = {
      userId,
      ...sessionData,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, GAME_SESSIONS_COLLECTION), sessionEntry);
    
    // Update user stats
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      gamesPlayed: increment(1),
      totalPlayTime: increment(sessionData.playTime || 0),
      lastActive: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging game session:', error);
    return { success: false, error: error.message };
  }
};

// Achievement Management
export const unlockAchievement = async (userId, achievementId, reward = 0) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      achievements: arrayUnion(achievementId),
      currency: increment(reward),
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, error: error.message };
  }
};

// Real-time User Profile Listener
export const subscribeToUserProfile = (userId, callback) => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};