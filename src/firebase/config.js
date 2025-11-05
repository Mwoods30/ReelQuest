// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase config object
// Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "reelquest-fishing.firebaseapp.com",
  projectId: "reelquest-fishing",
  storageBucket: "reelquest-fishing.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;