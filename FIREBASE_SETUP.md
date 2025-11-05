# Firebase Setup Instructions for ReelQuest

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `reelquest-fishing`
4. Enable Google Analytics (recommended)
5. Select or create a Google Analytics account
6. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click on it, toggle "Enable", and save
   - **Google**: Click on it, toggle "Enable", select your project support email, and save

## Step 3: Create Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in "test mode" (we'll configure security rules later)
4. Choose a location closest to your users (e.g., `us-central1`)
5. Click "Done"

## Step 4: Configure Security Rules

In Firestore, go to "Rules" tab and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read leaderboard, only authenticated users can write
    match /leaderboard/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Only authenticated users can read/write game sessions
    match /gameSessions/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Step 5: Add Web App to Firebase Project

1. In your Firebase project overview, click the web icon (`</>`)
2. Register your app with nickname: `ReelQuest Web`
3. Check "Also set up Firebase Hosting" if you want to deploy
4. Click "Register app"
5. Copy the Firebase configuration object

## Step 6: Update Firebase Configuration

1. Open `/src/firebase/config.js`
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "reelquest-fishing.firebaseapp.com",
  projectId: "reelquest-fishing",
  storageBucket: "reelquest-fishing.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 7: Test the Setup

1. Start your development server: `npm run dev`
2. Try creating an account and signing in
3. Play a game and check if data is saved to Firestore
4. Check the Firebase Console to see your data

## Step 8: Production Setup (Optional)

1. **Environment Variables**: Move Firebase config to environment variables for production
2. **Security**: Review and tighten Firestore security rules
3. **Hosting**: Set up Firebase Hosting for deployment
4. **Monitoring**: Enable Firebase Analytics and Performance Monitoring

## Firestore Collections Structure

Your database will automatically create these collections:

- **users**: User profiles and game progress
- **leaderboard**: Global high scores
- **gameSessions**: Individual game session logs

## Troubleshooting

### Common Issues:

1. **Authentication errors**: Check if Email/Password and Google sign-in are enabled
2. **Firestore permission errors**: Verify security rules are set up correctly
3. **Config errors**: Make sure Firebase config object is copied exactly from console
4. **Network errors**: Check if your Firebase project is active and billing is set up (if needed)

### Debug Mode:

Add this to your browser's developer console to enable Firebase debug logging:

```javascript
localStorage.setItem('debug', 'firebase:*');
```

## Features Enabled

With this setup, your ReelQuest game now supports:

- ✅ User registration and login
- ✅ Google Sign-In
- ✅ Persistent user profiles and game progress
- ✅ Global leaderboards with real-time updates
- ✅ Achievement tracking
- ✅ Inventory and shop system sync
- ✅ Game session logging and statistics
- ✅ Secure data storage with proper access controls

## Next Steps

1. Test all features thoroughly
2. Consider adding password reset functionality
3. Implement user profile editing
4. Add more social features (friend systems, challenges, etc.)
5. Set up analytics to track user engagement