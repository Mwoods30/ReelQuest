# ReelQuest - User Authentication & Global Leaderboards

## 🎣 New Features Added

### User Authentication System
- **Email/Password Registration & Login**: Users can create accounts with email and password
- **Google Sign-In**: Quick authentication using Google accounts
- **Password Reset**: Users can reset their passwords via email
- **Profile Management**: Users can update their display names and view account information

### Global Leaderboards
- **Real-time Leaderboards**: Live updating leaderboards using Firebase Firestore
- **Persistent Rankings**: User scores are saved globally and persist across sessions
- **Player Rankings**: See where you rank among all players worldwide
- **Game Session Tracking**: Detailed logging of all game sessions

### User Progress Persistence
- **Cloud Save**: All user progress (level, XP, currency, achievements) saved to Firebase
- **Cross-device Sync**: Access your progress from any device by signing in
- **Inventory Management**: Fish inventory and shop purchases synced across devices
- **Achievement Tracking**: Unlock and track achievements tied to your account

### Dual Mode Support
- **Authenticated Users**: Full feature set with cloud saves and global leaderboards
- **Guest Players**: Can still play with local storage (progress not saved)
- **Seamless Migration**: Guest progress can be manually transferred to accounts

## 🚀 Getting Started

### Prerequisites
1. Node.js (v14 or higher)
2. Firebase project (see FIREBASE_SETUP.md for detailed instructions)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase (follow FIREBASE_SETUP.md)
4. Start development server: `npm run dev`

### Firebase Setup
See `FIREBASE_SETUP.md` for complete Firebase configuration instructions.

## 🔧 Architecture

### Frontend Components
- **AuthForm**: Handles user registration, login, and password reset
- **UserProfile**: User profile management and statistics display
- **UserContext**: React context for managing authentication state
- **FishingGame**: Enhanced with Firebase integration for authenticated users

### Backend (Firebase)
- **Authentication**: Firebase Auth for user management
- **Firestore Collections**:
  - `users`: User profiles and game progress
  - `leaderboard`: Global high scores and rankings
  - `gameSessions`: Individual game session logs

### Data Flow
1. User signs in → Firebase Auth creates user session
2. User profile loaded from Firestore → Synced to React context
3. Game actions (catches, purchases) → Saved to Firestore in real-time
4. Leaderboard updates → Real-time listeners update all connected clients

## 🎮 User Experience

### For New Users
1. **Play as Guest**: Jump right in and start fishing
2. **Create Account**: Sign up to save progress and compete globally
3. **Profile Setup**: Customize your fisher name and preferences

### For Returning Users
1. **Sign In**: Access your saved progress instantly
2. **Continue Progress**: Pick up where you left off with all data intact
3. **Compete**: See your ranking on the global leaderboard
4. **Manage Account**: Update profile, reset password, view statistics

## 🔒 Security Features

### Data Protection
- **Firestore Security Rules**: Proper read/write permissions
- **User Isolation**: Users can only access their own data
- **Public Leaderboards**: Global leaderboards readable by all, writable by authenticated users only

### Authentication Security
- **Firebase Auth**: Industry-standard authentication system
- **Secure Tokens**: JWT-based session management
- **Password Requirements**: Minimum 6 characters for passwords
- **Email Verification**: Optional email verification can be enabled

## 📊 Analytics & Monitoring

### User Analytics
- **Game Session Tracking**: Duration, scores, catches per session
- **User Engagement**: Play time, retention metrics
- **Achievement Progress**: Track unlock rates and player progression

### Performance Monitoring
- **Real-time Updates**: Efficient Firestore listeners for live data
- **Offline Support**: Firebase handles offline scenarios gracefully
- **Error Handling**: Comprehensive error handling for network issues

## 🎯 Key Benefits

### For Players
- **Never Lose Progress**: Cloud saves ensure progress is never lost
- **Global Competition**: Compete with players worldwide
- **Cross-platform**: Access account from any device
- **Achievement System**: Unlock achievements tied to your account
- **Statistics Tracking**: Detailed personal gaming statistics

### For Developers
- **Scalable Backend**: Firebase scales automatically with user base
- **Real-time Features**: Live leaderboards and instant updates
- **User Management**: Complete user lifecycle management
- **Analytics Ready**: Built-in analytics and user tracking
- **Security**: Enterprise-grade security from Firebase

## 🔄 Data Synchronization

### Authenticated Users
- All game data synced to Firebase Firestore
- Real-time updates across all connected devices
- Automatic conflict resolution for concurrent play
- Offline play with sync when connection restored

### Guest Users
- Local storage for temporary progress
- Can play full game without account
- Prompted to create account to save progress
- Manual migration process for converting guest to user

## 🎪 Future Enhancements

### Planned Features
- **Friend System**: Add friends and compete with them
- **Tournaments**: Organized fishing competitions
- **Social Features**: Share achievements and compete in groups
- **Advanced Statistics**: More detailed analytics and insights
- **Push Notifications**: Tournament reminders and achievement notifications

### Technical Improvements
- **Progressive Web App**: Install as mobile app
- **Offline Mode**: Full offline play with sync
- **Performance Optimization**: Faster load times and smoother gameplay
- **Advanced Security**: Two-factor authentication, account recovery options

## 🐛 Troubleshooting

### Common Issues
1. **Authentication Errors**: Check Firebase configuration in config.js
2. **Data Not Saving**: Verify Firestore security rules are correct
3. **Leaderboard Not Loading**: Check network connection and Firebase status
4. **Profile Updates Failing**: Ensure user is properly authenticated

### Debug Mode
Enable Firebase debug logging in browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially authentication flows)
5. Submit a pull request

### Testing Checklist
- [ ] Guest play works without authentication
- [ ] User registration and login functional
- [ ] Game progress saves correctly for authenticated users
- [ ] Leaderboard updates in real-time
- [ ] Profile management works properly
- [ ] Password reset functionality works
- [ ] Cross-device sync works correctly

---

**ReelQuest** now offers a complete multiplayer fishing experience with persistent user accounts, global competition, and social features. Cast your line and compete with fishers around the world! 🎣🌍