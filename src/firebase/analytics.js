// Enhanced Firebase Analytics + Performance Monitoring (Optimized)
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { app } from './config.js';

// Safe initialization for SSR environments
let analytics = null;
let perf = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  perf = getPerformance(app);
}

// Centralized event logger
const safeLogEvent = (eventName, parameters = {}) => {
  if (!analytics) return;
  logEvent(analytics, eventName, {
    timestamp: Date.now(),
    ...parameters
  });
};

// ----------------------
// GAME ANALYTICS EVENTS
// ----------------------
export const gameAnalytics = {
  gameStarted: (mode = 'standard') => {
    safeLogEvent('game_started', { game_mode: mode });
  },

  gameCompleted: (score, catches, duration, streak) => {
    safeLogEvent('game_completed', {
      score,
      catches,
      duration_seconds: duration,
      longest_streak: streak,
      performance_rating: score >= 120 ? 'excellent' : score >= 60 ? 'good' : 'average'
    });
  },

  fishCaught: (fishType, rarity, points) => {
    safeLogEvent('fish_caught', {
      fish_type: fishType,
      fish_rarity: rarity,
      points_earned: points
    });
  },

  shopPurchase: (itemType, itemName, price) => {
    safeLogEvent('shop_purchase', {
      item_type: itemType,
      item_name: itemName,
      price,
      currency: 'coins'
    });
  },

  levelUp: (newLevel, xpGained) => {
    safeLogEvent('level_up', {
      new_level: newLevel,
      xp_gained: xpGained
    });
  },

  achievementUnlocked: (id, name) => {
    safeLogEvent('achievement_unlocked', {
      achievement_id: id,
      achievement_name: name
    });
  },

  userSignUp: (method) => {
    safeLogEvent('signup', { method });
  },

  userLogin: (method) => {
    safeLogEvent('login', { method });
  },

  leaderboardViewed: () => {
    safeLogEvent('leaderboard_viewed');
  },

  gameError: (type, message) => {
    safeLogEvent('game_error', {
      error_type: type,
      error_message: message
    });
  }
};

// ----------------------
// USER PROPERTIES
// ----------------------
export const setAnalyticsUser = (userId, properties = {}) => {
  if (!analytics) return;

  setUserId(analytics, userId);

  const defaultProps = {
    player_level: properties.level ?? 1,
    total_games_played: properties.gamesPlayed ?? 0,
    account_created: properties.createdAt || new Date().toISOString()
  };

  setUserProperties(analytics, { ...defaultProps, ...properties });
};

// ----------------------
// PERFORMANCE MONITORING
// ----------------------
const startTrace = (name) => {
  if (!perf) return null;
  try {
    const trace = perf.trace(name);
    trace.start();
    return trace;
  } catch {
    return null;
  }
};

const stopTrace = (trace) => {
  if (trace) trace.stop();
};

export const performanceMonitoring = {
  trackGameLoad: () => startTrace('game_load'),
  trackApiCall: (apiName) => startTrace(`api_${apiName}`),
  stopTrace
};

// ----------------------
// CUSTOM METRICS
// ----------------------
export const customMetrics = {
  recordGamePerformance: (fps, loadTime, renderTime) => {
    safeLogEvent('game_performance', {
      fps,
      load_time_ms: loadTime,
      render_time_ms: renderTime
    });
  }
};

export { analytics, perf };
