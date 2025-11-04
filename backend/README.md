# 🎣 ReelQuest Backend API

A comprehensive backend system for the ReelQuest fishing game with user authentication, game statistics, and leaderboards.

## 🚀 Features

- **User Authentication**: JWT-based authentication with password encryption using bcrypt
- **User Management**: Profile management, game statistics, and user rankings  
- **Game Sessions**: Start/end game sessions, save progress, track catches
- **Leaderboards**: Global and game-mode specific leaderboards
- **Security**: Rate limiting, input validation, CORS protection, and helmet security
- **Database**: MongoDB with Mongoose ODM for data modeling
- **API Documentation**: RESTful API with proper error handling

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Development**: nodemon for auto-restart

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/reelquest
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/reelquest

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Generate JWT Secret
Run the setup script to generate a secure JWT secret:
```bash
node setup.js
```

### 5. Start MongoDB
If using local MongoDB:
```bash
# On macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 6. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user  
- `POST /logout` - Logout user
- `POST /refresh-token` - Refresh JWT token
- `POST /forgot-password` - Request password reset
- `PATCH /reset-password/:token` - Reset password with token
- `PATCH /update-password` - Update password (protected)

### Users (`/api/users`) - All Protected
- `GET /profile` - Get user profile
- `PATCH /profile` - Update user profile
- `DELETE /account` - Delete user account
- `GET /stats` - Get user game statistics
- `GET /game-history` - Get user's game history

### Games (`/api/games`) - All Protected  
- `POST /start` - Start new game session
- `PATCH /:sessionId/end` - End game session
- `PATCH /:sessionId/progress` - Save game progress
- `POST /:sessionId/catch` - Add a fish catch
- `GET /:sessionId` - Get game session data

### Leaderboards (`/api/leaderboard`)
- `GET /global` - Get global leaderboard (optional auth)
- `GET /gamemode/:mode` - Get game mode leaderboard (optional auth)
- `GET /user/:userId/rank` - Get user's rank

### Utility
- `GET /api/health` - Health check endpoint
- `GET /` - Welcome message

## 📊 Database Schema

### User Model
```javascript
{
  // Basic Info
  name: String (required),
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  
  // Profile
  avatar: String (default: '🎣'),
  bio: String,
  location: String,
  
  // Game Statistics
  gameStats: {
    gamesPlayed: Number,
    totalScore: Number,
    highScore: Number,
    totalCatches: Number,
    rareFishCaught: Number,
    totalPlayTime: Number,
    achievements: [Achievement],
    level: Number,
    experience: Number
  },
  
  // Account Status
  isActive: Boolean,
  isVerified: Boolean,
  role: String (user|moderator|admin),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Game Model
```javascript
{
  // Session Info
  player: ObjectId (User ref),
  sessionId: String (unique),
  startTime: Date,
  endTime: Date,
  duration: Number (seconds),
  
  // Results
  score: Number,
  catches: [Catch],
  totalCatches: Number,
  rareFishCaught: Number,
  
  // Settings
  difficulty: String,
  gameMode: String,
  
  // Status
  isCompleted: Boolean,
  isValid: Boolean
}
```

## 🔒 Security Features

- **Password Encryption**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers and protection
- **Error Handling**: Centralized error handling with proper status codes

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reelquest
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-frontend-domain.com
```

### Deploy to Heroku
1. Create a Heroku app: `heroku create your-app-name`
2. Set environment variables: `heroku config:set MONGODB_URI=your-mongodb-uri`
3. Deploy: `git push heroku main`

### Deploy to Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Deploy to DigitalOcean App Platform
1. Create new app from GitHub repository
2. Configure environment variables
3. Deploy with automatic scaling

## 🧪 Testing

### API Testing with curl
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","username":"johndoe","email":"john@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"john@example.com","password":"Password123"}'

# Get user profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/users/profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get leaderboard
curl -X GET http://localhost:5000/api/leaderboard/global
```

## 🔧 Development

### Folder Structure
```
backend/
├── controllers/        # Route handlers
├── middleware/        # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── scripts/          # Utility scripts
├── server.js         # Main server file
├── setup.js          # Setup script
├── package.json      # Dependencies
├── .env.example      # Environment template
└── README.md         # This file
```

### Adding New Features
1. Create model in `/models`
2. Add routes in `/routes`  
3. Implement controllers in `/controllers`
4. Add middleware if needed in `/middleware`
5. Update server.js to include new routes

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection Error**: Check your MONGODB_URI and ensure MongoDB is running
2. **JWT Errors**: Verify JWT_SECRET is set in .env file
3. **CORS Issues**: Update CLIENT_URL in .env to match your frontend URL
4. **Port Already in Use**: Change PORT in .env or kill process using the port

### Debug Mode
Set `NODE_ENV=development` in your .env file for detailed error messages.

## 📚 API Usage Examples

Check the `examples/` folder for complete API usage examples with different programming languages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] Real-time multiplayer support with WebSockets
- [ ] Email notifications for password reset
- [ ] Advanced analytics and reporting
- [ ] Tournament system
- [ ] Achievement system expansion  
- [ ] Social features (friends, chat)
- [ ] Mobile app API support
- [ ] Advanced anti-cheat measures

---

Built with ❤️ for the ReelQuest fishing game community!