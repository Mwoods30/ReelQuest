import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const loadCredentials = () => {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    return cert(JSON.parse(inlineJson));
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const resolved = path.resolve(credentialsPath);
    if (!existsSync(resolved)) {
      throw new Error(`Service account file not found at ${resolved}`);
    }
    const content = readFileSync(resolved, 'utf8');
    return cert(JSON.parse(content));
  }

  return applicationDefault();
};

initializeApp({
  credential: loadCredentials()
});

const db = getFirestore();

const DEFAULT_PROFILE = {
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
  gamesPlayed: 0,
  totalPlayTime: 0
};

const ensurePlayerName = (userId, value) => {
  if (typeof value === 'string' && value.trim().length > 0 && value.length <= 50) {
    return value.trim();
  }
  return `Fisher_${userId.slice(0, 8)}`;
};

const ensureNumber = (value, fallback, min = 0, max) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  let next = value;
  if (typeof min === 'number') {
    next = Math.max(next, min);
  }
  if (typeof max === 'number') {
    next = Math.min(next, max);
  }
  return next;
};

const ensureArray = (value, fallback) => {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
};

const collectUpdates = (userId, data) => {
  const updates = {};

  const playerName = ensurePlayerName(userId, data.playerName);
  if (playerName !== data.playerName) {
    updates.playerName = playerName;
  }

  const level = ensureNumber(data.level, DEFAULT_PROFILE.level, 1, 100);
  if (level !== data.level) {
    updates.level = level;
  }

  const xp = ensureNumber(data.xp, DEFAULT_PROFILE.xp, 0);
  if (xp !== data.xp) {
    updates.xp = xp;
  }

  const currency = ensureNumber(data.currency, DEFAULT_PROFILE.currency, 0);
  if (currency !== data.currency) {
    updates.currency = currency;
  }

  const totalCatches = ensureNumber(data.totalCatches, DEFAULT_PROFILE.totalCatches, 0);
  if (totalCatches !== data.totalCatches) {
    updates.totalCatches = totalCatches;
  }

  const totalFishSold = ensureNumber(data.totalFishSold, DEFAULT_PROFILE.totalFishSold, 0);
  if (totalFishSold !== data.totalFishSold) {
    updates.totalFishSold = totalFishSold;
  }

  const totalPurchases = ensureNumber(data.totalPurchases, DEFAULT_PROFILE.totalPurchases, 0);
  if (totalPurchases !== data.totalPurchases) {
    updates.totalPurchases = totalPurchases;
  }

  const gamesPlayed = ensureNumber(data.gamesPlayed, DEFAULT_PROFILE.gamesPlayed, 0);
  if (gamesPlayed !== data.gamesPlayed) {
    updates.gamesPlayed = gamesPlayed;
  }

  const totalPlayTime = ensureNumber(data.totalPlayTime, DEFAULT_PROFILE.totalPlayTime, 0);
  if (totalPlayTime !== data.totalPlayTime) {
    updates.totalPlayTime = totalPlayTime;
  }

  const inventory = ensureArray(data.inventory, DEFAULT_PROFILE.inventory);
  if (inventory !== data.inventory) {
    updates.inventory = inventory;
  }

  const achievements = ensureArray(data.achievements, DEFAULT_PROFILE.achievements);
  if (achievements !== data.achievements) {
    updates.achievements = achievements;
  }

  const ownedEnvironments = ensureArray(data.ownedEnvironments, DEFAULT_PROFILE.ownedEnvironments);
  if (ownedEnvironments !== data.ownedEnvironments) {
    updates.ownedEnvironments = ownedEnvironments;
  }

  const ownedUpgrades = ensureArray(data.ownedUpgrades, DEFAULT_PROFILE.ownedUpgrades);
  if (ownedUpgrades !== data.ownedUpgrades) {
    updates.ownedUpgrades = ownedUpgrades;
  }

  const currentEnvironment = typeof data.currentEnvironment === 'string'
    ? data.currentEnvironment
    : DEFAULT_PROFILE.currentEnvironment;
  if (currentEnvironment !== data.currentEnvironment) {
    updates.currentEnvironment = currentEnvironment;
  }

  if (!data.createdAt) {
    updates.createdAt = FieldValue.serverTimestamp();
  }

  if (!data.lastActive) {
    updates.lastActive = FieldValue.serverTimestamp();
  }

  return updates;
};

const backfillUsers = async () => {
  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('No user documents found. Nothing to backfill.');
    return;
  }

  const commits = [];
  let batch = db.batch();
  let writesInBatch = 0;
  let updatedDocs = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const updates = collectUpdates(docSnap.id, data);

    if (Object.keys(updates).length === 0) {
      return;
    }

    batch.update(docSnap.ref, updates);
    writesInBatch += 1;
    updatedDocs += 1;

    if (writesInBatch === 400) {
      commits.push(batch.commit());
      batch = db.batch();
      writesInBatch = 0;
    }
  });

  if (writesInBatch > 0) {
    commits.push(batch.commit());
  }

  if (commits.length === 0) {
    console.log('All user documents already satisfy the required fields. No updates applied.');
    return;
  }

  await Promise.all(commits);
  console.log(`Backfill complete. Updated ${updatedDocs} user document(s).`);
};

backfillUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
