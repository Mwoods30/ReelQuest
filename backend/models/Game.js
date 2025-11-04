const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Player Info
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Game must have a player'],
  },
  
  // Game Session Info
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
  },
  
  // Game Results
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  catches: [{
    fishType: {
      type: String,
      required: true,
    },
    fishName: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    caughtAt: {
      type: Date,
      default: Date.now,
    },
    location: {
      x: Number,
      y: Number,
    },
  }],
  
  // Game Statistics
  totalCatches: {
    type: Number,
    default: 0,
  },
  rareFishCaught: {
    type: Number,
    default: 0,
  },
  perfectCasts: {
    type: Number,
    default: 0,
  },
  missedCasts: {
    type: Number,
    default: 0,
  },
  
  // Game Settings
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  gameMode: {
    type: String,
    enum: ['classic', 'timed', 'survival', 'tournament'],
    default: 'classic',
  },
  
  // Metadata
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
gameSchema.index({ player: 1, createdAt: -1 });
gameSchema.index({ score: -1 });
gameSchema.index({ sessionId: 1 });
gameSchema.index({ createdAt: -1 });

// Virtual for accuracy percentage
gameSchema.virtual('accuracy').get(function() {
  const totalCasts = this.perfectCasts + this.missedCasts;
  if (totalCasts === 0) return 0;
  return Math.round((this.perfectCasts / totalCasts) * 100);
});

// Virtual for average points per fish
gameSchema.virtual('averagePointsPerFish').get(function() {
  if (this.totalCatches === 0) return 0;
  return Math.round(this.score / this.totalCatches);
});

// Pre-save middleware to calculate totals
gameSchema.pre('save', function(next) {
  if (this.isModified('catches')) {
    this.totalCatches = this.catches.length;
    this.rareFishCaught = this.catches.filter(
      catch_ => ['rare', 'epic', 'legendary'].includes(catch_.rarity)
    ).length;
  }
  
  if (this.isModified('endTime') && this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }
  
  next();
});

// Static method to get user's game history
gameSchema.statics.getUserGameHistory = function(userId, limit = 10) {
  return this.find({ player: userId, isCompleted: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('score totalCatches rareFishCaught duration createdAt difficulty gameMode');
};

// Static method to get leaderboard for specific game mode
gameSchema.statics.getGameModeLeaderboard = function(gameMode = 'classic', limit = 10) {
  return this.aggregate([
    {
      $match: {
        gameMode: gameMode,
        isCompleted: true,
        isValid: true,
      }
    },
    {
      $group: {
        _id: '$player',
        bestScore: { $max: '$score' },
        totalGames: { $sum: 1 },
        totalCatches: { $sum: '$totalCatches' },
        totalRareFish: { $sum: '$rareFishCaught' },
        averageScore: { $avg: '$score' },
        lastPlayed: { $max: '$createdAt' },
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'player',
        pipeline: [
          {
            $project: {
              username: 1,
              name: 1,
              avatar: 1,
            }
          }
        ]
      }
    },
    {
      $unwind: '$player'
    },
    {
      $sort: { bestScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get daily/weekly/monthly stats
gameSchema.statics.getTimePeriodStats = function(userId, period = 'week') {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }
  
  return this.aggregate([
    {
      $match: {
        player: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        isCompleted: true,
        isValid: true,
      }
    },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalScore: { $sum: '$score' },
        bestScore: { $max: '$score' },
        totalCatches: { $sum: '$totalCatches' },
        totalRareFish: { $sum: '$rareFishCaught' },
        totalPlayTime: { $sum: '$duration' },
        averageScore: { $avg: '$score' },
      }
    }
  ]);
};

// Instance method to add a catch
gameSchema.methods.addCatch = function(fishData) {
  this.catches.push({
    fishType: fishData.type,
    fishName: fishData.name,
    rarity: fishData.rarity,
    points: fishData.points,
    caughtAt: new Date(),
    location: fishData.location,
  });
  
  // Update score
  this.score += fishData.points;
  
  return this.save();
};

// Instance method to end game
gameSchema.methods.endGame = function() {
  this.endTime = new Date();
  this.isCompleted = true;
  
  return this.save();
};

module.exports = mongoose.model('Game', gameSchema);