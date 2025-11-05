// Enhanced Firebase Analytics and Performance Monitoring
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { app } from './config.js';

// Initialize Analytics and Performance
export const analytics = getAnalytics(app);
export const perf = getPerformance(app);

// Custom Analytics Events
export const trackGameEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && analytics) {
    logEvent(analytics, eventName, parameters);
  }
};

// Game-specific event tracking
export const gameAnalytics = {
  // Track game start
  gameStarted: (mode = 'standard') => {
    trackGameEvent('game_started', {
      game_mode: mode,
      timestamp: Date.now()
    });
  },

  // Track game completion
  gameCompleted: (score, catches, duration, streak) => {
    trackGameEvent('game_completed', {
      score: score,
      catches: catches,
      duration_seconds: duration,
      longest_streak: streak,
      performance_rating: score > 100 ? 'good' : 'average'
    });
  },

  // Track fish catches
  fishCaught: (fishType, rarity, points) => {
    trackGameEvent('fish_caught', {
      fish_type: fishType,
      fish_rarity: rarity,
      points_earned: points
    });
  },

  // Track shop purchases
  shopPurchase: (itemType, itemName, price) => {
    trackGameEvent('shop_purchase', {
      item_type: itemType,
      item_name: itemName,
      price: price,
      currency: 'game_coins'
    });
  },

  // Track level progression
  levelUp: (newLevel, xpGained) => {
    trackGameEvent('level_up', {
      new_level: newLevel,
      xp_gained: xpGained
    });
  },

  // Track achievement unlocks
  achievementUnlocked: (achievementId, achievementName) => {
    trackGameEvent('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_name: achievementName
    });
  },

  // Track user authentication
  userSignUp: (method) => {
    trackGameEvent('sign_up', {
      method: method // 'email', 'google', etc.
    });
  },

  userLogin: (method) => {
    trackGameEvent('login', {
      method: method
    });
  },

  // Track leaderboard interactions
  leaderboardViewed: () => {
    trackGameEvent('leaderboard_viewed');
  },

  // Track errors
  gameError: (errorType, errorMessage) => {
    trackGameEvent('game_error', {
      error_type: errorType,
      error_message: errorMessage
    });
  }
};

// User property tracking
export const setAnalyticsUser = (userId, properties = {}) => {
  if (typeof window !== 'undefined' && analytics) {
    setUserId(analytics, userId);
    setUserProperties(analytics, {
      player_level: properties.level || 1,
      total_games_played: properties.gamesPlayed || 0,
      account_created: properties.createdAt || new Date().toISOString(),
      ...properties
    });
  }
};

// Performance monitoring helpers
export const performanceMonitoring = {
  // Track game loading performance
  trackGameLoad: () => {
    if (typeof window !== 'undefined' && perf) {
      const trace = perf.trace('game_load');
      trace.start();
      return trace;
    }
    return null;
  },

  // Track API call performance
  trackApiCall: (apiName) => {
    if (typeof window !== 'undefined' && perf) {
      const trace = perf.trace(`api_${apiName}`);
      trace.start();
      return trace;
    }
    return null;
  },

  // Stop performance trace
  stopTrace: (trace) => {
    if (trace) {
      trace.stop();
    }
  }
};

// Custom performance metrics
export const customMetrics = {
  recordGamePerformance: (fps, loadTime, renderTime) => {
    if (typeof window !== 'undefined' && perf) {
      // Record custom metrics for game performance
      trackGameEvent('game_performance', {
        fps: fps,
        load_time_ms: loadTime,
        render_time_ms: renderTime
      });
    }
  }
};