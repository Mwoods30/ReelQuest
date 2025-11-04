const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot be more than 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  
  // Profile Info
  avatar: {
    type: String,
    default: '🎣',
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot be more than 200 characters'],
    default: '',
  },
  location: {
    type: String,
    maxlength: [50, 'Location cannot be more than 50 characters'],
    default: '',
  },
  
  // Game Statistics
  gameStats: {
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    highScore: {
      type: Number,
      default: 0,
    },
    totalCatches: {
      type: Number,
      default: 0,
    },
    rareFishCaught: {
      type: Number,
      default: 0,
    },
    totalPlayTime: {
      type: Number, // in minutes
      default: 0,
    },
    achievements: [{
      name: String,
      description: String,
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'gameStats.highScore': -1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's rank (computed field)
userSchema.virtual('rank').get(function() {
  // This would need to be calculated based on leaderboard position
  return this._rank;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with cost of 12
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  
  next();
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after password change
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  
  // False means NOT changed
  return false;
};

// Instance method to update game statistics
userSchema.methods.updateGameStats = function(gameData) {
  const stats = this.gameStats;
  
  // Update basic stats
  stats.gamesPlayed += 1;
  stats.totalScore += gameData.score || 0;
  stats.totalCatches += gameData.catches || 0;
  stats.rareFishCaught += gameData.rareFish || 0;
  stats.totalPlayTime += gameData.playTime || 0;
  
  // Update high score if new score is higher
  if (gameData.score > stats.highScore) {
    stats.highScore = gameData.score;
  }
  
  // Calculate level and experience
  const newExperience = stats.experience + (gameData.score * 0.1);
  stats.experience = newExperience;
  stats.level = Math.floor(newExperience / 1000) + 1;
  
  // Check for achievements
  this.checkAchievements(gameData);
  
  return this.save();
};

// Instance method to check and unlock achievements
userSchema.methods.checkAchievements = function(gameData) {
  const stats = this.gameStats;
  const achievements = stats.achievements;
  
  // Define achievement conditions
  const achievementChecks = [
    {
      name: 'First Catch',
      description: 'Caught your first fish!',
      condition: stats.totalCatches >= 1,
    },
    {
      name: 'Century Club',
      description: 'Caught 100 fish!',
      condition: stats.totalCatches >= 100,
    },
    {
      name: 'High Scorer',
      description: 'Achieved a score of 1000 or more!',
      condition: stats.highScore >= 1000,
    },
    {
      name: 'Dedicated Angler',
      description: 'Played for 10 hours total!',
      condition: stats.totalPlayTime >= 600, // 10 hours in minutes
    },
    {
      name: 'Rare Hunter',
      description: 'Caught 10 rare fish!',
      condition: stats.rareFishCaught >= 10,
    },
  ];
  
  achievementChecks.forEach(achievement => {
    const alreadyUnlocked = achievements.some(a => a.name === achievement.name);
    
    if (achievement.condition && !alreadyUnlocked) {
      achievements.push({
        name: achievement.name,
        description: achievement.description,
        unlockedAt: new Date(),
      });
    }
  });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'gameStats.highScore': -1 })
    .limit(limit)
    .select('username name gameStats.highScore gameStats.totalCatches avatar createdAt');
};

// Static method to find user with rank
userSchema.statics.findWithRank = async function(userId) {
  const user = await this.findById(userId);
  if (!user) return null;
  
  // Calculate rank
  const rank = await this.countDocuments({
    'gameStats.highScore': { $gt: user.gameStats.highScore },
    isActive: true,
  }) + 1;
  
  user._rank = rank;
  return user;
};

module.exports = mongoose.model('User', userSchema);