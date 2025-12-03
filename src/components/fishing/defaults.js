import { ENVIRONMENT_LIBRARY } from './constants.js';

export const getDefaultPlayerData = () => ({
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
  playerName: `Fisher${Math.floor(Math.random() * 1000)}`,
  gamesPlayed: 0,
  totalPlayTime: 0
});

export const getActiveEnvironment = (playerData) => {
  const activeEnvironmentId = playerData?.currentEnvironment || 'crystal_lake';
  return ENVIRONMENT_LIBRARY[activeEnvironmentId] || ENVIRONMENT_LIBRARY.crystal_lake;
};
