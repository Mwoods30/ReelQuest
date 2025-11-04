#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎣 Setting up ReelQuest Backend...\n');

// Create .env file from .env.example if it doesn't exist
const envExample = path.join(__dirname, '.env.example');
const envFile = path.join(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  console.log('📄 Creating .env file...');
  fs.copyFileSync(envExample, envFile);
  console.log('✅ .env file created! Please update the values in .env file.\n');
} else {
  console.log('📄 .env file already exists.\n');
}

// Generate a random JWT secret
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 Generated JWT Secret (add this to your .env file):');
console.log(`JWT_SECRET=${jwtSecret}\n`);

console.log('📋 Next steps:');
console.log('1. Update your .env file with your MongoDB connection string');
console.log('2. Install dependencies: npm install');
console.log('3. Start MongoDB (if running locally)');
console.log('4. Run the server: npm run dev');
console.log('5. Your API will be available at http://localhost:5000\n');

console.log('🌟 API Endpoints:');
console.log('- POST /api/auth/signup - Register new user');
console.log('- POST /api/auth/login - Login user');
console.log('- GET /api/users/profile - Get user profile (protected)');
console.log('- GET /api/leaderboard/global - Get global leaderboard');
console.log('- POST /api/games/start - Start new game (protected)');
console.log('- GET /api/health - Health check\n');

console.log('🚀 ReelQuest Backend setup complete!');