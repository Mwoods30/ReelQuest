// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment variables loaded:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Found' : 'Missing',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Found' : 'Missing',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Found' : 'Missing'
  });
}

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAVVovCh4bNUMR_pfkneLGDbj78ur-hxcU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reelquest-fishing.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reelquest-fishing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reelquest-fishing.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "306216844565",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:306216844565:web:72d6f3335162e776147d1c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EGFCDC2704"
};

// Validate required environment variables in production
if (import.meta.env.PROD) {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    throw new Error(`Missing Firebase configuration: ${missingEnvVars.join(', ')}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;