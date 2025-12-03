export const OFFLINE_MODE = false; // cloud sync enabled

export const GAME_DURATION = 60;
export const STORAGE_KEY = 'reelquest:fishing:best-score';
export const PLAYER_DATA_KEY = 'reelquest:player:data';
export const GLOBAL_SCORES_KEY = 'reelquest:global:leaderboard';
export const PLAYER_STATS_KEY = 'reelquest:player:stats';

const generateXPTable = (maxLevel = 50, base = 100, exponent = 1.4) => {
  const xpTable = [0];
  for (let level = 1; level <= maxLevel; level += 1) {
    xpTable.push(Math.floor(base * Math.pow(level, exponent)));
  }
  return xpTable;
};

export const LEVEL_XP_REQUIREMENTS = generateXPTable(50);

export const XP_PER_CATCH = {
  Common: 15,
  Uncommon: 25,
  Rare: 40,
  Legendary: 75
};

export const ENVIRONMENT_LIBRARY = Object.freeze({
  crystal_lake: {
    id: 'crystal_lake',
    name: 'Crystal Lake',
    description: 'Peaceful freshwater retreat with balanced fish spawns',
    emoji: '🏞️',
    levelRequired: 1,
    price: 0,
    purchasable: false
  },
  swamp_marsh: {
    id: 'swamp_marsh',
    name: 'Swamp Marsh',
    description: 'Murky wetlands filled with resilient, quirky fish',
    emoji: '🪵',
    price: 150,
    levelRequired: 2,
    purchasable: true
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
  sunset_pier: {
    id: 'sunset_pier',
    name: 'Sunset Pier',
    description: 'A gentle coastline with dusk-loving species',
    emoji: '🌅',
    price: 300,
    levelRequired: 4,
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
  volcanic_springs: {
    id: 'volcanic_springs',
    name: 'Volcanic Springs',
    description: 'Boiling geothermal pools hiding heat-forged fish',
    emoji: '🌋',
    price: 650,
    levelRequired: 6,
    purchasable: true
  },
  frozen_tundra: {
    id: 'frozen_tundra',
    name: 'Frozen Tundra',
    description: 'Frigid waters with hardy, powerful cold-water fish',
    emoji: '❄️',
    price: 800,
    levelRequired: 7,
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

export const SHOP_ITEMS = {
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

export const ACHIEVEMENTS = [
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
  },
  {
    id: 'pro_collector',
    name: 'Pro Collector',
    description: 'Catch 50 fish',
    emoji: '🎣',
    requirement: { type: 'catches', value: 50 },
    reward: 200
  },
  {
    id: 'grand_master_collector',
    name: 'Grand Master Collector',
    description: 'Catch 250 fish',
    emoji: '🐟',
    requirement: { type: 'catches', value: 250 },
    reward: 500
  },
  {
    id: 'level_10',
    name: 'Veteran Fisher',
    description: 'Reach level 10',
    emoji: '🪙',
    requirement: { type: 'level', value: 10 },
    reward: 300
  },
  {
    id: 'level_20',
    name: 'Fishing Legend',
    description: 'Reach level 20',
    emoji: '👑',
    requirement: { type: 'level', value: 20 },
    reward: 600
  },
  {
    id: 'moneybags',
    name: 'Moneybags',
    description: 'Accumulate 5,000 coins',
    emoji: '💵',
    requirement: { type: 'currency', value: 5000 },
    reward: 450
  },
  {
    id: 'big_baller',
    name: 'Big Baller',
    description: 'Accumulate 10,000 coins',
    emoji: '💰',
    requirement: { type: 'currency', value: 10000 },
    reward: 750
  }
];

export const PHASES = Object.freeze({
  IDLE: 'idle',
  READY: 'ready',
  WAITING: 'waiting',
  HOOKED: 'hooked',
  CELEBRATE: 'celebrate',
  ENDED: 'ended'
});

export const FISH_TYPES = [
  // Common
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
    name: 'Sunfish',
    emoji: '🌞',
    rarity: 'Common',
    points: 12,
    difficulty: 1.1,
    escapeRate: 1.1,
    minSize: 5,
    maxSize: 9,
    value: 6
  },
  {
    name: 'Crappie',
    emoji: '🐚',
    rarity: 'Common',
    points: 13,
    difficulty: 1.15,
    escapeRate: 1.1,
    minSize: 6,
    maxSize: 11,
    value: 7
  },
  {
    name: 'Trout',
    emoji: '🐋',
    rarity: 'Common',
    points: 12,
    difficulty: 1.2,
    escapeRate: 1.3,
    minSize: 6,
    maxSize: 16,
    value: 12
  },
  // Uncommon
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
    name: 'Smallmouth Bass',
    emoji: '🐳',
    rarity: 'Uncommon',
    points: 22,
    difficulty: 1.7,
    escapeRate: 1.5,
    minSize: 9,
    maxSize: 15,
    value: 15
  },
  {
    name: 'Koi Carp',
    emoji: '🎏',
    rarity: 'Uncommon',
    points: 25,
    difficulty: 1.8,
    escapeRate: 1.6,
    minSize: 10,
    maxSize: 16,
    value: 18
  },
  // Rare
  {
    name: 'Striped Bass',
    emoji: '🐬',
    rarity: 'Rare',
    points: 28,
    difficulty: 1.7,
    escapeRate: 1.4,
    minSize: 12,
    maxSize: 20,
    value: 25
  },
  {
    name: 'Electric Eel',
    emoji: '⚡',
    rarity: 'Rare',
    points: 35,
    difficulty: 1.6,
    escapeRate: 1.35,
    minSize: 14,
    maxSize: 22,
    value: 32
  },
  {
    name: 'Tiger Shark',
    emoji: '🦈',
    rarity: 'Rare',
    points: 40,
    difficulty: 1.75,
    escapeRate: 1.45,
    minSize: 18,
    maxSize: 26,
    value: 40
  },
  // Legendary
  {
    name: 'Golden Marlin',
    emoji: '🐋',
    rarity: 'Legendary',
    points: 50,
    difficulty: 2.0,
    escapeRate: 1.6,
    minSize: 16,
    maxSize: 28,
    value: 60
  },
  {
    name: 'Crystal Salmon',
    emoji: '💠',
    rarity: 'Legendary',
    points: 55,
    difficulty: 2.05,
    escapeRate: 1.65,
    minSize: 16,
    maxSize: 30,
    value: 70
  },
  {
    name: 'Abyss Leviathan',
    emoji: '🐙',
    rarity: 'Legendary',
    points: 65,
    difficulty: 2.2,
    escapeRate: 1.75,
    minSize: 20,
    maxSize: 34,
    value: 90
  },
  {
    name: 'Obama Fish',
    emoji: '🐋',
    rarity: 'Legendary',
    points: 80,
    difficulty: 2.6,
    escapeRate: 2.2,
    minSize: 24,
    maxSize: 48,
    value: 90
  }
];
